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

        if (!Array.isArray(data) || data.length === 0) {
            console.warn('API returned empty data or invalid structure:', data);
            return [];
        }

        return data[0];
    } catch (error) {
        console.error('Error fetching table data:', error);
        return [];
    }
}

function filterDataByTableAndDate(tableData, targetTableId, targetDate) {
    console.log('Filtering data for table:', targetTableId, 'and target date:', targetDate);

    return tableData.filter(entry => {
        const tableId = entry.TableId;
        const startDate = new Date(entry.StartTime);
        const formattedStartDate = startDate.toISOString().split('T')[0];
        return tableId === targetTableId && formattedStartDate === targetDate;
    });
}

function getTableOccupancy(filteredData) {
    const occupancyData = [];

    filteredData.forEach(entry => {
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);

        // Skip the entry if OffTime is less than StartTime (shouldn't happen with valid data)
        if (offTime < startTime) {
            console.warn(`Skipping entry with StartTime: ${startTime.toISOString()} and OffTime: ${offTime.toISOString()}`);
            return;
        }

        const startDate = startTime.toISOString().split('T')[0];
        const offDate = offTime.toISOString().split('T')[0];

        // Ensure OffTime does not cross over to the next day
        if (startDate !== offDate) {
            console.warn(`Ignoring entry with OffTime crossing midnight: ${entry}`);
            return;
        }

        const timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }; // 24-hour format

        occupancyData.push({
            tableId: entry.TableId,
            date: startDate,
            startTime: startTime.toLocaleTimeString('en-GB', timeOptions),
            offTime: offTime.toLocaleTimeString('en-GB', timeOptions)
        });
    });

    // Sort the occupancyData by date and startTime
    occupancyData.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
        const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
        return dateA - dateB;
    });

    return occupancyData;
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

function createOccupancyChart(canvas, occupancyData) {
    const datasets = occupancyData.map((entry, index) => {
        const startTime = new Date(`${entry.date} ${entry.startTime}`);
        const offTime = new Date(`${entry.date} ${entry.offTime}`);

        // Convert times to hours (on a 24-hour scale)
        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
        const endHour = offTime.getHours() + offTime.getMinutes() / 60;

        return {
            label: `Table ${entry.tableId}`,
            data: [{
                x: entry.date,
                y: [startHour, endHour]
            }],
            backgroundColor: `rgba(${(index * 50) % 255}, 99, 132, 0.5)`,
            borderColor: `rgba(${(index * 50) % 255}, 99, 132, 1)`,
            borderWidth: 1
        };
    });

    // Create the chart
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: occupancyData.map(o => o.date),
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 24,
                    ticks: {
                        callback: function(value) {
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
                    }
                }
            }
        }
    });
}

function displayTableOccupancyChart(occupancyData) {
    const chartContainer = document.getElementById('tableOccupancyChart');
    chartContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    createOccupancyChart(canvas, occupancyData);
}

async function init() {
    const studio = 'Studio 111';
    const targetTableId = 'T1Studio 111';
    const targetDate = '2024-09-09';

    const tableData = await fetchTableData(studio);
    if (!tableData || tableData.length === 0) return;

    const filteredData = filterDataByTableAndDate(tableData, targetTableId, targetDate);
    if (filteredData.length === 0) return;

    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancyChart(occupancyData);
    displayTableOccupancyTable(occupancyData);
}

window.addEventListener('load', init);
