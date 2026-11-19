/* fig.02 — a 3D CI/CD loop drawn on canvas 2D (no WebGL, no library).
   A twisting ribbon traces the DevOps infinity loop: CI on top, CD below.
   Commits travel commit → build → test → release → deploy → monitor; some get
   caught at test. Press the figure to push your own commit. */
(function () {
  const canvas = document.getElementById("pipeCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const stage = document.getElementById("pipe");
  const fig = stage.closest(".pipe");
  const runEl = document.getElementById("pipeRun");
  const root = document.documentElement;

  // main.js (loaded first) sets html.reduced from the OS setting or the site's own toggle
  const still = root.classList.contains("reduced");

  // ---------- palette: resolve the CSS tokens to rgb once ----------
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const rgb = (name, fb) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim() || fb;
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = fb; probe.fillStyle = v; probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  };
  const C = { sig: rgb("--signal", "#c6f24a"), amber: rgb("--amber", "#f0b45a"), ink: rgb("--ink", "#ecefe6"), ink2: rgb("--ink-2", "#b3b8ae"), ink4: rgb("--ink-4", "#4f5550"), bg: rgb("--bg-2", "#1c211e") };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const col = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
  const FONT = getComputedStyle(root).getPropertyValue("--f-mono").trim() || "monospace";

  // ---------- geometry: vertical lemniscate with depth, so the loops cross over/under ----------
  const TAU = Math.PI * 2, SX = 1.45, DZ = 0.32;
  const curve = (t) => { const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; return [SX * s * c / d, c / d, DZ * s]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const frame = (t) => { // tangent-aligned basis for ribbon + gates
    const T = norm(sub(curve(t + 1e-3), curve(t - 1e-3)));
    const U = norm(cross(T, [0, 0, 1])), V = cross(T, U); return [T, U, V];
  };

  const N = 220, HW = 0.045;               // samples, ribbon half-width
  const samples = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * TAU - Math.PI / 2, [, U, V] = frame(t), p = curve(t), tw = 2 * t, ca = Math.cos(tw), sa = Math.sin(tw);
    const o = [U[0] * ca + V[0] * sa, U[1] * ca + V[1] * sa, U[2] * ca + V[2] * sa];
    samples.push({ t, p, a: [p[0] + o[0] * HW, p[1] + o[1] * HW, p[2] + o[2] * HW], b: [p[0] - o[0] * HW, p[1] - o[1] * HW, p[2] - o[2] * HW] });
  }

  const STAGES = [
    ["commit", -1.05], ["build", 0], ["test", 1.05], ["release", Math.PI - 1.05], ["deploy", Math.PI], ["monitor", Math.PI + 1.05],
  ].map(([name, t], i) => {
    const [, U, V] = frame(t), p = curve(t), ring = [];
    for (let k = 0; k <= 28; k++) { const a = (k / 28) * TAU, r = 0.12; ring.push([p[0] + (U[0] * Math.cos(a) + V[0] * Math.sin(a)) * r, p[1] + (U[1] * Math.cos(a) + V[1] * Math.sin(a)) * r, p[2] + (U[2] * Math.cos(a) + V[2] * Math.sin(a)) * r]); }
    return { name, n: `0${i + 1}`, t, p, ring, glow: 0, fail: 0 };
  });
  const VERB = { build: "building", test: "testing", release: "releasing", monitor: "monitoring · healthy" };
  const T0 = STAGES[0].t, T_TEST = STAGES[2].t, T_END = STAGES[5].t + 0.55; // fade out just before the loop closes

  // ---------- camera ----------
  let W = 0, H = 0, dpr = 1, R = 1, cx = 0, cy = 0;
  let yaw = 0, pitch = 0.08, tYaw = 0, tPitch = 0.08;
  const D = 4.2;
  let cyw = 1, syw = 0, cpt = 1, spt = 0;
  const proj = (v) => {
    const x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw;
    const y2 = v[1] * cpt - z1 * spt, z2 = v[1] * spt + z1 * cpt;
    const s = D / (D - z2);
    return [cx + x1 * s * R, cy - y2 * s * R, z2, s];
  };

  const size = () => {
    const r = canvas.getBoundingClientRect(); if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(H * 0.33, W * 0.47); cx = W / 2; cy = H * 0.51;
    if (still) draw(0);
  };

  // ---------- commits ----------
  let packets = [], run = 1284, nextSpawn = 0.4;
  const push = (t = T0) => { packets.push({ t, id: ++run, fails: !still && Math.random() < 0.16, dead: 0, spin: Math.random() * TAU }); setRun(`run #${run} · building`, ""); };
  const setRun = (txt, cls) => { if (!runEl) return; runEl.textContent = txt; runEl.className = `pipe__run mono${cls ? " " + cls : ""}`; };

  // glow sprite, drawn once
  const sprite = (c) => {
    const s = document.createElement("canvas"); s.width = s.height = 64; const g = s.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col(c, 0.9)); gr.addColorStop(0.25, col(c, 0.35)); gr.addColorStop(1, col(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return s;
  };
  const GLOW = sprite(C.sig), GLOW_F = sprite(C.amber);

  const CUBE = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

  // ---------- render ----------
  function draw(dt) {
    cyw = Math.cos(yaw); syw = Math.sin(yaw); cpt = Math.cos(pitch); spt = Math.sin(pitch);
    ctx.clearRect(0, 0, W, H);
    const items = [];
    const live = packets.filter((p) => !p.dead || p.dead < 1);

    // heat: how lit is each ribbon sample by a commit that just passed
    const heat = (t) => {
      let h = 0, f = 0;
      for (const p of live) {
        let d = p.t - t; if (d < 0) d += TAU; if (d > 0.9) continue;
        const k = (1 - d / 0.9) ** 2 * (1 - p.dead);
        if (k > h) { h = k; f = p.fails && p.t > T_TEST ? 1 : 0; }
      }
      return [h, f];
    };

    const P = samples.map((s) => ({ s, a: proj(s.a), b: proj(s.b), c: proj(s.p), h: heat(s.t) }));
    for (let i = 0; i < N; i++) {
      const A = P[i], B = P[(i + 1) % N];
      items.push({ z: (A.c[2] + B.c[2]) / 2, k: "seg", A, B, rung: i % 3 === 0 });
    }
    for (const st of STAGES) items.push({ z: proj(st.p)[2] + 0.01, k: "gate", st });
    for (const p of live) items.push({ z: proj(curve(p.t))[2] + 0.02, k: "pkt", p });
    items.sort((a, b) => a.z - b.z);

    for (const it of items) {
      const depth = Math.min(1, Math.max(0, (it.z + 0.45) / 0.9)); // 0 far → 1 near
      if (it.k === "seg") {
        const { A, B } = it, h = Math.max(A.h[0], B.h[0]), f = A.h[1] || B.h[1];
        const base = mix(C.ink4, C.ink2, depth), hot = f ? C.amber : C.sig, c = mix(base, hot, h);
        const a = 0.35 + depth * 0.55 + h * 0.2, w = (0.7 + depth * 0.9 + h * 0.8) * A.c[3];
        ctx.strokeStyle = col(c, Math.min(1, a)); ctx.lineWidth = w; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(A.a[0], A.a[1]); ctx.lineTo(B.a[0], B.a[1]); ctx.moveTo(A.b[0], A.b[1]); ctx.lineTo(B.b[0], B.b[1]);
        if (it.rung) { ctx.moveTo(A.a[0], A.a[1]); ctx.lineTo(A.b[0], A.b[1]); }
        ctx.stroke();
      } else if (it.k === "gate") {
        const st = it.st, g = st.glow, hot = st.fail ? C.amber : C.sig;
        ctx.beginPath();
        st.ring.forEach((v, j) => { const q = proj(v); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.strokeStyle = col(mix(mix(C.ink4, C.ink2, depth), hot, Math.max(g, 0.35)), 0.55 + depth * 0.35 + g * 0.3);
        ctx.lineWidth = 1.2 + g * 1.4; ctx.stroke();
        if (g > 0.02) { const q = proj(st.p), r = 46 * q[3] * (0.6 + g); ctx.globalAlpha = g * 0.8; ctx.drawImage(st.fail ? GLOW_F : GLOW, q[0] - r / 2, q[1] - r / 2, r, r); ctx.globalAlpha = 1; }
        // label, pushed outward from the loop's centre line
        const q = proj(st.p), side = st.p[0] > 0.05 ? 1 : st.p[0] < -0.05 ? -1 : 0;
        const lx = q[0] + side * 22 * q[3], ly = side ? q[1] + 3 : q[1] + (st.p[1] > 0 ? -20 : 26) * q[3];
        ctx.font = `500 ${Math.max(9, Math.min(11, W / 30))}px ${FONT}`;
        ctx.textAlign = side > 0 ? "left" : side < 0 ? "right" : "center";
        ctx.fillStyle = col(C.ink4, 0.9); ctx.fillText(st.n, lx, ly - 11);
        ctx.fillStyle = col(mix(C.ink2, hot, g), 0.75 + g * 0.25); ctx.fillText(st.name.toUpperCase(), lx, ly);
      } else {
        const p = it.p, q = proj(curve(p.t)), f = p.fails && p.t > T_TEST, al = 1 - p.dead, sz = 5.2 * q[3];
        const r = 34 * q[3]; ctx.globalAlpha = al; ctx.drawImage(f ? GLOW_F : GLOW, q[0] - r / 2, q[1] - r / 2, r, r);
        // tumbling wireframe cube = one commit
        p.spin += dt * 2.2; const ca = Math.cos(p.spin), sa = Math.sin(p.spin), cb = Math.cos(p.spin * 0.7), sb = Math.sin(p.spin * 0.7);
        const pts = CUBE.map(([x, y, z]) => { const x1 = x * ca - z * sa, z1 = x * sa + z * ca, y1 = y * cb - z1 * sb; return [q[0] + x1 * sz, q[1] + y1 * sz]; });
        ctx.strokeStyle = col(f ? C.amber : C.sig, al); ctx.lineWidth = 1.1; ctx.beginPath();
        for (const [i, j] of EDGES) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
  }

  // ---------- loop ----------
  function step(dt, time) {
    tYaw = Math.sin(time * 0.00021) * 0.55 + pointer.x * 0.5;
    tPitch = 0.08 + Math.sin(time * 0.00013) * 0.06 + pointer.y * 0.25;
    yaw += (tYaw - yaw) * Math.min(1, dt * 3); pitch += (tPitch - pitch) * Math.min(1, dt * 3);

    nextSpawn -= dt; if (nextSpawn <= 0) { push(); nextSpawn = 1.5 + Math.random() * 1.1; }
    for (const p of packets) {
      const prev = p.t, f = p.fails && p.t > T_TEST;
      p.t += dt * (f ? 0.25 : 0.95);
      if (f) p.dead = Math.min(1, p.dead + dt * 0.9);
      for (const st of STAGES) if (prev < st.t && p.t >= st.t && !(p.fails && st.t > T_TEST)) {
        st.glow = 1; st.fail = p.fails && st.t === T_TEST ? 1 : 0;
        if (st.fail) setRun(`run #${p.id} · test failed · blocked`, "is-fail");
        else if (st.name === "deploy") setRun(`run #${p.id} · deployed ✓`, "is-ok");
        else if (VERB[st.name]) setRun(`run #${p.id} · ${VERB[st.name]}`, "");
      }
      if (p.t > T_END) p.dead = Math.min(1, p.dead + dt * 2.5);
    }
    packets = packets.filter((p) => p.dead < 1);
    for (const st of STAGES) st.glow = Math.max(0, st.glow - dt * 1.4);
    draw(dt);
  }

  const pointer = { x: 0, y: 0 };
  let raf = 0, last = 0, visible = false;
  const frameFn = (now) => { const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; step(dt, now); raf = requestAnimationFrame(frameFn); };
  const start = () => { if (!raf && !still && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frameFn); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  fig.classList.add("is-live");
  if (still) {
    // static frame: three commits mid-flight, gates lit where they sit
    packets = [{ t: 0.15, id: 0, fails: false, dead: 0, spin: 0.6 }, { t: 1.3, id: 0, fails: false, dead: 0, spin: 1.4 }, { t: Math.PI + 0.12, id: 0, fails: false, dead: 0, spin: 2.2 }];
    STAGES[1].glow = 0.8; STAGES[4].glow = 0.8; yaw = 0.35;
    setRun(`run #${run} · deployed ✓`, "is-ok");
  } else {
    // pre-warm so the first look already has traffic on the loop
    for (let i = 0; i < 5; i++) push(T0 + i * 1.25);
  }
  size();
  if ("ResizeObserver" in window) new ResizeObserver(size).observe(canvas); else addEventListener("resize", size);

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { rootMargin: "100px" }).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  if (!still) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener("pointerleave", () => { pointer.x = pointer.y = 0; });
  }
  stage.addEventListener("click", () => {
    if (still) return;
    if (packets.length < 12) push();
  });
})();
