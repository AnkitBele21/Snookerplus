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

        // Ensure both startDate and offDate match the target date
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedOffDate = offDate.toISOString().split('T')[0];

        // Return true only if both start and off dates are the same as the targetDate
        return formattedStartDate === targetDate && formattedOffDate === targetDate;
    });
}

function getTableOccupancy(filteredData) {
    const occupancyData = {};

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);

        if (offTime < startTime) {
            console.warn(`Skipping entry with StartTime: ${startTime.toISOString()} and OffTime: ${offTime.toISOString()}`);
            return;
        }

        const timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

        const startHour = parseFloat(entry.StartTime.split('T')[1].split(':')[0]) + parseFloat(entry.StartTime.split(':')[1]) / 60;
        const offHour = parseFloat(entry.OffTime.split('T')[1].split(':')[0]) + parseFloat(entry.OffTime.split(':')[1]) / 60;

        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        occupancyData[tableId].push({
            date: startTime.toISOString().split('T')[0],
            startTime: startHour,
            offTime: offHour,
        });
    });

    return occupancyData;
}

function displayTableOccupancyChart(occupancyData) {
    const chartContainer = document.getElementById('tableOccupancyChart');
    chartContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const tableOccupancy = {};

    occupancyData.forEach(entry => {
        const dateKey = entry.date;

        if (!tableOccupancy[dateKey]) {
            tableOccupancy[dateKey] = [];
        }

        // Parse start and end time into hours and minutes
        const startTimeParts = entry.startTime.split(':').map(Number);
        const offTimeParts = entry.offTime.split(':').map(Number);

        // Calculate start and end time as fractional hours
        const startTime = startTimeParts[0] + startTimeParts[1] / 60;
        const offTime = offTimeParts[0] + offTimeParts[1] / 60;

        // Push data for each table with the respective start and off time
        tableOccupancy[dateKey].push({
            tableId: entry.tableId,
            startTime: entry.startTime,
            offTime: entry.offTime,
            startFractionalTime: startTime,
            offFractionalTime: offTime
        });
    });

    // Create datasets for each table
    const datasets = [];
    Object.keys(tableOccupancy).forEach(dateKey => {
        tableOccupancy[dateKey].forEach(entry => {
            const dataset = {
                label: `Table ${entry.tableId} on ${entry.date}`,
                data: [{
                    x: entry.date,
                    y: [entry.startFractionalTime, entry.offFractionalTime]
                }],
                backgroundColor: `rgba(${Math.random() * 255}, 99, 132, 0.5)`,
                borderColor: `rgba(${Math.random() * 255}, 99, 132, 1)`,
                borderWidth: 1
            };
            datasets.push(dataset);
        });
    });

    const uniqueDates = [...new Set(occupancyData.map(entry => entry.date))];

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
                            return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`; // Format back to HH:MM
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

    Object.keys(occupancyData).forEach(tableId => {
        occupancyData[tableId].forEach(entry => {
            const row = document.createElement('tr');
            [tableId, entry.date, entry.startTime, entry.offTime].forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

async function init() {
    const studio = 'Studio 111';
    const targetDate = '2024-09-09';

    const tableData = await fetchTableData(studio);
    if (!tableData || tableData.length === 0) return;

    const filteredData = filterDataByDate(tableData, targetDate);
    if (filteredData.length === 0) return;

    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancyChart(occupancyData);
    displayTableOccupancyTable(occupancyData);
}

window.addEventListener('load', init);
