// Helper function to get URL parameters
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, 'i');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Fetch table data from the API
async function fetchData(table, Studio, type = '') {
    const url = `https://app.snookerplus.in/apis/data/${type ? type + '/' : ''}${encodeURIComponent(Studio)}`;
    console.log(`Fetching ${type || 'table'} data from:`, url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Fetched ${type || 'table'} data:`, data);
        return data[0];
    } catch (error) {
        console.error(`Error fetching ${type || 'table'} data:`, error);
        return [];
    }
}

// Convert UTC date to IST
function convertToIST(date) {
    if (!date) return null;

    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(utcDate.getTime() + istOffset);
}

// Get the day of the week
function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
}

// Group frame data by date
function groupDataByDate(frames) {
    const groupedData = {};
    let totalTableMoney = 0;

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        if (!date || isNaN(date.getTime())) {
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const duration = parseInt(frame.Duration, 10) || 0;
        const totalMoney = parseFloat(frame.TotalMoney) || 0;
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = getDayOfWeek(date);

        if (!groupedData[dateString]) {
            groupedData[dateString] = { duration: 0, totalMoney: 0, dayOfWeek };
        }

        groupedData[dateString].duration += duration;
        groupedData[dateString].totalMoney += totalMoney;
        totalTableMoney += totalMoney;
    });

    return { groupedData, totalTableMoney };
}

// Group top-up data by date
function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach(topup => {
        if (!topup.RecordDate) {
            console.error('RecordDate is undefined:', topup);
            return;
        }

        const date = new Date(topup.RecordDate);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', topup.RecordDate);
            return;
        }

        const dateString = date.toISOString().split('T')[0];
        const amount = parseFloat(topup.Amount) || 0;

        if (!groupedData[dateString]) {
            groupedData[dateString] = { cash: 0, online: 0 };
        }

        if (topup.Mode === 'cash') {
            groupedData[dateString].cash += amount;
        } else if (topup.Mode === 'online') {
            groupedData[dateString].online += amount;
        }
    });

    return groupedData;
}

// Update the selected date box with data
function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
    const selectedDateBox = document.getElementById('selectedDateBox');
    if (!selectedDateBox) {
        console.error('Element with ID "selectedDateBox" not found.');
        return;
    }

    const dateString = new Date(selectedDate).toISOString().split('T')[0];
    const data = groupedData[dateString];
    const topupData = topupGroupedData[dateString];

    if (data) {
        selectedDateBox.innerHTML = `
            <h2>Details for ${dateString} (${data.dayOfWeek})</h2>
            <p>Total Duration: ${data.duration.toFixed(2)} minutes</p>
            <p>Total Money: ₹${data.totalMoney.toFixed(2)}</p>
        `;
    } else {
        selectedDateBox.innerHTML = `<p>No data available for ${dateString}</p>`;
    }

    if (topupData) {
        updateTotalReceivedBox(topupData.cash, topupData.online);
    } else {
        updateTotalReceivedBox(0, 0);
    }
}

// Update chart with grouped data
function updateChart(groupedData) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const labels = Object.keys(groupedData);
    const durations = labels.map(date => groupedData[date].duration);
    const totalMoney = labels.map(date => groupedData[date].totalMoney);

    const backgroundColors = labels.map(date => {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)';
    });

    const borderColors = labels.map(date => {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)';
    });

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Duration (minutes)',
                    data: durations,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                },
                {
                    label: 'Total Money',
                    data: totalMoney,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Values'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Update total table money display
function updateTotalMoneyBox(totalTableMoney) {
    const totalMoneyBox = document.getElementById('totalMoneyBox');
    if (!totalMoneyBox) {
        console.error('Element with ID "totalMoneyBox" not found.');
        return;
    }

    totalMoneyBox.innerHTML = `<p>Total Table Money: ₹${totalTableMoney.toFixed(2)}</p>`;
}

// Initialize the page and load data
async function init() {
    const table = 'frames';
    const Studio = getParameterByName('Studio') || 'Default Studio';
    console.log('Studio:', Studio);

    const frames = await fetchData(table, Studio);
    const topupData = await fetchData(table, Studio, 'topup');

    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const topupGroupedData = groupTopupDataByDate(topupData);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    });
}

window.addEventListener('load', init);
