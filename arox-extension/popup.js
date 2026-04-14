const btn = document.getElementById("analyze");
const result = document.getElementById("result");

btn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    result.textContent = "Aktif URL bulunamadı.";
    return;
  }

  result.textContent = "Analiz ediliyor...";

  const response = await fetch("http://127.0.0.1:8000/analiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: tab.url })
  });

  const data = await response.json();
  result.textContent = `${data.karar} | Y:${data.yorgunluk_skoru} F:${data.firsat_skoru} R:${data.risk_skoru}`;
});
