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

        return data.flat();  // Flatten the nested arrays into a single array
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

function convertToIST(date) {
    // Convert the date to IST (UTC+5:30)
    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDate = new Date(utcDate.getTime() + istOffset);
    return istDate;
}

function groupDataByDate(frames) {
    const groupedData = {};

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        const duration = parseInt(frame.Duration, 10) || 0;

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const dateString = date.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format

        if (!groupedData[dateString]) {
            groupedData[dateString] = 0;
        }

        groupedData[dateString] += duration;  // Sum the duration for each date
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
