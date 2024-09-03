async function fetchData1(table, Studio) {
    // Correctly format the URL with backticks and ensure proper string interpolation
    const url = https://v2apis.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)};
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(HTTP error! Status: ${response.status});
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        return data[0];  // Return the first element of the data array
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

function populateTable(frames) {
    const tableBody = document.getElementById('frameTableBody');
    tableBody.innerHTML = ''; // Clear any existing rows

    frames.forEach(frame => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${frame.frameID || 'N/A'}</td>
            <td>${frame.duration || 'N/A'}</td>
            <td>${frame.winner || 'N/A'}</td>
            <td>${frame.loser || 'N/A'}</td>
            <td>${frame.totalMoney || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function init() {
    const table = 'frames';  // Replace with your actual table name
    const Studio = 'Studio 111';  // Replace with your actual studio identifier

    const frames = await fetchData1(table, Studio);
    populateTable(frames);
}

// Run the init function when the page loads
window.addEventListener('load', init);



