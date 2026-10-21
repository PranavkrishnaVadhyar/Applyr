// Isolated-world registry: backend answers can never supply page selectors or code.
if (!globalThis.applyrAutofillInstalled) {
  globalThis.applyrAutofillInstalled = true;
  let scan = null;
  const label = element => {
    const labelled = (element.getAttribute("aria-labelledby") || "").split(/\s+/)
      .map(id => document.getElementById(id)?.textContent || "").join(" ").trim();
    return (Array.from(element.labels || []).map(item => item.textContent).join(" ").trim()
      || labelled || element.getAttribute("aria-label") || element.placeholder || "").trim().slice(0, 500);
  };
  const eligible = element => element.isConnected && !element.matches(":disabled") && !element.readOnly
    && element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible"
    && !element.closest('[inert], [aria-hidden="true"]')
    && ["text", "email", "tel", "url", "textarea", "select-one"].includes(element.type);
  const options = element => element.type === "select-one"
    ? Array.from(element.options).filter(option => !option.disabled && !option.parentElement?.disabled && option.value !== "").map(option => option.text.trim()) : [];
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.action === "scanForm") {
      scan = { id: crypto.randomUUID(), url: location.href, elements: new Map() };
      const fields = [];
      for (const element of document.querySelectorAll("input, textarea, select")) {
        if (!eligible(element) || !label(element) || fields.length >= 50) continue;
        const id = String(fields.length);
        const field = { id, label: label(element), type: element.type, options: options(element), has_value: !!element.value };
        if (field.options.length > 200 || field.options.some(option => option.length > 300)) continue;
        scan.elements.set(id, { element, field });
        fields.push(field);
      }
      reply({ scan_id: scan.id, url: scan.url, fields });
    }
    if (message.action === "applyAnswers") {
      if (!scan || scan.id !== message.scan_id || scan.url !== location.href) {
        reply({ error: "Page changed. Scan the form again." }); return;
      }
      let filled = 0, skipped = 0;
      for (const answer of message.answers || []) {
        const saved = scan.elements.get(answer.field_id);
        if (!saved || typeof answer.value !== "string" || !answer.value.trim() || answer.value.length > 10000) { skipped++; continue; }
        const { element, field } = saved;
        if (!eligible(element) || element.value || label(element) !== field.label || element.type !== field.type
          || JSON.stringify(options(element)) !== JSON.stringify(field.options)
          || (element.maxLength >= 0 && answer.value.length > element.maxLength)) { skipped++; continue; }
        let value = answer.value;
        if (element.type === "select-one") {
          const matches = Array.from(element.options).filter(option => !option.disabled && !option.parentElement?.disabled && option.value && option.text.trim() === value);
          if (matches.length !== 1) { skipped++; continue; }
          value = matches[0].value;
        }
        const prototype = element.tagName === "SELECT" ? HTMLSelectElement.prototype
          : element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        setter.call(element, value);
        if (!element.validity.valid) { setter.call(element, ""); skipped++; continue; }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        if (element.value === value) filled++; else skipped++;
      }
      scan = null;
      reply({ filled, skipped });
    }
  });
}
