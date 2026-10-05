(function () {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const menuButton = document.querySelector("[data-menu-button]");
  const whatsappNumber = String(window.AXM_CONFIG?.whatsappNumber || "").replace(/\D/g, "");
  const whatsappReady = /^\d{12,13}$/.test(whatsappNumber);

  function closeMenu() {
    if (!menu || !menuButton) return;
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  menuButton?.addEventListener("click", function () {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menu?.classList.toggle("is-open", !isOpen);
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    document.body.classList.toggle("menu-open", !isOpen);
  });

  menu?.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
    const message = link.getAttribute("data-whatsapp") || "Olá! Gostaria de mais informações sobre a AXM.";

    if (!whatsappReady) {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.setAttribute("title", "WhatsApp em configuração");
      link.addEventListener("click", function (event) {
        event.preventDefault();
      });
      return;
    }

    link.setAttribute("href", "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    link.addEventListener("click", function () {
      const detail = { channel: "whatsapp", message: message, page: window.location.pathname };
      window.dispatchEvent(new CustomEvent("axm:contact", { detail: detail }));
      window.dataLayer?.push({ event: "whatsapp_click", ...detail });
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (element) {
    element.textContent = String(new Date().getFullYear());
  });

  function updateHeader() {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
})();
