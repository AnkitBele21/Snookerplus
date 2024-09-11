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

        console.log(`Entry Start: ${startDate}, Entry End: ${offDate}`);

        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedOffDate = offDate.toISOString().split('T')[0];

        console.log(`Formatted Start: ${formattedStartDate}, Formatted End: ${formattedOffDate}`);

        const isValid = formattedStartDate === targetDate || formattedOffDate === targetDate;
        console.log(`Is valid for target date (${targetDate})?`, isValid);

        return isValid;
    });
}

function getTableOccupancy(filteredData, targetDate) {
    const occupancyData = {};

    const targetDateStart = new Date(`${targetDate}T00:01:00`);  // Start at 00:01
    const targetDateEnd = new Date(`${targetDate}T23:59:00`);    // End at 23:59

    filteredData.forEach(entry => {
        const tableId = entry.TableId;
        let startTime = toIST(new Date(entry.StartTime));
        let offTime = toIST(new Date(entry.OffTime));

        if (startTime < targetDateStart) {
            startTime = targetDateStart;
        }
        if (offTime > targetDateEnd) {
            offTime = targetDateEnd;
        }

        if (offTime <= startTime) {
            return;
        }

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
    canvas.style.height = '600px';  // Increase the height of the graph
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
}

init();
