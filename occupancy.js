// Convert UTC time to IST (Indian Standard Time)
function toIST(date) {
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
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

        return data[0];
    } catch (error) {
        console.error('Error fetching table data:', error);
        return [];
    }
}

function filterDataByDate(tableData, targetDate) {
    console.log('Filtering data for target date:', targetDate);

    return tableData.filter(entry => {
        const startDate = new Date(entry.StartTime);
        const offDate = new Date(entry.OffTime);

        // Format both dates to 'YYYY-MM-DD'
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedOffDate = offDate.toISOString().split('T')[0];

        // Return entries where either the start or off dates match the target date
        return formattedStartDate === targetDate || formattedOffDate === targetDate;
    });
}


function getTableOccupancy(filteredData) {
    const occupancyData = {};

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);

        // Initialize the occupancy structure if not done yet
        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        // If the entry crosses the date boundary (start and off dates are different)
        if (startTime.toISOString().split('T')[0] !== offTime.toISOString().split('T')[0]) {
            // Part 1: For the current day, from the start time to 23:59
            const endOfDay = 23 + 59 / 60;  // Representing 23:59 as fractional hours

            occupancyData[tableId].push({
                date: startTime.toISOString().split('T')[0],  // Current day
                startTime: startTime.getHours() + startTime.getMinutes() / 60,
                offTime: endOfDay  // End at 23:59
            });

            // Part 2: For the next day, from 00:00 to the actual offTime
            const offHour = offTime.getHours() + offTime.getMinutes() / 60;
            occupancyData[tableId].push({
                date: offTime.toISOString().split('T')[0],  // Next day
                startTime: 0,  // Midnight (00:00)
                offTime: offHour  // Actual off time on the next day
            });
        } else {
            // If no date boundary is crossed, add the entry directly
            occupancyData[tableId].push({
                date: startTime.toISOString().split('T')[0],
                startTime: startTime.getHours() + startTime.getMinutes() / 60,
                offTime: offTime.getHours() + offTime.getMinutes() / 60
            });
        }
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
            backgroundColor: `rgba(${Math.random() * 255}, 99, 132, 0.5)`,
            borderColor: `rgba(${Math.random() * 255}, 99, 132, 1)`,
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
    const minutes = Math.floor((fractionalHour - hours) * 60);
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
}

async function init() {
    const studio = 'Studio 111';
    const targetDate = '2024-09-10';

    const tableData = await fetchTableData(studio);
    if (!tableData || tableData.length === 0) return;

    const filteredData = filterDataByDate(tableData, targetDate);
    if (filteredData.length === 0) return;

    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancyChart(occupancyData);
    displayTableOccupancyTable(occupancyData);
}

window.addEventListener('load', init);
