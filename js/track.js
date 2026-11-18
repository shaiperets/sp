// Visitor insights on top of Umami (cookieless, no personal data).
//
// 1. Per-application links: a CV or application links to https://peretz.icu/?r=<code>
//    (e.g. ?r=acme-cv). The code is attached to the whole Umami session, and a
//    "cv-visit" event is sent, so every later event from that visit can be
//    filtered by which application it came from.
// 2. Reading depth: a "section-view" event fires once per section per visit,
//    so you can see whether a visitor reached Experience, FAQ or Contact.
//
// Umami loads with `defer` after this file, so calls are queued until it is ready.
(function () {
  const params = new URLSearchParams(location.search);
  const raw = params.get("r") || params.get("utm_campaign") || "";
  const ref = raw.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 60);
  const source = params.get("utm_source") || (params.get("r") ? "cv" : "");

  const queue = [];
  const flush = () => { while (queue.length) queue.shift()(window.umami); };
  const whenReady = (fn) => { queue.push(fn); if (window.umami) flush(); };
  let tries = 0;
  const poll = setInterval(() => {
    if (window.umami) { clearInterval(poll); flush(); }
    else if (++tries > 40) clearInterval(poll); // give up after ~10 s (blocked or offline)
  }, 250);

  if (ref) {
    whenReady((u) => {
      if (u.identify) u.identify({ application: ref, source: source || "link" });
      u.track("cv-visit", { application: ref, source: source || "link" });
    });
  }

  if (!("IntersectionObserver" in window)) return;
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = e.target.id;
      if (!e.isIntersecting || seen.has(id)) return;
      seen.add(id);
      io.unobserve(e.target);
      const data = ref ? { section: id, application: ref } : { section: id };
      whenReady((u) => u.track("section-view", data));
    });
  }, { rootMargin: "-45% 0px -45% 0px" }); // counts once the section crosses the middle of the screen
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
})();
