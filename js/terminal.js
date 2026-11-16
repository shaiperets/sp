/* A tiny interactive terminal — every answer comes from the CV. */
(function () {
  const body = document.getElementById("termBody");
  const input = document.getElementById("termInput");
  if (!body || !input) return;

  const OUT = {
    help: "commands:\n  whoami     who I am\n  now        what I'm doing today\n  exp        career, newest first\n  skills     the toolbox\n  certs      certifications & education\n  contact    how to reach me\n  clear      clean the screen",
    whoami: "Shai Peretz — DevOps Manager | Platform Engineering & Cloud Architecture\n10+ yrs platform engineering, 5+ yrs leading teams. Tel Aviv.",
    now: "Check Point Software Technologies (2023 – present)\n› leading 11 engineers: CI/CD, cloud platforms, custom apps\n› AI tooling adoption + MCP servers for R&D productivity\n› primary technical focal point for the R&D org",
    exp: "2023–now   DevOps Manager ........ Check Point\n2021–2023  DevOps Team Lead ...... Perimeter 81\n2020–2021  Sr DevOps Engineer .... Palo Alto Networks\n2017–2020  Sr DevOps Engineer .... Radware\n2015–2017  Java Software Eng. .... Matomy\n2012–2015  Software Eng. – Auto .. Pitney Bowes\n2009–2012  Tier 3 Support TL ..... Odoro Inc.",
    skills: "cloud    AWS GCP Kubernetes Docker Terraform Terragrunt Helm Lambda EKS GKE\ncicd     GitHub Actions · TeamCity · Jenkins · Ansible · GitOps · Bash\nlang     Python Bash Java JavaScript/Node.js C#\ndata     Airflow Flink Presto Hive SageMaker Redshift MongoDB MySQL SQL",
    certs: "AWS Certified Solutions Architect ........ Sep 2021\nAWS Certified Cloud Developer ............ Dec 2022\nMCSD, Computer Programming — Sela College  2014–2016\nEng. Degree, Civil Engineering — Tel-Hai   2004–2008",
    contact: "linkedin  linkedin.com/in/shai-peretz\ngithub    github.com/shaiperets\n› the fastest way to reach me is a LinkedIn message",
  };
  OUT.ls = OUT.help; OUT["?"] = OUT.help; OUT.experience = OUT.exp; OUT.stack = OUT.skills;

  const hist = []; let hi = 0;
  const add = (cls, txt) => { const p = document.createElement("p"); if (cls) p.className = cls; p.textContent = txt; body.appendChild(p); body.scrollTop = body.scrollHeight; };
  const typeOut = (txt) => {
    const p = document.createElement("p"); body.appendChild(p);
    if (document.documentElement.classList.contains("reduced")) { p.textContent = txt; return; }
    let i = 0; (function tick() { p.textContent = txt.slice(0, (i += 6)); body.scrollTop = body.scrollHeight; if (i < txt.length) requestAnimationFrame(tick); else p.textContent = txt; })();
  };

  add("ok", "shai@platform ready. type 'help'.");

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi] || ""; return; }
    if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; return; }
    if (e.key !== "Enter") return;
    const v = input.value.trim(); input.value = ""; if (!v) return;
    hist.push(v); hi = hist.length;
    add("cmd", v);
    const k = v.toLowerCase();
    if (k === "clear") { body.innerHTML = ""; return; }
    typeOut(OUT[k] || `command not found: ${v}. try 'help'`);
  });
  window.termFocusHint = () => input.focus({ preventScroll: true });
})();
