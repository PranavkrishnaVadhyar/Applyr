const savedApplication = document.getElementById("savedApplication");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const confirmSubmissionBtn = document.getElementById("confirmSubmissionBtn");
const draftState = document.getElementById("draftState");
const draftInputs = ["draftRole", "draftCompany", "draftUrl", "draftDescription"].map(id => document.getElementById(id));
let savedApplications = [], trackingId = crypto.randomUUID(), retainedAnswers = [], trackingStatus = "draft";
let trackingSignedIn = false, trackingGeneration = 0, trackingSaved = false, trackingBusy = false;
let selectedResumeId = null;
const answerKey = answer => JSON.stringify([answer.page_url, answer.label, answer.field_type]);
function savedAnswerFor(field, url) {
  return retainedAnswers.find(answer => answerKey(answer) === answerKey({ page_url: url, label: field.label, field_type: field.type }))?.value;
}
function retainReviewedAnswers() {
  if (!activeScan) return;
  const previous = JSON.stringify(retainedAnswers);
  // Visible unchecked/edited suggestions are excluded from this saved snapshot.
  // Answers from other pages remain available for multi-step applications.
  const currentKeys = new Set(reviewedAnswers.map(item => answerKey({ label: item.label, field_type: item.field_type, page_url: activeScan.url })));
  retainedAnswers = retainedAnswers.filter(answer => !currentKeys.has(answerKey(answer)));
  for (const item of reviewedAnswers.filter(item => item.select.checked && item.input.value.trim())) {
    if (reviewedAnswers.filter(other => other.label === item.label && other.field_type === item.field_type).length !== 1) continue;
    const answer = { label: item.label, field_type: item.field_type, value: item.input.value, page_url: activeScan.url };
    retainedAnswers = retainedAnswers.filter(old => answerKey(old) !== answerKey(answer));
    retainedAnswers.push(answer);
  }
  if (JSON.stringify(retainedAnswers) !== previous) {
    trackingSaved = false; confirmSubmissionBtn.disabled = true;
    draftState.textContent = `${retainedAnswers.length} reviewed answers in memory. Save draft to keep them.`;
  }
}
function trackingControls() {
  saveDraftBtn.disabled = trackingBusy || trackingStatus !== "draft";
  confirmSubmissionBtn.disabled = trackingBusy || !trackingSaved || trackingStatus !== "draft";
  savedApplication.disabled = trackingBusy;
  for (const input of draftInputs) input.disabled = trackingBusy || trackingStatus !== "draft";
  document.getElementById("resumeSelect").disabled = trackingBusy;
  document.getElementById("scanBtn").disabled = trackingBusy || !document.getElementById("resumeSelect").value;
  document.getElementById("extractBtn").disabled = trackingBusy;
  if (typeof reviewedAnswers !== "undefined") for (const item of reviewedAnswers) {
    item.input.disabled = trackingBusy; item.select.disabled = trackingBusy;
  }
}
function selectApplication(application) {
  trackingGeneration++;
  trackingId = application?.id || crypto.randomUUID();
  trackingStatus = application?.status || "draft";
  trackingSaved = !!application?.resume_id;
  selectedResumeId = application?.resume_id || null;
  retainedAnswers = application?.response?.version === 1 ? application.response.answers || [] : [];
  const values = [application?.job_role, application?.company_name, application?.response?.job_url, application?.job_description];
  draftInputs.forEach((input, i) => { input.value = values[i] || ""; });
  if (typeof clearReview === "function") clearReview();
  const resume = document.getElementById("resumeSelect");
  if (application?.resume_id) resume.value = application.resume_id;
  draftState.textContent = application ? `${trackingStatus}: ${retainedAnswers.length} saved reviewed answers` : "New draft";
  trackingControls();
}
async function refreshApplications(selectId = savedApplication.value) {
  const generation = trackingGeneration;
  const applications = await request({ action: "listApplications" });
  if (!trackingSignedIn || generation !== trackingGeneration) return;
  savedApplications = applications;
  savedApplication.replaceChildren();
  const blank = document.createElement("option"); blank.value = ""; blank.textContent = "New application"; savedApplication.append(blank);
  for (const app of applications) {
    const option = document.createElement("option"); option.value = app.id;
    option.textContent = `${app.company_name} — ${app.job_role} (${app.status})`; savedApplication.append(option);
  }
  savedApplication.value = selectId;
}
document.addEventListener("applyrSession", event => {
  if (trackingSignedIn === event.detail.signedIn) return;
  trackingSignedIn = event.detail.signedIn; selectApplication(null);
  if (trackingSignedIn) refreshApplications().catch(error => showStatus(error.message, "error"));
  else { savedApplications = []; savedApplication.replaceChildren(); }
});
document.addEventListener("applyrResumesLoaded", () => {
  if (selectedResumeId) document.getElementById("resumeSelect").value = selectedResumeId;
  trackingControls();
});
document.addEventListener("applyrAnswersChanged", () => { trackingSaved = false; trackingControls(); });
document.addEventListener("applyrSavedJob", async event => {
  selectApplication(event.detail);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (trackingId === event.detail.id) draftInputs[2].value = tab?.url || "";
  refreshApplications(event.detail.id).catch(error => showStatus(error.message, "error"));
});
savedApplication.addEventListener("change", () => selectApplication(savedApplications.find(app => app.id === savedApplication.value)));
document.getElementById("refreshApplications").addEventListener("click", () => refreshApplications().catch(error => showStatus(error.message, "error")));
for (const input of draftInputs) input.addEventListener("input", () => { trackingSaved = false; trackingControls(); });
document.getElementById("resumeSelect").addEventListener("change", () => {
  selectedResumeId = document.getElementById("resumeSelect").value;
  retainedAnswers = []; trackingSaved = false; trackingControls();
  draftState.textContent = "Resume changed. Review new answers and save the draft.";
});
saveDraftBtn.addEventListener("click", async () => {
  if (trackingBusy || trackingStatus !== "draft") return;
  retainReviewedAnswers();
  const generation = trackingGeneration;
  trackingBusy = true; trackingControls();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (generation !== trackingGeneration || !trackingSignedIn) return;
    if (!draftInputs[2].value) draftInputs[2].value = tab?.url || "";
    const draft = { resume_id: document.getElementById("resumeSelect").value,
      job_role: draftInputs[0].value.trim(), company_name: draftInputs[1].value.trim(),
      job_url: draftInputs[2].value, job_description: draftInputs[3].value, answers: retainedAnswers };
    if (!draft.resume_id || !draft.job_role || !draft.company_name) throw new Error("Select a resume and enter the job role and company.");
    const app = await request({ action: "saveApplicationDraft", application_id: trackingId, draft });
    if (generation !== trackingGeneration) return;
    selectedResumeId = draft.resume_id;
    trackingSaved = true;
    draftState.textContent = `Draft saved with ${app.response.answers.length} reviewed answers. Reopen it from the saved application list.`;
    await refreshApplications(app.id);
  } catch (error) { showStatus(error.message, "error"); }
  finally { trackingBusy = false; trackingControls(); }
});
confirmSubmissionBtn.addEventListener("click", async () => {
  if (trackingBusy || !trackingSaved || trackingStatus !== "draft") return;
  trackingBusy = true; trackingControls();
  const generation = trackingGeneration;
  try {
    const app = await request({ action: "confirmSubmission", application_id: trackingId });
    if (generation !== trackingGeneration) return;
    trackingStatus = app.status;
    draftState.textContent = `Submission recorded: ${app.applied_at ? new Date(app.applied_at).toLocaleString() : app.status}`;
    await refreshApplications(app.id);
  } catch (error) { showStatus(error.message, "error"); }
  finally { trackingBusy = false; trackingControls(); }
});
