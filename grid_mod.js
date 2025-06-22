document.addEventListener("DOMContentLoaded", function () {
  // ===== Конфигурация =====
  const CONFIG = {
    zIndex: {
      modal: 1000,
      menu: 1100,
      overlay: 900,
    },
    transitions: {
      duration: 300,
      disableDuration: 50,
    },
  };

  // ===== Глобальные элементы =====
  const elements = {
    wrap: document.querySelector(".wrap"),
    listItems: document.querySelectorAll(".list_item"),
    modalTriggers: document.querySelectorAll(".modal"),
    modalCloseButtons: document.querySelectorAll(".modal_close"),
    modalWrap: document.querySelector(".modal_wrap"),
    themeToggle: document.getElementById("theme_toggle"),
  };

  // ===== Система событий =====
  const eventSystem = {
    controllers: new Map(),

    add(element, type, handler, options) {
      if (!this.controllers.has(element)) {
        this.controllers.set(element, new AbortController());
      }
      const { signal } = this.controllers.get(element);
      element.addEventListener(type, handler, { ...options, signal });
    },

    remove(element) {
      if (this.controllers.has(element)) {
        this.controllers.get(element).abort();
        this.controllers.delete(element);
      }
    },

    removeAll() {
      this.controllers.forEach((controller) => controller.abort());
      this.controllers.clear();
    },
  };

  // ===== Менеджер переходов =====
  const transitionManager = {
    disable() {
      const style = document.createElement("style");
      style.id = "disable-transitions";
      style.textContent = `* { transition: none !important; }`;
      document.head.appendChild(style);

      setTimeout(() => {
        style.remove();
      }, CONFIG.transitions.disableDuration);
    },
  };

  // ===== Модуль списка =====
  const listModule = {
    init() {
      elements.listItems.forEach((item) => {
        eventSystem.add(item, "click", this.handleItemClick.bind(this));
      });

      if (elements.wrap) {
        eventSystem.add(
          elements.wrap,
          "click",
          this.handleWrapClick.bind(this)
        );
      }
    },

    handleItemClick(e) {
      const item = e.currentTarget;
      const isCaptionClick = e.target.closest(".item_caption_wrap");
      const isOpen = item.classList.contains("open");

      if (isCaptionClick && isOpen) {
        item.classList.remove("open");
        return;
      }

      this.closeAllItems();
      item.classList.add("open");
    },

    handleWrapClick(e) {
      if (!e.target.closest(".list_item") && !e.target.closest(".modal_wrap")) {
        this.closeAllItems();
      }
    },

    closeAllItems() {
      elements.listItems.forEach((item) => {
        item.classList.remove("open");
      });
    },
  };

  // ===== Модуль модального окна =====
  const modalModule = {
    init() {
      if (!elements.modalWrap) return;

      elements.modalTriggers.forEach((trigger) => {
        eventSystem.add(trigger, "click", this.handleTriggerClick.bind(this));
      });

      elements.modalCloseButtons.forEach((button) => {
        eventSystem.add(button, "click", this.close.bind(this));
      });

      eventSystem.add(
        elements.modalWrap,
        "click",
        this.handleOverlayClick.bind(this)
      );
    },

    handleTriggerClick(e) {
      e.preventDefault();
      this.open();
    },

    handleOverlayClick(e) {
      if (e.target === elements.modalWrap) {
        this.close();
      }
    },

    open() {
      elements.modalWrap.style.zIndex = CONFIG.zIndex.modal;
      elements.modalWrap.classList.add("modal_open");
    },

    close() {
      elements.modalWrap.classList.remove("modal_open");
    },
  };

  // ===== Модуль темы =====
  const themeModule = {
    init() {
      if (!elements.themeToggle) return;

      this.applyInitialTheme();
      eventSystem.add(elements.themeToggle, "click", this.toggle.bind(this));
    },

    applyInitialTheme() {
      const savedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const theme = savedTheme || (systemPrefersDark ? "dark" : "light");

      document.documentElement.setAttribute("data-theme", theme);
    },

    toggle() {
      transitionManager.disable();

      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    },
  };

  // ===== Модуль модального меню =====
  const menuModule = {
    MENU_HTML: `
      <div class="menu_modal_wrap">
        <ul class="menu_modal">
          <li class="menu_modal_item">копировать задачу</li>
          <li class="menu_modal_item">перенести на другую дату</li>
          <li class="menu_modal_item">удалить</li>
        </ul>
      </div>
    `,

    init() {
      eventSystem.add(document, "click", this.handleDocumentClick.bind(this));
    },

    handleDocumentClick(e) {
      const btn = e.target.closest(".menu_modal_btn_open");
      if (btn) {
        this.open(btn);
        return;
      }

      if (e.target.closest(".menu_modal_item")) {
        this.handleItemClick(e);
        return;
      }
    },

    open(btn) {
      this.closeExisting();

      document.body.insertAdjacentHTML("beforeend", this.MENU_HTML);
      const menuWrap = document.body.lastElementChild;
      const menuModal = menuWrap.querySelector(".menu_modal");

      menuModal.style.zIndex = CONFIG.zIndex.menu;

      setTimeout(() => menuWrap.classList.add("active"), 10);
      this.positionMenu(btn, menuModal);
      this.setupCloseHandlers(menuWrap, btn);
    },

    handleItemClick(e) {
      const menuItem = e.target.closest(".menu_modal_item");
      console.log(`Выбран пункт: ${menuItem.textContent}`);
      this.closeExisting();
    },

    positionMenu(btn, menuModal) {
      const btnRect = btn.getBoundingClientRect();
      const rightPosition = window.innerWidth - btnRect.right;

      Object.assign(menuModal.style, {
        position: "fixed",
        top: `${btnRect.bottom + window.scrollY}px`,
        right: `${rightPosition}px`,
      });
    },

    closeExisting() {
      const existingMenu = document.querySelector(".menu_modal_wrap");
      if (!existingMenu) return;

      existingMenu.classList.remove("active");
      eventSystem.remove(existingMenu);

      const cleanup = () => {
        existingMenu.remove();
      };

      if (getComputedStyle(existingMenu).transitionDuration !== "0s") {
        eventSystem.add(existingMenu, "transitionend", cleanup, { once: true });
        setTimeout(cleanup, CONFIG.transitions.duration);
      } else {
        cleanup();
      }
    },

    setupCloseHandlers(menuWrap, btn) {
      // Обработчик ресайза
      const handleResize = () => {
        this.positionMenu(btn, menuWrap.querySelector(".menu_modal"));
      };
      eventSystem.add(window, "resize", handleResize);
      menuWrap._resizeHandler = handleResize;

      // Обработчик клика вне меню
      const handleOutsideClick = (e) => {
        if (
          !e.target.closest(".menu_modal") &&
          !e.target.closest(".menu_modal_btn_open")
        ) {
          this.closeExisting();
        }
      };
      eventSystem.add(document, "click", handleOutsideClick);
      menuWrap._outsideClickHandler = handleOutsideClick;

      // Обработчик клика по оверлею
      eventSystem.add(menuWrap, "click", (e) => {
        if (e.target === menuWrap) this.closeExisting();
      });
    },
  };

  // ===== Проверка поддержки CSS =====
  const featureDetection = {
    checkSupport() {
      const features = {
        willChange: this.checkCSSSupport("willChange"),
        colorContrast: this.checkColorContrastSupport(),
        clipPath: this.checkCSSSupport("clip-path", "path('M0 0')"),
        hwb: this.checkHWBSupport(),
      };

      console.log("Поддержка CSS:", features);
      return features;
    },

    checkCSSSupport(property, testValue = "", withPrefixes = true) {
      const el = document.createElement("div").style;
      const prefixes = withPrefixes
        ? ["", "-webkit-", "-moz-", "-ms-", "-o-"]
        : [""];

      return prefixes.some((prefix) => {
        const prop = prefix + property;
        if (!(prop in el)) return false;
        if (!testValue) return true;

        try {
          el[prop] = testValue;
          return el[prop] === testValue;
        } catch {
          return false;
        }
      });
    },

    checkColorContrastSupport() {
      return (
        CSS.supports?.("color", "color-contrast(red vs white, black)") ??
        this.checkCSSSupport(
          "color",
          "color-contrast(red vs white, black)",
          false
        )
      );
    },

    checkHWBSupport() {
      return (
        CSS.supports?.("color", "hwb(120 0% 0%)") ??
        this.checkCSSSupport("color", "hwb(120 0% 0%)", false)
      );
    },
  };

  // ===== Инициализация приложения =====
  function init() {
    listModule.init();
    modalModule.init();
    themeModule.init();
    menuModule.init();
    featureDetection.checkSupport();
  }

  init();
});
