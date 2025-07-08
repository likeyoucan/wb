document.addEventListener("DOMContentLoaded", function () {
  const INTERVAL_CONFIG = {
    hours: { min: 0, max: 23 },
    minutes: { min: 0, max: 59 },
  };

  const BASE_ANIMATION_DURATION = 350;
  const SCROLL_THRESHOLD = 2;
  const INITIAL_SCROLL_INTERVAL = 200; // Начальный интервал (медленно)
  const ACCELERATED_SCROLL_INTERVAL = 50; // Ускоренный интервал
  const ACCELERATION_DELAY = 5000; // 5 секунд до ускорения
  const MAX_SPEED_FACTOR = 3; // Максимальный коэффициент ускорения

  class IntervalScroller {
    constructor(form) {
      this.form = form;
      this.isHours = form.classList.contains("hours");
      this.isAnimating = false;
      this.isDragging = false;
      this.isMouseDown = false;
      this.startY = 0;
      this.lastY = 0;
      this.scrollLock = false;
      this.autoScrollTimer = null;
      this.accelerationTimer = null;
      this.scrollDirection = null;
      this.currentSpeedFactor = 1;
      this.holdStartTime = 0;

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
        100, // Минимальная длительность
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

      this.isDragging = true;
      this.isMouseDown = true;
      this.startY = this.lastY = e.clientY || e.touches[0].clientY;
      this.scrollLock = false;
      this.holdStartTime = Date.now();

      e.preventDefault();
      document.addEventListener("mousemove", this.handleMove.bind(this));
      document.addEventListener("touchmove", this.handleMove.bind(this), {
        passive: false,
      });
      document.addEventListener("mouseup", this.handleEnd.bind(this));
      document.addEventListener("touchend", this.handleEnd.bind(this));
    }

    handleMove(e) {
      if (!this.isDragging || this.isAnimating || this.scrollLock) return;

      const y = e.clientY || e.touches[0].clientY;
      const deltaY = y - this.lastY;
      this.lastY = y;

      if (Math.abs(deltaY) > SCROLL_THRESHOLD) {
        const direction = deltaY > 0 ? "down" : "up";
        this.scrollDirection = direction;
        const holdDuration = (Date.now() - this.holdStartTime) / 1000;
        const speedFactor = Math.min(MAX_SPEED_FACTOR, 1 + holdDuration / 2);
        this.scroll(direction, speedFactor);
      }

      e.preventDefault();
    }

    startAutoScroll() {
      if (this.autoScrollTimer) return;

      this.holdStartTime = Date.now();
      this.currentSpeedFactor = 1;

      // Запускаем проверку времени удержания для ускорения
      this.accelerationTimer = setTimeout(() => {
        this.currentSpeedFactor = MAX_SPEED_FACTOR;
      }, ACCELERATION_DELAY);

      // Функция автоскролла
      const scrollFn = () => {
        if (this.scrollDirection && this.isMouseDown) {
          // Плавное увеличение скорости
          const holdDuration = (Date.now() - this.holdStartTime) / 1000;
          const speedFactor = Math.min(
            MAX_SPEED_FACTOR,
            1 + (holdDuration * holdDuration) / 4
          );

          this.scroll(this.scrollDirection, speedFactor);

          // Динамический интервал в зависимости от скорости
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
      this.scrollDirection = null;
      this.currentSpeedFactor = 1;
    }

    handleEnd() {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.isMouseDown = false;
      this.stopAutoScroll();

      document.removeEventListener("mousemove", this.handleMove.bind(this));
      document.removeEventListener("touchmove", this.handleMove.bind(this));
      document.removeEventListener("mouseup", this.handleEnd.bind(this));
      document.removeEventListener("touchend", this.handleEnd.bind(this));
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

  // Инициализация всех форм
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
