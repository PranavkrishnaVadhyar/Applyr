const watchStatus = document.getElementById("submissionWatchState");
document.getElementById("watchSubmissionBtn").addEventListener("click", async () => {
  try {
    if (!trackingSaved || trackingStatus !== "draft" || trackingBusy) throw new Error("Save this draft and its reviewed answers first.");
    const result = await request({ action: "watchSubmission", application_id: trackingId });
    watchStatus.textContent = result.message;
  } catch (error) { watchStatus.textContent = error.message; }
});
async function stopDetection() {
  try { watchStatus.textContent = (await request({ action: "stopSubmissionWatch" })).message; }
  catch (error) { watchStatus.textContent = error.message; }
}
document.getElementById("stopSubmissionWatch").addEventListener("click", stopDetection);
document.getElementById("savedApplication").addEventListener("change", stopDetection);
document.getElementById("resumeSelect").addEventListener("change", stopDetection);
document.addEventListener("applyrAnswersChanged", stopDetection);
for (const input of draftInputs) input.addEventListener("input", stopDetection);
request({ action: "submissionWatchState" }).then(result => { watchStatus.textContent = result.message; }).catch(() => {});
