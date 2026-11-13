// Keep one primary task visible at a time; tabs remain available for going back.
function renderFlow() {
  const current = document.querySelector('[data-view][aria-selected="true"]')?.dataset.view || 'job';
  const ready = !!draftInputs[0].value.trim() && !!draftInputs[1].value.trim() && !trackingBusy && !scanning;
  document.getElementById('goReview').disabled = !ready;
  applyBtn.hidden = current !== 'review';
  saveDraftBtn.hidden = false;
  document.getElementById('nextActionHint').textContent = current === 'job'
    ? 'Save these job details as a draft, or proceed to answering.'
    : current === 'review' ? 'Open the application form → Find questions → Generate drafts → Review → Fill webpage.'
    : 'Finish on the website. Save a tracker draft if you want to keep your progress.';
}
document.getElementById('goReview').addEventListener('click', () => {
  if (trackingBusy || scanning || !draftInputs[0].value.trim() || !draftInputs[1].value.trim()) return;
  selectView('review'); renderFlow();
  scanBtn.focus();
});
document.getElementById('reviewAgain').addEventListener('click', () => {
  selectView('review'); scanBtn.focus();
});
saveDraftBtn.addEventListener('click', () => {
  const missing = draftInputs.slice(0, 2).find(input => !input.value.trim());
  if (missing) {
    document.getElementById('trackerDetails').open = true;
    // The save handler temporarily locks fields; reveal the required details.
    document.getElementById('trackerDetails').scrollIntoView({ block: 'nearest' });
  }
});
document.addEventListener('applyrViewChanged', renderFlow);
document.addEventListener('applyrResumesLoaded', () => {
  document.getElementById('resumeHelp').textContent = resumeSelect.options.length
    ? 'Check this source before scanning. Changing it clears the current suggestions.'
    : 'No resumes yet. Upload a resume in the web app, then press Refresh here.';
  renderFlow();
});
document.addEventListener('applyrFilled', event => {
  const { filled, skipped } = event.detail;
  document.getElementById('fillOutcome').textContent = `${filled} fields filled · ${skipped} skipped. Nothing was submitted.`;
  selectView('activity');
  document.getElementById('fillOutcome').setAttribute('tabindex', '-1');
  document.getElementById('fillOutcome').focus();
});
let flowSignedIn = null;
document.addEventListener('applyrSession', event => {
  if (flowSignedIn !== event.detail.signedIn) selectView('job');
  flowSignedIn = event.detail.signedIn;
  renderFlow();
});
resumeSelect.addEventListener('change', renderFlow);
renderFlow();
