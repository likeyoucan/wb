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
      this._handleColorClassUpdate(); // Добавляем обработчик цвета при инициализации
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

      // Слушаем собственное событие change для обновления цвета
      this.select.addEventListener("change", (e) => {
        if (this.select.classList.contains("select_colors")) {
          this._handleColorClassUpdate();
        }
      });
    }

    // Новый метод для обработки цветовых классов
    _handleColorClassUpdate() {
      if (!this.select.classList.contains("select_colors")) return;

      const todoListWrap = document.querySelector(".todo_list_wrap");
      if (!todoListWrap) return;

      // Находим класс color_ в текущем выбранном элементе
      const colorClass = Array.from(this.header.classList).find((className) =>
        className.startsWith("color_")
      );

      if (colorClass) {
        // Удаляем все существующие color_ классы
        Array.from(todoListWrap.classList).forEach((className) => {
          if (className.startsWith("color_")) {
            todoListWrap.classList.remove(className);
          }
        });

        // Добавляем новый класс
        todoListWrap.classList.add(colorClass);
      }
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

      // Инициализируем цвет сразу, если это select_colors
      if (select.classList.contains("select_colors")) {
        instance._handleColorClassUpdate();
      }
    });

    return instances;
  };

  // Инициализация при загрузке
  initCustomSelects();

  // Экспортируем функцию для повторной инициализации
  window.initCustomSelects = initCustomSelects;
});
