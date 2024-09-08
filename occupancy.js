async function fetchTableData(studio) {
    const url = `https://app.snookerplus.in/apis/data/frames/studio=${encodeURIComponent(studio)}`;
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

    if (Object.keys(occupancyData).length === 0) {
        tableOccupancyDiv.textContent = 'No occupancy data available for the selected table and date.';
        return;
    }

    Object.keys(occupancyData).forEach(tableId => {
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table-occupancy');

        const tableTitle = document.createElement('h3');
        tableTitle.textContent = `Table ${tableId}`;
        tableDiv.appendChild(tableTitle);

        occupancyData[tableId].forEach(occupancy => {
            const occupancyText = document.createElement('p');
            occupancyText.textContent = `Occupied: ${occupancy.startTime} to ${occupancy.offTime} on ${occupancy.date}`;
            tableDiv.appendChild(occupancyText);
        });

        tableOccupancyDiv.appendChild(tableDiv);
    });

    console.log('Displayed table occupancy.');
}

async function init() {
    const studio = 'studio 111';
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
