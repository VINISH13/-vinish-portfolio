/* ==========================================================================
   Portfolio v5 — "Dark Minimal + 3D" interactions
   theme · nav/menu · 3D scene (Three.js) · masked reveals · word-by-word
   statement · typing · counters · filter · copy · contact form
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  const themeListeners = [];

  /* Theme ------------------------------------------------------------------ */
  function initTheme() {
    const root = document.documentElement;
    const meta = $('meta[name="theme-color"]');
    const apply = (t) => {
      root.setAttribute("data-theme", t);
      root.setAttribute("data-bs-theme", t);
      if (meta) meta.setAttribute("content", t === "dark" ? "#000000" : "#f5f5f7");
      themeListeners.forEach((fn) => fn(t));
    };
    apply(root.getAttribute("data-theme") || "dark");
    $("#themeToggle")?.addEventListener("click", () => {
      const next = isLight() ? "dark" : "light";
      apply(next);
      try { localStorage.setItem("portfolio-theme-v5", next); } catch (e) { /* ignore */ }
    });
  }

  /* Nav + full-screen menu ---------------------------------------------------- */
  function initNav() {
    const nav = $("#siteNav");
    const toggle = $("#navToggle");
    const overlay = $("#menuOverlay");
    const setOpen = (open) => {
      if (!overlay || !toggle) return;
      overlay.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle?.addEventListener("click", () => setOpen(overlay.hidden));
    overlay && $$("a", overlay).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

    const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 20);
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

  /* 3D centrepiece: a breathing particle sphere wrapped around a wireframe ---- */
  function initScene() {
    const canvas = $("#scene");
    if (!canvas) return;
    const fail = () => document.body.classList.add("no-webgl");
    if (!window.THREE) { fail(); return; }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { fail(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 7;

    const tilt = new THREE.Group();   // follows the mouse
    const spin = new THREE.Group();   // rotates continuously
    tilt.add(spin);
    scene.add(tilt);

    // Particle sphere (Fibonacci distribution)
    const N = window.innerWidth < 700 ? 1800 : 3600;
    const R = 1.9;
    const base = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * golden;
      base[i * 3] = Math.cos(th) * r * R;
      base[i * 3 + 1] = y * R;
      base[i * 3 + 2] = Math.sin(th) * r * R;
    }
    pos.set(base);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    spin.add(points);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, 1)),
      new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22 })
    );
    spin.add(wire);

    const paint = () => {
      const light = isLight();
      const a = new THREE.Color(light ? 0x2563eb : 0x7dd3fc);
      const b = new THREE.Color(light ? 0x7c3aed : 0xa78bfa);
      const c = new THREE.Color();
      for (let i = 0; i < N; i++) {
        c.copy(a).lerp(b, (base[i * 3 + 1] / R + 1) / 2);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.attributes.color.needsUpdate = true;
      mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      mat.needsUpdate = true;
      wire.material.color.set(light ? 0x1d1d1f : 0xffffff);
    };
    paint();
    themeListeners.push(paint);

    // Layout: object sits to the right on wide screens, behind the text on small ones.
    let w = 0, h = 0;
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const wide = w > 992;
      tilt.position.set(wide ? 2.1 : 0, wide ? 0.25 : 0.9, 0);
      tilt.scale.setScalar(wide ? 0.86 : 0.8);
      mat.opacity = wide ? 0.95 : 0.55;
      wire.material.opacity = wide ? 0.22 : 0.12;
    };
    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

    let mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    }

    const clock = new THREE.Clock();
    const frame = () => {
      const t = clock.getElapsedTime();
      for (let i = 0; i < N; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const d = 1 + 0.07 * Math.sin(x * 2.2 + t * 1.1) * Math.cos(y * 2.4 + t * 0.9) + 0.03 * Math.sin(z * 3 + t * 1.6);
        pos[i * 3] = x * d; pos[i * 3 + 1] = y * d; pos[i * 3 + 2] = z * d;
      }
      geo.attributes.position.needsUpdate = true;
      spin.rotation.y = t * 0.12;
      wire.rotation.x = t * 0.2;
      tilt.rotation.x += (my * 0.35 - tilt.rotation.x) * 0.05;
      tilt.rotation.y += (mx * 0.5 - tilt.rotation.y) * 0.05;
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      canvas.style.opacity = String(1 - p * 0.9);
      renderer.render(scene, camera);
    };

    if (reduce) { frame(); themeListeners.push(() => renderer.render(scene, camera)); return; }
    const loop = () => { if (visible && !document.hidden) frame(); requestAnimationFrame(loop); };
    loop();
  }

  /* Reveal (fade-up + masked lines) -------------------------------------------- */
  function initReveal() {
    const items = $$(".reveal, .mask");
    items.forEach((el) => el.dataset.delay && el.style.setProperty("--delay", `${el.dataset.delay}ms`));
    if (reduce || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* Statement that lights up word by word as you scroll --------------------- */
  function initStatement() {
    const el = $("[data-words]");
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</span>`).join(" ");
    const spans = $$(".w", el);
    if (reduce) { spans.forEach((s) => s.classList.add("lit")); return; }
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
      const lit = Math.round(progress * spans.length);
      spans.forEach((s, i) => s.classList.toggle("lit", i < lit));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* Typing -------------------------------------------------------------------- */
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
      if (!del && n === word.length) { del = true; wait = 2200; }
      else if (del && n === 0) { del = false; i = (i + 1) % roles.length; wait = 350; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2800);
  }

  /* Counters ------------------------------------------------------------------ */
  function initCounters() {
    const els = $$("[data-count]");
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1300;
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

  /* Project filter ---------------------------------------------------------------- */
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
          setTimeout(() => it.classList.contains("is-out") && it.classList.add("is-hidden"), 300);
        }
      });
      empty?.classList.toggle("d-none", shown > 0);
    }));
  }

  /* Toast + copy ----------------------------------------------------------------- */
  function toast(msg, isError = false) {
    const el = $("#appToast");
    if (!el || !window.bootstrap) { alert(msg); return; }
    $("#appToastBody").textContent = msg;
    el.classList.toggle("is-error", isError);
    const icon = $(".toast-icon", el);
    if (icon) icon.className = `bi ${isError ? "bi-exclamation-circle" : "bi-check-circle"} toast-icon`;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 4500 }).show();
  }
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

  /* Contact form --------------------------------------------------------------- */
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
    initScene();
    initReveal();
    initStatement();
    initTyping();
    initCounters();
    initFilter();
    initCopy();
    initContact();
  });
})();
