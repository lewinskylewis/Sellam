"use strict";

// Shared helpers for api/sync-mailboxes.js and api/send-message.js. Not
// itself a route — Vercel only treats files directly under api/ whose
// default export is a handler as routes; a leading underscore is the
// established convention (mirrors this project's other non-route helper
// files) to make that non-routing intent obvious at a glance too.

const MAILBOXES = {
  sales: "sales@sellamre.com",
  office: "office@sellamre.com"
};

function supabaseHeaders(secretKey, prefer) {
  const headers = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json"
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Verifies the caller is a signed-in dashboard admin by asking Supabase Auth
// to resolve the bearer token the browser sent — the same trust boundary
// RLS already uses for every other authenticated-only dashboard write, just
// checked explicitly here because this route needs the service_role key
// (for Resend/IMAP), which must never be reachable by an unauthenticated
// request. Returns the Supabase user object on success, throws otherwise.
async function requireAuthenticatedAdmin(request) {
  const authHeader = request.headers?.authorization || request.headers?.Authorization;
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
  if (!token) {
    const error = new Error("Missing Authorization header.");
    error.statusCode = 401;
    throw error;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = new Error("Invalid or expired session.");
    error.statusCode = 401;
    throw error;
  }

  return response.json();
}

// True when the request is Vercel's own Cron invocation (matched via a
// shared secret you set once as CRON_SECRET and reference in vercel.json's
// crons config) — lets /api/sync-mailboxes run on a schedule with no human
// signed in, while still rejecting any other unauthenticated caller.
function isVercelCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers?.authorization || request.headers?.Authorization;
  return authHeader === `Bearer ${secret}`;
}

// The admin dashboard is typically its own Vercel project/domain (root
// directory "admin"), separate from the main sellamre.com project that owns
// these api/ routes — so its browser calls here are cross-origin and need
// an explicit CORS allow, scoped to exactly that one origin (never "*",
// since these routes accept an admin session token). ADMIN_ORIGIN is set to
// the admin dashboard's real URL, e.g. https://admin.sellamre.com.
function applyCors(request, response) {
  const allowedOrigin = process.env.ADMIN_ORIGIN;
  const requestOrigin = request.headers?.origin;
  if (allowedOrigin && requestOrigin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return true;
  }
  return false;
}

module.exports = { MAILBOXES, supabaseHeaders, requireEnv, requireAuthenticatedAdmin, isVercelCron, applyCors };
