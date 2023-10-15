const API_KEY = 'AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc';
const SHEET_ID = '1Bcl1EVN-7mXUP7M1FL9TBB5v4O4AFxGTVB6PwqOn9ss';

async function fetchData(sheetName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.values;
}

function createGraph(data, labels, canvasId, graphTitle) {
    // Filter out zero values and corresponding labels
    const nonZeroIndices = data.map((val, idx) => val !== '0' ? idx : -1).filter(idx => idx !== -1);
    const filteredData = nonZeroIndices.map(idx => data[idx]);
    const filteredLabels = nonZeroIndices.map(idx => labels[idx]);

    var ctx = document.getElementById(canvasId).getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredLabels,
            datasets: [{
                label: graphTitle,
                data: filteredData,
                backgroundColor: '#01AB7A',
                borderColor: '#018a5e',
                borderWidth: 1,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Details for ${filteredLabels[context[0].dataIndex]}`;
                        }
                    }
                }
            },
            title: {
                display: true,
                text: graphTitle,
                font: {
                    size: 18,
                    weight: 'bold'
                },
                color: '#01AB7A'
            }
        }
    });
}

// ...

async function createTableWisePerformanceGraph(sheetName) {
    const data = await fetchData(sheetName);
    const tables = data.map((row, index) => index + 1);
    const occupancy = data.map(row => row[1]);
    const filteredData = occupancy.filter(val => val !== '0');
    const filteredTables = tables.slice(0, filteredData.length);
    createGraph(filteredData, filteredTables, 'tableWisePerformanceChart', 'Tables Occupied');
}

async function createDateWisePerformanceGraph(sheetName) {
    const data = await fetchData(sheetName);
    const dates = data.map((row, index) => index + 1);
    const occupancy = data.map(row => row[9]);
    const filteredData = occupancy.filter(val => val !== '0');
    const filteredDates = dates.slice(0, filteredData.length);
    createGraph(filteredData, filteredDates, 'dateWisePerformanceChart', 'Club Performance by Date');
}

// ...

window.onload = function() {
    createTableWisePerformanceGraph('club'); // Graph for data in 'club' sheet
    createDateWisePerformanceGraph('club2'); // Graph for data in 'club2' sheet
    applyFilters();
};

function displayFrameEntries(frameEntries) {
    const frameEntriesContainer = document.getElementById('frameEntries');
    frameEntries.forEach(entry => {
        const frameElement = document.createElement('div');
        frameElement.className = 'frame-entry';
        
        const dateElement = document.createElement('p');
        dateElement.innerText = `Date: ${entry.date}`;
        frameElement.appendChild(dateElement);
        
        const durationElement = document.createElement('p');
        durationElement.innerText = `Duration: ${entry.duration} min`;
        frameElement.appendChild(durationElement);
        
        const startTimeElement = document.createElement('p');
        startTimeElement.innerText = `Start Time: ${entry.startTime}`;
        frameElement.appendChild(startTimeElement);
        
        const playersElement = document.createElement('p');
        playersElement.innerText = `Players: ${entry.playerNames.join(', ')}`;
        frameElement.appendChild(playersElement);
        
        const frameMoneyElement = document.createElement('p');
        frameMoneyElement.innerText = `Frame Money: ${entry.frameMoney}`;
        frameElement.appendChild(frameMoneyElement);
        
        frameEntriesContainer.appendChild(frameElement);
    });
}

function applyFilters() {
    const playerNameFilter = document.getElementById('playerNameFilter').value.toLowerCase();
    const dateFilter = document.getElementById('dateFilter').value;
    
    fetchFrameEntries().then(frameEntries => {
        let filteredEntries = frameEntries;
        
        if (playerNameFilter) {
            filteredEntries = filteredEntries.filter(entry =>
                entry.playerNames.some(name => name.toLowerCase().includes(playerNameFilter))
            );
        }
        
        if (dateFilter) {
            filteredEntries = filteredEntries.filter(entry => entry.date === dateFilter);
        }
        
        if (!playerNameFilter && !dateFilter) {
            const latestDate = Math.max(...frameEntries.map(entry => new Date(entry.date)));
            filteredEntries = frameEntries.filter(entry => new Date(entry.date).getTime() === latestDate);
        }
        
        document.getElementById('frameEntries').innerHTML = '';
        displayFrameEntries(filteredEntries);
    });
}

window.onload = function() {
    createTableWisePerformanceGraph();
    createDateWisePerformanceGraph();
    applyFilters();
};
