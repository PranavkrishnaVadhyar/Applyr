if (!globalThis.applyrSubmissionInstalled) {
  globalThis.applyrSubmissionInstalled = true;
  let watch = null, baseline = new Set(), sending = false;
  let lastUserAction = 0;
  document.addEventListener("click", event => {
    if (event.isTrusted && event.target.closest?.('button[type="submit"], input[type="submit"], button:not([type])')) lastUserAction = Date.now();
  }, true);
  document.addEventListener("keydown", event => {
    if (event.isTrusted && event.key === "Enter") lastUserAction = Date.now();
  }, true);
  function evidence() {
    return Array.from(document.querySelectorAll('h1, h2, [role="status"], [role="alert"], .application-confirmation'))
      .filter(element => element.getClientRects().length && getComputedStyle(element).visibility === "visible")
      .map(element => element.textContent.trim().slice(0, 500))
      .filter(text => /^your application (?:has been |was )?(?:successfully )?(?:submitted|received)(?:[.!\s]|$)/i.test(text)
        && !/\b(not|failed|error|unable)\b/i.test(text));
  }
  async function check() {
    if (!watch?.attemptedAt || Date.now() - watch.attemptedAt > 300000 || sending) return;
    const text = evidence().find(text => !baseline.has(text));
    if (!text) return;
    sending = true;
    try {
      const response = await chrome.runtime.sendMessage({ action: "submissionSuccess", token: watch.token, evidence: text });
      if (response?.data?.recorded) watch = null;
    } finally { sending = false; }
  }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id || message.action !== "armSubmissionDetector") return;
    watch = { token: message.token, attemptedAt: message.attemptedAt };
    baseline = message.attemptedAt ? new Set() : new Set(evidence());
    check().catch(() => {}); reply({ armed: true });
  });
  document.addEventListener("submit", async event => {
    if (!watch || !event.isTrusted || !lastUserAction || Date.now() - lastUserAction > 3000) return;
    lastUserAction = 0;
    baseline = new Set(evidence());
    const token = watch.token;
    const response = await chrome.runtime.sendMessage({ action: "submissionAttempt", token }).catch(() => null);
    if (watch?.token === token && response?.data?.accepted) { watch.attemptedAt = Date.now(); check().catch(() => {}); }
  }, true);
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; check().catch(() => {}); }, 300);
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "style"] });
}
