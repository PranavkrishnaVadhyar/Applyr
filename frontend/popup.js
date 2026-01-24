document.getElementById("extractBtn").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Extracting questions...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFormQuestions
    });

    output.textContent = JSON.stringify(result, null, 2);

  } catch (err) {
    console.error(err);
    output.textContent = "❌ Failed to extract questions";
  }
});

/* ===============================
   THIS FUNCTION RUNS IN THE PAGE
================================ */
function extractFormQuestions() {
  console.log("🔍 Extracting form questions");

  const questions = [];
  let index = 0;

  function findLabel(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.innerText.trim();
    }

    const parentLabel = el.closest("label");
    if (parentLabel) return parentLabel.innerText.trim();

    return el.placeholder || null;
  }

  /* ===============================
     TEXT INPUTS, EMAIL, NUMBER etc
  ================================ */
  document
    .querySelectorAll("input:not([type=hidden]):not([type=submit])")
    .forEach(input => {
      questions.push({
        index: index++,
        tag: "input",
        inputType: input.type,
        name: input.name || null,
        question: findLabel(input),
        required: input.required || false
      });
    });

  /* ===============================
     TEXTAREAS (DESCRIPTIVE)
  ================================ */
  document.querySelectorAll("textarea").forEach(textarea => {
    questions.push({
      index: index++,
      tag: "textarea",
      name: textarea.name || null,
      question: findLabel(textarea),
      required: textarea.required || false,
      rows: textarea.rows || null
    });
  });

  /* ===============================
     SELECT DROPDOWNS
  ================================ */
  document.querySelectorAll("select").forEach(select => {
    questions.push({
      index: index++,
      tag: "select",
      name: select.name || null,
      question: findLabel(select),
      required: select.required || false,
      options: Array.from(select.options).map(o => ({
        value: o.value,
        label: o.text
      }))
    });
  });

  return {
    url: location.href,
    title: document.title,
    totalQuestions: questions.length,
    questions
  };
}
