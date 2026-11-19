// Visitor insights on top of Umami (cookieless, no personal data).
//
// 1. Visit source: every visit gets one "visit-source" event and a session
//    property `source`, so each visit in Umami is marked as one of:
//      linkedin  - came from LinkedIn (referrer linkedin.com / lnkd.in, or ?utm_source=linkedin)
//      cv-pdf    - came from the link in the PDF CV (?r=cv-pdf, or any per-application ?r=<code>)
//      ai-search - ChatGPT, Perplexity, Gemini, Copilot, Claude
//      search    - Google, Bing, DuckDuckGo and other search engines
//      referral  - any other site
//      direct    - typed in, bookmarked, or the referrer was hidden
// 2. Per-application links: https://peretz.icu/?r=<code> (e.g. ?r=acme-devops) also
//    tags the session with `application` and sends a "cv-visit" event.
// 3. Reading depth: a "section-view" event fires once per section per visit.
//
// Umami loads with `defer` after this file, so calls are queued until it is ready.
(function () {
  const clean = (v) => (v || "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 60);
  const params = new URLSearchParams(location.search);
  const r = clean(params.get("r"));
  const utmSource = clean(params.get("utm_source"));
  const special = r === "linkedin" || r === "cv-pdf";
  const ref = (!special && r) || clean(params.get("utm_campaign"));

  let refHost = "";
  try { refHost = new URL(document.referrer).hostname.replace(/^www\./, ""); } catch {}
  if (refHost === location.hostname.replace(/^www\./, "")) refHost = "";

  const source =
    utmSource === "linkedin" || r === "linkedin" || /(^|\.)linkedin\.com$|^lnkd\.in$/.test(refHost) ? "linkedin"
    : r === "cv-pdf" || /^cv/.test(utmSource) || (r && !special) ? "cv-pdf"
    : /(chatgpt|openai|perplexity|gemini|copilot|claude)\./.test(refHost) ? "ai-search"
    : /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia|baidu|brave)\./.test(refHost) ? "search"
    : refHost ? "referral"
    : "direct";

  const queue = [];
  const flush = () => { while (queue.length) queue.shift()(window.umami); };
  const whenReady = (fn) => { queue.push(fn); if (window.umami) flush(); };
  let tries = 0;
  const poll = setInterval(() => {
    if (window.umami) { clearInterval(poll); flush(); }
    else if (++tries > 40) clearInterval(poll); // give up after ~10 s (blocked or offline)
  }, 250);

  // Once per browser tab, so a reload doesn't count the same visit twice.
  let first = true;
  try { first = !sessionStorage.getItem("visit-source"); sessionStorage.setItem("visit-source", source); } catch {}
  const tag = ref ? { source, application: ref } : { source };
  whenReady((u) => {
    if (u.identify) u.identify(tag);
    if (!first) return;
    u.track("visit-source", { ...tag, referrer: refHost || "none" });
    if (ref) u.track("cv-visit", tag);
  });

  if (!("IntersectionObserver" in window)) return;
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = e.target.id;
      if (!e.isIntersecting || seen.has(id)) return;
      seen.add(id);
      io.unobserve(e.target);
      const data = { section: id, ...tag };
      whenReady((u) => u.track("section-view", data));
    });
  }, { rootMargin: "-45% 0px -45% 0px" }); // counts once the section crosses the middle of the screen
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
})();
