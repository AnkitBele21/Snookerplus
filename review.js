// Function to fetch frame data from API and populate the table
async function fetchFrameData() {
    try {
        const response = await fetch('https://v2api.snookerplus.in/apis/data/frames/Studio%20111');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        populateTable(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

// Function to populate the table with frame data
function populateTable(frames) {
    const tableBody = document.getElementById('frameTableBody');

    frames.forEach(frame => {
        // Create a new row
        const row = document.createElement('tr');

        // Create and append cells
        const idCell = document.createElement('td');
        idCell.textContent = frame.id; // Adjust based on actual data structure
        row.appendChild(idCell);

        const durationCell = document.createElement('td');
        durationCell.textContent = frame.duration; // Adjust based on actual data structure
        row.appendChild(durationCell);

        const winnerCell = document.createElement('td');
        winnerCell.textContent = frame.winner; // Adjust based on actual data structure
        row.appendChild(winnerCell);

        const loserCell = document.createElement('td');
        loserCell.textContent = frame.loser; // Adjust based on actual data structure
        row.appendChild(loserCell);

        const moneyCell = document.createElement('td');
        moneyCell.textContent = frame.totalMoney; // Adjust based on actual data structure
        row.appendChild(moneyCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

// Call the function to fetch and display data
fetchFrameData();
