const API_URL = "http://127.0.0.1:8000";
let refreshPromise = null;

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(typeof data.detail === "string" ? data.detail : "Request failed (" + response.status + ")");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function refreshSession(oldSession) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const data = await readResponse(await fetch(API_URL + "/api/auth/refresh", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: oldSession.refresh_token }),
      }));
      const { session } = await chrome.storage.session.get("session");
      if (!session || session.refresh_token !== oldSession.refresh_token) throw new Error("Session changed. Sign in again.");
      await chrome.storage.session.set({ session: data });
      return data;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function authorizedRequest(path, body, method = "POST") {
  let { session } = await chrome.storage.session.get("session");
  if (!session) throw new Error("Sign in to Applyr first.");
  const send = () => fetch(API_URL + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
    body: JSON.stringify(body),
  });
  let response = await send();
  if (response.status === 401) {
    const staleSession = session;
    try {
      session = await refreshSession(staleSession);
      response = await send();
    } catch (error) {
      const current = await chrome.storage.session.get("session");
      if (error.status === 401 && current.session?.refresh_token === staleSession.refresh_token) {
        await chrome.storage.session.remove("session");
      }
      throw error;
    }
  }
  if (response.status === 401) await chrome.storage.session.remove("session");
  return readResponse(response);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only extension UI can invoke authenticated operations; never a page content script.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL("popup/"))) return;
  (async () => {
    if (message.action === "session") {
      const { session } = await chrome.storage.session.get("session");
      return { signedIn: !!session };
    }
    if (message.action === "signin") {
      const session = await readResponse(await fetch(API_URL + "/api/auth/signin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: message.email, password: message.password }),
      }));
      await chrome.storage.session.set({ session });
      return { signedIn: true };
    }
    if (message.action === "logout") {
      try { await authorizedRequest("/api/auth/logout", {}); }
      finally { await chrome.storage.session.remove("session"); }
      return { signedIn: false };
    }
    if (message.action === "saveJob") return authorizedRequest("/api/applications/extract", { text: message.text });
    if (message.action === "listResumes") return authorizedRequest("/api/resumes/", undefined, "GET");
    if (message.action === "listApplications") return authorizedRequest("/api/applications/owned", undefined, "GET");
    if (["saveApplicationDraft", "confirmSubmission"].includes(message.action)) {
      if (!/^[0-9a-f-]{36}$/i.test(message.application_id || "")) throw new Error("Invalid application ID");
      return message.action === "saveApplicationDraft"
        ? authorizedRequest("/api/applications/drafts/" + message.application_id, message.draft, "PUT")
        : authorizedRequest("/api/applications/" + message.application_id + "/confirm-submission", {});
    }
    if (message.action === "resolveAutofill") return authorizedRequest("/api/autofill/resolve", {
      resume_id: message.resume_id, fields: message.fields, generate_drafts: message.generate_drafts === true,
    });
    throw new Error("Unknown action");
  })().then(data => sendResponse({ data }), error => sendResponse({ error: error.message }));
  return true;
});
