async function fetchFrameData() {
    try {
        const response = await fetch('https://v2api.snookerplus.in/apis/data/frames/Studio%20111');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Log the data to understand its structure
        console.log('API Data:', data);

        populateTable(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('frameTableBody');

    // Assuming data is an array of frames
    if (Array.isArray(data)) {
        data.forEach(frame => {
            // Log each frame to understand its structure
            console.log('Frame:', frame);

            // Create a new row
            const row = document.createElement('tr');

            // Create and append cells based on the actual data structure
            const idCell = document.createElement('td');
            idCell.textContent = frame.id || 'N/A'; // Replace with correct field name
            row.appendChild(idCell);

            const durationCell = document.createElement('td');
            durationCell.textContent = frame.duration || 'N/A'; // Replace with correct field name
            row.appendChild(durationCell);

            const winnerCell = document.createElement('td');
            winnerCell.textContent = frame.winner || 'N/A'; // Replace with correct field name
            row.appendChild(winnerCell);

            const loserCell = document.createElement('td');
            loserCell.textContent = frame.loser || 'N/A'; // Replace with correct field name
            row.appendChild(loserCell);

            const moneyCell = document.createElement('td');
            moneyCell.textContent = frame.totalMoney || 'N/A'; // Replace with correct field name
            row.appendChild(moneyCell);

            // Append the row to the table body
            tableBody.appendChild(row);
        });
    } else {
        console.error('Expected an array but got:', data);
    }
}

// Call the function to fetch and display data
fetchFrameData();
