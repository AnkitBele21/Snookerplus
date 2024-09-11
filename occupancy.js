// Convert UTC time to IST (Indian Standard Time)
function toIST(date) {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

async function fetchTableData(studio) {
    const url = `https://app.snookerplus.in/apis/data/frames/${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Full API response:', data); // Log the full API response

        if (!data || data.length === 0) {
            console.warn('API returned empty data or invalid structure:', data);
            return [];
        }

        return data[0]; // Returning the first element, assuming the data structure is an array
    } catch (error) {
        console.error('Error fetching table data:', error);
        return [];
    }
}

function filterDataByDate(tableData, targetDate) {
    console.log('Filtering data for target date:', targetDate);

    return tableData.filter(entry => {
        const startDate = toIST(new Date(entry.StartTime));
        const offDate = toIST(new Date(entry.OffTime));

        console.log(`Entry Start: ${startDate}, Entry End: ${offDate}`); // Log for debugging

        const targetDateObj = new Date(targetDate);
        
        // Filter based on if the entry spans or occurs on the target date
        const isValid = (
            startDate.toDateString() === targetDateObj.toDateString() ||
            offDate.toDateString() === targetDateObj.toDateString() ||
            (startDate < targetDateObj && offDate > targetDateObj)
        );

        console.log(`Is valid for target date (${targetDate})?`, isValid);
        return isValid;
    });
}

function getTableOccupancy(filteredData, targetDate) {
    const occupancyData = {};

    // Define the time range for the target date (00:00 - 23:59)
    const targetDateStart = new Date(`${targetDate}T00:00:00`);
    const targetDateEnd = new Date(`${targetDate}T23:59:59`);

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        let startTime = toIST(new Date(entry.StartTime));
        let offTime = toIST(new Date(entry.OffTime));

        // Adjust times if the entry spans outside the target date
        if (startTime < targetDateStart) startTime = targetDateStart;
        if (offTime > targetDateEnd) offTime = targetDateEnd;

        // Skip entries with no valid overlap with the target date
        if (offTime <= startTime) return;

        // Initialize occupancy data for the table if it doesn't exist
        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        occupancyData[tableId].push({
            date: targetDate,
            startTime: startTime.getHours() + startTime.getMinutes() / 60,
            offTime: offTime.getHours() + offTime.getMinutes() / 60,
        });
    });

    // Sort each table's entries by start time
    Object.keys(occupancyData).forEach(tableId => {
        occupancyData[tableId].sort((a, b) => a.startTime - b.startTime);
    });

    return occupancyData;
}

function displayTableOccupancyChart(occupancyData) {
    const chartContainer = document.getElementById('tableOccupancyChart');
    chartContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const datasets = [];
    const uniqueDates = [];

    Object.keys(occupancyData).forEach(tableId => {
        const dataPoints = occupancyData[tableId].map(entry => {
            if (!uniqueDates.includes(entry.date)) uniqueDates.push(entry.date);

            return {
                x: entry.date,
                y: [entry.startTime, entry.offTime]  // Start and end times as y values
            };
        });

        const randomColor = `rgba(${Math.floor(Math.random() * 255)}, 99, 132, 0.5)`;

        datasets.push({
            label: `Table ${tableId}`, 
            data: dataPoints,
            backgroundColor: randomColor,
            borderColor: randomColor.replace('0.5', '1'),
            borderWidth: 1
        });
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: uniqueDates,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 24,
                    ticks: {
                        stepSize: 0.25,  // 15-minute intervals
                        callback: function (value) {
                            const hours = Math.floor(value);
                            const minutes = Math.floor((value - hours) * 60);
                            return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`; 
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time (24-hour scale)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}

function displayTableOccupancyTable(occupancyData) {
    const tableContainer = document.getElementById('tableOccupancyTable');
    tableContainer.innerHTML = '';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    ['Table ID', 'Date', 'Start Time', 'End Time'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Sort table IDs for better readability
    const sortedTableIds = Object.keys(occupancyData).sort((a, b) => parseInt(a.replace('T', '')) - parseInt(b.replace('T', '')));

    sortedTableIds.forEach(tableId => {
        const tableHeaderRow = document.createElement('tr');
        const tdTable = document.createElement('td');
        tdTable.textContent = `Table ${tableId}`;
        tdTable.colSpan = 4;
        tdTable.style.fontWeight = 'bold';
        tableHeaderRow.appendChild(tdTable);
        tbody.appendChild(tableHeaderRow);

        occupancyData[tableId].forEach(entry => {
            const row = document.createElement('tr');

            const tdTableId = document.createElement('td');
            tdTableId.textContent = ''; // Empty cell under 'Table' header
            row.appendChild(tdTableId);

            const tdDate = document.createElement('td');
            tdDate.textContent = entry.date;
            row.appendChild(tdDate);

            const tdStartTime = document.createElement('td');
            tdStartTime.textContent = formatTime(entry.startTime);
            row.appendChild(tdStartTime);

            const tdEndTime = document.createElement('td');
            tdEndTime.textContent = formatTime(entry.offTime);
            row.appendChild(tdEndTime);

            tbody.appendChild(row);
        });
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

function formatTime(fractionalHour) {
    const hours = Math.floor(fractionalHour);
    const minutes = Math.round((fractionalHour - hours) * 60);
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
}

// Function to initialize and handle date changes
async function init() {
    const studio = 'Studio 111';
    const dateInput = document.getElementById('dateSelector');

    // Initialize with today's date
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load data for the default date (today)
    await loadDataForDate(studio, today);

    // Add event listener for date changes
    dateInput.addEventListener('change', async (event) => {
        const selectedDate = event.target.value;
        console.log('Date selected:', selectedDate);
        await loadDataForDate(studio, selectedDate);
    });
}

async function loadDataForDate(studio, targetDate) {
    const tableData = await fetchTableData(studio);
    const filteredData = filterDataByDate(tableData, targetDate);
    const occupancyData = getTableOccupancy(filteredData, targetDate);

    displayTableOccupancyChart(occupancyData);
    displayTableOccupancyTable(occupancyData);
}

// Initialize the script
init();
