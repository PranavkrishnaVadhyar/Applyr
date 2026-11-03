const autofillPanel = document.getElementById("autofillPanel");
const resumeSelect = document.getElementById("resumeSelect");
const review = document.getElementById("answerReview");
const scanBtn = document.getElementById("scanBtn");
const applyBtn = document.getElementById("applyBtn");
let activeScan = null, reviewedAnswers = [], sessionVersion = 0, reviewVersion = 0, signedInForFill = false;
function clearReview() {
  reviewVersion++;
  activeScan = null; reviewedAnswers = []; review.replaceChildren(); applyBtn.disabled = true;
}
async function loadResumes() {
  const version = sessionVersion;
  clearReview(); resumeSelect.replaceChildren(); scanBtn.disabled = true;
  const resumes = await request({ action: "listResumes" });
  if (version !== sessionVersion || !signedInForFill) return;
  for (const resume of resumes) {
    const option = document.createElement("option");
    option.value = resume.id; option.textContent = resume.filename; resumeSelect.append(option);
  }
  scanBtn.disabled = !resumes.length;
  document.dispatchEvent(new CustomEvent("applyrResumesLoaded"));
  if (!resumes.length) showStatus("Upload a resume in Applyr first.");
}
document.addEventListener("applyrSession", event => {
  const signedIn = event.detail.signedIn;
  autofillPanel.classList.toggle("hidden", !signedIn);
  if (signedIn !== signedInForFill) {
    sessionVersion++; signedInForFill = signedIn; clearReview();
    if (signedIn) loadResumes().catch(error => showStatus(error.message, "error"));
    else resumeSelect.replaceChildren();
  }
});
document.getElementById("reloadResumes").addEventListener("click", () => loadResumes().catch(error => showStatus(error.message, "error")));
resumeSelect.addEventListener("change", clearReview);
scanBtn.addEventListener("click", async () => {
  clearReview(); scanBtn.disabled = true;
  const version = sessionVersion, revision = reviewVersion, resumeId = resumeSelect.value;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw new Error("Open an application form first.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["autofill-content.js"] });
    const scan = await chrome.tabs.sendMessage(tab.id, { action: "scanForm" });
    if (!scan?.fields?.length) throw new Error("No supported labelled fields found. Fill this form manually.");
    showStatus("Finding answers…");
    const data = await request({ action: "resolveAutofill", resume_id: resumeId,
      fields: scan.fields, generate_drafts: document.getElementById("enableDrafts").checked });
    if (version !== sessionVersion || revision !== reviewVersion || resumeSelect.value !== resumeId) return;
    activeScan = { ...scan, tabId: tab.id };
    for (const answer of data.results) {
      const field = scan.fields.find(item => item.id === answer.field_id);
      if (!field) continue;
      const card = document.createElement("section"); card.className = "answer-card";
      const heading = document.createElement("strong"); heading.textContent = field.label;
      const reason = document.createElement("p"); reason.textContent = answer.reason;
      card.append(heading, reason);
      const uniqueLabel = scan.fields.filter(item => item.label === field.label && item.type === field.type).length === 1;
      const pending = uniqueLabel && typeof unsavedAnswerFor === "function" ? unsavedAnswerFor(field, scan.url) : null;
      const saved = pending ?? (uniqueLabel && typeof savedAnswerFor === "function" ? savedAnswerFor(field, scan.url) : null);
      if (answer.value != null || saved != null) {
        const isChoice = ["select-one", "radio", "combobox"].includes(field.type);
        const input = document.createElement(isChoice ? "select" : "textarea");
        input.setAttribute("aria-label", "Answer for " + field.label);
        if (isChoice) for (const text of field.options) {
          const option = document.createElement("option"); option.value = text; option.textContent = text; input.append(option);
        }
        input.value = saved ?? answer.value;
        if (saved != null) reason.textContent = pending != null ? "Recovered session edit. Review it before filling." : "Restored saved answer. Review it again before filling.";
        const select = document.createElement("input"); select.type = "checkbox";
        const label = document.createElement("label"); label.append(select, document.createTextNode(" I reviewed this answer"));
        // Editing invalidates the prior review confirmation.
        input.addEventListener("input", () => { select.checked = false; updateApply(); document.dispatchEvent(new CustomEvent("applyrAnswersChanged")); });
        select.addEventListener("change", () => { updateApply(); document.dispatchEvent(new CustomEvent("applyrAnswersChanged")); });
        card.append(input, label);
        reviewedAnswers.push({ field_id: answer.field_id, label: field.label, field_type: field.type, input, select });
      }
      const evidenceDetails = document.createElement("details");
      const evidenceSummary = document.createElement("summary"); evidenceSummary.textContent = "See resume source";
      evidenceDetails.append(evidenceSummary);
      for (const evidence of answer.evidence) {
        const source = document.createElement("p"); source.className = "answer-source";
        const [section, index] = evidence.id.split(":");
        const name = section === "contact" ? "Contact details" : section.charAt(0).toUpperCase() + section.slice(1);
        source.textContent = `Resume → ${name}${index && /^\d+$/.test(index) ? ` → Item ${Number(index) + 1}` : ""}\n${evidence.text}`; evidenceDetails.append(source);
      }
      if (answer.evidence.length) card.append(evidenceDetails);
      const badge = document.createElement("p"); badge.className = "answer-kind";
      badge.textContent = saved != null ? "Your saved edit" : answer.status === "draft" ? "AI draft" : answer.status === "skipped" ? "Existing answer preserved" : answer.value != null ? "Resume fact" : "Needs your answer";
      card.append(badge);
      review.append(card);
    }
    const summary = document.getElementById("reviewSummary");
    if (summary) summary.textContent = `${data.results.filter(item => item.value != null).length} suggestions · ${data.results.filter(item => item.status === "unresolved").length} need your answer · ${data.results.filter(item => item.status === "skipped").length} existing answers preserved`;
    showStatus("Review the suggestions and their resume evidence.");
  } catch (error) { showStatus(error.message, "error"); }
  finally { scanBtn.disabled = !resumeSelect.value; }
});
function updateApply() {
  const count = reviewedAnswers.filter(item => item.select.checked && item.input.value.trim()).length;
  applyBtn.disabled = !activeScan || !count;
  applyBtn.textContent = count ? `Fill reviewed answers (${count})` : "Fill reviewed answers";
}
applyBtn.addEventListener("click", async () => {
  applyBtn.disabled = true;
  const revision = reviewVersion, version = sessionVersion, scan = activeScan;
  try {
    if (!scan) throw new Error("Scan the form again.");
    const answers = reviewedAnswers.filter(item => item.select.checked).map(item => ({ field_id: item.field_id, value: item.input.value }));
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (revision !== reviewVersion || version !== sessionVersion) return;
    if (tab?.id !== scan.tabId || tab.url !== scan.url) throw new Error("Page changed. Scan the form again.");
    const result = await chrome.tabs.sendMessage(tab.id, { action: "applyAnswers", scan_id: scan.scan_id, answers });
    if (revision !== reviewVersion || version !== sessionVersion) return;
    if (!result || result.error) throw new Error(result?.error || "Page unavailable. Scan again.");
    if (typeof retainReviewedAnswers === "function") retainReviewedAnswers();
    clearReview();
    showStatus(`Filled ${result.filled}; skipped ${result.skipped}. Review the page before submitting.`, "success");
  } catch (error) { clearReview(); showStatus(error.message, "error"); }
});
