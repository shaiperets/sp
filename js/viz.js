/* Per-role illustrations — generated SVG that reflects what each role was about. */
(function () {
  const svg = (inner) =>
    `<svg viewBox="0 0 400 260" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  const T = (x, y, s, a = "middle") => `<text class="viz-txt" x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;

  const V = {
    // Odoro — tiered support funnel
    tiers() {
      return svg(`
        <g transform="translate(200 140)">
          <circle class="viz-line" r="110"/><circle class="viz-line" r="74"/><circle class="viz-line" r="38"/>
          <circle class="viz-sig viz-flow" r="110"/><circle class="viz-sig viz-flow" r="74" style="animation-direction:reverse"/>
          <circle class="viz-fill viz-pulse" r="9"/>
          <circle class="viz-node viz-pulse" cx="0" cy="-110" r="5" style="animation-delay:.2s"/>
          <circle class="viz-node viz-pulse" cx="74" cy="0" r="5" style="animation-delay:.8s"/>
          <circle class="viz-node viz-pulse" cx="-38" cy="0" r="5" style="animation-delay:1.4s"/>
        </g>
        ${T(200, 24, "tier 3 · escalation")}${T(200, 252, "tier 1 → 2 → 3")}
      `);
    },
    // Pitney Bowes — load / stress curves
    load() {
      let bars = "";
      for (let i = 0; i < 18; i++) {
        const h = 30 + Math.abs(Math.sin(i * 0.7) * 90) + i * 4;
        bars += `<rect class="viz-bar" x="${52 + i * 17}" y="${220 - h}" width="9" height="${h}" fill="oklch(0.9 0.21 128 / 0.8)" style="animation-delay:${(i * 0.12).toFixed(2)}s;animation-duration:${2 + (i % 4) * 0.4}s"/>`;
      }
      return svg(`
        <line class="viz-line" x1="40" y1="220" x2="370" y2="220"/><line class="viz-line" x1="40" y1="40" x2="40" y2="220"/>
        <line class="viz-line viz-flow" x1="40" y1="90" x2="370" y2="90" style="stroke:var(--amber)"/>
        ${bars}${T(44, 30, "req / s", "start")}${T(370, 84, "threshold", "end")}
      `);
    },
    // Matomy — data pipeline
    data() {
      const n = [["Airflow", 50], ["Flink", 140], ["Presto", 230], ["Hive", 320]];
      return svg(`
        <path class="viz-sig viz-flow" d="M60 130 H340"/>
        ${n.map(([l, x], i) => `<g><rect class="viz-node viz-pulse" x="${x - 28}" y="${i % 2 ? 150 : 90}" width="56" height="40" rx="4" style="animation-delay:${i * 0.4}s"/>${T(x, (i % 2 ? 150 : 90) + 24, l)}</g>
        <path class="viz-line" d="M${x} ${i % 2 ? 150 : 130}V130"/>`).join("")}
        ${T(200, 235, "high-volume ad-tech data flows")}
        <circle r="4" class="viz-fill"><animateMotion dur="4s" repeatCount="indefinite" path="M60 130 H340"/></circle>
      `);
    },
    // Radware — high availability, mirrored
    ha() {
      return svg(`
        <rect class="viz-node" x="40" y="60" width="110" height="140" rx="6"/><rect class="viz-node" x="250" y="60" width="110" height="140" rx="6"/>
        ${[0, 1, 2, 3].map((i) => `<rect class="viz-line" x="54" y="${74 + i * 30}" width="82" height="20" rx="3"/><circle class="viz-fill viz-pulse" cx="124" cy="${84 + i * 30}" r="3" style="animation-delay:${i * 0.3}s"/>
        <rect class="viz-line" x="264" y="${74 + i * 30}" width="82" height="20" rx="3"/><circle class="viz-fill viz-pulse" cx="334" cy="${84 + i * 30}" r="3" style="animation-delay:${i * 0.3 + 0.15}s"/>`).join("")}
        <path class="viz-sig viz-beat" d="M150 130 H175 L185 100 L200 165 L212 120 L222 130 H250"/>
        ${T(95, 225, "az-a")}${T(305, 225, "az-b")}${T(200, 40, "high availability")}
      `);
    },
    // Palo Alto — k8s cluster grid
    k8s() {
      let pods = "";
      for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
        const x = 62 + c * 38, y = 54 + r * 34, d = ((r * 8 + c) * 0.13) % 2.4;
        pods += `<rect class="${(r + c) % 5 === 0 ? "viz-fill" : "viz-node"} viz-pulse" x="${x}" y="${y}" width="24" height="20" rx="3" style="animation-delay:${d.toFixed(2)}s"/>`;
      }
      return svg(`${pods}${T(200, 24, "terraform · terragrunt → eks / gke")}${T(200, 240, "r&d + production clusters")}`);
    },
    // Perimeter 81 — GitOps reconciliation loop
    gitops() {
      const p = [[200, 50, "git"], [320, 190, "ci"], [80, 190, "cluster"]];
      return svg(`
        <path id="gl" class="viz-sig viz-flow" d="M200 50 L320 190 L80 190 Z"/>
        ${p.map(([x, y, l]) => `<circle class="viz-node viz-pulse" cx="${x}" cy="${y}" r="18"/>${T(x, y + 32, l)}`).join("")}
        <circle r="5" class="viz-fill"><animateMotion dur="5s" repeatCount="indefinite" path="M200 50 L320 190 L80 190 Z"/></circle>
        ${T(200, 135, "desired = actual")}
      `);
    },
    // Check Point — a lead and a team of 11
    team() {
      let nodes = "", lines = "";
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 - Math.PI / 2, x = 200 + Math.cos(a) * 96, y = 130 + Math.sin(a) * 96;
        lines += `<line class="viz-line viz-flow" x1="200" y1="130" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:oklch(0.9 0.21 128 / .35)"/>`;
        nodes += `<circle class="viz-node viz-pulse" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" style="animation-delay:${(i * 0.21).toFixed(2)}s"/>`;
      }
      return svg(`<g class="viz-spin">${lines}${nodes}</g>
        <circle class="viz-fill" cx="200" cy="130" r="16"/><circle class="viz-sig viz-pulse" cx="200" cy="130" r="28"/>${T(200, 134, "").trim()}
        <text class="viz-txt" x="200" y="134" text-anchor="middle" style="fill:var(--bg);font-weight:700">LEAD</text>
        ${T(200, 252, "11 engineers · one platform")}`);
    },
  };

  window.renderViz = function () {
    document.querySelectorAll(".card[data-viz]").forEach((c) => {
      const f = V[c.dataset.viz];
      if (f) c.querySelector(".card__viz").innerHTML = f();
    });
  };
})();
