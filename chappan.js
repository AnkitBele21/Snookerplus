const SHEET_ID = "1Wk61dTUlNu84sYIc42IierWo8HCdHkgYg899OGNyrxI";
const SHEET_NAME = "century";
const API_KEY = "AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc";

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    const values = data.values;

    if (!values || values.length < 5) return;

    // Update all 4 players
    for (let i = 1; i <= 4; i++) {
      const row = values[i] || [];
      updatePlayer(`player${i}`, row[0], row[1], row[2]);
    }

    // Active player (D2 → values[1][3])
    const activePlayer = parseInt(values[1]?.[3]) || 1;
    document
      .querySelectorAll(".player-card")
      .forEach((card) => card.classList.remove("active"));
    document.getElementById(`player${activePlayer}`)?.classList.add("active");

    // Match Info (E2)
    document.getElementById("matchInfo").textContent =
      values[1]?.[4] || "Century Tournament";

    // Background Image (G2)
    const bgUrl = values[1]?.[6];
    if (bgUrl) {
      document.getElementById(
        "fullscreenBg"
      ).innerHTML = `<img src="${bgUrl}" alt="Background">`;
    }

    // Message Strip (H2)
    const message = values[1]?.[7];
    const messageStrip = document.getElementById("messageStrip");
    const scoreStrip = document.getElementById("scoreStrip");

    if (message) {
      messageStrip.textContent = message;
      messageStrip.style.display = "block";
      scoreStrip.style.display = "none";
    } else {
      messageStrip.style.display = "none";
      scoreStrip.style.display = "block";
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function updatePlayer(playerId, name, score, redBalls) {
  // Fallbacks
  name = name || playerId.replace("player", "Player ");
  score = score || "0";
  const redCount = parseInt(redBalls) || 0;

  // Update name
  const nameElement = document.getElementById(`${playerId}Name`);
  if (nameElement) nameElement.textContent = name;

  // Update score
  const scoreElement = document.getElementById(`${playerId}Score`);
  if (scoreElement) scoreElement.textContent = score;

  // Update reds
  const redsElement = document.getElementById(`${playerId}Reds`);
  const redIcons = redsElement?.querySelectorAll("span");
  if (redIcons?.length >= 4) {
    for (let j = 0; j < 3; j++) {
      redIcons[j].textContent = j < redCount ? "●" : "○";
    }
    redIcons[3].textContent = `${redCount}/3`;
  }

  // Update mature badge
  const matureBadge = document.getElementById(`${playerId}Mature`);
  if (matureBadge) {
    matureBadge.style.display = redCount >= 3 ? "inline-block" : "none";
  }
}

// Initial call + polling
fetchData();
setInterval(fetchData, 2500);
