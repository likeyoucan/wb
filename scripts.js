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

  // ===== Notes =====

  // Находим все элементы .notes_switch
  document.addEventListener("click", (e) => {
    // Проверяем, был ли клик по элементу .notes_switch или его потомку
    const switchElement = e.target.closest(".notes_switch");
    if (switchElement) {
      // Переключаем класс edit у ближайшего родителя .section_notes
      const sectionNotes = switchElement.closest(".section_notes");
      sectionNotes?.classList.toggle("open");
    }
  });

  // ===== Вертикальный счетчик =====
  const INTERVAL_CONFIG = {
    hours: { min: 0, max: 23 },
    minutes: { min: 0, max: 59 },
  };

  // Константы для анимации
  const BASE_ANIMATION_DURATION = 350;
  const VELOCITY_THRESHOLD = 50;
  const MAX_SPEED_FACTOR = 3;
  const INERTIA_STEP_DELAY = 50;
  const SCROLL_THRESHOLD = 60;
  const DRAG_SCROLL_COOLDOWN = BASE_ANIMATION_DURATION * 0.8;

  class IntervalScroller {
    constructor(form) {
      this.form = form;
      this.isHours = form.classList.contains("hours");
      this.isAnimating = false;
      this.isScrolling = false;
      this.velocity = 0;
      this.lastDirection = null;
      this.startY = 0;
      this.lastScrollY = 0;
      this.scrollLock = false;
      this.lastDragTime = 0;
      this.accumulatedDelta = 0;
      this.lastWheelTime = 0;

      this.init();
    }

    init() {
      this.initializeIntervals();
      this.setupEventListeners();
    }

    initializeIntervals() {
      const activeValue = parseInt(
        this.form.querySelector(".is_active")?.textContent || 0
      );
      const values = this.calculateIntervalValues(activeValue);
      const classes = [
        "is_prev_hidden",
        "is_prev",
        "is_active",
        "is_next",
        "is_next_hidden",
      ];

      this.form.innerHTML = "";
      values.forEach((value, index) => {
        const span = document.createElement("span");
        span.className = `interval ${classes[index]}`;
        span.textContent = this.formatValue(value);
        this.form.appendChild(span);
      });
    }

    calculateIntervalValues(activeValue) {
      return [
        this.getBoundedValue(activeValue - 2),
        this.getBoundedValue(activeValue - 1),
        activeValue,
        this.getBoundedValue(activeValue + 1),
        this.getBoundedValue(activeValue + 2),
      ];
    }

    getBoundedValue(value) {
      const config = this.isHours
        ? INTERVAL_CONFIG.hours
        : INTERVAL_CONFIG.minutes;
      const range = config.max - config.min + 1;

      if (value < config.min) {
        return config.max - ((config.min - value - 1) % range);
      }
      if (value > config.max) {
        return config.min + ((value - config.max - 1) % range);
      }
      return value;
    }

    formatValue(value) {
      return value.toString().padStart(2, "0");
    }

    updateHiddenValues() {
      const intervals = Array.from(this.form.querySelectorAll(".interval"));
      const activeValue = parseInt(
        this.form.querySelector(".is_active").textContent
      );

      intervals.forEach((el) => {
        if (el.classList.contains("is_prev_hidden")) {
          el.textContent = this.formatValue(
            this.getBoundedValue(activeValue - 2)
          );
        } else if (el.classList.contains("is_next_hidden")) {
          el.textContent = this.formatValue(
            this.getBoundedValue(activeValue + 2)
          );
        }
      });
    }

    scroll(direction, speedFactor = 1) {
      if (this.isAnimating || this.scrollLock) return;

      this.scrollLock = true;
      this.isAnimating = true;

      const intervals = Array.from(this.form.querySelectorAll(".interval"));
      const duration = Math.max(
        250,
        BASE_ANIMATION_DURATION / Math.max(1, speedFactor * 0.8)
      );

      intervals.forEach((el) => {
        el.style.setProperty("--duration", `${duration}ms`);
      });

      intervals.forEach((el) => {
        const classList = el.classList;
        const classMap = {
          down: {
            is_prev_hidden: "is_prev",
            is_prev: "is_active",
            is_active: "is_next",
            is_next: "is_next_hidden",
            is_next_hidden: "is_prev_hidden",
          },
          up: {
            is_prev_hidden: "is_next_hidden",
            is_prev: "is_prev_hidden",
            is_active: "is_prev",
            is_next: "is_active",
            is_next_hidden: "is_next",
          },
        };

        const currentClass = Array.from(classList).find((cls) =>
          cls.startsWith("is_")
        );
        if (currentClass && classMap[direction][currentClass]) {
          classList.replace(currentClass, classMap[direction][currentClass]);
        }
      });

      setTimeout(() => {
        this.updateHiddenValues();
        this.isAnimating = false;
        this.scrollLock = false;
      }, duration);
    }

    setupEventListeners() {
      this.form.addEventListener("mousedown", this.handleStart.bind(this));
      this.form.addEventListener("touchstart", this.handleStart.bind(this), {
        passive: false,
      });
      this.form.addEventListener("wheel", this.handleWheel.bind(this), {
        passive: false,
      });
    }

    handleStart(e) {
      if (this.isAnimating) return;

      this.isScrolling = true;
      this.startY = e.clientY || e.touches[0].clientY;
      this.lastScrollY = this.startY;
      this.velocity = 0;
      this.lastDirection = null;
      this.accumulatedDelta = 0;
      this.lastDragTime = performance.now();

      e.preventDefault();
      document.addEventListener("mousemove", this.handleMove.bind(this));
      document.addEventListener("touchmove", this.handleMove.bind(this), {
        passive: false,
      });
      document.addEventListener("mouseup", this.handleEnd.bind(this));
      document.addEventListener("touchend", this.handleEnd.bind(this));
    }

    handleMove(e) {
      if (!this.isScrolling || this.isAnimating) return;

      const y = e.clientY || e.touches[0].clientY;
      const deltaY = y - this.lastScrollY;
      this.accumulatedDelta += deltaY;
      this.lastScrollY = y;

      const now = performance.now();
      const timeDiff = now - this.lastDragTime;

      if (
        Math.abs(this.accumulatedDelta) < SCROLL_THRESHOLD &&
        timeDiff < DRAG_SCROLL_COOLDOWN
      ) {
        return;
      }

      if (Math.abs(this.accumulatedDelta) >= SCROLL_THRESHOLD) {
        this.velocity = (this.accumulatedDelta / timeDiff) * 1000;
        const direction = this.accumulatedDelta > 0 ? "down" : "up";

        if (
          direction !== this.lastDirection ||
          timeDiff >= DRAG_SCROLL_COOLDOWN
        ) {
          const speedFactor = Math.min(
            MAX_SPEED_FACTOR,
            Math.max(1, Math.abs(this.velocity) / 100)
          );
          this.scroll(direction, speedFactor);
          this.lastDirection = direction;
          this.lastDragTime = now;
          this.accumulatedDelta = 0;
        }
      }

      e.preventDefault();
    }

    handleEnd() {
      if (!this.isScrolling) return;

      if (Math.abs(this.velocity) > VELOCITY_THRESHOLD) {
        this.applyInertia();
      } else {
        this.isScrolling = false;
      }

      document.removeEventListener("mousemove", this.handleMove.bind(this));
      document.removeEventListener("touchmove", this.handleMove.bind(this));
      document.removeEventListener("mouseup", this.handleEnd.bind(this));
      document.removeEventListener("touchend", this.handleEnd.bind(this));
    }

    applyInertia() {
      const direction = this.velocity > 0 ? "down" : "up";
      const speed = Math.min(MAX_SPEED_FACTOR, Math.abs(this.velocity) / 100);
      const steps = Math.min(3, Math.ceil(speed));

      let step = 0;
      const inertiaInterval = setInterval(() => {
        if (step >= steps || !this.isScrolling) {
          clearInterval(inertiaInterval);
          this.isScrolling = false;
          return;
        }

        const currentSpeedFactor = speed * (1 - step / steps);
        this.scroll(direction, currentSpeedFactor);
        step++;
      }, Math.max(INERTIA_STEP_DELAY, 150 / speed));
    }

    handleWheel(e) {
      e.preventDefault();
      if (this.isAnimating) return;

      const now = performance.now();
      const deltaTime = now - (this.lastWheelTime || now);
      this.lastWheelTime = now;

      const speedFactor = Math.min(
        MAX_SPEED_FACTOR,
        Math.max(1, Math.abs(e.deltaY) / 5)
      );

      if (e.deltaY > 0) {
        this.scroll("down", speedFactor);
      } else {
        this.scroll("up", speedFactor);
      }
    }
  }

  // Инициализация всех форм
  document.querySelectorAll(".interval_form").forEach((form) => {
    new IntervalScroller(form);
  });

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
