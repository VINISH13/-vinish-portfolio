/* ==========================================================================
   Developer Portfolio — interactions
   Modules: preloader, theme, navbar, scroll UI, reveal, typing, counters,
            project filter, tilt, cursor glow, particles, contact form.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- Preloader */
  function initPreloader() {
    const loader = $("#preloader");
    if (!loader) return;
    const hide = () => loader.classList.add("is-hidden");
    window.addEventListener("load", () => setTimeout(hide, 350));
    setTimeout(hide, 2500); // safety net if a CDN asset is slow
  }

  /* -------------------------------------------------------------------- Theme */
  function initTheme() {
    const root = document.documentElement;
    const toggle = $("#themeToggle");
    const meta = $('meta[name="theme-color"]');

    const apply = (theme) => {
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-bs-theme", theme);
      if (meta) meta.setAttribute("content", theme === "dark" ? "#05060f" : "#f4f6ff");
      if (toggle) toggle.setAttribute("aria-pressed", String(theme === "light"));
    };

    apply(root.getAttribute("data-theme") || "dark");

    toggle?.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("portfolio-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------------- Navbar */
  function initNavbar() {
    const nav = $("#siteNav");
    const menu = $("#navMenu");
    if (!nav) return;

    // Close the mobile menu after choosing a link.
    $$(".nav-link", nav).forEach((link) =>
      link.addEventListener("click", () => {
        if (menu?.classList.contains("show") && window.bootstrap) {
          bootstrap.Collapse.getOrCreateInstance(menu).hide();
        }
      })
    );

    // Highlight the link of the section currently in view.
    const links = $$(".nav-link[data-section]", nav);
    const sections = links.map((l) => document.getElementById(l.dataset.section)).filter(Boolean);
    if (!sections.length) return;

    const setActive = (id) => links.forEach((l) => {
      const active = l.dataset.section === id;
      l.classList.toggle("active", active);
      if (active) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* --------------------------------------------- Scroll progress, nav state, top */
  function initScrollUI() {
    const nav = $("#siteNav");
    const bar = $("#scrollProgress");
    const topBtn = $("#backToTop");
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav?.classList.toggle("is-scrolled", y > 30);
      topBtn?.classList.toggle("is-visible", y > 600);
      if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    topBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" }));
  }

  /* ---------------------------------------------------------- Scroll reveal */
  function initReveal() {
    const items = $$(".reveal, .skill-card");
    items.forEach((el) => el.dataset.delay && el.style.setProperty("--delay", `${el.dataset.delay}ms`));

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => observer.observe(el));
  }

  /* ----------------------------------------------------------- Typing effect */
  function initTyping() {
    const target = $("#typedText");
    const data = $("#typing-roles");
    if (!target || !data) return;

    let roles;
    try { roles = JSON.parse(data.textContent); } catch (e) { return; }
    if (!Array.isArray(roles) || !roles.length) return;
    if (prefersReducedMotion) { target.textContent = roles.join(" · "); return; }

    let roleIndex = 0;
    let charIndex = roles[0].length;
    let deleting = true;
    const TYPE = 75, DELETE = 40, HOLD = 1700, GAP = 350;

    const tick = () => {
      const word = roles[roleIndex];
      charIndex += deleting ? -1 : 1;
      target.textContent = word.slice(0, charIndex);

      let delay = deleting ? DELETE : TYPE;
      if (!deleting && charIndex === word.length) { deleting = true; delay = HOLD; }
      else if (deleting && charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        delay = GAP;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, HOLD + 600);
  }

  /* --------------------------------------------------------- Count-up stats */
  function initCounters() {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    const run = (el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      if (prefersReducedMotion) { el.textContent = end; return; }
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => observer.observe(c));
  }

  /* --------------------------------------------------------- Project filter */
  function initProjectFilter() {
    const buttons = $$(".filter-btn");
    const items = $$(".project-item");
    const empty = $("#filterEmpty");
    if (!buttons.length || !items.length) return;

    buttons.forEach((btn) => btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });

      let shown = 0;
      items.forEach((item) => {
        const match = filter === "all" || item.dataset.category === filter;
        if (match) {
          shown++;
          item.classList.remove("is-hidden");
          item.classList.add("is-visible");
          requestAnimationFrame(() => item.classList.remove("is-filtered-out"));
        } else {
          item.classList.add("is-filtered-out");
          setTimeout(() => item.classList.contains("is-filtered-out") && item.classList.add("is-hidden"), 400);
        }
      });
      empty?.classList.toggle("d-none", shown > 0);
    }));
  }

  /* -------------------------------------------------------------- Card tilt */
  function initTilt() {
    if (!canHover || prefersReducedMotion) return;
    const MAX = 6;
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * MAX}deg) rotateY(${x * MAX}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------ Cursor glow */
  function initCursorGlow() {
    const glow = $("#cursorGlow");
    if (!glow || !canHover || prefersReducedMotion) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf = null;

    const loop = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = `translate(${cx - 260}px, ${cy - 260}px)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : null;
    };
    window.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      document.body.classList.add("has-cursor");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("mouseleave", () => document.body.classList.remove("has-cursor"));
  }

  /* ---------------------------------------------------- Particle background */
  function initParticles() {
    const canvas = $("#particles");
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles, dpr;
    const LINK = 130;

    const color = () => (document.documentElement.getAttribute("data-theme") === "light"
      ? "124, 58, 237" : "120, 200, 255");

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((w * h) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.6 + 0.4,
      }));
    };

    let running = true;
    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const rgb = color();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, .6)`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = dx * dx + dy * dy;
          if (dist < LINK * LINK) {
            ctx.strokeStyle = `rgba(${rgb}, ${0.14 * (1 - Math.sqrt(dist) / LINK)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    };

    resize();
    draw();
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running) draw();
    });
  }

  /* ----------------------------------------------------------------- Toast */
  function showToast(message, isError = false) {
    const el = $("#appToast");
    if (!el || !window.bootstrap) { alert(message); return; }
    $("#appToastBody").textContent = message;
    el.classList.toggle("is-error", isError);
    const icon = $(".toast-icon", el);
    if (icon) icon.className = `bi ${isError ? "bi-exclamation-octagon-fill" : "bi-check-circle-fill"} toast-icon`;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 5000 }).show();
  }

  /* ---------------------------------------------------------- Contact form */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    const submit = $("#contactSubmit");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const rules = {
      name: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),
      email: (v) => (!emailRe.test(v.trim()) ? "Please enter a valid email address." : ""),
      subject: (v) => (v.trim().length < 3 ? "Subject must be at least 3 characters." : ""),
      message: (v) => {
        const len = v.trim().length;
        if (len < 10) return "Message must be at least 10 characters.";
        if (len > 5000) return "Message is too long (max 5000 characters).";
        return "";
      },
    };

    const setError = (name, msg) => {
      const input = form.elements[name];
      const feedback = $(`[data-error-for="${name}"]`, form);
      if (!input) return;
      input.classList.toggle("is-invalid", !!msg);
      input.classList.toggle("is-valid", !msg && input.value.trim() !== "");
      input.setAttribute("aria-invalid", String(!!msg));
      if (feedback) feedback.textContent = msg || "";
    };

    const validateField = (name) => {
      const input = form.elements[name];
      const msg = rules[name] ? rules[name](input.value) : "";
      setError(name, msg);
      return !msg;
    };

    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      input.addEventListener("blur", () => input.value && validateField(name));
      input.addEventListener("input", () => input.classList.contains("is-invalid") && validateField(name));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const valid = Object.keys(rules).map(validateField).every(Boolean);
      if (!valid) {
        form.querySelector(".is-invalid")?.focus();
        return;
      }

      submit.classList.add("is-loading");
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          form.reset();
          Object.keys(rules).forEach((n) => form.elements[n]?.classList.remove("is-valid", "is-invalid"));
          $$(".form-alert", form).forEach((a) => a.remove());
          showToast(data.message || "Message sent!");
        } else {
          Object.entries(data.errors || {}).forEach(([field, msgs]) => setError(field, msgs.join(" ")));
          showToast(data.message || "Something went wrong. Please try again.", true);
        }
      } catch (err) {
        showToast("Network error — please check your connection and try again.", true);
      } finally {
        submit.classList.remove("is-loading");
      }
    });
  }

  /* ------------------------------------------------------------------ Boot */
  document.documentElement.classList.remove("no-js");
  initPreloader();
  initTheme();
  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initScrollUI();
    initReveal();
    initTyping();
    initCounters();
    initProjectFilter();
    initTilt();
    initCursorGlow();
    initParticles();
    initContactForm();
  });
})();
