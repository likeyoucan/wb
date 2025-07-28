document.addEventListener("DOMContentLoaded", function () {
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
      this.form.addEventListener("mousedown", this.handleStart.bind(this));

      this.form.addEventListener(
        "touchstart",
        this.handleTouchStart.bind(this),
        {
          passive: false,
        }
      );

      this.form.addEventListener("wheel", this.handleWheel.bind(this), {
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
      document.addEventListener("mousemove", this.handleMove.bind(this));
      document.addEventListener("mouseup", this.handleEnd.bind(this));
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
      document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
        passive: false,
      });
      document.addEventListener("touchend", this.handleTouchEnd.bind(this));
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

      document.removeEventListener("mousemove", this.handleMove.bind(this));
      document.removeEventListener("mouseup", this.handleEnd.bind(this));
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

      document.removeEventListener(
        "touchmove",
        this.handleTouchMove.bind(this)
      );
      document.removeEventListener("touchend", this.handleTouchEnd.bind(this));
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
  }

  // Инициализация всех счетчиков
  document.querySelectorAll(".interval_form").forEach((form) => {
    const scroller = new IntervalScroller(form);

    form.addEventListener("mousedown", (e) => {
      const rect = form.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      if (y < height / 3) {
        scroller.scrollDirection = "up";
        scroller.startAutoScroll();
      } else if (y > (height * 2) / 3) {
        scroller.scrollDirection = "down";
        scroller.startAutoScroll();
      }
    });

    document.addEventListener("mouseup", () => {
      scroller.stopAutoScroll();
    });
  });
});
