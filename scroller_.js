/**
 * IntervalScroller - Скроллер для выбора временных интервалов
 * Полная версия с поддержкой тач-событий, колеса мыши и автопрокрутки
 */

const INTERVAL_CONFIG = {
  hours: { min: 0, max: 23 },
  minutes: { min: 0, max: 59 },
};

// Константы для настройки поведения
const BASE_ANIMATION_DURATION = 350;
const SCROLL_THRESHOLD = 2;
const INITIAL_SCROLL_INTERVAL = 200;
const ACCELERATED_SCROLL_INTERVAL = 50;
const ACCELERATION_DELAY = 1000;
const MAX_SPEED_FACTOR = 4;
const TOUCH_HOLD_DELAY = 200;
const MIN_ANIMATION_DURATION = 50;
const CONTINUOUS_SCROLL_DELAY = 300;
const TOUCH_SCROLL_DEADZONE = 5;
const TOUCH_COOLDOWN = 150;
const ANIMATION_BUFFER = 50;
const ACCELERATION_RATE = 0.5;

class IntervalScroller {
  constructor(form) {
    this.form = form;
    this.isHours = form.classList.contains("hours");

    // Состояния
    this.isAnimating = false;
    this.isDragging = false;
    this.isMouseDown = false;
    this.isTouchHold = false;
    this.isContinuousScroll = false;
    this.hasMoved = false;
    this.touchCooldown = false;

    // Позиции
    this.startY = 0;
    this.lastY = 0;
    this.lastDeltaY = 0;
    this.accumulatedDelta = 0;

    // Контроль прокрутки
    this.scrollLock = false;
    this.autoScrollTimer = null;
    this.accelerationTimer = null;
    this.touchHoldTimer = null;
    this.continuousScrollTimer = null;
    this.cooldownTimer = null;
    this.scrollDirection = null;
    this.currentSpeedFactor = 1;
    this.holdStartTime = 0;
    this.lastScrollTime = 0;

    // Привязка методов
    this.handleStart = this.handleStart.bind(this);
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

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
    if (
      this.isAnimating ||
      this.scrollLock ||
      (this.touchCooldown && !this.isMouseDown)
    )
      return;

    const now = Date.now();
    if (now - this.lastScrollTime < 10) return;
    this.lastScrollTime = now;

    this.scrollLock = true;
    this.isAnimating = true;
    this.startTouchCooldown();

    const intervals = Array.from(this.form.querySelectorAll(".interval"));
    const duration = Math.max(
      MIN_ANIMATION_DURATION,
      BASE_ANIMATION_DURATION / Math.max(1, speedFactor)
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

      // Эмитируем событие изменения значения
      const activeValue = this.form.querySelector(".is_active").textContent;
      this.form.dispatchEvent(
        new CustomEvent("valueChange", {
          detail: { value: activeValue },
        })
      );
    }, duration + ANIMATION_BUFFER);
  }

  startTouchCooldown() {
    this.touchCooldown = true;
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }
    this.cooldownTimer = setTimeout(() => {
      this.touchCooldown = false;
    }, TOUCH_COOLDOWN);
  }

  setupEventListeners() {
    this.form.addEventListener("mousedown", this.handleStart);
    this.form.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.form.addEventListener("wheel", this.handleWheel, {
      passive: false,
    });
  }

  handleStart(e) {
    if (this.isAnimating) return;

    this.isDragging = true;
    this.isMouseDown = true;
    this.startY = this.lastY = e.clientY;
    this.holdStartTime = Date.now();
    this.scrollLock = false;

    e.preventDefault();
    document.addEventListener("mousemove", this.handleMove);
    document.addEventListener("mouseup", this.handleEnd);
  }

  handleTouchStart(e) {
    if (this.isAnimating || this.touchCooldown) return;

    this.isDragging = true;
    this.startY = this.lastY = e.touches[0].clientY;
    this.holdStartTime = Date.now();
    this.scrollLock = false;
    this.isContinuousScroll = false;
    this.hasMoved = false;
    this.accumulatedDelta = 0;

    this.stopAutoScroll();
    if (this.continuousScrollTimer) {
      clearTimeout(this.continuousScrollTimer);
      this.continuousScrollTimer = null;
    }

    e.preventDefault();
    document.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd);
  }

  handleMove(e) {
    if (!this.isDragging || this.isAnimating || this.scrollLock) return;

    const y = e.clientY;
    const deltaY = y - this.lastY;
    this.lastY = y;

    if (Math.abs(deltaY) > SCROLL_THRESHOLD) {
      const direction = deltaY > 0 ? "down" : "up";
      this.scrollDirection = direction;

      const holdDuration = (Date.now() - this.holdStartTime) / 1000;
      const speedFactor = Math.min(
        MAX_SPEED_FACTOR,
        1 + Math.pow(holdDuration, 1.5)
      );

      this.scroll(direction, speedFactor);
    }

    e.preventDefault();
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.isAnimating || this.scrollLock) return;

    const y = e.touches[0].clientY;
    const deltaY = y - this.lastY;
    this.lastDeltaY = deltaY;
    this.lastY = y;
    this.accumulatedDelta += Math.abs(deltaY);

    if (Math.abs(deltaY) < TOUCH_SCROLL_DEADZONE) return;

    this.hasMoved = true;

    if (Math.abs(deltaY) > SCROLL_THRESHOLD) {
      const direction = deltaY > 0 ? "down" : "up";
      this.scrollDirection = direction;

      const speedFactor = Math.min(
        MAX_SPEED_FACTOR,
        1 + (this.accumulatedDelta * ACCELERATION_RATE) / 100
      );

      this.scroll(direction, speedFactor);

      if (this.continuousScrollTimer) {
        clearTimeout(this.continuousScrollTimer);
      }

      this.continuousScrollTimer = setTimeout(() => {
        if (this.isDragging && !this.isTouchHold && this.hasMoved) {
          this.isContinuousScroll = true;
          this.startAutoScroll();
        }
      }, CONTINUOUS_SCROLL_DELAY);
    }

    e.preventDefault();
  }

  startAutoScroll() {
    if (this.autoScrollTimer || !this.scrollDirection) return;

    this.holdStartTime = Date.now();
    this.currentSpeedFactor = 1;
    this.accumulatedDelta = 0;

    this.accelerationTimer = setTimeout(() => {
      this.currentSpeedFactor = MAX_SPEED_FACTOR;
    }, ACCELERATION_DELAY);

    const scrollFn = () => {
      if (
        this.scrollDirection &&
        (this.isMouseDown || this.isTouchHold || this.isContinuousScroll)
      ) {
        const holdDuration = (Date.now() - this.holdStartTime) / 1000;
        const speedFactor = Math.min(
          MAX_SPEED_FACTOR,
          1 + Math.pow(holdDuration, 1.5)
        );

        this.scroll(this.scrollDirection, speedFactor);

        const interval = Math.max(
          ACCELERATED_SCROLL_INTERVAL,
          INITIAL_SCROLL_INTERVAL / speedFactor
        );

        this.autoScrollTimer = setTimeout(scrollFn, interval);
      }
    };

    this.autoScrollTimer = setTimeout(scrollFn, INITIAL_SCROLL_INTERVAL);
  }

  stopAutoScroll() {
    if (this.autoScrollTimer) {
      clearTimeout(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
    if (this.accelerationTimer) {
      clearTimeout(this.accelerationTimer);
      this.accelerationTimer = null;
    }
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    this.scrollDirection = null;
    this.currentSpeedFactor = 1;
    this.isTouchHold = false;
    this.isContinuousScroll = false;
  }

  handleEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.isMouseDown = false;
    this.stopAutoScroll();

    document.removeEventListener("mousemove", this.handleMove);
    document.removeEventListener("mouseup", this.handleEnd);
  }

  handleTouchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.isContinuousScroll = false;
    this.stopAutoScroll();

    if (this.continuousScrollTimer) {
      clearTimeout(this.continuousScrollTimer);
      this.continuousScrollTimer = null;
    }

    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
  }

  handleWheel(e) {
    e.preventDefault();
    if (this.isAnimating) return;

    if (e.deltaY > 0) {
      this.scroll("down", 1);
    } else {
      this.scroll("up", 1);
    }
  }

  destroy() {
    // Очищаем все таймеры
    this.stopAutoScroll();

    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }
    if (this.continuousScrollTimer) {
      clearTimeout(this.continuousScrollTimer);
    }

    // Удаляем обработчики событий
    this.form.removeEventListener("mousedown", this.handleStart);
    this.form.removeEventListener("touchstart", this.handleTouchStart);
    this.form.removeEventListener("wheel", this.handleWheel);
    document.removeEventListener("mousemove", this.handleMove);
    document.removeEventListener("mouseup", this.handleEnd);
    document.removeEventListener("touchmove", this.handleTouchMove);
    document.removeEventListener("touchend", this.handleTouchEnd);
  }
}

// Делаем класс доступным глобально
window.IntervalScroller = IntervalScroller;
