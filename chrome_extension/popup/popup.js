document.getElementById("extractBtn").addEventListener("click", async () => {

    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});

    chrome.tabs.sendMessage(tab.id, {action: "extractJob"}, (response) => {

        if (!response) return;

        document.getElementById("title").innerText = response.title;
        document.getElementById("company").innerText = response.company;
        document.getElementById("deadline").innerText = response.deadline;
        document.getElementById("description").innerText = response.description;

    });

});