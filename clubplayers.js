const API_KEY = 'AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc';
const SHEET_ID = '1Bcl1EVN-7mXUP7M1FL9TBB5v4O4AFxGTVB6PwqOn9ss';
const PLAYER_SHEET_NAME = 'snookerplus';

const loaderInstance = new FullScreenLoader();

document.addEventListener('DOMContentLoaded', function() {
    fetchPlayerData();

    document.getElementById('playerSearch').addEventListener('input', function(e) {
        const searchValue = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#playersTable tbody tr');
        
        rows.forEach(row => {
            const playerName = row.querySelector('td:first-child').textContent.toLowerCase();
            if (playerName.includes(searchValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});

function fetchPlayerData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${PLAYER_SHEET_NAME}?key=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const rows = data.values;
            const tableBody = document.getElementById('playersTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Clear existing rows
            rows.slice(3).forEach((row, index) => {
                if (row.length > 0) { // Check if row is not empty
                    const playerName = row[3]; // Assuming player names are in column D
                    const balance = parseFloat(row[6]); // Assuming balances are in column G
                    const rowElement = tableBody.insertRow();

                    // Apply classes based on conditions
                    if (!isNaN(balance) && balance > 5) {
                        rowElement.classList.add('balance-high');
                    } else if (!isNaN(balance) && balance < -5) {
                        rowElement.classList.add('balance-low');
                    }

                    const playerNameCell = rowElement.insertCell(0);
                    playerNameCell.textContent = playerName;

                    if (!isNaN(balance) && balance > 5) {
                        playerNameCell.style.color = '#F44336'; // Example color, adjust as needed
                    } else if (!isNaN(balance) && balance < -5) {
                        playerNameCell.style.color = '#4CAF50'; // Example color, adjust as needed
                    }

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
                }
            });
        })
        .catch(error => console.error('Error fetching player data:', error));
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
        recordAppPurchase(playerName, amount)
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
