// API Address
const API = "https://ms-vscode.gallery.vsassets.io/_apis/public/gallery/publisher/{PUBLISHER}/extension/{EXT_NAME}/{VERSION}/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage";

// Extract data from marketplace page 
async function buildVsixDict(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const script = doc.querySelector('script.jiContent');
        if (!script) throw new Error("Not available here.");
        const data = JSON.parse(script.textContent);
        const publisher = data.Resources.PublisherName;
        const extName = data.Resources.ExtensionName;
        const version = data.Resources.Version;
        return {
            [extName]: API
                .replace('{PUBLISHER}', publisher)
                .replace('{EXT_NAME}', extName)
                .replace('{VERSION}', version)
        };
    } catch (e) {
        console.error("Error extracting data :", e);
        throw e;
    }
}

// Download the file an remane it
async function downloadFromUrlAndRename(url) {
    try {
        const data = await buildVsixDict(url);
        for (const [k, v] of Object.entries(data)) {
            const response = await fetch(v);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${k}.vsix`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            
        }
    } catch (e) {
        console.error("Download error :", e);
        showPopup(`Erreur : ${e.message}`, "error");
    }
}

// Display popup message
function showPopup(message, type) {
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '20px';
    popup.style.right = '20px';
    popup.style.padding = '10px 15px';
    popup.style.backgroundColor = type === "success" ? '#4CAF50' : '#f44336';
    popup.style.color = 'white';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => {
        document.body.removeChild(popup);
    }, 3000);
}

// Event Listener
document.getElementById('downloadBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url) {
        await downloadFromUrlAndRename(tab.url);
    } else {
        showPopup("You're maybe not on the maketplace.", "error");
    }
});
