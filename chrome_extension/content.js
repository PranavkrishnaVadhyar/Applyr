function extractJobDetails() {

    // Read the entire rendered page, including headings, lists and tables.
    // Do not collect input values, cookies, scripts or hidden DOM content.
    return { text: document.body.innerText, title: document.title, url: window.location.href };

}

if (!globalThis.applyrExtractorInstalled) {
globalThis.applyrExtractorInstalled = true;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "extractJob") {

        const jobData = extractJobDetails();

        sendResponse(jobData);
    }
});
}
