document.getElementById("extractBtn").addEventListener("click", async () => {

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    chrome.tabs.sendMessage(tab.id, {action: "extractJob"}, (response) => {

        if (!response) {
            document.getElementById("result").innerText = "Failed to extract job details";
            return;
        }

        document.getElementById("title").innerText = response.title;
        document.getElementById("company").innerText = response.company;
        document.getElementById("deadline").innerText = response.deadline;
        document.getElementById("description").innerText = response.description;

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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: HARDCODED_USER_ID,
                text: combinedText
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("Extraction parsed and saved:", data);
            document.getElementById("extractBtn").innerText = "Saved to Applyr!";
        })
        .catch(err => {
            console.error("Error saving job", err);
            document.getElementById("extractBtn").innerText = "Error Saving";
        });

    });

});