const extractBtn = document.getElementById("extractBtn");
const resultSection = document.getElementById("result");
const statusMsg = document.getElementById("statusMsg");

function showStatus(message, type = "info") {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type}`;
  statusMsg.classList.remove("hidden");
}

function hideStatus() {
  statusMsg.classList.add("hidden");
}

function setButtonState(text, state = "default") {
  extractBtn.textContent = text;
  extractBtn.className = "btn-primary";
  if (state === "success") extractBtn.classList.add("success");
  if (state === "error") extractBtn.classList.add("error");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function displayResult(data) {
  document.getElementById("jobRole").textContent = data.job_role || "—";
  document.getElementById("jobDescription").textContent = data.job_description || "—";
  document.getElementById("companyName").textContent = data.company_name || "—";
  document.getElementById("companyDescription").textContent = data.company_description || "—";
  document.getElementById("finalDate").textContent = formatDate(data.final_date);

  const badge = document.getElementById("statusBadge");
  badge.textContent = data.status || "unknown";
  badge.className = "status-badge";

  resultSection.classList.remove("hidden");
}

extractBtn.addEventListener("click", async () => {
  // Disable button and show loading
  extractBtn.disabled = true;
  setButtonState("Extracting…");
  hideStatus();
  resultSection.classList.add("hidden");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { action: "extractJob" }, (response) => {
    if (!response) {
      setButtonState("Extract Job");
      extractBtn.disabled = false;
      showStatus("Could not extract job details from this page.", "error");
      return;
    }

    showStatus("Sending to Applyr…", "info");

    const combinedText = `
URL: ${response.url}
Title: ${response.title}
Company: ${response.company}
Deadline: ${response.deadline}
Description: ${response.description}
    `.trim();

    const HARDCODED_USER_ID = "34af6551-c288-4ea3-ac5a-2ee28ded6878";

    fetch("http://127.0.0.1:8000/api/applications/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: HARDCODED_USER_ID,
        text: combinedText,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Backend response:", data);

        // Display the backend response fields
        displayResult(data);

        setButtonState("✓ Saved to Applyr", "success");
        hideStatus();
        extractBtn.disabled = false;

        // Reset button after 3 seconds
        setTimeout(() => {
          setButtonState("Extract Job");
        }, 3000);
      })
      .catch((err) => {
        console.error("Error saving job", err);
        setButtonState("Extract Job");
        extractBtn.disabled = false;
        showStatus("Failed to save. Is the backend running?", "error");
      });
  });
});