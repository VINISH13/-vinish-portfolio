/* ==========================================================================
   Portfolio v4 — "Clean Professional" interactions (subtle motion only)
   theme · nav · reveal · typing · counters · filter · copy · contact form
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Theme (light by default, stored separately from the other designs) ------ */
  function initTheme() {
    const root = document.documentElement;
    const meta = $('meta[name="theme-color"]');
    const apply = (t) => {
      root.setAttribute("data-theme", t);
      root.setAttribute("data-bs-theme", t);
      if (meta) meta.setAttribute("content", t === "dark" ? "#0b1120" : "#ffffff");
    };
    apply(root.getAttribute("data-theme") || "light");
    $("#themeToggle")?.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("portfolio-theme-v4", next); } catch (e) { /* ignore */ }
    });
  }

  /* Navigation ---------------------------------------------------------------- */
  function initNav() {
    const bar = $("#siteNav");
    const toggle = $("#navToggle");
    const menu = $("#mobileMenu");

    const setOpen = (open) => {
      if (!menu || !toggle) return;
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      const icon = $("i", toggle);
      if (icon) icon.className = open ? "bi bi-x-lg" : "bi bi-list";
    };
    toggle?.addEventListener("click", () => setOpen(menu.hidden));
    menu && $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

    const onScroll = () => bar?.classList.toggle("is-scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const links = $$("[data-section]");
    const ids = [...new Set(links.map((l) => l.dataset.section))];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.section === e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  /* Reveal ---------------------------------------------------------------------- */
  function initReveal() {
    const items = $$(".reveal");
    items.forEach((el) => el.dataset.delay && el.style.setProperty("--delay", `${el.dataset.delay}ms`));
    if (reduce || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* Typing ------------------------------------------------------------------------ */
  function initTyping() {
    const el = $("#typedText");
    const data = $("#typing-roles");
    if (!el || !data) return;
    let roles;
    try { roles = JSON.parse(data.textContent); } catch (e) { return; }
    if (!Array.isArray(roles) || !roles.length) return;
    if (reduce || roles.length === 1) { el.textContent = roles[0]; return; }
    let i = 0, n = roles[0].length, del = true;
    const tick = () => {
      const word = roles[i];
      n += del ? -1 : 1;
      el.textContent = word.slice(0, n);
      let wait = del ? 35 : 70;
      if (!del && n === word.length) { del = true; wait = 2200; }
      else if (del && n === 0) { del = false; i = (i + 1) % roles.length; wait = 300; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2600);
  }

  /* Counters ---------------------------------------------------------------------- */
  function initCounters() {
    const els = $$("[data-count]");
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1000;
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach((el) => io.observe(el));
  }

  /* Project filter ------------------------------------------------------------------ */
  function initFilter() {
    const btns = $$(".filters__btn");
    const items = $$(".project-item");
    const empty = $("#filterEmpty");
    btns.forEach((btn) => btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      btns.forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", String(b === btn)); });
      let shown = 0;
      items.forEach((it) => {
        const match = f === "all" || it.dataset.category === f;
        if (match) {
          shown++;
          it.classList.remove("is-hidden");
          it.classList.add("is-visible");
          requestAnimationFrame(() => it.classList.remove("is-out"));
        } else {
          it.classList.add("is-out");
          setTimeout(() => it.classList.contains("is-out") && it.classList.add("is-hidden"), 260);
        }
      });
      empty?.classList.toggle("d-none", shown > 0);
    }));
  }

  /* Toast ---------------------------------------------------------------------------- */
  function toast(msg, isError = false) {
    const el = $("#appToast");
    if (!el || !window.bootstrap) { alert(msg); return; }
    $("#appToastBody").textContent = msg;
    el.classList.toggle("is-error", isError);
    const icon = $(".toast-icon", el);
    if (icon) icon.className = `bi ${isError ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"} toast-icon`;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
  }

  /* Copy ------------------------------------------------------------------------------ */
  function initCopy() {
    $$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        const icon = $("i", btn);
        btn.classList.add("is-copied");
        if (icon) icon.className = "bi bi-check2";
        toast("Copied to clipboard");
        setTimeout(() => { btn.classList.remove("is-copied"); if (icon) icon.className = "bi bi-copy"; }, 1800);
      } catch (e) {
        toast("Couldn't copy — please copy it manually.", true);
      }
    }));
  }

  /* Contact form ----------------------------------------------------------------------- */
  function initContact() {
    const form = $("#contactForm");
    if (!form) return;
    const submit = $("#contactSubmit");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const rules = {
      name: (v) => (v.trim().length < 2 ? "Please enter your full name." : ""),
      email: (v) => (!emailRe.test(v.trim()) ? "Please enter a valid email address." : ""),
      subject: (v) => (v.trim().length < 3 ? "Subject must be at least 3 characters." : ""),
      message: (v) => {
        const n = v.trim().length;
        return n < 10 ? "Message must be at least 10 characters." : n > 5000 ? "Message is too long (max 5000 characters)." : "";
      },
    };
    const setError = (name, msg) => {
      const input = form.elements[name];
      if (!input) return;
      input.classList.toggle("is-invalid", !!msg);
      input.classList.toggle("is-valid", !msg && input.value.trim() !== "");
      input.setAttribute("aria-invalid", String(!!msg));
      const fb = $(`[data-error-for="${name}"]`, form);
      if (fb) fb.textContent = msg || "";
    };
    const check = (name) => { const msg = rules[name](form.elements[name].value); setError(name, msg); return !msg; };
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      input.addEventListener("blur", () => input.value && check(name));
      input.addEventListener("input", () => input.classList.contains("is-invalid") && check(name));
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!Object.keys(rules).map(check).every(Boolean)) { form.querySelector(".is-invalid")?.focus(); return; }
      submit.classList.add("is-loading");
      try {
        const res = await fetch(form.action, {
          method: "POST", body: new FormData(form),
          headers: { "X-Requested-With": "XMLHttpRequest" }, credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          form.reset();
          Object.keys(rules).forEach((n) => form.elements[n]?.classList.remove("is-valid", "is-invalid"));
          $$(".note", form).forEach((n) => n.remove());
          toast(data.message || "Message sent!");
        } else {
          Object.entries(data.errors || {}).forEach(([f, msgs]) => setError(f, msgs.join(" ")));
          toast(data.message || "Something went wrong. Please try again.", true);
        }
      } catch (err) {
        toast("Network error — please check your connection and try again.", true);
      } finally {
        submit.classList.remove("is-loading");
      }
    });
  }

  document.documentElement.classList.remove("no-js");
  initTheme();
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initReveal();
    initTyping();
    initCounters();
    initFilter();
    initCopy();
    initContact();
  });
})();
