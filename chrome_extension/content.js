function extractJobDetails() {

    let pageText = document.body.innerText;

    // Company name (best guess)
    let company = document.querySelector(
        '[class*="company"], [id*="company"], meta[property="og:site_name"]'
    );

    company = company ? company.innerText || company.content : "Not found";

    // Try extracting job title
    let title = document.querySelector("h1");
    title = title ? title.innerText : "Unknown Title";

    // Try finding deadline keywords
    let deadlineMatch = pageText.match(
        /(apply by|last date|deadline|closing date)[^\n]*/i
    );

    let deadline = deadlineMatch ? deadlineMatch[0] : "Not found";

    // Extract main paragraphs
    let paragraphs = [...document.querySelectorAll("p")]
        .map(p => p.innerText)
        .join("\n\n");

    return {
        title: title,
        company: company,
        deadline: deadline,
        description: paragraphs.substring(0, 5000),
        url: window.location.href
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "extractJob") {

        const jobData = extractJobDetails();

        sendResponse(jobData);
    }
});