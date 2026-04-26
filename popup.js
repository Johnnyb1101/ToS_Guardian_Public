const browser = globalThis.browser || chrome;

browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  browser.tabs.sendMessage(currentTab.id, { action: "getText" }, (response) => {
    if (response && response.text) {
      browser.runtime.sendMessage(
        { 
          action: "analyzeTos", 
          text: response.text,
          pageUrl: currentTab.url
        },
        (result) => {
  document.getElementById("loading").style.display = "none";
  document.getElementById("summary").innerHTML = formatSummary(
    result?.summary || "Could not analyze this page.",
    result?.optOutLinks || []
  );
}
      );
    } else {
      document.getElementById("loading").innerText = "No ToS text found on this page.";
    }
  });
});