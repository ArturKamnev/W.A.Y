(() => {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem("way.theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    root.dataset.theme = storedTheme;
    root.style.colorScheme = storedTheme;
  }

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      root.style.colorScheme = next;
      localStorage.setItem("way.theme", next);
    });
  });

  document.querySelectorAll<HTMLFormElement>("[data-language-form]").forEach((form) => {
    const select = form.querySelector<HTMLSelectElement>('select[name="language"]');
    select?.addEventListener("change", () => form.requestSubmit());
  });

  const navToggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");
  if (navToggle && drawer) {
    navToggle.addEventListener("click", () => {
      const open = drawer.dataset.open === "true" ? "false" : "true";
      drawer.dataset.open = open;
      navToggle.setAttribute("aria-expanded", open);
    });

    drawer.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
      link.addEventListener("click", () => {
        drawer.dataset.open = "false";
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  initAscii();
  initTyped404();
  initTestProgress();
  initGuide();
  initReveals();
  initLandingSlides();

  function initLandingSlides(): void {
    const story = document.querySelector<HTMLElement>("[data-landing-story]");
    const track = document.querySelector<HTMLElement>("[data-landing-track]");
    if (!story || !track) return;

    const slides = Array.from(track.querySelectorAll<HTMLElement>(".landing-slide"));
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-landing-progress] button"));
    let index = 0;
    let locked = false;
    let desktop = window.matchMedia("(min-width: 961px)").matches;

    const apply = (): void => {
      if (!desktop) {
        document.body.classList.remove("is-landing-locked");
        track.style.transform = "";
        slides.forEach((slide) => slide.classList.add("is-active"));
        return;
      }

      document.body.classList.add("is-landing-locked");
      track.style.transform = `translateY(-${index * 100}%)`;
      slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
      dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
    };

    const move = (nextIndex: number): void => {
      const clamped = Math.max(0, Math.min(slides.length - 1, nextIndex));
      if (clamped === index || locked) return;
      index = clamped;
      locked = true;
      apply();
      window.setTimeout(() => {
        locked = false;
      }, 780);
    };

    const onWheel = (event: WheelEvent): void => {
      if (!desktop) return;
      event.preventDefault();
      if (Math.abs(event.deltaY) < 18) return;
      move(index + (event.deltaY > 0 ? 1 : -1));
    };

    const onKey = (event: KeyboardEvent): void => {
      if (!desktop) return;
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        move(index + 1);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        move(index - 1);
      }
    };

    dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => move(dotIndex)));
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => {
      desktop = window.matchMedia("(min-width: 961px)").matches;
      apply();
    });
    apply();
  }

  function initReveals(): void {
    const items = Array.from(
    document.querySelectorAll<HTMLElement>(".card, .profile-panel, .profession-card, .result-card"),
    ).filter((item) => !item.closest("[data-landing-story]"));

    items.forEach((item) => item.classList.add("reveal"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );

    items.forEach((item) => observer.observe(item));
  }

  function initAscii(): void {
    const symbols = "#@$%&/\\|:;+=*SAWY";
    document.querySelectorAll<HTMLElement>("[data-ascii-logo]").forEach((node) => {
      const base = node.textContent || "";
      const chars = Array.from(base);
      const visible = chars.map((char, charIndex) => (char.trim() ? charIndex : -1)).filter((charIndex) => charIndex >= 0);

      window.setInterval(() => {
        const next = [...chars];
        const swaps = Math.max(8, Math.round(visible.length * 0.028));
        for (let i = 0; i < swaps; i += 1) {
          const charIndex = visible[Math.floor(Math.random() * visible.length)];
          next[charIndex] = symbols[Math.floor(Math.random() * symbols.length)];
        }
        node.textContent = next.join("");
      }, 280);
    });
  }

  function initTyped404(): void {
    const typed = document.querySelector<HTMLElement>("[data-typed-subtitle]");
    if (!typed) return;

    const messages = parseMessages(typed.getAttribute("data-messages") || "[]");
    let messageIndex = 0;
    let charIndex = 0;

    const tick = (): void => {
      const message = messages[messageIndex] || "";
      typed.textContent = message.slice(0, charIndex);
      if (charIndex < message.length) {
        charIndex += 1;
        window.setTimeout(tick, 34);
        return;
      }

      window.setTimeout(() => {
        messageIndex = (messageIndex + 1) % Math.max(messages.length, 1);
        charIndex = 0;
        tick();
      }, 5000);
    };

    tick();
  }

  function parseMessages(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  function initTestProgress(): void {
    document.querySelectorAll<HTMLFormElement>("[data-test-form]").forEach((form) => {
      const questions = Array.from(form.querySelectorAll<HTMLElement>("[data-question]"));
      const progress = form.querySelector<HTMLElement>("[data-progress]");

      const update = (): void => {
        const answered = questions.filter((question) => question.querySelector<HTMLInputElement>("input:checked")).length;
        if (progress) progress.style.width = `${questions.length ? (answered / questions.length) * 100 : 0}%`;
      };

      form.addEventListener("change", update);
      update();
    });
  }

  function initGuide(): void {
    document.querySelectorAll<HTMLFormElement>("[data-guide-form]").forEach((form) => {
      const list = document.querySelector<HTMLElement>("[data-chat-list]");
      const input = form.querySelector<HTMLInputElement>('[name="message"]');
      if (!input) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = (input.value || "").trim();
        if (!message) return;

        const body = new FormData(form);
        input.value = "";

        try {
          const response = await fetch(form.action, {
            method: "POST",
            body,
            headers: { "X-Requested-With": "XMLHttpRequest" },
          });
          if (!response.ok) throw new Error("Request failed");

          const payload = (await response.json()) as GuidePayload;
          if (list) {
            list.insertAdjacentHTML("beforeend", `<div class="chat-bubble chat-bubble--user">${escapeHtml(payload.user.content)}</div>`);
            list.insertAdjacentHTML("beforeend", `<div class="chat-bubble chat-bubble--guide">${escapeHtml(payload.guide.content)}</div>`);
            list.scrollTop = list.scrollHeight;
          }
        } catch {
          form.submit();
        }
      });
    });
  }

  type GuidePayload = {
    user: { content: string };
    guide: { content: string };
  };

  function escapeHtml(value: string): string {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(value).replace(/[&<>"']/g, (char) => replacements[char] || char);
  }
})();
