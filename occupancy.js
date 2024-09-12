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
        console.log('Full API response:', data);

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

        console.log(`Entry Start: ${startDate}, Entry End: ${offDate}`);

        const targetDateObj = new Date(targetDate);
        
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

    const targetDateStart = new Date(`${targetDate}T00:00:00`);
    const targetDateEnd = new Date(`${targetDate}T23:59:59`);

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        let startTime = toIST(new Date(entry.StartTime));
        let offTime = toIST(new Date(entry.OffTime));

        if (startTime < targetDateStart) startTime = targetDateStart;
        if (offTime > targetDateEnd) offTime = targetDateEnd;

        if (offTime <= startTime) return;

        if (!occupancyData[tableId]) {
            occupancyData[tableId] = [];
        }

        occupancyData[tableId].push({
            date: targetDate,
            startTime: startTime.getHours() + startTime.getMinutes() / 60,
            offTime: offTime.getHours() + offTime.getMinutes() / 60,
        });
    });

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
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                min: 6, // Starting at 06:00
                max: 30, // Ending at 05:00 of the next day (24 + 6)
                ticks: {
                    stepSize: 1, // 1-hour intervals
                    callback: function (value) {
                        let adjustedValue = value;
                        if (value >= 24) {
                            adjustedValue = value - 24; // Adjust for times past 24:00
                        }
                        const hours = Math.floor(adjustedValue);
                        const minutes = Math.floor((adjustedValue - hours) * 60);
                        return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`; 
                    }
                },
                title: {
                    display: true,
                    text: 'Time (24-hour scale)',
                    font: { size: window.innerWidth < 768 ? 10 : 14 }
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date',
                    font: { size: window.innerWidth < 768 ? 10 : 14 }
                },
                ticks: {
                    autoSkip: false,
                    font: { size: window.innerWidth < 768 ? 10 : 12 }
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    font: { size: window.innerWidth < 768 ? 10 : 14 }
                }
            }
        }
    }
});
}

async function init() {
    const studio = 'Studio 111';
    const dateInput = document.getElementById('dateSelector');

    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    await loadDataForDate(studio, today);

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
}

// Initialize the script
init();
