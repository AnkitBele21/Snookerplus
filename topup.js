async function fetchTopupData(studio) {
    const url = `https://v2api.snookerplus.in/apis/data/topup/${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched topup data:', data);

        return data[0];
    } catch (error) {
        console.error('Error fetching topup data:', error);
        return [];
    }
}

function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach(topup => {
        // Debugging: Log the topup data
        console.log('Topup entry:', topup);

        if (!topup.RecordDate) {
            console.error('RecordDate is undefined:', topup);
            return; // Skip entries with undefined RecordDate
        }

        const date = new Date(topup.RecordDate);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', topup.RecordDate, 'Date:', date);
            return; // Skip invalid dates
        }

        const dateString = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        const amount = parseFloat(topup.Amount) || 0;

        if (!groupedData[dateString]) {
            groupedData[dateString] = { cash: 0, online: 0 };
        }

        const mode = topup.Mode.trim().toLowerCase();
        console.log('Processing Mode:', mode); // Add this line

        if (mode === 'cash') {
            groupedData[dateString].cash += amount;
        } else if (mode === 'online') {
            groupedData[dateString].online += amount;
        } else {
            console.error('Unknown mode:', topup.Mode);
        }
    });

    return groupedData;
}

function populateTopupTable(groupedData) {
    const topupTableBody = document.querySelector('#topupTable tbody');
    const totalTopupElem = document.querySelector('#totalTopup');
    const onlineTotalElem = document.querySelector('#onlineTotal');
    const cashTotalElem = document.querySelector('#cashTotal');
    
    if (!topupTableBody) {
        console.error('Element with ID "topupTable" not found.');
        return;
    }

    topupTableBody.innerHTML = '';  // Clear any existing rows

    let totalTopup = 0;
    let onlineTotal = 0;
    let cashTotal = 0;

    Object.keys(groupedData).forEach(date => {
        const { cash, online } = groupedData[date];
        const total = cash + online;

        totalTopup += total;
        onlineTotal += online;
        cashTotal += cash;

        const row = topupTableBody.insertRow();
        const dateCell = row.insertCell(0);
        const totalCell = row.insertCell(1);
        const onlineCell = row.insertCell(2);
        const cashCell = row.insertCell(3);

        dateCell.textContent = date;
        totalCell.textContent = total.toFixed(2);
        onlineCell.textContent = online.toFixed(2);
        cashCell.textContent = cash.toFixed(2);
    });

    // Update the summary box
    totalTopupElem.textContent = totalTopup.toFixed(2);
    onlineTotalElem.textContent = onlineTotal.toFixed(2);
    cashTotalElem.textContent = cashTotal.toFixed(2);
}

function filterByDate(groupedData, selectedDate) {
    const filteredData = {};

    Object.keys(groupedData).forEach(date => {
        if (date === selectedDate) {
            filteredData[date] = groupedData[date];
        }
    });

    return filteredData;
}

async function init() {
    const studio = 'Studio 111';
    const topupData = await fetchTopupData(studio);
    console.log('Data received for processing:', topupData);
    const groupedData = groupTopupDataByDate(topupData);
    populateTopupTable(groupedData);

    // Date Selector Event Listener
    document.querySelector('#dateSelector').addEventListener('change', (event) => {
        const selectedDate = event.target.value;
        if (selectedDate) {
            const filteredData = filterByDate(groupedData, selectedDate);
            populateTopupTable(filteredData);
        } else {
            populateTopupTable(groupedData); // Show all data if no date is selected
        }
    });
}

window.addEventListener('load', init);
