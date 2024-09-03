async function fetchData1(table, Studio) {
    const url = `https://v2api.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        return data;  // Return the full data array
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

function groupDataByDate(frames) {
    const groupedData = {};

    frames.forEach(frame => {
        const date = new Date(frame.StartTime).toLocaleDateString();  // Extract the date part
        const duration = frame.Duration || 0;

        if (!groupedData[date]) {
            groupedData[date] = 0;
        }

        groupedData[date] += duration;  // Sum the duration for each date
    });

    return groupedData;
}

function populateAnalyticsTable(groupedData) {
    const tableBody = document.getElementById('analyticsTableBody');
    tableBody.innerHTML = ''; // Clear any existing rows

    Object.keys(groupedData).forEach(date => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${groupedData[date]}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function init() {
    const table = 'frames';  // Replace with your actual table name
    const Studio = 'Studio 111';  // Replace with your actual studio identifier

    const frames = await fetchData1(table, Studio);
    const groupedData = groupDataByDate(frames);
    populateAnalyticsTable(groupedData);
}

// Run the init function when the page loads
window.addEventListener('load', init);
