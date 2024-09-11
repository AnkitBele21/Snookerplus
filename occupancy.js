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

        return data[0]; // Log the full raw data for further inspection
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

        // Log the data for debugging
        console.log(`Entry Start: ${startDate}, Entry End: ${offDate}`);

        // Include entries where the time spans across midnight (or the target date)
        const isSameDay = startDate.toDateString() === offDate.toDateString();
        const targetDateObj = new Date(targetDate);

        const isValid = (
            // Check if the entry starts or ends on the target date
            (startDate.toDateString() === targetDateObj.toDateString()) ||
            (offDate.toDateString() === targetDateObj.toDateString()) ||
            // Check if the entry spans across the target date
            (startDate < targetDateObj && offDate > targetDateObj)
        );

        console.log(`Is valid for target date (${targetDate})?`, isValid);
        return isValid;
    });
}



function getTableOccupancy(filteredData, targetDate) {
    const occupancyData = {};

    // Define target date range
    const targetDateStart = new Date(`${targetDate}T00:00:00`);  // Start at 00:00
    const targetDateEnd = new Date(`${targetDate}T23:59:59`);    // End at 23:59

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        let startTime = toIST(new Date(entry.StartTime));
        let offTime = toIST(new Date(entry.OffTime));

        // Adjust times if they span across the target date
        if (startTime < targetDateStart) {
            startTime = targetDateStart;
        }
        if (offTime > targetDateEnd) {
            offTime = targetDateEnd;
        }

        // Skip if no overlap with target date
        if (offTime <= startTime) {
            return;
        }

        // Initialize occupancy data for the table
        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        occupancyData[tableId].push({
            date: targetDate,
            startTime: startTime.getHours() + startTime.getMinutes() / 60,
            offTime: offTime.getHours() + offTime.getMinutes() / 60,
        });
    });

    // Sort entries for each table by start time
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
            const startHour = entry.startTime;
            const offHour = entry.offTime;
            if (!uniqueDates.includes(entry.date)) {
                uniqueDates.push(entry.date);
            }
            return {
                x: entry.date,
                y: [startHour, offHour]
            };
        });

        const dataset = {
            label: `Table ${tableId}`, 
            data: dataPoints,
            backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, 99, 132, 0.5)`,
            borderColor: `rgba(${Math.floor(Math.random() * 255)}, 99, 132, 1)`,
            borderWidth: 1
        };

        datasets.push(dataset);
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
                        stepSize: 0.25,  // Increase y-axis detail with 15-minute intervals
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

    function compareTableIds(a, b) {
        const numA = parseInt(a.replace('T', ''));
        const numB = parseInt(b.replace('T', ''));
        return numA - numB;
    }

    const sortedTableIds = Object.keys(occupancyData).sort(compareTableIds);

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
            tdTableId.textContent = ''; 
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

// Function to re-initialize based on date selection
async function init() {
    const studio = 'Studio 111';
    const dateInput = document.getElementById('dateSelector');

    // Initialize with today's date
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Trigger loading for the default date (today)
    await loadDataForDate(studio, today);

    // Add event listener for date changes
    dateInput.addEventListener('change', async (event) => {
        const selectedDate = event.target.value;
        console.log('Date selected:', selectedDate); // Log the selected date
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

init();
