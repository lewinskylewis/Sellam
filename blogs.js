const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const blogSlides = [
  {
    image: "assets/images/blogs/blog-hero-team.jpg",
    kicker: "Our Top Picks",
    title: "Why Location Is the Secret Weapon<br>in Commercial Real Estate",
    copy:
      "In real estate, location isn't just important - it's everything. The right location can boost foot traffic, attract premium tenants, and significantly increase property value. We break down how to identify prime areas and what factors matter most for both buyers and investors.",
    note: "Whether you're expanding your business or starting fresh, this guide will help you choose wisely."
  },
  {
    image: "assets/images/blogs/blog-office-leasing.jpg",
    kicker: "Leasing Guide",
    title: "Top 5 Things to Look for When Leasing<br>Office Space",
    copy:
      "Choosing the right office space is more than finding four walls and a desk. From accessibility to amenities, the details matter before you sign a lease.",
    note: "Use the right checklist before you commit to a commercial address."
  },
  {
    image: "assets/images/blogs/blog-commercial-investment.jpg",
    kicker: "Investment Watch",
    title: "Is Now the Right Time to Invest in<br>Commercial Property?",
    copy:
      "Market trends, economic shifts, and urban growth can all influence timing for property investment. We analyze current data to help you make informed decisions.",
    note: "The best opportunities reward buyers who understand the market early."
  },
  {
    image: "assets/images/blogs/blog-rental-returns.jpg",
    kicker: "Investor Notes",
    title: "How to Maximize Returns on Your<br>Rental Property",
    copy:
      "From smart renovations to strategic tenant selection, small management decisions can make a meaningful difference to rental income.",
    note: "The right improvements can protect value and strengthen yield."
  },
  {
    image: "assets/images/blogs/blog-nairobi-market.jpg",
    kicker: "Market Guide",
    title: "Navigating Nairobi's Real Estate Market:<br>A Beginner's Guide",
    copy:
      "The Nairobi real estate market offers incredible opportunities, but it can be overwhelming for first-time buyers or investors.",
    note: "Understand the basics before choosing your next property move."
  }
];

const currentBg = document.querySelector(".blog-hero-bg-current");
const nextBg = document.querySelector(".blog-hero-bg-next");
const heroCopy = document.querySelector(".blog-hero-copy");
const dotsWrap = document.querySelector(".blog-hero-dots");
let activeSlide = 0;
let activeLayer = currentBg;
let inactiveLayer = nextBg;
let blogTimer;

function setupMobileMenu() {
  const openButton = document.querySelector(".menu-toggle");
  const closeButton = document.querySelector(".menu-close");
  const menu = document.querySelector(".mobile-menu");
  const menuLinks = document.querySelectorAll(".mobile-nav-list a");

  if (!openButton || !closeButton || !menu) return;

  const openMenu = () => {
    document.body.classList.add("menu-open");
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    closeButton.focus({ preventScroll: true });
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
  };

  openButton.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  menu.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });
  menuLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function setLayerImage(layer, image) {
  if (layer) layer.style.backgroundImage = `url("${image}")`;
}

function renderBlogSlide(index) {
  const nextIndex = (index + blogSlides.length) % blogSlides.length;
  const slide = blogSlides[nextIndex];

  if (!activeLayer?.classList.contains("is-active") || nextIndex !== activeSlide) {
    setLayerImage(inactiveLayer, slide.image);
    inactiveLayer.classList.add("is-active");
    activeLayer.classList.remove("is-active");
    [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
  }

  if (heroCopy) {
    heroCopy.classList.add("is-changing");
    window.setTimeout(() => {
      const kicker = heroCopy.querySelector(".blog-kicker");
      const title = heroCopy.querySelector("h1");
      const paragraphs = heroCopy.querySelectorAll("p");
      if (kicker?.firstChild) kicker.firstChild.textContent = slide.kicker;
      if (title) title.innerHTML = slide.title;
      if (paragraphs[0]) paragraphs[0].textContent = slide.copy;
      if (paragraphs[1]) paragraphs[1].textContent = slide.note;
      heroCopy.classList.remove("is-changing");
    }, prefersReducedMotion ? 0 : 240);
  }

  dotsWrap?.querySelectorAll(".blog-hero-dot").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === nextIndex);
    dot.setAttribute("aria-selected", dotIndex === nextIndex ? "true" : "false");
  });

  activeSlide = nextIndex;
}

function setupBlogHero() {
  if (!currentBg || !nextBg || !dotsWrap) return;

  blogSlides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "blog-hero-dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show ${slide.kicker}`);
    dot.addEventListener("click", () => {
      renderBlogSlide(index);
      restartBlogTimer();
    });
    dotsWrap.append(dot);
  });

  setLayerImage(currentBg, blogSlides[0].image);
  currentBg.classList.add("is-active");
  renderBlogSlide(0);
  startBlogTimer();
}

function startBlogTimer() {
  if (prefersReducedMotion) return;
  blogTimer = window.setInterval(() => {
    renderBlogSlide(activeSlide + 1);
  }, 6200);
}

function restartBlogTimer() {
  window.clearInterval(blogTimer);
  startBlogTimer();
}

function setupBlogPagination() {
  const cards = document.querySelectorAll("[data-blog-page]");
  const buttons = document.querySelectorAll("[data-page-button]");
  if (!cards.length || !buttons.length) return;

  const showPage = (page) => {
    cards.forEach((card) => {
      const isVisible = card.dataset.blogPage === page;
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) card.classList.add("is-visible");
    });

    buttons.forEach((button) => {
      const isActive = button.dataset.pageButton === page;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.pageButton || "1");
      document.querySelector(".blog-listing")?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  showPage("1");
}

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupForms() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupBlogHero();
  setupBlogPagination();
  setupRevealAnimations();
  setupForms();
});
