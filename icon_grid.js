document.addEventListener("DOMContentLoaded", function () {
  // Конфигурация по умолчанию
  const defaultConfig = {
    selector: "",
    width: "",
    height: "",
    gridStep: 10,
    roundBorderWidth: 1,
    lineHeight: 1,
    gridColor: "#cccccc",
    roundWidth: "50px",
    lineRotate: 0,
    globalOpacity: 0.5,
    gridOpacity: 0.5,
    roundOpacity: 0.5,
    lineOpacity: 0.5,
    rounds: [],
    lines: [],
    controlsVisible: true
  };

  const state = { ...defaultConfig };
  const canvasCache = new WeakMap();
  let updateGridFrame;
  let controlsDiv;

  // ================== Вспомогательные функции ==================
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    children.forEach((child) => el.appendChild(child));
    return el;
  }

  function createControlGroup(title, children) {
    const group = createElement("div", { className: "control-group" });
    if (title) group.appendChild(createElement("h3", { textContent: title }));
    children.forEach((child) => group.appendChild(child));
    return group;
  }

  function createLabel(forId, text) {
    return createElement("label", { htmlFor: forId, textContent: text });
  }

  function createInput(type, id, { placeholder, value, min, max, step } = {}) {
    const input = createElement("input", {
      type,
      id,
      placeholder,
      min,
      max,
      step,
    });
    if (value !== undefined) input.value = value;
    return input;
  }

  function createButton(id, text) {
    return createElement("button", { id, textContent: text });
  }

  function createRangeInput(id, min, max, value, step, unit) {
    const container = document.createElement("div");
    const input = createInput("range", id, { min, max, value, step });
    const valueSpan = createElement("span", {
      id: `${id}Value`,
      textContent: value,
    });
    container.append(
      input,
      valueSpan,
      unit ? document.createTextNode(unit) : null
    );
    return container;
  }

  function createButtonGroup(buttons) {
    const group = createElement("div", { className: "button-group" });
    buttons.forEach((button) => group.appendChild(button));
    return group;
  }

  function createErrorElement(id) {
    return createElement("div", { id, className: "error-message" });
  }

  function debounce(fn, ms) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function showNotification(message, type = "success") {
    const notification = createElement("div", {
      className: `notification ${type}`,
      textContent: message,
      style: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background: ${
          type === "error"
            ? "#ff4444"
            : type === "warning"
            ? "#ffbb33"
            : "#00C851"
        };
        color: white;
        border-radius: 4px;
        z-index: 10001;
        animation: fadeIn 0.3s;
      `,
    });

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = "fadeOut 0.3s";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getSelector(element) {
    if (element.id) return `#${element.id}`;

    const path = [];
    while (element.parentNode) {
      let selector = element.tagName.toLowerCase();
      if (element.className) {
        selector += "." + element.className.split(/\s+/).join(".");
      }

      const siblings = Array.from(element.parentNode.children).filter(
        (child) =>
          child.tagName === element.tagName &&
          child.className === element.className
      );

      if (siblings.length > 1) {
        selector += `:nth-child(${siblings.indexOf(element) + 1})`;
      }

      path.unshift(selector);
      element = element.parentNode;
    }

    return path.join(" > ");
  }

  // ================== Работа с Canvas и Grid ==================
  function createGridCanvas(gridElement) {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "1",
      opacity: `calc(${state.gridOpacity} * ${state.globalOpacity})`,
    });

    const wrap = gridElement.closest(".icon_grid_wrap");
    if (wrap) {
      wrap.style.opacity = state.globalOpacity;
    }

    gridElement.appendChild(canvas);
    canvasCache.set(gridElement, canvas);
    updateGrid(gridElement);

    const resizeObserver = new ResizeObserver(
      debounce(() => {
        updateGridFrame = window.requestAnimationFrame(() => {
          if (canvasCache.has(gridElement)) updateGrid(gridElement);
        });
      }, 100)
    );

    resizeObserver.observe(gridElement.parentElement);
    return canvas;
  }

  function updateGrid(gridElement) {
    const canvas = canvasCache.get(gridElement);
    if (!canvas) return;

    const parent = gridElement.parentElement;
    const width = parent.offsetWidth;
    const height = parent.offsetHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    Object.assign(canvas.style, {
      width: `${width}px`,
      height: `${height}px`,
    });

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = state.gridColor;
    ctx.lineWidth = 0.2;
    ctx.clearRect(0, 0, width, height);

    const drawLine = (x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
      ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
      ctx.stroke();
    };

    // Рисуем вертикальные линии
    for (let x = 0; x <= width; x += state.gridStep) {
      drawLine(x, 0, x, height);
    }

    // Рисуем горизонтальные линии
    for (let y = 0; y <= height; y += state.gridStep) {
      drawLine(0, y, width, y);
    }
  }

  function updateAllGrids() {
    document.querySelectorAll(".icon_grid").forEach((grid) => {
      if (canvasCache.has(grid)) updateGrid(grid);
    });
  }

  function initGrid() {
    updateCSSVariables();
    document.querySelectorAll(".icon_grid").forEach((grid) => {
      if (!canvasCache.has(grid)) createGridCanvas(grid);
      else updateGrid(grid);
    });
  }

  // ================== Обновление стилей элементов ==================
  function updateRoundStyles() {
    document.querySelectorAll(".icon_grid_round").forEach((round) => {
      round.style.borderColor = state.gridColor;
      round.style.opacity = `calc(${state.roundOpacity} * ${state.globalOpacity})`;
    });
  }

  function updateLineStyles() {
    document.querySelectorAll(".icon_grid_line").forEach((line) => {
      line.style.backgroundColor = state.gridColor;
      line.style.opacity = `calc(${state.lineOpacity} * ${state.globalOpacity})`;
    });
  }

  function updateCSSVariables() {
    const rootStyles = document.documentElement.style;
    rootStyles.setProperty("--grid-step", `${state.gridStep}px`);
    rootStyles.setProperty(
      "--round-border-width",
      `${state.roundBorderWidth}px`
    );
    rootStyles.setProperty("--line-height", `${state.lineHeight}px`);
    rootStyles.setProperty("--grid-border-color", state.gridColor);
    rootStyles.setProperty("--global-opacity", state.globalOpacity);
    rootStyles.setProperty("--grid-opacity", state.gridOpacity);
    rootStyles.setProperty("--round-opacity", state.roundOpacity);
    rootStyles.setProperty("--line-opacity", state.lineOpacity);
    rootStyles.setProperty("--wrap-opacity", state.globalOpacity);
  }

  function updateAllOpacity() {
    document.querySelectorAll(".icon_grid canvas").forEach((canvas) => {
      canvas.style.opacity = `calc(${state.gridOpacity} * ${state.globalOpacity})`;
    });
    document.querySelectorAll(".icon_grid_wrap").forEach((wrap) => {
      wrap.style.opacity = state.globalOpacity;
    });
    updateRoundStyles();
    updateLineStyles();
  }

  // ================== Основные функции управления ==================
  function applySelector() {
    const selector = document.getElementById("elementSelector").value.trim();
    const errorElement = document.getElementById("selectorError");
    errorElement.textContent = "";
    state.selector = selector;

    if (!selector) {
      errorElement.textContent = "Please enter a selector";
      return;
    }

    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        errorElement.textContent = "No elements found with this selector";
        return;
      }

      document.querySelectorAll(".icon_grid_wrap").forEach((el) => el.remove());

      elements.forEach((element) => {
        element.classList.add("icon_controls");
        element.style.position = "relative";

        if (!element.querySelector(".icon_grid_wrap")) {
          const gridWrap = createElement(
            "div",
            { className: "icon_grid_wrap" },
            [createElement("div", { className: "icon_grid" })]
          );
          element.appendChild(gridWrap);
          createGridCanvas(gridWrap.querySelector(".icon_grid"));
        }
      });

      showNotification("Selector applied successfully");
    } catch (e) {
      errorElement.textContent = "Invalid selector syntax";
    }
  }

  function applySize() {
    const width = document.getElementById("widthInput").value.trim();
    const height = document.getElementById("heightInput").value.trim();
    state.width = width;
    state.height = height;

    document.querySelectorAll(".icon_controls").forEach((element) => {
      if (width) element.style.width = width;
      if (height) element.style.height = height;
    });

    setTimeout(updateAllGrids, 100);
    showNotification("Size applied successfully");
  }

  function addRound() {
    const width = document.getElementById("roundWidth").value.trim();
    const borderWidth = state.roundBorderWidth;
    const color = state.gridColor;
    const opacity = state.roundOpacity;

    const errorElement = document.getElementById("roundError");
    errorElement.textContent = "";

    if (!width) {
      errorElement.textContent = "Please enter width";
      return;
    }

    const elements = document.querySelectorAll(
      ".icon_controls .icon_grid_wrap"
    );
    if (elements.length === 0) {
      errorElement.textContent =
        "No elements with icon_controls found. Apply selector first.";
      return;
    }

    elements.forEach((wrap) => {
      const round = createElement("div", {
        className: "icon_grid_round",
        style: `
          margin: auto;
          width: ${width};
          height: ${width};
          border: ${borderWidth}px solid ${color};
          border-radius: 50%;
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-sizing: border-box;
          opacity: calc(${opacity} * ${state.globalOpacity});
        `,
      });
      wrap.appendChild(round);
    });

    state.rounds.push({ width, borderWidth, color, opacity });
    showNotification("Round added successfully");
  }

  function removeRounds() {
    document.querySelectorAll(".icon_grid_round").forEach((el) => el.remove());
    state.rounds = [];
    showNotification("Rounds removed");
  }

  function addLine() {
    const rotate = document.getElementById("lineRotate").value;
    const color = state.gridColor;
    const height = state.lineHeight;
    const opacity = state.lineOpacity;

    document
      .querySelectorAll(".icon_controls .icon_grid_wrap")
      .forEach((wrap) => {
        const line = createElement("div", {
          className: "icon_grid_line",
          style: `
                margin: auto;
                position: absolute;
                inset: 0;
                width: 100%;
                height: ${height}px;
                background-color: ${color};
                transform: rotate(${rotate}deg);
                transform-origin: center;
                pointer-events: none;
                opacity: calc(${opacity} * ${state.globalOpacity});
            `,
        });
        wrap.appendChild(line);
      });

    // Добавляем новую линию в массив, не заменяя существующие
    state.lines.push({ rotate, color, height, opacity });
    showNotification(`Line with angle ${rotate}° added`);
  }

  function removeLines() {
    document.querySelectorAll(".icon_grid_line").forEach((el) => el.remove());
    state.lines = [];
    showNotification("All lines removed");
  }

  function saveSettings() {
    const settings = {
      selector: state.selector,
      width: state.width,
      height: state.height,
      gridStep: state.gridStep,
      roundBorderWidth: state.roundBorderWidth,
      lineHeight: state.lineHeight,
      gridColor: state.gridColor,
      roundWidth: document.getElementById("roundWidth").value,
      lineRotate: state.lineRotate,
      globalOpacity: state.globalOpacity,
      gridOpacity: state.gridOpacity,
      roundOpacity: state.roundOpacity,
      lineOpacity: state.lineOpacity,
      rounds: state.rounds,
      lines: state.lines,
      controlsVisible: state.controlsVisible
    };

    localStorage.setItem("iconControlsSettings", JSON.stringify(settings));

    const elements = Array.from(
      document.querySelectorAll(".icon_controls")
    ).map((el) => ({
      selector: getSelector(el),
      width: el.style.width,
      height: el.style.height,
    }));

    localStorage.setItem("iconControlsElements", JSON.stringify(elements));
    showNotification("Settings saved successfully");
  }

  function loadSettings() {
    try {
      const savedSettings = localStorage.getItem("iconControlsSettings");
      if (!savedSettings) return;

      const settings = JSON.parse(savedSettings);
      Object.assign(state, settings);

      // Обновляем UI из загруженного состояния
      document.getElementById("elementSelector").value = state.selector;
      document.getElementById("widthInput").value = state.width;
      document.getElementById("heightInput").value = state.height;
      document.getElementById("gridStep").value = state.gridStep;
      document.getElementById("gridStepValue").textContent = state.gridStep;
      document.getElementById("roundBorderWidth").value =
        state.roundBorderWidth;
      document.getElementById("roundBorderWidthValue").textContent =
        state.roundBorderWidth;
      document.getElementById("lineHeight").value = state.lineHeight;
      document.getElementById("lineHeightValue").textContent = state.lineHeight;
      document.getElementById("gridColor").value = state.gridColor;
      document.getElementById("roundWidth").value = state.roundWidth;
      document.getElementById("lineRotate").value = state.lineRotate;
      document.getElementById("globalOpacity").value = state.globalOpacity;
      document.getElementById("globalOpacityValue").textContent =
        state.globalOpacity;
      document.getElementById("gridOpacity").value = state.gridOpacity;
      document.getElementById("gridOpacityValue").textContent =
        state.gridOpacity;
      document.getElementById("roundOpacity").value = state.roundOpacity;
      document.getElementById("roundOpacityValue").textContent =
        state.roundOpacity;
      document.getElementById("lineOpacity").value = state.lineOpacity;
      document.getElementById("lineOpacityValue").textContent =
        state.lineOpacity;

      updateCSSVariables();

      // Обновляем видимость controls
      if (controlsDiv) {
        controlsDiv.style.display = state.controlsVisible ? "" : "none";
        const toggleButton = document.getElementById("toggleControls");
        if (toggleButton) {
          toggleButton.textContent = state.controlsVisible ? "Hide Controls" : "Show Controls";
        }
      }

      // Если есть селектор, применяем его
      if (state.selector) {
        setTimeout(() => {
          applySelector();

          // После применения селектора создаем все сохраненные элементы
          setTimeout(() => {
            if (state.width || state.height) applySize();

            // Восстанавливаем круги
            if (state.rounds?.length) {
              state.rounds.forEach((round) => {
                document.getElementById("roundWidth").value = round.width;
                document.getElementById("roundBorderWidth").value =
                  round.borderWidth;
                addRound();
              });
            }

            // Восстанавливаем линии
            if (state.lines?.length) {
              state.lines.forEach((line) => {
                document.getElementById("lineRotate").value = line.rotate;
                document.getElementById("lineHeight").value = line.height;
                addLine();
              });
            }
          }, 100);
        }, 50);
      }

      // Загрузка сохраненных элементов
      const savedElements = localStorage.getItem("iconControlsElements");
      if (savedElements) {
        JSON.parse(savedElements)?.forEach((item) => {
          try {
            if (item?.selector) {
              const el = document.querySelector(item.selector);
              if (el) {
                el.classList.add("icon_controls");
                el.style.position = "relative";
                if (item.width) el.style.width = item.width;
                if (item.height) el.style.height = item.height;

                if (!el.querySelector(".icon_grid_wrap")) {
                  const gridWrap = createElement(
                    "div",
                    { className: "icon_grid_wrap" },
                    [createElement("div", { className: "icon_grid" })]
                  );
                  el.appendChild(gridWrap);
                  createGridCanvas(gridWrap.querySelector(".icon_grid"));
                }
              }
            }
          } catch (e) {
            console.error("Error loading element:", e);
          }
        });
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  }

  function resetSettings() {
    if (!confirm("Are you sure you want to reset all settings?")) return;

    localStorage.removeItem("iconControlsSettings");
    localStorage.removeItem("iconControlsElements");

    document.querySelectorAll(".icon_controls").forEach((el) => {
      el.classList.remove("icon_controls");
      el.querySelector(".icon_grid_wrap")?.remove();
      el.style.width = "";
      el.style.height = "";
      el.style.position = "";
    });

    // Сброс значений в состоянии
    Object.assign(state, { ...defaultConfig });

    // Обновляем UI
    document.getElementById("elementSelector").value = "";
    document.getElementById("widthInput").value = "";
    document.getElementById("heightInput").value = "";
    document.getElementById("gridStep").value = state.gridStep;
    document.getElementById("gridStepValue").textContent = state.gridStep;
    document.getElementById("roundBorderWidth").value = state.roundBorderWidth;
    document.getElementById("roundBorderWidthValue").textContent =
      state.roundBorderWidth;
    document.getElementById("lineHeight").value = state.lineHeight;
    document.getElementById("lineHeightValue").textContent = state.lineHeight;
    document.getElementById("gridColor").value = state.gridColor;
    document.getElementById("roundWidth").value = state.roundWidth;
    document.getElementById("lineRotate").value = state.lineRotate;
    document.getElementById("globalOpacity").value = state.globalOpacity;
    document.getElementById("globalOpacityValue").textContent =
      state.globalOpacity;
    document.getElementById("gridOpacity").value = state.gridOpacity;
    document.getElementById("gridOpacityValue").textContent = state.gridOpacity;
    document.getElementById("roundOpacity").value = state.roundOpacity;
    document.getElementById("roundOpacityValue").textContent =
      state.roundOpacity;
    document.getElementById("lineOpacity").value = state.lineOpacity;
    document.getElementById("lineOpacityValue").textContent = state.lineOpacity;

    // Обновляем видимость controls
    if (controlsDiv) {
      controlsDiv.style.display = "";
      const toggleButton = document.getElementById("toggleControls");
      if (toggleButton) {
        toggleButton.textContent = "Hide Controls";
      }
    }

    updateCSSVariables();
    state.rounds = [];
    state.lines = [];
    showNotification("Settings reset to default");
  }

  // ================== Инициализация UI ==================
  function initUI() {
    // Создаем кнопку переключения видимости
    const toggleButton = createElement("button", {
      id: "toggleControls",
      className: "toggle-controls",
      textContent: state.controlsVisible ? "Hide Controls" : "Show Controls",
      style: `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10001;
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s;
      `
    });

    document.body.appendChild(toggleButton);

    controlsDiv = createElement("div", { 
      className: "controls",
      style: state.controlsVisible ? "" : "display: none;"
    });

    const style = createElement("style", {
      textContent: `
        :root {
          --grid-border-color: ${state.gridColor};
          --grid-step: ${state.gridStep}px;
          --round-border-width: ${state.roundBorderWidth}px;
          --line-height: ${state.lineHeight}px;
          --global-opacity: ${state.globalOpacity};
          --grid-opacity: ${state.gridOpacity};
          --round-opacity: ${state.roundOpacity};
          --line-opacity: ${state.lineOpacity};
        }

        .icon_controls {
          position: relative !important;
        }

        .icon_grid_wrap {
          position: absolute;
          margin: auto;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
          opacity: var(--wrap-opacity);
        }

        .icon_grid_wrap::after {
          content: "";
          margin: auto;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          border: 0.3px solid var(--grid-border-color);
        }

        .icon_grid {
          position: absolute;
          width: 100%;
          height: 100%;
          top: -0.5px;
          left: -0.5px;
        }

        .icon_grid_round {
          aspect-ratio: 1 / 1;
          position: absolute;
          margin: auto;
          inset: 0;
          border: var(--round-border-width) solid var(--grid-border-color);
          border-radius: 50%;
          opacity: calc(var(--round-opacity) * var(--global-opacity));
        }

        .icon_grid_line {
          width: 100%;
          position: absolute;
          margin: auto;
          inset: 0;
          height: var(--line-height);
          background-color: var(--grid-border-color);
          transform-origin: center;
          opacity: calc(var(--line-opacity) * var(--global-opacity));
        }

        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          padding: 30px 15px 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 10000;
          width: 300px;
          max-height: 100dvh;
          overflow-y: auto;
          font-family: Arial, sans-serif;
        }

        .controls label {
          display: block;
          margin: 8px 0 4px;
          font-size: 14px;
          color: #555;
        }

        .controls input[type="text"], 
        .controls input[type="number"] {
          width: 100%;
          padding: 6px;
          margin-bottom: 8px;
          box-sizing: border-box;
          border: 1px solid #ddd;
          border-radius: 3px;
        }

        .controls input[type="range"] {
          width: calc(100% - 50px);
          vertical-align: middle;
        }

        .controls button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 12px;
          margin: 5px 5px 5px 0;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .controls button:hover {
          background: #45a049;
        }

        .control-group {
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }

        .control-group h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
        }

        .button-group {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .button-group button {
          margin-right: 5px;
        }

        .error-message {
          color: #f44336;
          font-size: 12px;
          margin-top: 5px;
        }

        .global-opacity-group {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
        }

        .actions-group {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }

        .toggle-controls {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 10001;
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .toggle-controls:hover {
          background: #45a049;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
      `
    });
    document.head.appendChild(style);

    // Создаем группы элементов управления
    const controlGroups = [
      createControlGroup("", [
        createLabel("globalOpacity", "Global Opacity (всех элементов):"),
        createRangeInput("globalOpacity", 0, 1, state.globalOpacity, 0.1, ""),
      ]),

      createControlGroup("Element Selector", [
        createLabel("elementSelector", "Element Selector:"),
        createInput("text", "elementSelector", {
          placeholder: ".icon_wrap:has(.icon_edit) or .menu_icon",
        }),
        createButtonGroup([
          createButton("applySelector", "Apply"),
          createButton("saveSettings", "Save Settings"),
        ]),
        createErrorElement("selectorError"),
      ]),

      createControlGroup("Size Controls", [
        createLabel("widthInput", "Width:"),
        createInput("text", "widthInput", { placeholder: "e.g. 100px or 50%" }),
        createLabel("heightInput", "Height:"),
        createInput("text", "heightInput", {
          placeholder: "e.g. 100px or 50%",
        }),
        createButton("applySize", "Apply Size"),
      ]),

      createControlGroup("Grid Controls", [
        createLabel("gridStep", "Grid Step (px):"),
        createRangeInput("gridStep", 1, 80, state.gridStep, 1, "px"),
        createLabel("gridColor", "Grid Color:"),
        createInput("color", "gridColor", { value: state.gridColor }),
        createLabel("gridOpacity", "Grid Opacity:"),
        createRangeInput("gridOpacity", 0, 1, state.gridOpacity, 0.1, ""),
      ]),

      createControlGroup("Round Controls", [
        createLabel("roundWidth", "Round Width:"),
        createButtonGroup([
          createInput("text", "roundWidth", {
            placeholder: "e.g. 50px or 30%",
            value: state.roundWidth,
          }),
          createButton("addRound", "Add Round"),
          createButton("removeRounds", "Remove Rounds"),
        ]),
        createErrorElement("roundError"),
        createLabel("roundBorderWidth", "Round Border Width (px):"),
        createRangeInput(
          "roundBorderWidth",
          1,
          5,
          state.roundBorderWidth,
          1,
          "px"
        ),
        createLabel("roundOpacity", "Round Opacity:"),
        createRangeInput("roundOpacity", 0, 1, state.roundOpacity, 0.1, ""),
      ]),

      createControlGroup("Line Controls", [
        createLabel("lineRotate", "Line Rotate (deg):"),
        createButtonGroup([
          createInput("number", "lineRotate", {
            placeholder: "0-360",
            value: state.lineRotate,
            min: 0,
            max: 360,
          }),
          createButton("addLine", "Add Line"),
          createButton("removeLines", "Remove Lines"),
        ]),
        createLabel("lineHeight", "Line Height (px):"),
        createRangeInput("lineHeight", 1, 5, state.lineHeight, 1, "px"),
        createLabel("lineOpacity", "Line Opacity:"),
        createRangeInput("lineOpacity", 0, 1, state.lineOpacity, 0.1, ""),
      ]),
    ];

    controlGroups.forEach((group) => controlsDiv.appendChild(group));
    controlsDiv.appendChild(createButton("resetSettings", "Reset All"));
    document.body.appendChild(controlsDiv);
  }

  // ================== Настройка обработчиков событий ==================
  function setupEventListeners() {
    document
      .getElementById("applySelector")
      .addEventListener("click", applySelector);
    document.getElementById("applySize").addEventListener("click", applySize);
    document.getElementById("addRound").addEventListener("click", addRound);
    document
      .getElementById("removeRounds")
      .addEventListener("click", removeRounds);
    document.getElementById("addLine").addEventListener("click", addLine);
    document
      .getElementById("removeLines")
      .addEventListener("click", removeLines);
    document
      .getElementById("saveSettings")
      .addEventListener("click", saveSettings);
    document
      .getElementById("resetSettings")
      .addEventListener("click", resetSettings);

    // Обработчик для кнопки переключения видимости controls
    document.getElementById("toggleControls").addEventListener("click", function() {
      state.controlsVisible = !state.controlsVisible;
      
      if (state.controlsVisible) {
        controlsDiv.style.display = "";
        this.textContent = "Hide Controls";
      } else {
        controlsDiv.style.display = "none";
        this.textContent = "Show Controls";
      }
      
      saveSettings();
    });

    document
      .getElementById("globalOpacity")
      .addEventListener("input", function () {
        state.globalOpacity = this.value;
        document.getElementById("globalOpacityValue").textContent = this.value;
        updateCSSVariables();
        updateAllOpacity();
      });

    document.getElementById("gridStep").addEventListener("input", function () {
      state.gridStep = parseInt(this.value);
      document.getElementById("gridStepValue").textContent = this.value;
      updateCSSVariables();
      updateAllGrids();
    });

    document
      .getElementById("roundBorderWidth")
      .addEventListener("input", function () {
        state.roundBorderWidth = this.value;
        document.getElementById("roundBorderWidthValue").textContent =
          this.value;
        updateCSSVariables();
      });

    document
      .getElementById("lineHeight")
      .addEventListener("input", function () {
        state.lineHeight = this.value;
        document.getElementById("lineHeightValue").textContent = this.value;
        updateCSSVariables();
      });

    document.getElementById("gridColor").addEventListener("input", function () {
      state.gridColor = this.value;
      updateCSSVariables();
      updateAllGrids();
      updateRoundStyles();
      updateLineStyles();
    });

    document
      .getElementById("gridOpacity")
      .addEventListener("input", function () {
        state.gridOpacity = this.value;
        document.getElementById("gridOpacityValue").textContent = this.value;
        updateCSSVariables();
        updateAllOpacity();
      });

    document
      .getElementById("roundOpacity")
      .addEventListener("input", function () {
        state.roundOpacity = this.value;
        document.getElementById("roundOpacityValue").textContent = this.value;
        updateCSSVariables();
        updateRoundStyles();
      });

    document
      .getElementById("lineOpacity")
      .addEventListener("input", function () {
        state.lineOpacity = this.value;
        document.getElementById("lineOpacityValue").textContent = this.value;
        updateCSSVariables();
        updateLineStyles();
      });

    window.addEventListener("resize", debounce(initGrid, 200));
  }

  // ================== Инициализация приложения ==================
  initUI();
  setupEventListeners();
  initGrid();
  loadSettings();
});
