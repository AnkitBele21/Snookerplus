const API_KEY = 'AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc';
const SHEET_ID = '1Bcl1EVN-7mXUP7M1FL9TBB5v4O4AFxGTVB6PwqOn9ss';

let frameGlobalData = [];
const loaderInstance = new FullScreenLoader();

async function fetchData(sheetName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.values.slice(1);
}

function markFrameOn() {
    let frameId = 1;
    if (frameGlobalData.length > 0) {
        frameId += parseInt(frameGlobalData[0].rowNumber);
    }
    window.location.href = `https://leaderboard.snookerplus.in/updateactiveframe?frameId=${frameId}&markOn=true`;
}

function displayFrameEntries(frameEntries) {
  const frameEntriesContainer = document.getElementById("frameEntries");
  frameEntriesContainer.innerHTML = "";

  frameEntries.forEach((entry, index) => {
    const frameElement = document.createElement("div");
    frameElement.className = entry.isActive ? "frame-card active-frame" : "frame-card";

    const frameIdElement = document.createElement("p");
    frameIdElement.innerText = `Frame ID: SPS${entry.rowNumber}`;
    frameIdElement.style.fontSize = "small";
    frameElement.appendChild(frameIdElement);

    const dateElement = document.createElement("h5");
    dateElement.innerText = `Date: ${entry.date}`;
    frameElement.appendChild(dateElement);

    const tableNoElement = document.createElement("p");
    tableNoElement.innerText = `Table No: ${entry.tableNo || "N/A"}`;
    frameElement.appendChild(tableNoElement);

    if (!entry.isActive) {
      const frameOnButton = document.createElement("button");
      frameOnButton.className = "btn btn-success";
      frameOnButton.innerText = "Frame On";
      frameOnButton.addEventListener("click", () => {
        const url = `https://leaderboard.snookerplus.in/updateactiveframe?frameId=${entry.rowNumber}&markOn=true`;
        window.location.href = url;
      });
      frameElement.appendChild(frameOnButton);
    } else {
      const frameOffButton = document.createElement("button");
      frameOffButton.className = "btn btn-danger off-btn";
      frameOffButton.innerText = "Frame Off";
      frameOffButton.addEventListener("click", () => {
        const url = `https://leaderboard.snookerplus.in/updateactiveframe?frameId=${entry.rowNumber}&markOn=false`;
        window.location.href = url;
      });
      frameElement.appendChild(frameOffButton);
    }

    const framePlayersHeader = document.createElement("h5");
    framePlayersHeader.innerText = "Players:";
    frameElement.appendChild(framePlayersHeader);

    const playerList = document.createElement("ul");
    entry.players.forEach(player => {
      const playerElement = document.createElement("li");
      playerElement.innerText = player;
      playerList.appendChild(playerElement);
    });
    frameElement.appendChild(playerList);

    frameEntriesContainer.appendChild(frameElement);
  });
}

function applyFilters() {
  const playerNameFilter = document.getElementById("playerNameFilter").value.toLowerCase();
  const dateFilter = document.getElementById("dateFilter").value;
  const activeFramesFilter = document.getElementById("activeFramesFilter").checked;

  const filteredData = frameGlobalData.filter(entry => {
    const playerMatch = !playerNameFilter || entry.players.some(player => player.toLowerCase().includes(playerNameFilter));
    const dateMatch = !dateFilter || entry.date === dateFilter;
    const activeMatch = !activeFramesFilter || entry.isActive;

    return playerMatch && dateMatch && activeMatch;
  });

  displayFrameEntries(filteredData);
}

function initPlayerNameDatalist(frameData) {
  const playerNameSet = new Set();
  frameData.forEach(entry => {
    entry.players.forEach(player => playerNameSet.add(player));
  });

  const playerNamesDatalist = document.getElementById("playerNames");
  playerNameSet.forEach(playerName => {
    const optionElement = document.createElement("option");
    optionElement.value = playerName;
    playerNamesDatalist.appendChild(optionElement);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  loaderInstance.show();

  try {
    const frameData = await fetchData("Frames Data");
    frameGlobalData = frameData.map((entry, index) => ({
      rowNumber: entry[0],
      date: entry[1],
      tableNo: entry[2],
      players: entry.slice(3, 7).filter(name => name),
      isActive: entry[8] === "TRUE"
    }));

    initPlayerNameDatalist(frameGlobalData);
    displayFrameEntries(frameGlobalData);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loaderInstance.hide();
  }

  document.getElementById("playerNameFilter").addEventListener("input", applyFilters);
  document.getElementById("dateFilter").addEventListener("change", applyFilters);
});
