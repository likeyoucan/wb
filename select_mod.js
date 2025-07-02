document.addEventListener("DOMContentLoaded", () => {
  const initCustomSelect = (selectClass = "select") => {
    const selects = document.querySelectorAll(`.${selectClass}`);
    if (!selects.length) return;

    // Закрыть все открытые селекты, кроме исключения
    const closeAllSelects = (except = null) => {
      document
        .querySelectorAll(`.${selectClass}.select_open`)
        .forEach((select) => {
          if (select !== except) select.classList.remove("select_open");
        });
    };

    // Обработчик выбора опции
    const handleOptionSelect = (select, option) => {
      const selected = select.querySelector(".select_option_wrap.item_select");
      if (!selected) return;

      const currentOption = selected.querySelector(".option_name");
      const selectedOption = option.querySelector(".option_name");
      if (!currentOption || !selectedOption) return;

      // Сохраняем текущие данные
      const prevData = {
        classes: selected.className.replace("item_select", "").trim(),
        text: currentOption.textContent,
        caption: selected.querySelector(".option_caption")?.textContent || null,
      };

      // Обмен данными между элементами
      selected.className = `${option.className
        .replace("item_select", "")
        .trim()} item_select`;
      currentOption.textContent = selectedOption.textContent;

      if (prevData.caption) {
        selected.querySelector(".option_caption").textContent =
          prevData.caption;
      }

      option.className = prevData.classes;
      selectedOption.textContent = prevData.text;

      // Закрываем и эмитируем событие
      select.classList.remove("select_open");
      select.dispatchEvent(
        new CustomEvent("selectChange", {
          detail: {
            value: currentOption.textContent,
            caption: prevData.caption,
            selectedClass: selected.className,
          },
        })
      );
    };

    // Инициализация селектов
    selects.forEach((select) => {
      const header = select.querySelector(".select_option_wrap.item_select");
      if (!header) return;

      header.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllSelects(select);
        select.classList.toggle("select_open");
      });

      select
        .querySelectorAll(".select_option_wrap:not(.item_select)")
        .forEach((option) => {
          option.addEventListener("click", () =>
            handleOptionSelect(select, option)
          );
        });
    });

    // Глобальный клик для закрытия
    document.addEventListener("click", () => closeAllSelects());
  };

  initCustomSelect();
});
