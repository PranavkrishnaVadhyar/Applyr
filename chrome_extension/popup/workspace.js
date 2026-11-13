let workspaceOwner = null, restoringWorkspace = false, recoveryAnswers = [], workspaceRevision = 0;
let persistenceQueue = Promise.resolve();
function selectView(view) {
  for (const button of document.querySelectorAll('[data-view]')) {
    const selected = button.dataset.view === view;
    button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
  }
  for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== view;
  document.dispatchEvent(new CustomEvent('applyrViewChanged'));
}
const viewButtons = Array.from(document.querySelectorAll('[data-view]'));
viewButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectView(button.dataset.view));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? viewButtons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + viewButtons.length) % viewButtons.length;
    selectView(viewButtons[next].dataset.view); viewButtons[next].focus();
  });
});

function unsavedAnswerFor(field, url) {
  return recoveryAnswers.find(answer => answer.label === field.label && answer.field_type === field.type && answer.page_url === url)?.value;
}
function snapshotWorkspace() {
  if (activeScan) {
    const edits = reviewedAnswers.map(item => ({ label: item.label, field_type: item.field_type, value: item.input.value, page_url: activeScan.url }));
    recoveryAnswers = recoveryAnswers.filter(answer => !edits.some(edit => answerKey(edit) === answerKey(answer))).concat(edits).slice(-100);
  }
  return { id: trackingId, resume_id: resumeSelect.value || selectedResumeId, status: trackingStatus,
    job_role: draftInputs[0].value, company_name: draftInputs[1].value, job_description: draftInputs[3].value, company_description: draftInputs[4].value, final_date: draftInputs[5].value || null,
    response: { version: 1, job_url: draftInputs[2].value, answers: retainedAnswers }, pending: recoveryAnswers };
}
function updateWorkspace() {
  const title = [draftInputs[1].value, draftInputs[0].value].filter(Boolean).join(' · ');
  document.getElementById('contextTitle').textContent = title || 'Start a new application';
  if (!workspaceOwner || restoringWorkspace) return;
  const owner = workspaceOwner, snapshot = snapshotWorkspace(); workspaceRevision++;
  // Serialize writes: an older slow write must not replace newer edits.
  persistenceQueue = persistenceQueue.catch(() => {}).then(async () => {
    if (workspaceOwner !== owner) return;
    await request({ action: 'saveWorkspace', owner, snapshot });
    if (workspaceOwner === owner) document.getElementById('sessionState').textContent = 'Session recovery updated · cleared at sign-out';
  }).catch(() => { document.getElementById('sessionState').textContent = 'Session recovery unavailable. Save to the tracker before closing.'; });
}
document.addEventListener('applyrSession', async event => {
  if (workspaceOwner === event.detail.userId) return;
  workspaceOwner = event.detail.signedIn ? event.detail.userId : null;
  recoveryAnswers = []; workspaceRevision++;
  if (!workspaceOwner) { restoringWorkspace = false; return; }
  const owner = workspaceOwner, revision = workspaceRevision;
  restoringWorkspace = true; trackingBusy = true; trackingControls();
  try {
    const snapshot = await request({ action: 'loadWorkspace', owner });
    if (workspaceOwner !== owner || revision !== workspaceRevision || !snapshot) return;
    recoveryAnswers = Array.isArray(snapshot.pending) ? snapshot.pending : [];
    selectApplication(snapshot);
    trackingSaved = false;
    draftState.textContent = trackingStatus === 'draft' ? 'Recovered session draft · review and save to tracker' : 'Recovered application · submission status unchanged';
    trackingControls();
  } catch (_) { document.getElementById('sessionState').textContent = 'Could not restore session edits. Saved tracker drafts are still available.'; }
  finally { if (workspaceOwner === owner) { restoringWorkspace = false; trackingBusy = false; trackingControls(); } }
});
for (const input of draftInputs) input.addEventListener('input', updateWorkspace);
document.addEventListener('applyrAnswersChanged', updateWorkspace);
document.addEventListener('applyrSavedJob', () => { recoveryAnswers = []; updateWorkspace(); });
document.getElementById('savedApplication').addEventListener('change', () => { recoveryAnswers = []; updateWorkspace(); });
document.getElementById('resumeSelect').addEventListener('change', () => { recoveryAnswers = []; updateWorkspace(); });
