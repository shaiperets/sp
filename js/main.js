(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  // ---------- reduced motion ----------
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  const pref = store.get("motion");
  if (pref === "reduced" || (pref === null && mq.matches)) root.classList.add("reduced");
  const isReduced = () => root.classList.contains("reduced");

  const loader = $("#loader");
  const finish = () => { root.classList.add("is-ready"); };
  if (!window.gsap || !window.ScrollTrigger) { root.classList.add("no-js"); finish(); window.renderViz && renderViz(); return; }
  gsap.registerPlugin(ScrollTrigger);
  window.renderViz && renderViz();

  const motionBtn = $("#motionBtn");
  const syncBtn = () => (motionBtn.textContent = isReduced() ? "enable motion" : "reduce motion");
  syncBtn();
  motionBtn.addEventListener("click", () => {
    root.classList.toggle("reduced");
    store.set("motion", isReduced() ? "reduced" : "full");
    location.reload();
  });

  $("#yr").textContent = new Date().getFullYear();

  // ---------- smooth scroll ----------
  let lenis = null;
  if (!isReduced() && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); const el = id === "#top" ? document.body : $(id);
      if (!el) return; e.preventDefault();
      lenis ? lenis.scrollTo(id === "#top" ? 0 : el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) }) : el.scrollIntoView({ behavior: isReduced() ? "auto" : "smooth" });
    })
  );

  // ---------- split text ----------
  $$(".split").forEach((el) => {
    const t = el.textContent; el.setAttribute("aria-hidden", "true"); el.textContent = "";
    [...t].forEach((c) => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; el.appendChild(s); });
  });

  // ---------- counters ----------
  const fmt = (el, v) => (el.textContent = (el.dataset.prefix || "") + Math.round(v) + (el.dataset.suffix || ""));
  function count(el, delay = 0) {
    const to = +el.dataset.count;
    if (isReduced()) return fmt(el, to);
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.8, delay, ease: "power3.out", onUpdate: () => fmt(el, o.v) });
  }

  // ---------- preloader → intro ----------
  const logEl = $("#loaderLog"), numEl = $("#loaderNum");
  const LINES = ["git clone shai-peretz/platform", "terraform apply -auto-approve", "helm upgrade --install portfolio .", "kubectl rollout status deploy/portfolio", "all checks passed"];
  function intro() {
    finish();
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".split .ch", { y: 0, rotate: 0, duration: 1.3, stagger: 0.045 }, 0.1)
      .to("#heroPhoto .duo", { clipPath: "inset(0 0 0% 0)", duration: 1.5, ease: "expo.inOut" }, 0.25)
      .fromTo("#heroPhoto img", { scale: 1.4 }, { scale: 1.12, duration: 1.8 }, 0.25)
      .from([".hero__meta", ".hero__kicker", ".hero__sub", ".hero__scroll", "#heroPhoto figcaption"], { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.7)
      .from(".hero__stats > div", { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, 0.9)
      .from(".nav > *", { y: -20, opacity: 0, duration: 0.9, stagger: 0.06 }, 0.8);
    $$(".hero__stats [data-count]").forEach((e, i) => count(e, 1 + i * 0.1));
    initScroll();
  }

  if (isReduced()) {
    gsap.set(loader, { display: "none" });
    $$(".hero__stats [data-count]").forEach((e) => fmt(e, +e.dataset.count));
    gsap.set(".split .ch", { y: 0, rotate: 0 }); gsap.set("#heroPhoto .duo", { clipPath: "none" });
    finish(); initScroll();
  } else {
    lenis && lenis.stop();
    const o = { n: 0 }; let shown = 0;
    const tl = gsap.timeline({ onComplete: () => {
      gsap.timeline({ onComplete: () => { loader.style.display = "none"; lenis && lenis.start(); } })
        .to(".loader__inner", { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" })
        .to(".loader__panel--t", { yPercent: -101, duration: 1.1, ease: "expo.inOut" }, 0.35)
        .to(".loader__panel--b", { yPercent: 101, duration: 1.1, ease: "expo.inOut" }, 0.35)
        .add(intro, 0.7);
    } });
    tl.to(o, { n: 100, duration: 2.3, ease: "power2.inOut", onUpdate() {
      numEl.textContent = Math.round(o.n);
      const k = Math.min(LINES.length, Math.floor(o.n / (100 / LINES.length)) + (o.n >= 99 ? 1 : 0));
      while (shown < k) { logEl.innerHTML += `<b>›</b> ${LINES[shown]}${shown === LINES.length - 1 ? " <b>✓</b>" : ""}\n`; shown++; }
    } });
  }

  // ---------- cursor ----------
  const cur = $("#cursor");
  if (cur && !isReduced() && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const qx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }), qy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    const lab = $(".cursor__label", cur);
    addEventListener("pointermove", (e) => { cur.classList.add("is-on"); qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { lab.textContent = t.dataset.cursor; cur.classList.add("is-big"); } else cur.classList.remove("is-big");
    });
    document.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
  }

  // ---------- hero canvas: dot grid that breathes + reacts ----------
  (function heroField() {
    const cv = $("#heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, dpr, run = true, m = { x: -999, y: -999 };
    const sig = getComputedStyle(root).getPropertyValue("--signal").trim(), ink = getComputedStyle(root).getPropertyValue("--ink-3").trim();
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    $("#hero").addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; });
    $("#hero").addEventListener("pointerleave", () => (m.x = m.y = -999));
    new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) requestAnimationFrame(draw); }).observe(cv);
    const S = 38;
    function draw(t) {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      for (let y = S / 2; y < H; y += S) for (let x = S / 2; x < W; x += S) {
        const w = isReduced() ? 0 : Math.sin(x * 0.012 + t / 1400) * Math.cos(y * 0.014 - t / 1900);
        const d = Math.hypot(x - m.x, y - m.y), near = Math.max(0, 1 - d / 220);
        const px = x + (x - m.x) / (d || 1) * near * 14, py = y + (y - m.y) / (d || 1) * near * 14;
        ctx.globalAlpha = 0.18 + w * 0.12 + near * 0.8;
        ctx.fillStyle = near > 0.2 ? sig : ink;
        const r = 1 + near * 2.2 + Math.max(0, w) * 0.8;
        ctx.fillRect(px - r / 2, py - r / 2, r, r);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  // ---------- scroll-driven ----------
  function initScroll() {
    // progress bar + nav state
    gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
    $$("main > section[id]").forEach((s) => {
      const a = $(`.nav__links a[href="#${s.id}"]`); if (!a) return;
      ScrollTrigger.create({ trigger: s, start: "top 50%", end: "bottom 50%", onToggle: (self) => a.classList.toggle("is-active", self.isActive) });
    });

    if (!isReduced()) {
      // hero photo parallax + drift on pointer
      gsap.to("#heroPhoto", { yPercent: -14, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero__title", { yPercent: 18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
      const hx = gsap.quickTo("#heroPhoto", "x", { duration: 1, ease: "power3" });
      $("#hero").addEventListener("pointermove", (e) => hx((e.clientX / innerWidth - 0.5) * -24));
    }

    // statement: word-by-word scrub
    const st = $("#statement");
    if (!st.dataset.done) {
      st.dataset.done = 1;
      st.innerHTML = st.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    }
    if (!isReduced()) gsap.to("#statement .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: st, start: "top 82%", end: "bottom 45%", scrub: true } });

    // generic reveals
    if (!isReduced()) {
      gsap.from(".about__copy > *", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".about__copy", start: "top 80%", once: true } });
      [".about__video", ".about__desk"].forEach((s, i) => gsap.from(s, { y: 80, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%", once: true } }));
      gsap.to(".about__desk", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".about__grid", start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(".faq__item", { y: 30, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".faq__list", start: "top 82%", once: true } });
      gsap.from(".cred__card", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: ".cred__grid", start: "top 80%", once: true } });
      gsap.to(".contact__title .line > span", { y: 0, duration: 1.3, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".contact__title", start: "top 85%", once: true } });
      gsap.set(".contact__title .line > span", { y: "105%" });
      gsap.from(".stack__field", { opacity: 0, duration: 1.4, scrollTrigger: { trigger: ".stack__field", start: "top 85%", once: true } });
    }
    $$(".cred__card").forEach((c) => ScrollTrigger.create({ trigger: c, start: "top 85%", once: true, onEnter: () => c.classList.add("is-in") }));
    $$(".nums [data-count]").forEach((e) => ScrollTrigger.create({ trigger: e, start: "top 90%", once: true, onEnter: () => count(e) }));

    // reel video: play only while visible
    const v = $("#reel");
    if (v && !isReduced()) {
      new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.35 }).observe(v);
    }
    v && v.addEventListener("click", () => { v.paused ? v.play() : v.pause(); });

    // experience: horizontal pinned timeline (desktop, full motion only)
    const mm = gsap.matchMedia();
    mm.add("(min-width: 861px)", () => {
      if (isReduced()) return;
      const track = $("#track"), fill = $("#railFill"), label = $("#railLabel");
      const years = ["2023 → now", "2021", "2020", "2017", "2015", "2012", "2009"];
      const dist = () => Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft));
      const cards = $$(".card");
      const hz = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: {
        trigger: ".exp__pin", pin: true, scrub: 0.8, start: "top top", end: () => "+=" + dist(), invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate(self) {
          fill.style.transform = `scaleX(${self.progress})`;
          label.textContent = years[Math.min(years.length - 1, Math.floor(self.progress * years.length))];
        },
      } });
      cards.forEach((c) => {
        gsap.from(c.querySelector(".card__viz svg"), { scale: 0.85, opacity: 0.2, ease: "none", scrollTrigger: { trigger: c, containerAnimation: hz, start: "left 95%", end: "left 45%", scrub: true } });
      });
    });
    ScrollTrigger.refresh();
  }

  // ---------- magnetic buttons ----------
  if (!isReduced() && matchMedia("(hover: hover)").matches) {
    $$(".magnet").forEach((m) => {
      const x = gsap.quickTo(m, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(m, "y", { duration: 0.6, ease: "power3" });
      m.addEventListener("pointermove", (e) => { const r = m.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.12); y((e.clientY - r.top - r.height / 2) * 0.25); });
      m.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  // ---------- clock ----------
  const clock = $("#clock");
  const tick = () => { try { clock.textContent = "TLV " + new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" }).format(new Date()); } catch {} };
  tick(); setInterval(tick, 30000);

  addEventListener("load", () => ScrollTrigger.refresh());
})();
