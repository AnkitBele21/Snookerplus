async function fetchTableData(studio) {
    const url = `https://app.snookerplus.in/apis/data/frames/${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Full API response:', data);

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

function filterDataByTableAndDate(tableData, targetTableId, targetDate) {
    console.log('Filtering data for table:', targetTableId, 'and target date:', targetDate);

    const filtered = tableData.filter(entry => {
        const tableId = entry.TableId;

        // Check if this entry is for the target table
        if (tableId !== targetTableId) {
            return false;
        }

        const startDate = new Date(entry.StartTime);
        
        if (isNaN(startDate.getTime())) {
            console.error('Invalid StartTime:', entry.StartTime);
            return false;
        }

        const formattedStartDate = startDate.toISOString().split('T')[0];
        return formattedStartDate === targetDate;
    });

    console.log('Filtered data:', filtered);
    return filtered;
}

function getTableOccupancy(filteredData) {
    console.log('Generating table occupancy data from filtered data:', filteredData);

    const occupancyData = {};

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        const startTime = new Date(entry.StartTime);
        const offTime = new Date(entry.OffTime);

        const cleanTableId = tableId.replace(/studio\s*\d+/i, '').trim();

        if (!occupancyData[cleanTableId]) {
            occupancyData[cleanTableId] = [];
        }

        occupancyData[cleanTableId].push({
            date: startTime.toISOString().split('T')[0], // Store date separately
            startTime: startTime.toLocaleTimeString(),    // Get time from StartTime
            offTime: offTime.toLocaleTimeString()         // Get time from OffTime
        });
    });

    console.log('Occupancy data:', occupancyData);
    return occupancyData;
}

function displayTableOccupancy(occupancyData) {
    const tableOccupancyDiv = document.getElementById('tableOccupancy');
    tableOccupancyDiv.innerHTML = '';

    const canvas = document.createElement('canvas');
    tableOccupancyDiv.appendChild(canvas);
    
    const datasets = [];

    // Loop through each table and prepare data for Chart.js
    Object.keys(occupancyData).forEach((tableId, index) => {
        const tableOccupancy = occupancyData[tableId];

        const data = [];
        tableOccupancy.forEach((occupancy) => {
            const startTime = new Date(`${occupancy.date} ${occupancy.startTime}`);
            const offTime = new Date(`${occupancy.date} ${occupancy.offTime}`);

            // Convert times to hours (on a 24-hour scale)
            const startHour = startTime.getHours() + startTime.getMinutes() / 60;
            const endHour = offTime.getHours() + offTime.getMinutes() / 60;

            data.push({
                x: occupancy.date,
                y: [startHour, endHour]
            });
        });

        datasets.push({
            label: `Table ${tableId}`,
            data: data,
            backgroundColor: `rgba(${(index * 50) % 255}, 99, 132, 0.5)`, // Use different colors for each table
            borderColor: `rgba(${(index * 50) % 255}, 99, 132, 1)`,
            borderWidth: 1
        });
    });

    // Create the chart
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: occupancyData[Object.keys(occupancyData)[0]].map(o => o.date),
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 24,
                    ticks: {
                        callback: function(value) {
                            // Display times in "HH:mm" format
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

async function init() {
    const studio = 'Studio 111';
    const targetTableId = 'T1Studio 111'; // The table you're filtering for
    const targetDate = '2024-09-08'; // The date you're filtering for

    console.log('Initializing...');

    const tableData = await fetchTableData(studio);

    if (!tableData || tableData.length === 0) {
        console.error('No table data found.');
        return;
    }

    const filteredData = filterDataByTableAndDate(tableData, targetTableId, targetDate);

    if (filteredData.length === 0) {
        console.log('No data for the specified table and date.');
        return;
    }

    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancy(occupancyData);
}

window.addEventListener('load', init);
