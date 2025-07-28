/**
 * Custom Select Component
 * Кастомный селект с анимациями и поддержкой touch-событий
 */
document.addEventListener("DOMContentLoaded", () => {
  class CustomSelect {
    constructor(selectElement) {
      this.select = selectElement;
      this.header = this.select.querySelector(".item_select");
      this.options = Array.from(
        this.select.querySelectorAll(".select_option_wrap:not(.item_select)")
      );
      this.isOpen = false;
      this._init();
    }

    _init() {
      this._setupEventListeners();
    }

    _setupEventListeners() {
      this.header.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });

      this.options.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          this._selectOption(option);
        });
      });

      document.addEventListener("click", () => {
        if (this.isOpen) {
          this.close();
        }
      });
    }

    _selectOption(option) {
      const currentSelected = this.select.querySelector(".item_select");
      if (!currentSelected) return;

      const currentOption = currentSelected.querySelector(".option_name");
      const selectedOption = option.querySelector(".option_name");
      if (!currentOption || !selectedOption) return;

      // Сохраняем текущие данные
      const prevData = {
        classes: currentSelected.className.replace("item_select", "").trim(),
        text: currentOption.textContent,
      };

      // Обмен данными между элементами
      currentSelected.className = `${option.className
        .replace("item_select", "")
        .trim()} item_select`;
      currentOption.textContent = selectedOption.textContent;
      option.className = prevData.classes;
      selectedOption.textContent = prevData.text;

      this.close();

      // Эмитируем событие изменения
      this.select.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            value: currentOption.textContent,
            selectedClass: currentSelected.className,
          },
        })
      );
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.select.classList.add("select_open");
      this.isOpen = true;
    }

    close() {
      this.select.classList.remove("select_open");
      this.isOpen = false;
    }

    destroy() {
      this.header.removeEventListener("click", this._handleHeaderClick);
      this.options.forEach((option) => {
        option.removeEventListener("click", this._handleOptionClick);
      });
      document.removeEventListener("click", this._handleDocumentClick);
    }
  }

  const initCustomSelects = () => {
    const selects = document.querySelectorAll(".select");
    const instances = new WeakMap();

    selects.forEach((select) => {
      // Удаляем предыдущий экземпляр, если есть
      if (instances.has(select)) {
        instances.get(select).destroy();
      }

      const instance = new CustomSelect(select);
      instances.set(select, instance);
    });

    return instances;
  };

  // Инициализация при загрузке
  initCustomSelects();

  // Экспортируем функцию для повторной инициализации
  window.initCustomSelects = initCustomSelects;
});
