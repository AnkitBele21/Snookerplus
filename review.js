// Fetch data from the API
async function fetchData1(table, Studio) {
    const url = `https://v2api.snookerplus.in/apis/data/${table}/${Studio}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        // Assuming data is an array and we want the first item
        return data[0];
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array in case of error
    }
}

// Populate the table with data
function populateTable(frames) {
    const tableBody = document.getElementById('frameTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';

    frames.forEach((frame) => {
        const row = document.createElement('tr');
        
        // Create table cells
        const frameIdCell = document.createElement('td');
        frameIdCell.textContent = frame.frameId || 'N/A';
        row.appendChild(frameIdCell);

        const durationCell = document.createElement('td');
        durationCell.textContent = frame.duration || 'N/A';
        row.appendChild(durationCell);

        const winnerCell = document.createElement('td');
        winnerCell.textContent = frame.winner || 'N/A';
        row.appendChild(winnerCell);

        const looserCell = document.createElement('td');
        looserCell.textContent = frame.looser || 'N/A';
        row.appendChild(looserCell);

        const totalMoneyCell = document.createElement('td');
        totalMoneyCell.textContent = frame.totalMoney || 'N/A';
        row.appendChild(totalMoneyCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

// Initialize the script
async function init() {
    const table = 'frames';  // Replace with your table name
    const Studio = 'Studio%20111';  // Replace with your studio identifier

    const frames = await fetchData1(table, Studio);
    populateTable(frames);
}

// Run the init function when the page loads
window.addEventListener('load', init);
