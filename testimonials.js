const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const testimonials = [
  {
    name: "Brian Davis",
    image: "assets/images/testimonials/client-brian-davis.jpg",
    alt: "Brian Davis portrait",
    quote:
      "Working with Sellam completely transformed our real estate experience. They understood exactly what our business needed and found the perfect commercial space within weeks. The process was smooth, transparent, and stress-free from start to finish."
  },
  {
    name: "Natasha Wambui",
    image: "assets/images/testimonials/client-natasha-wambui.jpg",
    alt: "Natasha Wambui portrait",
    quote:
      "Sellam's team went above and beyond to find us a property that matched our vision and budget. Their market knowledge is unmatched, and they guided us through every step with clarity and professionalism."
  },
  {
    name: "Ian Kinoti",
    image: "assets/images/testimonials/client-ian-kinoti.jpg",
    alt: "Ian Kinoti portrait",
    quote:
      "Our experience with Sellam has been nothing short of exceptional. They made leasing our office space quick, efficient, and completely hassle-free. I will definitely work with them again in the future."
  },
  {
    name: "Amina Shah",
    image: "assets/images/testimonials/client-natasha-wambui.jpg",
    alt: "Amina Shah portrait",
    quote:
      "The Sellam team handled our search with rare attention to detail. Every viewing was relevant, every answer was clear, and the final property felt completely aligned with what we wanted."
  },
  {
    name: "Daniel Mwangi",
    image: "assets/images/testimonials/client-ian-kinoti.jpg",
    alt: "Daniel Mwangi portrait",
    quote:
      "From valuation to negotiation, Sellam gave us thoughtful guidance and calm execution. Their professionalism made a complex decision feel simple, measured, and very well managed."
  }
];

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

function createCard(testimonial, index) {
  const article = document.createElement("article");
  article.className = "testimonial-card";
  article.dataset.index = String(index);
  article.innerHTML = `
    <span class="testimonial-photo">
      <img src="${testimonial.image}" alt="${testimonial.alt}">
    </span>
    <div class="testimonial-body">
      <h2>${testimonial.name}</h2>
      <p>${testimonial.quote}</p>
    </div>
    <span class="testimonial-quote" aria-hidden="true">&rdquo;</span>
  `;
  return article;
}

function setActiveCard(cards, activeCard) {
  cards.forEach((card) => {
    const isActive = card === activeCard;
    card.dataset.active = isActive ? "true" : "false";
    if (isActive) {
      card.setAttribute("aria-current", "true");
    } else {
      card.removeAttribute("aria-current");
    }
  });
}

function setupTestimonials() {
  const stack = document.querySelector("[data-testimonial-stack]");
  const viewport = document.querySelector("[data-testimonial-viewport]");
  if (!stack || !viewport) return;

  testimonials.forEach((testimonial, index) => {
    stack.append(createCard(testimonial, index));
  });

  const desktopQuery = window.matchMedia("(min-width: 761px)");
  const cards = Array.from(stack.querySelectorAll(".testimonial-card"));
  let ticking = false;

  const updateActiveFromScroll = () => {
    if (!desktopQuery.matches) {
      cards.forEach((card) => {
        card.dataset.active = "false";
        card.removeAttribute("aria-current");
      });
      viewport.scrollTop = 0;
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.top + viewportRect.height / 2;
    const activeCard = cards.reduce((closest, card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
      return !closest || distance < closest.distance ? { card, distance } : closest;
    }, null)?.card;

    setActiveCard(cards, activeCard || cards[1]);
  };

  const requestActiveUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateActiveFromScroll();
      ticking = false;
    });
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!desktopQuery.matches) return;
      const firstCard = cards[0];
      const targetTop = card.offsetTop - firstCard.offsetTop - (viewport.clientHeight - card.offsetHeight) / 2;
      viewport.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  });

  viewport.addEventListener("scroll", requestActiveUpdate, { passive: true });
  window.addEventListener("resize", updateActiveFromScroll);

  updateActiveFromScroll();
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
  setupTestimonials();
  setupRevealAnimations();
  setupForms();
});
