/**
 * MODAL SYSTEM - Полная версия
 * Управление всеми модальными окнами приложения
 */
document.addEventListener("DOMContentLoaded", () => {
  class ModalSystem {
    constructor() {
      this.modalStack = [];
      this.allModals = {};
      this.modalContainer =
        document.querySelector(".list_items_wrap") || document.body;
      this.scrollerInstances = new WeakMap();
      this.selectInstances = new WeakMap();

      this.modalTemplates = {
        interval: this._createIntervalModal(),
        edit: this._createEditModal(),
      };

      this._initModals();
      this._setupEventListeners();
    }

    _createModalContainer(modalId) {
      const modalWrap = document.createElement("div");
      modalWrap.className = "modal_wrap";
      modalWrap.dataset.modal = modalId;
      return modalWrap;
    }

    _createIntervalModal() {
      const modal = this._createModalContainer("modal_interval");
      modal.innerHTML = `
        <div class="modal_content_wrap">
          <div class="modal_header">
            <div class="modal_caption_wrap">
              <h4 class="modal_caption">начало</h4>
            </div>
          </div>
          <div class="modal_body">
            <div class="options_wrap">
              <div class="section_interval_wrap">
                <div class="interval_form hours">
                  <span class="interval is_active">00</span>
                </div>
                <div class="interval_form minutes">
                  <span class="interval is_active">00</span>
                </div>
              </div>
            </div>
          </div>
          <div class="controls_btn_wrap">
            <div class="btn_cancel modal_close" aria-label="Отменить">
              <div class="icon_wrap__size_m__scale">
                <div class="icon_close">
                  <div class="icon_item"></div>
                </div>
              </div>
            </div>
            <div class="btn_save modal_close" aria-label="Сохранить">
              <div class="icon_wrap__size_m__scale">
                <div class="icon_check">
                  <div class="icon_item"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      return modal;
    }

    _createEditModal() {
      const modal = this._createModalContainer("modal-edit");
      modal.innerHTML = `
        <div class="modal_content_wrap">
          <div class="modal_header">
            <div class="modal_caption_wrap">
              <h4 class="modal_caption">редактирование</h4>
            </div>
          </div>
          <div class="modal_body">
            <div class="options_wrap">
              <section class="section_options">
                <div class="option_item_wrap">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">весь день</h5>
                  </div>
                  <div class="option_wrap">
                    <div class="icon_wrap__size_s">
                      <div class="icon_toggle">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="option_item_wrap interval_option">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">начало</h5>
                  </div>
                  <div class="option_wrap">
                    <p class="option">15:00</p>
                    <div class="icon_wrap__size_s_scale">
                      <div class="icon_arrow_right_move">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="option_item_wrap interval_option">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">окончание</h5>
                  </div>
                  <div class="option_wrap">
                    <p class="option">00:00</p>
                    <div class="icon_wrap__size_s_scale">
                      <div class="icon_arrow_right_move">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="option_item_wrap">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">задать интервал</h5>
                  </div>
                  <div class="option_wrap">
                    <div class="icon_wrap__size_s">
                      <div class="icon_toggle">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section class="section_options">
                <div class="option_item_wrap">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">напоминание</h5>
                  </div>
                  <div class="option_wrap">
                    <div class="icon_wrap__size_s">
                      <div class="icon_toggle">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="option_item_wrap interval_option">
                  <div class="option_caption_wrap">
                    <h5 class="option_caption">начало</h5>
                  </div>
                  <div class="option_wrap">
                    <p class="option">15:00</p>
                    <div class="icon_wrap__size_s_scale">
                      <div class="icon_arrow_right_move">
                        <div class="icon_item"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <div class="section_caption_wrap">
                <h5 class="section_caption">категория</h5>
              </div>
              <section class="section_select">
                <div class="select_wrap">
                  <div class="select select_colors">
                    <div class="select_option_wrap color_light_blue item_select">
                      <div class="option_cover">
                        <h5 class="option_name">спорт</h5>
                      </div>
                      <div class="icon_wrap__size_m__scale">
                        <div class="icon_arrow__bottom__rotate">
                          <div class="icon_item"></div>
                        </div>
                      </div>
                    </div>
                    <div class="select_option_wrap color_green">
                      <h5 class="option_name">арт</h5>
                    </div>
                    <div class="select_option_wrap color_peach">
                      <h5 class="option_name">кодинг</h5>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div class="controls_btn_wrap">
            <div class="btn_cancel modal_close" aria-label="Отменить">
              <div class="icon_wrap__size_m__scale">
                <div class="icon_close">
                  <div class="icon_item"></div>
                </div>
              </div>
            </div>
            <div class="btn_save modal_close" aria-label="Сохранить">
              <div class="icon_wrap__size_m__scale">
                <div class="icon_check">
                  <div class="icon_item"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      return modal;
    }

    _initModals() {
      Object.entries(this.modalTemplates).forEach(([key, template]) => {
        const modalClone = template.cloneNode(true);
        this.modalContainer.appendChild(modalClone);
        this.allModals[modalClone.dataset.modal] = modalClone;
      });
    }

    _setupEventListeners() {
      document.addEventListener("click", (e) => {
        const intervalOption = e.target.closest(
          ".interval_option:not(.disabled)"
        );
        if (intervalOption) {
          e.preventDefault();
          e.stopPropagation();
          this.open("modal_interval", {
            title:
              intervalOption.querySelector(".option_caption")?.textContent ||
              "Время",
            value:
              intervalOption.querySelector(".option")?.textContent || "00:00",
            openerElement: intervalOption,
          });
        }

        const editModalBtn = e.target.closest(
          ".list_item .modal:not(.disabled)"
        );
        if (editModalBtn) {
          e.preventDefault();
          e.stopPropagation();
          this.open("modal-edit", {
            listItem: editModalBtn.closest(".list_item"),
            openerElement: editModalBtn,
          });
        }

        const modalCloseBtn = e.target.closest(".modal_close");
        if (modalCloseBtn) {
          e.stopPropagation();
          this.close(modalCloseBtn.closest(".modal_wrap"));
        }
      });

      Object.values(this.allModals).forEach((modal) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) this.close(modal);
        });
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.modalStack.length > 0) {
          this.close(this.modalStack[this.modalStack.length - 1]);
        }
      });
    }

    open(modalId, options = {}) {
      const modal = this.allModals[modalId];
      if (!modal || options.openerElement?.classList.contains("disabled")) {
        return;
      }

      // Очищаем предыдущие экземпляры
      this._cleanupModal(modal);

      this.modalStack.push(modalId);
      this._updateModalStack();

      switch (modalId) {
        case "modal_interval":
          this._fillIntervalModal(modal, options);
          if (typeof IntervalScroller !== "undefined") {
            this._initIntervalScrollers(modal);
          }
          break;
        case "modal-edit":
          this._fillEditModal(modal, options);
          this._initSelects(modal);
          break;
      }

      modal.classList.add("modal_open");
      document.body.classList.add("modal-open");
    }

    close(modal) {
      if (!modal) return;

      const modalId = modal.dataset.modal;
      const index = this.modalStack.indexOf(modalId);
      if (index !== -1) this.modalStack.splice(index, 1);

      // Очищаем экземпляры перед закрытием
      this._cleanupModal(modal);

      modal.classList.remove("modal_open");
      this._updateModalStack();

      if (
        !Object.values(this.allModals).some((m) =>
          m.classList.contains("modal_open")
        )
      ) {
        document.body.classList.remove("modal-open");
      }
    }

    _cleanupModal(modal) {
      // Удаляем экземпляры скроллеров
      const scrollers = modal.querySelectorAll(".interval_form");
      scrollers.forEach((form) => {
        const instance = this.scrollerInstances.get(form);
        if (instance) {
          instance.destroy();
          this.scrollerInstances.delete(form);
        }
      });

      // Удаляем обработчики селектов
      const select = modal.querySelector(".select");
      if (select) {
        const selectInstance = this.selectInstances.get(select);
        if (selectInstance) {
          selectInstance.destroy();
          this.selectInstances.delete(select);
        }
      }
    }

    _updateModalStack() {
      this.modalStack.forEach((modalId, index) => {
        const modal = this.allModals[modalId];
        if (modal) {
          modal.style.zIndex = 1000 + index;
          const content = modal.querySelector(".modal_content_wrap");
          if (content) content.style.zIndex = 1001 + index;
        }
      });
    }

    _initIntervalScrollers(modal) {
      modal.querySelectorAll(".interval_form").forEach((form) => {
        if (this.scrollerInstances.has(form)) return;

        if (typeof IntervalScroller !== "undefined") {
          const scroller = new IntervalScroller(form);
          this.scrollerInstances.set(form, scroller);

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
        }
      });
    }

    _initSelects(modal) {
      const select = modal.querySelector(".select");
      if (!select || this.selectInstances.has(select)) return;

      const selectInstance = {
        destroy: () => {
          select.removeEventListener("click", handleSelectClick);
          document.removeEventListener("click", handleDocumentClick);
        },
      };

      this.selectInstances.set(select, selectInstance);

      const handleSelectClick = (e) => {
        e.stopPropagation();
        const isOption = e.target.closest(
          ".select_option_wrap:not(.item_select)"
        );
        if (isOption) {
          handleOptionSelect(select, isOption);
          return;
        }

        const isHeader = e.target.closest(".item_select");
        if (isHeader) {
          select.classList.toggle("select_open");
        }
      };

      const handleOptionSelect = (select, option) => {
        const selected = select.querySelector(".item_select");
        if (!selected) return;

        const currentOption = selected.querySelector(".option_name");
        const selectedOption = option.querySelector(".option_name");
        if (!currentOption || !selectedOption) return;

        const prevData = {
          classes: selected.className.replace("item_select", "").trim(),
          text: currentOption.textContent,
        };

        selected.className = `${option.className
          .replace("item_select", "")
          .trim()} item_select`;
        currentOption.textContent = selectedOption.textContent;
        option.className = prevData.classes;
        selectedOption.textContent = prevData.text;

        select.classList.remove("select_open");
      };

      const handleDocumentClick = () => {
        select.classList.remove("select_open");
      };

      select.addEventListener("click", handleSelectClick);
      document.addEventListener("click", handleDocumentClick);
    }

    _fillIntervalModal(modal, { title, value }) {
      const caption = modal.querySelector(".modal_caption");
      if (caption && title) caption.textContent = title;

      if (value) {
        const [hours, minutes] = value.split(":");

        modal
          .querySelectorAll(".interval_form.hours .interval")
          .forEach((el) => {
            el.textContent = hours?.padStart(2, "0") || "00";
          });

        modal
          .querySelectorAll(".interval_form.minutes .interval")
          .forEach((el) => {
            el.textContent = minutes?.padStart(2, "0") || "00";
          });
      }
    }

    _fillEditModal(modal, { listItem }) {
      if (!listItem) return;

      modal.dataset.listItem = listItem.dataset.item;

      const titleInput = modal.querySelector(".list_item_caption_form");
      const itemTitle = listItem.querySelector(".item_caption")?.textContent;
      if (titleInput && itemTitle) {
        titleInput.value = itemTitle;
      }

      const timeInterval =
        listItem.querySelector(".item_interval")?.textContent;
      if (timeInterval) {
        const [start, end] = timeInterval.split(" - ");

        const startEl = modal.querySelector(
          ".interval_option:nth-of-type(1) .option"
        );
        const endEl = modal.querySelector(
          ".interval_option:nth-of-type(2) .option"
        );

        if (startEl) startEl.textContent = start || "";
        if (endEl) endEl.textContent = end || "";
      }

      const category = listItem.querySelector(".item_category")?.textContent;
      if (category) {
        const options = modal.querySelectorAll(".select_option_wrap");
        options.forEach((opt) => {
          if (opt.querySelector(".option_name").textContent === category) {
            const currentSelected = modal.querySelector(".item_select");
            if (currentSelected) {
              currentSelected.classList.remove("item_select");
            }
            opt.classList.add("item_select");
          }
        });
      }
    }
  }

  window.modalSystem = new ModalSystem();
});
