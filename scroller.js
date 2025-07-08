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
    this.lastScrollY = y;

    const now = performance.now();
    const timeDiff = now - this.lastDragTime;
    this.lastDragTime = now;

    // Используем экспоненциальное скользящее среднее для сглаживания скорости
    const alpha = 0.2; // Коэффициент сглаживания (0 < alpha < 1)
    this.velocity =
      alpha * (deltaY / (timeDiff || 1)) * 1000 + (1 - alpha) * this.velocity;

    // Упрощенная проверка порога срабатывания
    if (Math.abs(deltaY) > 2) {
      // Минимальный порог движения
      const direction = deltaY > 0 ? "down" : "up";

      // Динамический расчет фактора скорости с насыщением
      const speedBase = Math.min(
        MAX_SPEED_FACTOR,
        Math.abs(this.velocity) / 80
      );
      const speedFactor = Math.max(
        1,
        speedBase * (1 - Math.exp(-timeDiff / 100))
      );

      this.scroll(direction, speedFactor);
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
    if (Math.abs(this.velocity) < VELOCITY_THRESHOLD) {
      this.isScrolling = false;
      return;
    }

    const direction = this.velocity > 0 ? "down" : "up";
    const initialSpeed = Math.min(
      MAX_SPEED_FACTOR,
      Math.abs(this.velocity) / 100
    );

    // Параметры инерции
    const deceleration = 0.95; // Коэффициент замедления (0.9-0.99)
    const minSpeed = 0.5; // Минимальная скорость для остановки

    let currentSpeed = initialSpeed;
    let lastStepTime = performance.now();

    const inertiaStep = () => {
      const now = performance.now();
      const deltaTime = now - lastStepTime;
      lastStepTime = now;

      // Экспоненциальное замедление
      currentSpeed *= Math.pow(deceleration, deltaTime / 16);

      if (currentSpeed < minSpeed) {
        this.isScrolling = false;
        return;
      }

      this.scroll(direction, currentSpeed);
      requestAnimationFrame(inertiaStep);
    };

    requestAnimationFrame(inertiaStep);
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
document.addEventListener("DOMContentLoaded", function () {
  // Инициализация всех форм
  document.querySelectorAll(".interval_form").forEach((form) => {
    new IntervalScroller(form);
  });
});
