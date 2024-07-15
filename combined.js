const API_KEY = 'AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc';
const SHEET_ID = '1Bcl1EVN-7mXUP7M1FL9TBB5v4O4AFxGTVB6PwqOn9ss';
const PLAYER_SHEET_NAME = 'snookerplus';

const loaderInstance = new FullScreenLoader();

document.addEventListener('DOMContentLoaded', function() {
    fetchCombinedData();

    document.getElementById('playerSearch').addEventListener('input', function(e) {
        const searchValue = e.target.value.toLowerCase();
        filterPlayers(searchValue);
    });

    document.getElementById('frameSearch').addEventListener('input', function(e) {
        const searchValue = e.target.value.toLowerCase();
        filterFrames(searchValue);
    });

    // Add event listener to the Back button
    const backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.addEventListener("click", function () {
            window.location.href = "https://leaderboard.snookerplus.in/clubframes";
        });
    }
});

function fetchCombinedData() {
    fetchPlayerData();
    fetchFrameData();
}

function fetchPlayerData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${PLAYER_SHEET_NAME}?key=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayPlayers(data.values.slice(1));
        })
        .catch(error => console.error('Error fetching player data:', error));
}

function fetchFrameData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Frames?key=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayFrames(data.values.slice(1));
        })
        .catch(error => console.error('Error fetching frame data:', error));
}

function displayPlayers(playersData) {
    const tableBody = document.getElementById('playersTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows

    playersData.forEach((row, index) => {
        const playerName = row[3]; // Assuming player names are in column D
        const balance = parseFloat(row[6]); // Assuming balances are in column G

        const rowElement = tableBody.insertRow();

        const playerNameCell = rowElement.insertCell(0);
        playerNameCell.textContent = playerName;

        const balanceCell = rowElement.insertCell(1);
        balanceCell.textContent = balance;

        const actionsCell = rowElement.insertCell(2);
        const topUpButton = document.createElement('button');
        topUpButton.textContent = 'Top Up';
        topUpButton.className = 'btn btn-primary mr-2';
        topUpButton.addEventListener('click', () => topUpBalance(playerName));
        actionsCell.appendChild(topUpButton);

        const purchaseButton = document.createElement('button');
        purchaseButton.textContent = 'Purchase';
        purchaseButton.className = 'btn btn-warning';
        purchaseButton.addEventListener('click', () => makePurchase(playerName));
        actionsCell.appendChild(purchaseButton);
    });
}

function topUpBalance(playerName) {
    const amount = prompt(`Enter top-up amount for ${playerName}:`);
    if (amount) {
        recordTopUp(playerName, amount);
    }
}

function makePurchase(playerName) {
    const amount = prompt(`Enter purchase amount for ${playerName}:`);
    if (amount) {
        recordAppPurchase(playerName, amount);
    }
}

function recordTopUp(playerName, amount) {
    try {
        loaderInstance.showLoader();
        fetch("https://payment.snookerplus.in/record_top_up/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: playerName,
                amount_paid: amount,
            }),
        })
        .then((resp) => {
            loaderInstance.hideLoader();
            if (!resp.ok) {
                throw new Error("Network response was not ok");
            }
            return resp.json();
        })
        .then((_body) => {
            window.location.reload();
        });
    } catch (error) {
        loaderInstance.hideLoader();
        console.error("Fetch error:", error);
        alert("Something went wrong while handling payment success. Contact support.");
    }
}

function recordAppPurchase(playerName, amount) {
    try {
        loaderInstance.showLoader();
        fetch("https://payment.snookerplus.in/record_app_purchase/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: playerName,
                amount_paid: amount,
            }),
        })
        .then((resp) => {
            loaderInstance.hideLoader();
            if (!resp.ok) {
                throw new Error("Network response was not ok");
            }
            return resp.json();
        })
        .then((_body) => {
            window.location.reload();
        });
    } catch (error) {
        loaderInstance.hideLoader();
        console.error("Fetch error:", error);
        alert("Something went wrong while handling payment success. Contact support.");
    }
}

function displayFrames(framesData) {
    const frameEntriesContainer = document.getElementById("frameEntries");
    frameEntriesContainer.innerHTML = ""; // Clear existing entries

    framesData.forEach((row, index) => {
        const frameElement = document.createElement("div");
        frameElement.className = row[6] && !row[8] ? "frame-card active-frame" : "frame-card";

        // Include Frame ID
        const frameIdElement = document.createElement("p");
        frameIdElement.innerText = `Frame ID: SPS${index + 2}`;
        frameIdElement.style.fontSize = "small"; // Making the font size small
        frameElement.appendChild(frameIdElement);

        const dateElement = document.createElement("h5");
        dateElement.innerText = `Date: ${row[2]}`;
        frameElement.appendChild(dateElement);

        const tableNoElement = document.createElement("p");
        tableNoElement.innerText = `Table No: ${row[7] || "N/A"}`;
        frameElement.appendChild(tableNoElement);

        if (!row[6] || (row[6] && row[8])) {
            const durationElement = document.createElement("p");
            durationElement.innerText = `Duration: ${row[3]} min`;
            frameElement.appendChild(durationElement);
        }

        const startTimeElement = document.createElement("p");
        startTimeElement.innerText = `Start Time: ${row[10]}`;
        frameElement.appendChild(startTimeElement);

        if (!row[6] || (row[6] && row[8])) {
            const tableMoneyElement = document.createElement("p");
            tableMoneyElement.innerText = `Table Money: ${row[20]}`;
            frameElement.appendChild(tableMoneyElement);
        }

        const playersElement = document.createElement("p");
        playersElement.innerText = `Players: ${row.slice(12, 18).filter(name => name).join(", ")}`;
        frameElement.appendChild(playersElement);

        const paidByElement = document.createElement("p");
        paidByElement.innerText = `Paid by: ${row.slice(23, 29).filter(name => name).join(", ") || "N/A"}`;
        frameElement.appendChild(paidByElement);

        // Status for active frames
        if (row[6] && !row[8]) {
            const statusElement = document.createElement("p");
            statusElement.innerText = `Status: ${row[8] ? row[8] : "Active"}`;
            statusElement.style.color = row[8] ? "red" : "green"; // Red for "Off", green for "Active"
            frameElement.appendChild(statusElement);

            // Edit Button for active frames
            const editButton = document.createElement("button");
            editButton.innerText = "Edit";
            editButton.className = "btn btn-primary edit-btn";
            editButton.onclick = function () {
                window.location.href = `https://leaderboard.snookerplus.in/updateactiveframe.html?frameId=SPS${index + 2}`;
            };
            frameElement.appendChild(editButton);

            const offButton = document.createElement("button");
            offButton.innerText = "Off";
            offButton.className = "btn btn-danger off-btn";
            offButton.addEventListener("click", () =>
                showOffPopup(index + 2, row.slice(12, 18).filter(name => name).join(", "))
            );
            frameElement.appendChild(offButton);
        }

        frameEntriesContainer.appendChild(frameElement);
    });
}

function showOffPopup(rowNumber, playerName) {
    const playerListString = prompt(`To be paid by ${playerName}:`);

    if (playerListString) {
        console.log(
            `Marking frame at row ${rowNumber} as off. Paid by: ${playerName} and amount: ${playerListString}`
        );
        try {
            loaderInstance.showLoader();
            const url = "https://payment.snookerplus.in/update/frame/off/";

            const payload = {
                frameId: `SPS${rowNumber}`,
                players: playerListString.split(",").map(player => player.trim()), // Ensure players are trimmed
            };

            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
            .then(resp => {
                loaderInstance.hideLoader();
                if (!resp.ok) {
                    throw new Error("Network response was not ok");
                }
                return resp.json();
            })
            .then(_body => {
                alert("Frame turned off successfully!");
                window.location.reload();
            });
        } catch (error) {
            loaderInstance.hideLoader();
            console.error("Fetch error:", error);
            alert("Something went wrong while turning off the frame. Contact support.");
        }
    }
}

function filterPlayers(searchValue) {
    const playersTable = document.getElementById('playersTable');
    const rows = playersTable.getElementsByTagName('tbody')[0].rows;

    Array.from(rows).forEach(row => {
        const playerName = row.cells[0].textContent.toLowerCase();
        row.style.display = playerName.includes(searchValue) ? '' : 'none';
    });
}

function filterFrames(searchValue) {
    const frameCards = document.getElementsByClassName('frame-card');

    Array.from(frameCards).forEach(frameCard => {
        const playersText = frameCard.getElementsByTagName('p')[5].textContent.toLowerCase();
        frameCard.style.display = playersText.includes(searchValue) ? '' : 'none';
    });
}
