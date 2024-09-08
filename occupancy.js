async function fetchTableData(studio, date) {
    const url = `https://app.snookerplus.in/apis/data/frames/studio=${encodeURIComponent(studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched table data:', data);

        return data[0];
    } catch (error) {
        console.error('Error fetching table data:', error);
        return [];
    }
}

function filterDataByDate(tableData, targetDate) {
    return tableData.filter(entry => {
        const startDate = new Date(entry.StartTime);
        
        // Check if the startDate is a valid date
        if (isNaN(startDate.getTime())) {
            console.error('Invalid StartTime:', entry.StartTime);
            return false;
        }

        const formattedStartDate = startDate.toISOString().split('T')[0];
        return formattedStartDate === targetDate;
    });
}


function getTableOccupancy(filteredData) {
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
            startTime: startTime.toLocaleTimeString(),
            offTime: offTime.toLocaleTimeString(),
        });
    });

    return occupancyData;
}

function displayTableOccupancy(occupancyData) {
    const tableOccupancyDiv = document.getElementById('tableOccupancy');
    tableOccupancyDiv.innerHTML = '';

    Object.keys(occupancyData).forEach(tableId => {
        const tableDiv = document.createElement('div');
        tableDiv.classList.add('table-occupancy');

        const tableTitle = document.createElement('h3');
        tableTitle.textContent = `Table ${tableId}`;
        tableDiv.appendChild(tableTitle);

        occupancyData[tableId].forEach(occupancy => {
            const occupancyText = document.createElement('p');
            occupancyText.textContent = `Occupied: ${occupancy.startTime} to ${occupancy.offTime}`;
            tableDiv.appendChild(occupancyText);
        });

        tableOccupancyDiv.appendChild(tableDiv);
    });
}

async function init() {
    const studio = 'studio 111';
    const targetDate = '2024-08-31';
    const tableData = await fetchTableData(studio);

    const filteredData = filterDataByDate(tableData, targetDate);
    const occupancyData = getTableOccupancy(filteredData);

    displayTableOccupancy(occupancyData);
}

window.addEventListener('load', init);
