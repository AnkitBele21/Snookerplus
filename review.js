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

    // Check if data is an array
    if (Array.isArray(data)) {
        data.forEach(frame => {
            // Check if frame is an array
            if (Array.isArray(frame)) {
                // Create a new row
                const row = document.createElement('tr');

                // Assuming frame is an array with values in order:
                // [Frame ID, Duration, Winner, Loser, Total Money]
                const idCell = document.createElement('td');
                idCell.textContent = frame[0] || 'N/A'; // Adjust index based on actual data
                row.appendChild(idCell);

                const durationCell = document.createElement('td');
                durationCell.textContent = frame[1] || 'N/A'; // Adjust index based on actual data
                row.appendChild(durationCell);

                const winnerCell = document.createElement('td');
                winnerCell.textContent = frame[2] || 'N/A'; // Adjust index based on actual data
                row.appendChild(winnerCell);

                const loserCell = document.createElement('td');
                loserCell.textContent = frame[3] || 'N/A'; // Adjust index based on actual data
                row.appendChild(loserCell);

                const moneyCell = document.createElement('td');
                moneyCell.textContent = frame[4] || 'N/A'; // Adjust index based on actual data
                row.appendChild(moneyCell);

                // Append the row to the table body
                tableBody.appendChild(row);
            } else {
                console.error('Frame is not an array:', frame);
            }
        });
    } else {
        console.error('Expected an array but got:', data);
    }
}

// Call the function to fetch and display data
fetchFrameData();
