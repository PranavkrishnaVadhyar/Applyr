const autofillPanel = document.getElementById("autofillPanel");
const resumeSelect = document.getElementById("resumeSelect");
const review = document.getElementById("answerReview");
const scanBtn = document.getElementById("scanBtn");
const applyBtn = document.getElementById("applyBtn");
let activeScan = null, reviewedAnswers = [], sessionVersion = 0, reviewVersion = 0, signedInForFill = false, scanning = false;
function clearReview() {
  reviewVersion++;
  activeScan = null; reviewedAnswers = []; review.replaceChildren(); applyBtn.disabled = true;
  const generate = document.getElementById("generateBtn"); if (generate) generate.disabled = true;
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
  if (scanning || !resumeSelect.value) return;
  if (typeof retainReviewedAnswers === "function") retainReviewedAnswers();
  scanning = true;
  clearReview(); scanBtn.disabled = true;
  scanBtn.textContent = "Finding answers…";
  if (typeof renderFlow === "function") renderFlow();
  const version = sessionVersion, revision = reviewVersion, resumeId = resumeSelect.value;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw new Error("Open an application form first.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["autofill-content.js"] });
    const scan = await chrome.tabs.sendMessage(tab.id, { action: "scanForm" });
    if (!scan?.fields?.length) throw new Error("No supported fields found. If this is a job listing, open its application form and scan again. Otherwise complete this page manually.");
    if (version !== sessionVersion || revision !== reviewVersion || resumeSelect.value !== resumeId) return;
    activeScan = { ...scan, tabId: tab.id };
    for (const field of scan.fields) {
      const card = document.createElement("section"); card.className = "answer-card";
      const label = document.createElement("strong"); label.textContent = field.label;
      card.append(label); review.append(card);
    }
    document.getElementById("generateBtn").disabled = false;
    const summary = document.getElementById("reviewSummary");
    if (summary) summary.textContent = `${scan.fields.length} questions found. Click Fill answers in extension to prepare editable answers.`;
    showStatus("Questions found. Choose whether to include AI drafts, then fill answers in the extension.");
  } catch (error) { showStatus(error.message, "error"); }
  finally { scanning = false; scanBtn.disabled = !resumeSelect.value; scanBtn.textContent = "Scan questions again"; if (typeof renderFlow === "function") renderFlow(); }
});
document.getElementById("generateBtn").addEventListener("click", async () => {
  if (!activeScan || scanning) return;
  if (typeof retainReviewedAnswers === "function") retainReviewedAnswers();
  const scan = activeScan, version = sessionVersion, revision = reviewVersion, resumeId = resumeSelect.value;
  scanning = true; document.getElementById("generateBtn").disabled = true; scanBtn.disabled = true; applyBtn.disabled = true;
  if (typeof renderFlow === "function") renderFlow();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== scan.tabId || tab.url !== scan.url) throw new Error("Page changed. Scan questions again.");
    const data = await request({ action: "resolveAutofill", resume_id: resumeId,
      fields: scan.fields, generate_drafts: document.getElementById("enableDrafts").checked });
    if (version !== sessionVersion || revision !== reviewVersion || resumeSelect.value !== resumeId) return;
    review.replaceChildren(); reviewedAnswers = [];
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
      if (answer.status !== "skipped") {
        const isChoice = ["select-one", "radio", "combobox"].includes(field.type);
        const input = document.createElement(isChoice ? "select" : "textarea");
        input.setAttribute("aria-label", "Answer for " + field.label);
        if (isChoice) { const blank = document.createElement("option"); blank.value = ""; blank.textContent = "Choose an answer"; input.append(blank); }
        if (isChoice) for (const text of field.options) {
          const option = document.createElement("option"); option.value = text; option.textContent = text; input.append(option);
        }
        input.value = saved ?? answer.value ?? "";
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
    if (typeof saveCurrentDraft === "function") await saveCurrentDraft();
    showStatus("Answers prepared and saved as drafts. Review them before filling the webpage.");
  } catch (error) { showStatus(error.message, "error"); }
  finally {
    scanning = false; scanBtn.disabled = !resumeSelect.value;
    document.getElementById("generateBtn").disabled = !activeScan;
    scanBtn.textContent = "Scan questions again";
    if (typeof renderFlow === "function") renderFlow();
    updateApply();
  }
});
function updateApply() {
  const count = reviewedAnswers.filter(item => item.select.checked && item.input.value.trim()).length;
  applyBtn.disabled = scanning || !activeScan || !count;
  applyBtn.textContent = count ? `Fill webpage (${count})` : "Fill webpage";
}
applyBtn.addEventListener("click", async () => {
  if (scanning) return;
  applyBtn.disabled = true;
  const revision = reviewVersion, version = sessionVersion, scan = activeScan;
  try {
    if (!scan) throw new Error("Scan the form again.");
    const answers = reviewedAnswers.filter(item => item.select.checked).map(item => ({ field_id: item.field_id, value: item.input.value }));
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (revision !== reviewVersion || version !== sessionVersion) return;
    if (tab?.id !== scan.tabId || tab.url !== scan.url) throw new Error("Page changed. Scan the form again.");
    if (typeof saveCurrentDraft === "function") await saveCurrentDraft();
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (revision !== reviewVersion || version !== sessionVersion || currentTab?.id !== scan.tabId || currentTab.url !== scan.url) throw new Error("Page changed. Scan questions again.");
    const result = await chrome.tabs.sendMessage(tab.id, { action: "applyAnswers", scan_id: scan.scan_id, answers });
    if (revision !== reviewVersion || version !== sessionVersion) return;
    if (!result || result.error) throw new Error(result?.error || "Page unavailable. Scan again.");
    if (typeof retainReviewedAnswers === "function") retainReviewedAnswers();
    clearReview();
    if (typeof updateWorkspace === "function") updateWorkspace();
    showStatus(`Filled ${result.filled}; skipped ${result.skipped}. Review the page before submitting.`, "success");
    document.dispatchEvent(new CustomEvent("applyrFilled", { detail: result }));
  } catch (error) { showStatus(error.message, "error"); updateApply(); }
});
