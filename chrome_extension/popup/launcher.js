let windowId;
const button = document.getElementById("openWorkspace");
chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => { windowId = tab?.windowId; button.disabled = !Number.isInteger(windowId); });
button.addEventListener("click", () => {
  chrome.sidePanel.open({ windowId }).then(() => window.close()).catch(error => { document.getElementById("launchStatus").textContent = error.message; });
});
