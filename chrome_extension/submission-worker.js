// Only an explicit popup action can associate a tab with an owned saved draft.
const SUCCESS_PATTERN = /^your application (?:has been |was )?(?:successfully )?(?:submitted|received)(?:[.!\s]|$)/i;
async function injectSubmissionWatch(tabId, watch) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["submission-content.js"] });
  await chrome.tabs.sendMessage(tabId, { action: "armSubmissionDetector", token: watch.token, attemptedAt: watch.attemptedAt || 0 });
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id) return;
  const popup = sender.url?.startsWith(chrome.runtime.getURL("popup/"));
  if (!((popup && ["watchSubmission", "stopSubmissionWatch", "submissionWatchState"].includes(message.action))
    || (!popup && ["submissionAttempt", "submissionSuccess"].includes(message.action)))) return;
  (async () => {
    if (popup && message.action === "stopSubmissionWatch") {
      await chrome.storage.session.remove("submissionWatch"); return { message: "Detection stopped" };
    }
    if (popup && message.action === "submissionWatchState") {
      const { submissionWatch: watch } = await chrome.storage.session.get("submissionWatch");
      return { message: watch?.expiresAt > Date.now() ? watch.message || "Watching for a submission confirmation" : "Detection is off" };
    }
    if (popup && message.action === "watchSubmission") {
      if (!/^[0-9a-f-]{36}$/i.test(message.application_id || "")) throw new Error("Invalid application");
      const app = await authorizedRequest("/api/applications/" + message.application_id, undefined, "GET");
      if (app.status !== "draft" || !app.resume_id) throw new Error("Save a draft with a resume first");
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !/^https?:/.test(tab.url || "")) throw new Error("Open the application form first");
      const watch = { tabId: tab.id, origin: new URL(tab.url).origin, applicationId: app.id,
        token: crypto.randomUUID(), expiresAt: Date.now() + 30 * 60 * 1000, attemptedAt: 0,
        message: `Watching ${app.company_name} — ${app.job_role}. Submit the form yourself.` };
      await chrome.storage.session.set({ submissionWatch: watch });
      try { await injectSubmissionWatch(tab.id, watch); }
      catch (error) { await chrome.storage.session.remove("submissionWatch"); throw error; }
      return { message: watch.message };
    }
    const { submissionWatch: watch } = await chrome.storage.session.get("submissionWatch");
    if (!watch || watch.expiresAt <= Date.now() || sender.tab?.id !== watch.tabId || sender.frameId !== 0
      || new URL(sender.url).origin !== watch.origin || message.token !== watch.token) return { ignored: true };
    if (message.action === "submissionAttempt") {
      watch.attemptedAt = Date.now();
      watch.message = "Submission attempted; waiting for explicit success text.";
      await chrome.storage.session.set({ submissionWatch: watch }); return { accepted: true };
    }
    if (!watch.attemptedAt || Date.now() - watch.attemptedAt > 5 * 60 * 1000
      || typeof message.evidence !== "string" || message.evidence.length > 500 || !SUCCESS_PATTERN.test(message.evidence)
      || /\b(not|failed|error|unable)\b/i.test(message.evidence)) return { ignored: true };
    const { session } = await chrome.storage.session.get("session");
    if (!session) return { ignored: true };
    await authorizedRequest("/api/applications/" + watch.applicationId + "/confirm-submission", {}, "POST", session.refresh_token);
    const current = (await chrome.storage.session.get("submissionWatch")).submissionWatch;
    if (current?.token === watch.token) {
      watch.attemptedAt = 0; watch.message = "Application recorded as applied after a success message. Refresh saved applications.";
      await chrome.storage.session.set({ submissionWatch: watch });
    }
    return { recorded: true };
  })().then(data => reply({ data }), error => reply({ error: error.message }));
  return true;
});
chrome.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  if (change.status !== "complete") return;
  const { submissionWatch: watch } = await chrome.storage.session.get("submissionWatch");
  if (!watch || watch.tabId !== tabId || watch.expiresAt <= Date.now()) return;
  if (!tab.url || new URL(tab.url).origin !== watch.origin) {
    await chrome.storage.session.remove("submissionWatch"); return;
  }
  try { await injectSubmissionWatch(tabId, watch); }
  catch (_) { /* No host access after navigation: leave manual confirmation available. */ }
});
chrome.tabs.onRemoved.addListener(async tabId => {
  const { submissionWatch: watch } = await chrome.storage.session.get("submissionWatch");
  if (watch?.tabId === tabId) await chrome.storage.session.remove("submissionWatch");
});
