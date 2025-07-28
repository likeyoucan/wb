/**
 * MAIN APPLICATION SCRIPT
 * Основной скрипт приложения ToDo List
 */

document.addEventListener("DOMContentLoaded", function () {
  // Проверка зависимостей
  if (typeof IntervalScroller === "undefined") {
    console.warn(
      "IntervalScroller не загружен - некоторые функции могут не работать"
    );
  }
  if (typeof modalSystem === "undefined") {
    console.warn(
      "ModalSystem не загружена - некоторые функции могут не работать"
    );
  }

  // ===== Инициализация элементов DOM =====
  const elements = {
    wrap: document.querySelector(".wrap"),
    body: document.body,
    listItems: document.querySelectorAll(".list_item"),
    mainMenu: {
      button: document.getElementById("main_menu"),
      wrap: document.querySelector(".main_menu_wrap"),
      overlay: document.querySelector(".menu_wrap_overlay"),
      closeBtn: document.querySelector(".main_menu_close"),
    },
    form: {
      wrap: document.querySelector(".list_item_form_wrap"),
      openBtn: document.querySelector(".list_form_create_btn"),
      closeBtns: document.querySelectorAll(".close_form"),
    },
    themeToggle: document.getElementById("theme_toggle"),
  };

  // ===== Вспомогательные функции =====
  const helpers = {
    /** Закрывает все открытые элементы списка */
    closeAllItems: () => {
      document
        .querySelectorAll(".list_item.open")
        .forEach((item) => item.classList.remove("open"));
    },

    /** Проверяет поддержку CSS-свойства */
    checkCSSSupport: (property, testValue = "", withPrefixes = true) => {
      const el = document.createElement("div").style;
      const prefixes = withPrefixes
        ? ["", "-webkit-", "-moz-", "-ms-", "-o-"]
        : [""];
      return prefixes.some((prefix) => {
        const prop = prefix + property;
        return (
          prop in el &&
          (!testValue ||
            (() => {
              try {
                el[prop] = testValue;
                return el[prop] === testValue;
              } catch {
                return false;
              }
            })())
        );
      });
    },

    /** Временно отключает CSS-переходы */
    disableTransitions: () => {
      const transitionElements = Array.from(
        document.querySelectorAll("*")
      ).filter((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.transitionDuration !== "0s" || styles.transitionDelay !== "0s"
        );
      });

      const originalTransitions = transitionElements.map((el) => ({
        element: el,
        transition: el.style.transition,
      }));

      transitionElements.forEach((el) => (el.style.transition = "none"));

      setTimeout(() => {
        originalTransitions.forEach(({ element, transition }) => {
          element.style.transition = transition;
        });
      }, 50);
    },

    /** Делегирование событий */
    delegateEvent: (event, selector, handler, context = document) => {
      context.addEventListener(event, function (e) {
        let target = e.target;
        while (target && target !== context) {
          if (target.matches(selector)) {
            handler.call(target, e);
            break;
          }
          target = target.parentNode;
        }
      });
    },
  };

  // ===== Основные модули приложения =====

  /** Настройка элементов списка задач */
  function setupListItems() {
    helpers.delegateEvent("click", ".list_item", function (e) {
      const isCaptionClick = e.target.closest(".item_caption_wrap");
      const isOpen = this.classList.contains("open");

      if (isCaptionClick && isOpen) {
        this.classList.remove("open");
        return;
      }

      helpers.closeAllItems();
      this.classList.add("open");
    });

    if (elements.wrap) {
      elements.wrap.addEventListener("click", function (e) {
        if (!e.target.closest(".list_item")) {
          helpers.closeAllItems();
        }
      });
    }
  }

  /** Настройка главного меню */
  function setupMainMenu() {
    const { button, wrap, overlay, closeBtn } = elements.mainMenu;
    if (!button || !wrap) return;

    // Элементы, к которым нужно добавить класс при открытии меню
    const affectedElements = [
      wrap, // .main_menu_wrap (оригинальный элемент)
      document.querySelector(".list_items_wrap"),
      document.querySelector(".list_form_create_btn"),
      document.querySelector(".nav_wrap"),
    ].filter((el) => el); // Фильтруем null (если элементы не найдены)

    const toggleMenu = (open) => {
      // Добавляем/удаляем класс всем указанным элементам
      affectedElements.forEach((el) =>
        el.classList.toggle("main_menu_open", open)
      );
      elements.body.classList.toggle("menu_open", open);
    };

    const handleMenuClick = (e) => {
      e.stopPropagation();
      toggleMenu(!wrap.classList.contains("main_menu_open"));
    };

    const handleClose = (e) => {
      e?.stopPropagation();
      toggleMenu(false);
    };

    const handleOutsideClick = (e) => {
      if (
        !e.target.closest(".main_menu_wrap") &&
        !e.target.closest("#main_menu") &&
        wrap.classList.contains("main_menu_open")
      ) {
        handleClose();
      }
    };

    button.addEventListener("click", handleMenuClick);
    closeBtn?.addEventListener("click", handleClose);
    overlay?.addEventListener("click", handleClose);
    document.addEventListener("click", handleOutsideClick);
  }

  /** Настройка формы добавления задачи */
  function setupItemForm() {
    if (!elements.form.wrap) return;

    elements.form.openBtn?.addEventListener("click", () => {
      elements.form.wrap.classList.add("open_form");
    });

    elements.form.closeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        elements.form.wrap.classList.remove("open_form");
      });
    });
  }

  /** Настройка переключателя темы */
  function setupThemeSwitcher() {
    if (!elements.themeToggle) return;

    const applyInitialTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        savedTheme || (systemPrefersDark ? "dark" : "light")
      );
    };

    elements.themeToggle.addEventListener("click", () => {
      helpers.disableTransitions();
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });

    applyInitialTheme();
  }

  /** Настройка контекстного меню */
  function setupContextMenu() {
    const MENU_HTML = `
      <div class="menu_modal_wrap">
        <ul class="menu_modal">
          <li class="menu_modal_item">Копировать задачу</li>
          <li class="menu_modal_item">Перенести на другую дату</li>
          <li class="menu_modal_item">Удалить</li>
        </ul>
      </div>
    `;

    let currentMenu = null;

    function createMenu(btn) {
      closeMenu();
      elements.body.insertAdjacentHTML("beforeend", MENU_HTML);
      currentMenu = elements.body.lastElementChild;
      const menuModal = currentMenu.querySelector(".menu_modal");

      setTimeout(() => currentMenu.classList.add("active"), 10);

      const btnRect = btn.getBoundingClientRect();
      const rightPosition = window.innerWidth - btnRect.right;
      Object.assign(menuModal.style, {
        position: "fixed",
        top: `${btnRect.bottom + window.scrollY}px`,
        right: `${rightPosition}px`,
        zIndex: "1001",
      });

      const handleOutsideClick = (e) => {
        if (
          !e.target.closest(".menu_modal") &&
          !e.target.closest(".menu_modal_btn_open")
        ) {
          closeMenu();
        }
      };

      document.addEventListener("click", handleOutsideClick);
      currentMenu._outsideClickHandler = handleOutsideClick;
    }

    function closeMenu() {
      if (!currentMenu) return;
      currentMenu.classList.remove("active");

      const cleanup = () => {
        if (!currentMenu) return;
        document.removeEventListener("click", currentMenu._outsideClickHandler);
        currentMenu.remove();
        currentMenu = null;
      };

      currentMenu.addEventListener("transitionend", cleanup, { once: true });
      setTimeout(cleanup, 300);
    }

    helpers.delegateEvent(
      "click",
      ".menu_modal_btn_open:not(.disabled)",
      function (e) {
        if (this.classList.contains("disabled")) return;
        e.stopPropagation();
        createMenu(this);
      }
    );

    helpers.delegateEvent("click", ".menu_modal_item", function () {
      closeMenu();
    });
  }

  /** Настройка заметок к задачам */
  function setupNotes() {
    helpers.delegateEvent(
      "click",
      ".notes_switch:not(.disabled)",
      function (e) {
        if (this.classList.contains("disabled")) return;
        this.closest(".section_notes")?.classList.toggle("open");
      }
    );
  }

  // ===== Инициализация приложения =====
  setupListItems();
  setupMainMenu();
  setupItemForm();
  setupThemeSwitcher();
  setupContextMenu();
  setupNotes();
});
