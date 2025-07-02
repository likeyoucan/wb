document.addEventListener("DOMContentLoaded", function () {
  // ===== Переключатель класса open для list_item =====
  const listItems = document.querySelectorAll(".list_item");
  const wrap = document.querySelector(".wrap");

  function closeAllItems() {
    listItems.forEach((item) => {
      item.classList.remove("open");
    });
  }

  listItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      const isCaptionClick = e.target.closest(".item_caption_wrap");
      const isOpen = this.classList.contains("open");

      if (isCaptionClick && isOpen) {
        this.classList.remove("open");
        return;
      }

      closeAllItems();
      this.classList.add("open");
    });
  });

  if (wrap) {
    wrap.addEventListener("click", function (e) {
      // Исключаем клики по модальному окну и его содержимому
      if (!e.target.closest(".list_item") && !e.target.closest(".modal_wrap")) {
        closeAllItems();
      }
    });
  }

  // ===== Модальное окно =====
  const modalTriggers = document.querySelectorAll(".modal");
  const modalCloseButtons = document.querySelectorAll(".modal_close");
  const modalWrap = document.querySelector(".modal_wrap");

  if (modalWrap) {
    modalTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation(); // Предотвращаем всплытие до wrap
        modalWrap.classList.toggle("modal_open");
      });
    });

    modalCloseButtons.forEach((closeButton) => {
      closeButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Предотвращаем всплытие до wrap
        modalWrap.classList.remove("modal_open");
      });
    });

    modalWrap.addEventListener("click", (e) => {
      if (e.target === modalWrap) {
        modalWrap.classList.remove("modal_open");
      }
    });
  }

  // ===== Переключатель темы =====
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

  applyInitialTheme();

  // ===== Временное отключение переходов =====
  const disableTransitionsTemporarily = () => {
    const elements = document.querySelectorAll("*");
    const originalTransitions = [];

    elements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const transitionDuration = styles.transitionDuration;
      const transitionDelay = styles.transitionDelay;

      if (transitionDuration !== "0s" || transitionDelay !== "0s") {
        originalTransitions.push({
          element: el,
          duration: transitionDuration,
          delay: transitionDelay,
        });
        el.style.transition = "none"; // Отключаем ВСЕ переходы (оптимизация)
      }
    });

    setTimeout(() => {
      originalTransitions.forEach((item) => {
        item.element.style.transition = ""; // Восстанавливаем исходные transition
      });
    }, 50);
  };

  // ===== Переключение темы с отключением анимаций =====
  const themeToggle = document.getElementById("theme_toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      // 1. Отключаем переходы
      disableTransitionsTemporarily();

      // 2. Меняем тему
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // ===== Modal menu =====

  // Обработчик клика по кнопке открытия меню
  // Общие переменные и константы
  const MENU_HTML = `
      <div class="menu_modal_wrap">
        <ul class="menu_modal">
          <li class="menu_modal_item">копировать задачу</li>
          <li class="menu_modal_item">перенести на другую дату</li>
          <li class="menu_modal_item">удалить</li>
        </ul>
      </div>
    `;

  // Главный обработчик кликов
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".menu_modal_btn_open");
    if (btn) {
      handleMenuOpen(btn);
      return;
    }

    if (e.target.closest(".menu_modal_item")) {
      handleMenuItemClick(e);
      return;
    }
  });

  // Функция открытия меню
  function handleMenuOpen(btn) {
    closeExistingMenu();

    document.body.insertAdjacentHTML("beforeend", MENU_HTML);
    const menuWrap = document.body.lastElementChild;
    const menuModal = menuWrap.querySelector(".menu_modal");

    setTimeout(() => menuWrap.classList.add("active"), 10);
    positionMenuRight(btn, menuModal);
    setupCloseHandlers(menuWrap, btn);
  }

  // Функция обработки клика по пункту меню
  function handleMenuItemClick(e) {
    const menuItem = e.target.closest(".menu_modal_item");
    console.log(`Выбран пункт: ${menuItem.textContent}`);
    closeExistingMenu();
  }

  // Функция позиционирования меню
  function positionMenuRight(btn, menuModal) {
    const btnRect = btn.getBoundingClientRect();
    const rightPosition = window.innerWidth - btnRect.right;

    Object.assign(menuModal.style, {
      position: "fixed",
      top: `${btnRect.bottom + window.scrollY}px`,
      right: `${rightPosition}px`,
      zIndex: "1001",
    });
  }

  // Функция закрытия меню
  function closeExistingMenu() {
    const existingMenu = document.querySelector(".menu_modal_wrap");
    if (!existingMenu) return;

    existingMenu.classList.remove("active");

    const cleanup = () => {
      existingMenu.remove();
      if (existingMenu._resizeHandler) {
        window.removeEventListener("resize", existingMenu._resizeHandler);
      }
      if (existingMenu._outsideClickHandler) {
        document.removeEventListener(
          "click",
          existingMenu._outsideClickHandler
        );
      }
    };

    // Ждем завершения анимации или удаляем сразу, если transition не поддерживается
    const onTransitionEnd = () => cleanup();
    existingMenu.addEventListener("transitionend", onTransitionEnd, {
      once: true,
    });

    // Fallback на случай, если transition не сработает
    setTimeout(cleanup, 300);
  }

  // Настройка обработчиков закрытия
  function setupCloseHandlers(menuWrap, btn) {
    // Обработчик ресайза
    const handleResize = () => {
      positionMenuRight(btn, menuWrap.querySelector(".menu_modal"));
    };
    window.addEventListener("resize", handleResize);
    menuWrap._resizeHandler = handleResize;

    // Обработчик клика вне меню
    const handleOutsideClick = (e) => {
      if (
        !e.target.closest(".menu_modal") &&
        !e.target.closest(".menu_modal_btn_open")
      ) {
        closeExistingMenu();
      }
    };
    document.addEventListener("click", handleOutsideClick);
    menuWrap._outsideClickHandler = handleOutsideClick;

    // Обработчик клика по оверлею
    menuWrap.addEventListener("click", (e) => {
      if (e.target === menuWrap) closeExistingMenu();
    });
  }

  // ===== Проверка поддержки CSS =====
  function checkCSSSupport(property, testValue = "", withPrefixes = true) {
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
  }
  // Переключеие отображения формы для создания list_item
  const openBtn = document.querySelector(".list_form_create_btn");
  const closeBtns = document.querySelectorAll(".close_form"); // Получаем все кнопки закрытия
  const formWrap = document.querySelector(".list_item_form_wrap");

  if (formWrap) {
    // Открытие формы (если кнопка существует)
    openBtn?.addEventListener("click", () =>
      formWrap.classList.add("open_form")
    );

    // Закрытие формы (обработчик для каждой кнопки .close_form)
    closeBtns.forEach((btn) => {
      btn.addEventListener("click", () =>
        formWrap.classList.remove("open_form")
      );
    });
  }

  // Проверки поддержки (можно вынести в отдельный файл)
  const willChangeSupported = checkCSSSupport("willChange");
  console.log(
    `Поддержка will-change: ${willChangeSupported ? "✅ Да" : "❌ Нет"}`
  );

  const colorContrastSupported =
    CSS.supports?.("color", "color-contrast(red vs white, black)") ??
    checkCSSSupport("color", "color-contrast(red vs white, black)", false);
  console.log(
    `Поддержка color-contrast: ${colorContrastSupported ? "✅ Да" : "❌ Нет"}`
  );

  const clipPathPathSupported = checkCSSSupport("clip-path", "path('M0 0')");
  console.log(
    `Поддержка clip-path: path(): ${clipPathPathSupported ? "✅ Да" : "❌ Нет"}`
  );

  const hwbSupported =
    CSS.supports?.("color", "hwb(120 0% 0%)") ??
    checkCSSSupport("color", "hwb(120 0% 0%)", false);
  console.log(`Поддержка HWB цветов: ${hwbSupported ? "✅ Да" : "❌ Нет"}`);
});
