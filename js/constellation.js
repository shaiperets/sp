/* Interactive skill constellation — canvas 2D, springs + cursor repulsion */
(function () {
  const SKILLS = {
    cloud: ["AWS", "GCP", "Kubernetes", "Docker", "Terraform", "Terragrunt", "Helm", "AWS Lambda", "Amazon EKS", "GKE", "AI tools", "MCP"],
    cicd: ["GitHub Actions", "TeamCity", "Jenkins", "Ansible", "GitOps", "Bash", "GitLab"],
    lang: ["Python", "Bash", "Java", "Node.js", "C#", "JavaScript"],
    data: ["Airflow", "Flink", "Presto", "Hive", "SageMaker", "Redshift", "MongoDB", "MySQL", "SQL"],
  };
  const LABEL = { cloud: "Cloud & Infra", cicd: "CI/CD & Automation", lang: "Languages", data: "Data" };
  const CENTERS = { cloud: [0.3, 0.42], cicd: [0.68, 0.3], lang: [0.66, 0.74], data: [0.2, 0.78] };

  const canvas = document.getElementById("skillCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const field = document.getElementById("field");
  const tip = document.getElementById("tip");
  const list = document.getElementById("skillList");

  let W = 0, H = 0, dpr = 1, nodes = [], active = "all", mouse = { x: -999, y: -999, in: false }, hover = null, running = false, raf = 0;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let C = {};

  function build() {
    nodes = [];
    Object.entries(SKILLS).forEach(([cat, arr]) => {
      arr.forEach((name, i) => {
        const [cx, cy] = CENTERS[cat], a = (i / arr.length) * Math.PI * 2 + cat.length, r = 0.06 + (i % 3) * 0.045;
        const hx = cx + Math.cos(a) * r * (W / H > 1 ? H / W : 1) * 1.3, hy = cy + Math.sin(a) * r * 1.3;
        nodes.push({ name, cat, hx, hy, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, ph: Math.random() * 6.28, size: 0 });
      });
    });
    list.innerHTML = nodes.map((n) => `<li>${n.name} (${LABEL[n.cat]})</li>`).join("");
  }

  function resize() {
    const r = field.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    C = { sig: css("--signal"), ink: css("--ink"), dim: css("--ink-3"), line: css("--line") };
    if (!nodes.length) build();
  }

  function step(t) {
    ctx.clearRect(0, 0, W, H);
    const small = W < 700, fs = small ? 11 : 13, reduce = document.documentElement.classList.contains("reduced");
    hover = null;
    for (const n of nodes) {
      const on = active === "all" || active === n.cat;
      const tx = n.hx * W + (reduce ? 0 : Math.cos(t / 1800 + n.ph) * 10);
      const ty = n.hy * H + (reduce ? 0 : Math.sin(t / 1500 + n.ph) * 10);
      let fx = (tx - n.x) * 0.012, fy = (ty - n.y) * 0.012;
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
      if (mouse.in && d < 130) { const f = (1 - d / 130) * 3.2; fx += (dx / (d || 1)) * f; fy += (dy / (d || 1)) * f; }
      n.vx = (n.vx + fx) * 0.88; n.vy = (n.vy + fy) * 0.88; n.x += n.vx; n.y += n.vy;
      n.size += ((on ? 1 : 0.35) - n.size) * 0.1;
      if (mouse.in && d < 42 && on && (!hover || d < hover.d)) hover = { n, d };
    }
    // links within category
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (a.cat !== b.cat) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 190) continue;
      const lit = hover && (hover.n === a || hover.n === b);
      ctx.globalAlpha = (1 - d / 190) * Math.min(a.size, b.size) * (lit ? 1 : 0.5);
      ctx.strokeStyle = lit ? C.sig : C.dim;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.textBaseline = "middle"; ctx.font = `500 ${fs}px "JetBrains Mono", monospace`;
    for (const n of nodes) {
      const h = hover && hover.n === n, rel = hover && hover.n.cat === n.cat;
      ctx.globalAlpha = Math.max(0.12, n.size * (hover && !rel ? 0.35 : 1));
      const r = (h ? 7 : 4) ;
      ctx.fillStyle = h || active === n.cat || rel ? C.sig : C.ink;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      if (h) { ctx.strokeStyle = C.sig; ctx.beginPath(); ctx.arc(n.x, n.y, 16 + Math.sin(t / 200) * 2, 0, 6.283); ctx.stroke(); }
      ctx.fillStyle = h ? C.sig : C.ink;
      ctx.font = `${h ? 700 : 500} ${h ? fs + 3 : fs}px "JetBrains Mono", monospace`;
      ctx.fillText(n.name, n.x + 12, n.y);
    }
    ctx.globalAlpha = 1;
    tip.classList.toggle("is-on", !!hover);
    if (hover) tip.textContent = `${hover.n.name} — ${LABEL[hover.n.cat]}`;
    canvas.style.cursor = hover ? "pointer" : "default";
    if (running) raf = requestAnimationFrame(step);
  }

  function setMouse(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.in = true;
  }
  canvas.addEventListener("pointermove", setMouse);
  canvas.addEventListener("pointerdown", setMouse);
  canvas.addEventListener("pointerleave", () => { mouse.in = false; mouse.x = mouse.y = -999; });
  canvas.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") setTimeout(() => (mouse.in = false), 600); });

  document.getElementById("chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    active = b.dataset.cat;
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-on", c === b));
    // small kick so the field visibly reacts
    nodes.forEach((n) => { if (active === "all" || n.cat === active) { n.vx += (Math.random() - 0.5) * 8; n.vy += (Math.random() - 0.5) * 8; } });
  });

  new ResizeObserver(() => { resize(); }).observe(field);
  resize();
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (running) raf = requestAnimationFrame(step);
  }, { threshold: 0.05 }).observe(field);
})();
