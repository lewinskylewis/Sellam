"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const enquiryHandler = require("../api/enquiry.js");

const validPayload = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+254 700 000 000",
  message: "I would like to arrange a private viewing.",
  property_id: "sl-001",
  property_title: "4 Bedroom Maisonette",
  property_url: "https://sellam.example/properties/4-bedroom-maisonette-runda-nairobi.html",
  listing_category: "sale-and-rent",
  source_page: "https://sellam.example/rent.html",
  website: ""
};

function request(body, headers = {}) {
  return {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      origin: "https://sellam.example",
      host: "sellam.example",
      ...headers
    }
  };
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function configureEnvironment() {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_only";
  process.env.RESEND_API_KEY = "re_test_only";
  process.env.RESEND_FROM_EMAIL = "SELLAM Enquiries <enquiries@sellam.example>";
  process.env.ENQUIRY_RECIPIENT_EMAIL = "team@sellam.example";
}

function mockFetchResponse(status, jsonBody) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return jsonBody;
    },
    async text() {
      return JSON.stringify(jsonBody || {});
    }
  };
}

test("stores, emails, and marks a valid enquiry as notified", { concurrency: false }, async () => {
  configureEnvironment();
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return mockFetchResponse(201, [{ id: "11111111-1111-4111-8111-111111111111" }]);
    if (calls.length === 2) return mockFetchResponse(200, { id: "resend-email-id" });
    return mockFetchResponse(204, null);
  };

  try {
    const res = response();
    await enquiryHandler(request(validPayload), res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.ok, true);
    assert.equal(calls.length, 3);

    const insertBody = JSON.parse(calls[0].options.body);
    assert.equal(insertBody.property_id, "sl-001");
    assert.equal(insertBody.status, "new");
    assert.equal(calls[0].options.headers.apikey, "sb_secret_test_only");
    assert.equal(calls[0].options.headers.Authorization, undefined);

    const emailBody = JSON.parse(calls[1].options.body);
    assert.equal(emailBody.reply_to, validPayload.email);
    assert.deepEqual(emailBody.to, ["team@sellam.example"]);
    assert.equal(calls[1].options.headers["Idempotency-Key"], "sellam-enquiry/11111111-1111-4111-8111-111111111111");

    const updateBody = JSON.parse(calls[2].options.body);
    assert.equal(updateBody.status, "notified");
  } finally {
    global.fetch = originalFetch;
  }
});

test("accepts a honeypot submission without storing or emailing it", { concurrency: false }, async () => {
  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  try {
    const res = response();
    await enquiryHandler(request({ ...validPayload, website: "https://spam.example" }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.ok, true);
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("rejects invalid visitor data before calling external services", { concurrency: false }, async () => {
  let fetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  try {
    const res = response();
    await enquiryHandler(request({ ...validPayload, email: "not-an-email" }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.payload.ok, false);
    assert.match(res.payload.fields.email, /valid email/i);
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("rejects a cross-origin browser request", { concurrency: false }, async () => {
  const res = response();
  await enquiryHandler(
    request(validPayload, { origin: "https://attacker.example", host: "sellam.example" }),
    res
  );
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.ok, false);
});

test("keeps the stored lead when email delivery fails", { concurrency: false }, async () => {
  configureEnvironment();
  const calls = [];
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  console.error = () => {};
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return mockFetchResponse(201, [{ id: "22222222-2222-4222-8222-222222222222" }]);
    if (calls.length === 2) return mockFetchResponse(500, { message: "temporary email outage" });
    return mockFetchResponse(204, null);
  };

  try {
    const res = response();
    await enquiryHandler(request(validPayload), res);
    assert.equal(res.statusCode, 202);
    assert.equal(res.payload.ok, true);
    assert.equal(calls.length, 3);
    assert.equal(JSON.parse(calls[2].options.body).status, "email_failed");
  } finally {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
