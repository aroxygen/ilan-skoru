(() => {
  const id = "arox-analyze-btn";
  if (document.getElementById(id)) return;

  const button = document.createElement("button");
  button.id = id;
  button.textContent = "Arox: Analiz Et";
  button.style.cssText = `
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 999999;
    background: #10b981;
    color: #052e16;
    border: 0;
    border-radius: 999px;
    padding: 10px 14px;
    font-weight: 700;
    cursor: pointer;
  `;

  button.addEventListener("click", async () => {
    const response = await fetch("http://127.0.0.1:8000/analiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: window.location.href })
    });

    const result = await response.json();
    alert(`${result.karar}\nY:${result.yorgunluk_skoru} F:${result.firsat_skoru} R:${result.risk_skoru}\n${result.ozet}`);
  });

  document.body.appendChild(button);
})();
