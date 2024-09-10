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

function filterDataByTablesAndDate(tableData, targetTableIds, targetDate) {
    console.log('Filtering data for tables:', targetTableIds, 'and target date:', targetDate);

    const filtered = tableData.filter(entry => {
        const tableId = entry.TableId;
        const startDate = new Date(entry.StartTime);
        const offDate = new Date(entry.OffTime);

        // Ensure both startDate and offDate match the target date
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedOffDate = offDate.toISOString().split('T')[0];

        // Return true if the table ID is in the targetTableIds array and both start and off dates match the target date
        return targetTableIds.includes(tableId) && formattedStartDate === targetDate && formattedOffDate === targetDate;
    });

    console.log('Filtered data:', filtered);
    return filtered;
}


function getTableOccupancy(filteredData) {
    const occupancyData = [];

    filteredData.forEach(entry => {
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);

        if (offTime < startTime) {
            console.warn(`Skipping entry with StartTime: ${startTime.toISOString()} and OffTime: ${offTime.toISOString()}`);
            return;
        }

        const timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };

        // Handle entries that cross midnight
        while (startTime.getDate() !== offTime.getDate() || startTime.getMonth() !== offTime.getMonth()) {
            // Create a split entry for the current day
            const endOfDay = new Date(startTime);
            endOfDay.setHours(23, 59, 59, 999);

            occupancyData.push({
                tableId: entry.TableId,
                date: startTime.toISOString().split('T')[0],
                startTime: startTime.toLocaleTimeString('en-GB', timeOptions),
                offTime: endOfDay.toLocaleTimeString('en-GB', timeOptions)
            });

            // Move the start time to the next day at 00:00:00
            startTime.setDate(startTime.getDate() + 1);
            startTime.setHours(0, 0, 0, 0);
        }

        // Add the final part of the entry
        occupancyData.push({
            tableId: entry.TableId,
            date: startTime.toISOString().split('T')[0],
            startTime: startTime.toLocaleTimeString('en-GB', timeOptions),
            offTime: offTime.toLocaleTimeString('en-GB', timeOptions)
        });
    });

    return occupancyData;
}

function displayTableOccupancyChart(occupancyData) {
    const chartContainer = document.getElementById('tableOccupancyChart');
    chartContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const tableLabels = {
        'T1Studio 111': 'T1',
        'T2Studio 111': 'T2',
        'T3Studio 111': 'T3',
        'T4Studio 111': 'T4'
    };

    const tableOccupancy = {};

    // Iterate through occupancy data and map to table + date combinations
    occupancyData.forEach(entry => {
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);
        const dateKey = startTime.toISOString().split('T')[0]; // Format date as 'YYYY-MM-DD'
        const tableKey = tableLabels[entry.TableId] || entry.TableId;

        // Use 'dateKey tableKey' as the new identifier for the x-axis
        const labelKey = `${dateKey} ${tableKey}`;

        if (!tableOccupancy[labelKey]) {
            tableOccupancy[labelKey] = {
                label: labelKey,
                data: [],
                backgroundColor: `rgba(${Math.random() * 255}, 99, 132, 0.5)`,
                borderColor: `rgba(${Math.random() * 255}, 99, 132, 1)`,
                borderWidth: 1
            };
        }

        const timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }; // 24-hour format

        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        const endHour = offTime.getHours() + offTime.getMinutes() / 60;

        // Add data to this label
        tableOccupancy[labelKey].data.push({
            x: labelKey, // Combine date and table for x-axis label
            y: [startHour, endHour]
        });
    });

    // Create datasets from aggregated data
    const datasets = Object.values(tableOccupancy);

    // Create the chart
    new Chart(canvas, {
        type: 'bar',
        data: {
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
                        text: 'Date & Table'
                    },
                    ticks: {
                        autoSkip: false // Make sure all table/date combinations are shown
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

    occupancyData.forEach(entry => {
        const row = document.createElement('tr');
        [entry.tableId, entry.date, entry.startTime, entry.offTime].forEach(cellText => {
            const td = document.createElement('td');
            td.textContent = cellText;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

async function init() {
    const studio = 'Studio 111';
    const targetTableIds = ['T1Studio 111', 'T2Studio 111', 'T3Studio 111', 'T4Studio 111'];
    const targetDate = '2024-09-09';

    const tableData = await fetchTableData(studio);
    if (!tableData || tableData.length === 0) return;

    const filteredData = filterDataByTablesAndDate(tableData, targetTableIds, targetDate);
    if (filteredData.length === 0) return;

    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancyChart(occupancyData);
    displayTableOccupancyTable(occupancyData);
}

window.addEventListener('load', init);
