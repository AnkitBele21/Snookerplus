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
    if (!date) return null;  // Return null if date is undefined or invalid

    // Convert the date to IST (UTC+5:30)
    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDate = new Date(utcDate.getTime() + istOffset);

    return istDate;
}

function groupDataByDate(frames) {
    const groupedData = {};
    let totalTableMoney = 0;

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        if (!date || isNaN(date.getTime())) {  // Handle invalid dates
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const duration = parseInt(frame.Duration, 10) || 0;
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        const dateString = date.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format

        if (!groupedData[dateString]) {
            groupedData[dateString] = { duration: 0, totalMoney: 0 };
        }

        groupedData[dateString].duration += duration;    // Sum the duration for each date
        groupedData[dateString].totalMoney += totalMoney; // Sum the total money for each date
        totalTableMoney += totalMoney; // Add to total table money
    });

    return { groupedData, totalTableMoney };
}

function populateAnalyticsTable(groupedData, totalTableMoney) {
    const totalMoneyBox = document.getElementById('totalMoneyBox');
    if (!totalMoneyBox) {
        console.error('Element with ID "totalMoneyBox" not found.');
        return;
    }

    const tableBody = document.getElementById('analyticsTableBody');
    if (!tableBody) {
        console.error('Element with ID "analyticsTableBody" not found.');
        return;
    }

    // Set the total table money in the box above the table
    totalMoneyBox.innerHTML = `Total Table Money: ₹${totalTableMoney.toFixed(2)}`;

    // Clear any existing rows in the table
    tableBody.innerHTML = '';

    // Populate table rows with grouped data
    Object.keys(groupedData).forEach(date => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${(groupedData[date].duration / 60).toFixed(2)}</td> <!-- Convert seconds to minutes -->
            <td>₹${groupedData[date].totalMoney.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function init() {
    const table = 'frames';  // Replace with your actual table name
    const Studio = 'Studio 111';  // Replace with your actual studio identifier

    const frames = await fetchData1(table, Studio);
    const { groupedData, totalTableMoney } = groupDataByDate(frames);

    populateAnalyticsTable(groupedData, totalTableMoney);
}

// Run the init function when the page loads
window.addEventListener('load', init);
