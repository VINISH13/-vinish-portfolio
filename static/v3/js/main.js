/* ==========================================================================
   Portfolio v3 — "Futuristic HUD" interactions
   boot · theme · nav · starfield · cursor · reveal · scramble · typing ·
   counters · tilt/holo · magnetic · mission-log fill · gauge · filter ·
   copy · contact form
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* Boot sequence (once per session) --------------------------------------- */
  function initBoot() {
    const boot = $("#boot");
    if (!boot) return;
    const done = () => boot.classList.add("is-done");
    if (reduce || store.get("v3-booted")) { done(); return; }
    store.set("v3-booted", "1");

    const log = $("#bootLog");
    const bar = $("#bootBar");
    const lines = [
      "> initializing portfolio.sys",
      "> loading modules: python, django, rest_api",
      "> mounting projects [3] ............ ok",
      "> establishing secure channel ...... ok",
      "> system ready.",
    ];
    let i = 0;
    const next = () => {
      if (i < lines.length) {
        log.textContent += (i ? "\n" : "") + lines[i];
        i += 1;
        bar.style.width = `${(i / lines.length) * 100}%`;
        setTimeout(next, 170);
      } else {
        setTimeout(done, 250);
      }
    };
    next();
  }

  /* Theme ------------------------------------------------------------------- */
  function initTheme() {
    const root = document.documentElement;
    const meta = $('meta[name="theme-color"]');
    const apply = (t) => {
      root.setAttribute("data-theme", t);
      root.setAttribute("data-bs-theme", t);
      if (meta) meta.setAttribute("content", t === "dark" ? "#03040b" : "#eef3ff");
    };
    apply(root.getAttribute("data-theme") || "dark");
    $("#themeToggle")?.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("portfolio-theme", next); } catch (e) { /* ignore */ }
    });
  }

  /* Navigation + scroll meter ---------------------------------------------- */
  function initNav() {
    const nav = $("#siteNav");
    const toggle = $("#navToggle");
    const overlay = $("#navOverlay");
    const meter = $("#scrollMeter");

    const setOpen = (open) => {
      if (!overlay || !toggle) return;
      overlay.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle?.addEventListener("click", () => setOpen(overlay.hidden));
    overlay && $$("a", overlay).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      nav?.classList.toggle("is-scrolled", y > 20);
      if (meter) meter.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      updateLog();
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener("resize", update);
    update();

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

  /* Mission log progress line ---------------------------------------------- */
  function updateLog() {
    const log = $("#missionLog");
    if (!log) return;
    const r = log.getBoundingClientRect();
    const start = window.innerHeight * 0.75;
    const progress = Math.min(Math.max((start - r.top) / r.height, 0), 1);
    log.style.setProperty("--fill", `${progress * 100}%`);
    const fill = $("#logFill");
    if (fill) fill.style.height = `${progress * 100}%`;
  }

  /* Starfield (warp-style particles) ----------------------------------------- */
  function initStarfield() {
    const canvas = $("#starfield");
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    let w, h, stars, dpr, running = true, speed = 0.6, targetSpeed = 0.6;

    const colour = () => getComputedStyle(document.documentElement).getPropertyValue("--star").trim() || "200, 230, 255";
    const spawn = () => ({ x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * h, z: Math.random() * w });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.min(260, Math.floor((w * h) / 6000)) }, spawn);
    };

    let rgb = colour();
    const draw = () => {
      if (!running) return;
      speed += (targetSpeed - speed) * 0.05;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      for (const s of stars) {
        const pz = s.z;
        s.z -= speed;
        if (s.z <= 1) { Object.assign(s, spawn(), { z: w }); continue; }
        const k = 128 / s.z, pk = 128 / pz;
        const x = cx + s.x * k, y = cy + s.y * k;
        const px = cx + s.x * pk, py = cy + s.y * pk;
        if (x < 0 || x > w || y < 0 || y > h) continue;
        const a = Math.min(1, (1 - s.z / w) * 1.3);
        ctx.strokeStyle = `rgba(${rgb}, ${a})`;
        ctx.lineWidth = Math.max(0.4, (1 - s.z / w) * 2);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      requestAnimationFrame(draw);
    };

    resize(); draw();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
    document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) draw(); });
    // Stars drift at a constant gentle speed (no scroll "warp" streaks).
    new MutationObserver(() => { rgb = colour(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  /* Custom cursor ------------------------------------------------------------ */
  function initCursor() {
    if (!fine || reduce) return;
    const dot = $("#cursorDot"), ring = $("#cursorRing");
    if (!dot || !ring) return;
    let x = 0, y = 0, rx = 0, ry = 0;
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      document.body.classList.add("has-cursor");
    }, { passive: true });
    document.addEventListener("pointerleave", () => document.body.classList.remove("has-cursor"));
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("pointerover", (e) => {
      document.body.classList.toggle("cursor-hover", !!e.target.closest("a, button, .holo-card, input, textarea"));
    });
  }

  /* Text scramble ------------------------------------------------------------ */
  function scramble(el) {
    const final = el.dataset.final || el.textContent;
    el.dataset.final = final;
    el.setAttribute("aria-label", final);
    if (reduce) return;
    const chars = "!<>-_\\/[]{}=+*^?#ABCDEF0123456789";
    let frame = 0;
    const total = 22;
    const tick = () => {
      frame++;
      const revealCount = Math.floor((frame / total) * final.length);
      el.textContent = final.split("").map((c, i) => (i < revealCount || c === " " ? c : chars[(Math.random() * chars.length) | 0])).join("");
      if (frame < total) requestAnimationFrame(tick); else el.textContent = final;
    };
    tick();
  }

  /* Reveal + per-element triggers ------------------------------------------ */
  function initReveal() {
    const items = $$(".reveal");
    items.forEach((el) => el.dataset.delay && el.style.setProperty("--delay", `${el.dataset.delay}ms`));
    const onShow = (el) => {
      el.classList.add("is-visible");
      $$("[data-scramble]", el).forEach(scramble);
      if (el.matches("[data-scramble]")) scramble(el);
      $$(".gauge", el).forEach(fillGauge);
      if (el.matches(".gauge")) fillGauge(el);
    };
    if (reduce || !("IntersectionObserver" in window)) { items.forEach(onShow); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { onShow(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* CGPA gauge: "CGPA 7.71" -> 77.1%, "92%" -> 92% ------------------------- */
  function fillGauge(g) {
    const fill = $(".gauge__fill", g);
    if (!fill || g.dataset.done) return;
    g.dataset.done = "1";
    const m = (g.dataset.grade || "").match(/(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/);
    if (!m) return;
    const value = parseFloat(m[1]);
    const scale = m[2] ? parseFloat(m[2]) : value <= 10 ? 10 : 100;
    const pct = Math.max(0, Math.min(1, value / scale));
    const C = 2 * Math.PI * 52;
    requestAnimationFrame(() => { fill.style.strokeDashoffset = String(C * (1 - pct)); });
  }

  /* Typing ------------------------------------------------------------------- */
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
      let wait = del ? 32 : 65;
      if (!del && n === word.length) { del = true; wait = 1900; }
      else if (del && n === 0) { del = false; i = (i + 1) % roles.length; wait = 320; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2400);
  }

  /* Counters ----------------------------------------------------------------- */
  function initCounters() {
    const els = $$("[data-count]");
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1400;
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

  /* 3D tilt + holographic sheen --------------------------------------------- */
  function initTilt() {
    if (!fine || reduce) return;
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg)`;
        card.style.setProperty("--sx", `${px * 100}%`);
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* Magnetic buttons ---------------------------------------------------------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* Project filter ------------------------------------------------------------ */
  function initFilter() {
    const btns = $$(".tabs-neo__btn");
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
          setTimeout(() => it.classList.contains("is-out") && it.classList.add("is-hidden"), 320);
        }
      });
      empty?.classList.toggle("d-none", shown > 0);
    }));
  }

  /* Toast ---------------------------------------------------------------------- */
  function toast(msg, isError = false) {
    const el = $("#appToast");
    if (!el || !window.bootstrap) { alert(msg); return; }
    $("#appToastBody").textContent = msg;
    el.classList.toggle("is-error", isError);
    const icon = $(".toast-icon", el);
    if (icon) icon.className = `bi ${isError ? "bi-exclamation-octagon" : "bi-check2-circle"} toast-icon`;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
  }

  /* Copy ----------------------------------------------------------------------- */
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

  /* Contact form -------------------------------------------------------------- */
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

  /* Boot ------------------------------------------------------------------------ */
  document.documentElement.classList.remove("no-js");
  initTheme();
  initBoot();
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    // initStarfield();  — moving star background removed at user request
    initCursor();
    initReveal();
    initTyping();
    initCounters();
    initTilt();
    initMagnetic();
    initFilter();
    initCopy();
    initContact();
  });
})();
