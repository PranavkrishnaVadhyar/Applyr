// Isolated-world registry: backend answers can never supply page selectors or code.
if (!globalThis.applyrAutofillInstalled) {
  globalThis.applyrAutofillInstalled = true;
  let scan = null;
  function roots(root = document, depth = 0) {
    const result = [root];
    if (depth >= 6) return result;
    for (const element of Array.from(root.querySelectorAll("*")).slice(0, 3000)) {
      if (element.shadowRoot) result.push(...roots(element.shadowRoot, depth + 1));
      if (element.tagName === "IFRAME") {
        try { if (element.contentDocument && element.getClientRects().length && getComputedStyle(element).visibility === "visible") result.push(...roots(element.contentDocument, depth + 1)); } catch (_) { /* Cross-origin frames require separate permission. */ }
      }
    }
    return result;
  }
  const label = element => {
    // Some forms visually place a label immediately before the field but omit
    // its `for` attribute. Use only that unambiguous adjacent label as fallback.
    const previous = element.previousElementSibling;
    const adjacent = previous?.tagName === "LABEL" && !previous.getAttribute("for")
      ? previous.textContent : "";
    const labelled = (element.getAttribute("aria-labelledby") || "").split(/\s+/)
      .map(id => (element.getRootNode?.() || document).getElementById(id)?.textContent || "").join(" ").trim();
    return (Array.from(element.labels || []).map(item => item.textContent).join(" ").trim()
      || labelled || element.getAttribute("aria-label") || adjacent || element.placeholder || "").trim().slice(0, 500);
  };
  const eligible = element => element.isConnected && !element.matches(":disabled") && !element.readOnly
    && element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible"
    && !element.closest('[inert], [aria-hidden="true"]')
    && ["text", "email", "tel", "url", "textarea", "select-one"].includes(element.type);
  const options = element => element.type === "select-one"
    ? Array.from(element.options).filter(option => !option.disabled && !option.parentElement?.disabled && option.value !== "").map(option => option.text.trim()) : [];
  const visible = element => element.isConnected && !element.matches(':disabled, [aria-disabled="true"]')
    && element.getClientRects().length > 0 && (element.ownerDocument?.defaultView || globalThis).getComputedStyle(element).visibility === "visible"
    && !element.closest('[inert], [aria-hidden="true"]');
  function choice(element, root) {
    if (element.type === "radio") {
      const group = element.closest('fieldset, [role="radiogroup"]');
      if (!group || !element.name) return null;
      const members = Array.from(root.querySelectorAll('input[type="radio"]')).filter(item => item.name === element.name && item.form === element.form && item.closest('fieldset, [role="radiogroup"]') === group);
      return { type: "radio", label: group.querySelector('legend')?.textContent?.trim() || label(group), members,
        texts: members.map(label), hasValue: members.some(item => item.checked) };
    }
    if (element.getAttribute("role") === "combobox") {
      const id = element.getAttribute("aria-controls");
      const list = id && root.getElementById(id);
      if (!list || list.getAttribute("role") !== "listbox") return null;
      const members = Array.from(list.querySelectorAll('[role="option"]'));
      return { type: "combobox", label: label(element), members, texts: members.map(item => item.textContent.trim()),
        hasValue: !!element.value || members.some(item => item.getAttribute("aria-selected") === "true") };
    }
    return null;
  }
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    if (message.action === "scanForm") {
      scan = { id: crypto.randomUUID(), url: location.href, elements: new Map() };
      const fields = [];
      const seen = new Set();
      for (const root of roots()) for (const element of root.querySelectorAll('input, textarea, select, [role="combobox"]')) {
        const special = choice(element, root);
        if (special) {
          if (seen.has(element) || fields.length >= 50 || !visible(element) || !special.label || !special.members.length
            || special.members.length > 200 || special.texts.some(text => !text || text.length > 300)
            || special.members.some(member => !visible(member))) continue;
          special.members.forEach(member => seen.add(member));
          const id = String(fields.length);
          const field = { id, label: special.label.slice(0, 500), type: special.type, options: special.texts, has_value: special.hasValue };
          scan.elements.set(id, { element, field, special, root }); fields.push(field); continue;
        }
        if (element.getAttribute("role") === "combobox") continue;
        if (!eligible(element) || !label(element) || fields.length >= 50) continue;
        const id = String(fields.length);
        const field = { id, label: label(element), type: element.type, options: options(element), has_value: !!element.value };
        if (field.options.length > 200 || field.options.some(option => option.length > 300)) continue;
        scan.elements.set(id, { element, field, root });
        fields.push(field);
      }
      reply({ scan_id: scan.id, url: scan.url, fields });
    }
    if (message.action === "applyAnswers") {
      if (!scan || scan.id !== message.scan_id || scan.url !== location.href) {
        reply({ error: "Page changed. Scan the form again." }); return;
      }
      let filled = 0, skipped = 0;
      const results = [];
      const skip = (answer, reason) => { skipped++; results.push({ field_id: answer.field_id, status: "skipped", reason }); };
      const success = answer => { filled++; results.push({ field_id: answer.field_id, status: "filled" }); };
      const currentRoots = roots();
      for (const answer of message.answers || []) {
        const saved = scan.elements.get(answer.field_id);
        if (!saved || typeof answer.value !== "string" || !answer.value.trim() || answer.value.length > 10000) { skip(answer, "The answer is empty, too long, or no longer linked to a scanned field."); continue; }
        const { element, field } = saved;
        if (!currentRoots.includes(saved.root)) { skip(answer, "The form frame changed. Find questions again."); continue; }
        try {
        if (saved.special) {
          const current = choice(element, saved.root);
          if (current?.hasValue) { skip(answer, "An existing selection was preserved."); continue; }
          const index = current?.texts.indexOf(answer.value);
          if (!current || !visible(element) || current.hasValue || current.label.slice(0, 500) !== field.label
            || JSON.stringify(current.texts) !== JSON.stringify(field.options)
            || current.members.some((member, i) => member !== saved.special.members[i] || !visible(member))
            || index < 0 || current.texts.filter(text => text === answer.value).length !== 1) { skip(answer, "The choices changed, are hidden, or do not match the answer. Find questions again or select manually."); continue; }
          current.members[index].click();
          const applied = current.type === "radio" ? current.members[index].checked
            : current.members[index].getAttribute("aria-selected") === "true" || element.value === answer.value;
          if (applied) success(answer); else skip(answer, "The website did not accept the selection.");
          continue;
        }
        if (element.value) { skip(answer, "An existing value was preserved. Clear it on the webpage and scan again if you want to replace it."); continue; }
        if (!eligible(element) || label(element) !== field.label || element.type !== field.type
          || JSON.stringify(options(element)) !== JSON.stringify(field.options)
          || (element.maxLength >= 0 && answer.value.length > element.maxLength)) { skip(answer, "The field changed, is unavailable, or the answer exceeds its length limit. Find questions again."); continue; }
        let value = answer.value;
        if (element.type === "select-one") {
          const matches = Array.from(element.options).filter(option => !option.disabled && !option.parentElement?.disabled && option.value && option.text.trim() === value);
          if (matches.length !== 1) { skip(answer, "No unique matching dropdown option."); continue; }
          value = matches[0].value;
        }
        const realm = element.ownerDocument?.defaultView || globalThis;
        const prototype = element.tagName === "SELECT" ? realm.HTMLSelectElement.prototype
          : element.tagName === "TEXTAREA" ? realm.HTMLTextAreaElement.prototype : realm.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        setter.call(element, value);
        if (!element.validity.valid) { setter.call(element, ""); skip(answer, "The answer does not meet the field’s format or validation rules."); continue; }
        element.dispatchEvent(new realm.Event("input", { bubbles: true }));
        element.dispatchEvent(new realm.Event("change", { bubbles: true }));
        if (element.value === value) success(answer); else skip(answer, "The website rejected the value after its input handlers ran.");
        } catch (_) { skip(answer, "The website prevented updating this control. Complete it manually."); }
      }
      scan = null;
      reply({ filled, skipped, results });
    }
  });
}
