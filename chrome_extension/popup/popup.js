const extractBtn = document.getElementById("extractBtn");
const resultSection = document.getElementById("result");
const statusMsg = document.getElementById("statusMsg");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

function showStatus(message, type = "info") {
  statusMsg.textContent = message;
  statusMsg.className = "status-msg " + type;
}

async function request(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (response?.error) throw new Error(response.error);
  if (!response) throw new Error("Extension unavailable. Reload it and try again.");
  return response.data;
}

async function updateSession() {
  const { signedIn } = await request({ action: "session" });
  loginForm.classList.toggle("hidden", signedIn);
  logoutBtn.classList.toggle("hidden", !signedIn);
  extractBtn.classList.toggle("hidden", !signedIn);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("loginBtn");
  button.disabled = true;
  try {
    await request({ action: "signin", email: document.getElementById("email").value,
      password: document.getElementById("password").value });
    statusMsg.classList.add("hidden");
    await updateSession();
  } catch (error) { showStatus(error.message, "error"); }
  finally { document.getElementById("password").value = ""; button.disabled = false; }
});

logoutBtn.addEventListener("click", async () => {
  try { await request({ action: "logout" }); }
  catch (error) { showStatus(error.message, "error"); }
  finally { resultSection.classList.add("hidden"); await updateSession(); }
});

function displayResult(data) {
  for (const [id, key] of Object.entries({
    jobRole: "job_role", jobDescription: "job_description",
    companyName: "company_name", companyDescription: "company_description", finalDate: "final_date",
  })) document.getElementById(id).textContent = data[key] || "—";
  document.getElementById("statusBadge").textContent = data.status;
  resultSection.classList.remove("hidden");
}

extractBtn.addEventListener("click", async () => {
  extractBtn.disabled = true;
  extractBtn.textContent = "Extracting…";
  resultSection.classList.add("hidden");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:/.test(tab.url || "")) throw new Error("Open a job posting on a website first.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    const job = await chrome.tabs.sendMessage(tab.id, { action: "extractJob" });
    if (!job) throw new Error("Could not read this page. Reload it and try again.");
    showStatus("Saving to Applyr…");
    const text = `URL: ${job.url}\nTitle: ${job.title}\nCompany: ${job.company}\nDeadline: ${job.deadline}\nDescription: ${job.description}`;
    displayResult(await request({ action: "saveJob", text }));
    showStatus("Saved to Applyr.", "success");
  } catch (error) { showStatus(error.message, "error"); }
  finally {
    extractBtn.disabled = false;
    extractBtn.textContent = "Extract Job";
    await updateSession();
  }
});
updateSession().catch(error => showStatus(error.message, "error"));
