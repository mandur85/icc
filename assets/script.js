(function () {
  "use strict";

  const doc = document;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = doc.getElementById("site-header");
  if (header) {
    const setScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  const toggle = doc.querySelector(".menu-toggle");
  const mobileMenu = doc.getElementById("mobile-menu");

  if (toggle && mobileMenu) {
    let lastFocus = null;
    const supportsInert = "inert" in mobileMenu;

    if (supportsInert) mobileMenu.inert = true;

    const menuFocusables = function () {
      return [toggle].concat(Array.from(mobileMenu.querySelectorAll("a, button")));
    };

    const openMenu = function () {
      lastFocus = doc.activeElement;
      doc.body.classList.add("menu-open");
      if (supportsInert) mobileMenu.inert = false;
      mobileMenu.classList.add("is-open");
      mobileMenu.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Закрыть меню");
      const first = mobileMenu.querySelector("a");
      if (first) {
        window.requestAnimationFrame(function () {
          first.focus();
        });
      }
    };

    const closeMenu = function () {
      doc.body.classList.remove("menu-open");
      mobileMenu.classList.remove("is-open");
      mobileMenu.setAttribute("aria-hidden", "true");
      if (supportsInert) mobileMenu.inert = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    toggle.addEventListener("click", function () {
      if (doc.body.classList.contains("menu-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    doc.addEventListener("keydown", function (event) {
      if (!doc.body.classList.contains("menu-open")) return;

      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        const focusables = menuFocusables();
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1100 && doc.body.classList.contains("menu-open")) closeMenu();
    });
  }

  const revealItems = doc.querySelectorAll(".reveal");

  if (revealItems.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    }
  }

  const navLinks = Array.from(doc.querySelectorAll(".site-nav a"));
  const navSections = navLinks
    .map(function (link) {
      const id = link.getAttribute("href");
      return id && id.charAt(0) === "#" ? doc.querySelector(id) : null;
    })
    .filter(Boolean);

  if (navLinks.length && navSections.length) {
    let navTick = false;

    const updateActiveNav = function () {
      const marker = window.scrollY + 140;
      const contact = doc.getElementById("contact");
      let currentId = "";

      navSections.forEach(function (section) {
        if (section.offsetTop <= marker) currentId = "#" + section.id;
      });

      if (contact && contact.offsetTop <= marker) currentId = "";

      navLinks.forEach(function (link) {
        const isActive = link.getAttribute("href") === currentId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      navTick = false;
    };

    window.addEventListener("scroll", function () {
      if (!navTick) {
        navTick = true;
        window.requestAnimationFrame(updateActiveNav);
      }
    }, { passive: true });

    updateActiveNav();
  }

  const clock = doc.querySelector("[data-astana-time]");
  if (clock) {
    const formatter = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Asia/Almaty",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const tick = function () {
      clock.textContent = formatter.format(new Date());
    };

    tick();
    window.setInterval(tick, 30000);
  }

  const hero = doc.querySelector(".hero");
  if (hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let heroTick = false;
    let pointerX = 0;
    let pointerY = 0;

    hero.addEventListener("pointermove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (heroTick) return;
      heroTick = true;

      window.requestAnimationFrame(function () {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (pointerX - rect.left) + "px");
        hero.style.setProperty("--my", (pointerY - rect.top) + "px");
        heroTick = false;
      });
    });
  }

  const faqItems = Array.from(doc.querySelectorAll(".faq-item"));
  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  const form = doc.getElementById("contact-form");
  if (form) {
    const status = doc.getElementById("form-status");
    const submitButton = form.querySelector(".btn-submit");
    const FORM_ENDPOINT = "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const fields = {
      name: form.elements.name,
      company: form.elements.company,
      email: form.elements.email,
      amount: form.elements.amount,
      sector: form.elements.sector,
      consent: form.elements.consent
    };

    const setFieldError = function (key, message) {
      const field = fields[key];
      const error = doc.getElementById(key + "-error");
      if (!field || !error) return;
      error.textContent = message || "";
      const wrapper = field.closest(".field");
      if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (message && error.id) field.setAttribute("aria-describedby", error.id);
    };

    const clearFieldError = function (key) {
      setFieldError(key, "");
    };

    Object.keys(fields).forEach(function (key) {
      const field = fields[key];
      if (!field) return;
      const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(eventName, function () {
        clearFieldError(key);
        if (status) {
          status.textContent = "";
          status.classList.remove("is-error");
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let firstInvalid = null;
      const errors = [];

      const name = fields.name.value.trim();
      const company = fields.company.value.trim();
      const email = fields.email.value.trim();
      const phone = form.elements.phone.value.trim();
      const amount = fields.amount.value;
      const sector = fields.sector.value;
      const message = form.elements.message.value.trim();

      if (!name) {
        errors.push("name");
        setFieldError("name", "Укажите имя.");
      } else {
        setFieldError("name", "");
      }

      if (!company) {
        errors.push("company");
        setFieldError("company", "Укажите компанию.");
      } else {
        setFieldError("company", "");
      }

      if (!email) {
        errors.push("email");
        setFieldError("email", "Укажите email.");
      } else if (!emailPattern.test(email)) {
        errors.push("email");
        setFieldError("email", "Проверьте формат email.");
      } else {
        setFieldError("email", "");
      }

      if (!amount) {
        errors.push("amount");
        setFieldError("amount", "Выберите диапазон суммы.");
      } else {
        setFieldError("amount", "");
      }

      if (!sector) {
        errors.push("sector");
        setFieldError("sector", "Выберите сектор.");
      } else {
        setFieldError("sector", "");
      }

      if (!fields.consent.checked) {
        errors.push("consent");
        setFieldError("consent", "Необходимо согласие на обработку данных.");
      } else {
        setFieldError("consent", "");
      }

      if (errors.length) {
        firstInvalid = fields[errors[0]];
        if (status) {
          status.textContent = "Проверьте отмеченные поля.";
          status.classList.add("is-error");
        }
        if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
        return;
      }

      const payload = {
        name: name,
        company: company,
        email: email,
        phone: phone,
        amount: amount,
        sector: sector,
        message: message
      };

      const resetStatus = function () {
        if (!status) return;
        status.textContent = "";
        status.classList.remove("is-error");
      };

      if (!FORM_ENDPOINT) {
        const subject = "Заявка на финансирование — " + company;
        const body = [
          "Имя: " + name,
          "Компания: " + company,
          "Email: " + email,
          "Телефон / Telegram: " + (phone || "не указан"),
          "Сумма проекта: " + amount,
          "Сектор: " + sector,
          "О проекте: " + (message || "не указано"),
          "",
          "Отправлено с сайта Meridian 71."
        ].join("\n");

        const mailto = "mailto:invest.capital.center@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        window.location.href = mailto;
        resetStatus();
        if (status) status.textContent = "Открываем почтовый клиент. Если он не открылся, напишите на invest.capital.center@gmail.com.";
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
      }
      if (status) status.textContent = "Отправляем заявку…";

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          form.reset();
          resetStatus();
          if (status) status.textContent = "Спасибо. Заявка получена — мы вернёмся в течение двух рабочих дней.";
        })
        .catch(function () {
          if (status) {
            status.textContent = "Не удалось отправить форму. Напишите нам напрямую на invest.capital.center@gmail.com.";
            status.classList.add("is-error");
          }
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
          }
        });
    });
  }
})();
