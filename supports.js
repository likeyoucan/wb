/**
 * FEATURE SUPPORT CHECKER
 * Проверка поддерживаемых браузером функций
 */
document.addEventListener("DOMContentLoaded", function () {
  function checkFeaturesSupport() {
    const helpers = {
      /** Проверяет поддержку CSS-свойства */
      checkCSSSupport: (property, testValue = "", withPrefixes = true) => {
        const el = document.createElement("div").style;
        const prefixes = withPrefixes
          ? ["", "-webkit-", "-moz-", "-ms-", "-o-"]
          : [""];
        return prefixes.some((prefix) => {
          const prop = prefix + property;
          return (
            prop in el &&
            (!testValue ||
              (() => {
                try {
                  el[prop] = testValue;
                  return el[prop] === testValue;
                } catch {
                  return false;
                }
              })())
          );
        });
      },
    };

    const features = {
      willChange: helpers.checkCSSSupport("willChange"),
      colorContrast:
        CSS.supports?.("color", "color-contrast(red vs white, black)") ||
        helpers.checkCSSSupport(
          "color",
          "color-contrast(red vs white, black)",
          false
        ),
      clipPath: helpers.checkCSSSupport("clip-path", "path('M0 0')"),
      hwb:
        CSS.supports?.("color", "hwb(120 0% 0%)") ||
        helpers.checkCSSSupport("color", "hwb(120 0% 0%)", false),
    };

    console.log("Поддержка функций:");
    console.table(features);

    return features;
  }

  checkFeaturesSupport();
});
