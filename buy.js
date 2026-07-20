// Buy page — self-contained navbar/menu + form handling (no homepage hero deps).
(function () {
  const openButton = document.querySelector(".menu-toggle");
  const closeButton = document.querySelector(".menu-close");
  const menu = document.querySelector(".mobile-menu");
  const menuLinks = document.querySelectorAll(".mobile-nav-list a");

  if (openButton && closeButton && menu) {
    const open = () => {
      document.body.classList.add("menu-open");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      openButton.setAttribute("aria-expanded", "true");
      closeButton.focus({ preventScroll: true });
    };
    const close = () => {
      document.body.classList.remove("menu-open");
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      openButton.setAttribute("aria-expanded", "false");
    };
    openButton.addEventListener("click", open);
    closeButton.addEventListener("click", close);
    menu.addEventListener("click", (e) => { if (e.target === menu) close(); });
    menuLinks.forEach((l) => l.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  document.querySelectorAll("form").forEach((f) =>
    f.addEventListener("submit", (e) => e.preventDefault())
  );
})();
