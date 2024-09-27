// Helper function to get URL parameters
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, 'i');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Function to fetch data (frame data and top-up data)
async function fetchData(table, Studio, isTopup = false) {
    const apiPath = isTopup ? `topup/${encodeURIComponent(Studio)}` : `${table}/${encodeURIComponent(Studio)}`;
    const url = `https://app.snookerplus.in/apis/data/${apiPath}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data[0] || [];
    } catch (error) {
        console.error(`Error fetching ${isTopup ? 'topup' : 'frame'} data:`, error);
        return [];
    }
}

// Convert UTC to IST
function convertToIST(date) {
    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    return new Date(utcDate.getTime() + istOffset);
}

// Group frame data by date
function groupDataByDate(frames) {
    const groupedData = {};
    let totalTableMoney = 0;

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        const duration = parseInt(frame.Duration, 10) || 0;
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });

        if (!groupedData[dateString]) {
            groupedData[dateString] = { duration: 0, totalMoney: 0, dayOfWeek };
        }
        groupedData[dateString].duration += duration;
        groupedData[dateString].totalMoney += totalMoney;
        totalTableMoney += totalMoney;
    });

    return { groupedData, totalTableMoney };
}

// Group topup data by date
function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach(topup => {
        const date = new Date(topup.RecordDate).toISOString().split('T')[0];
        const amount = parseFloat(topup.Amount) || 0;

        if (!groupedData[date]) {
            groupedData[date] = { cash: 0, online: 0 };
        }
        if (topup.Mode === 'cash') groupedData[date].cash += amount;
        else if (topup.Mode === 'online') groupedData[date].online += amount;
    });

    return groupedData;
}

// Update the chart
function updateChart(groupedData) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const labels = Object.keys(groupedData);
    const durations = labels.map(date => groupedData[date].duration);
    const totalMoney = labels.map(date => groupedData[date].totalMoney);

    const backgroundColors = labels.map(date => {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)';
    });

    if (window.analyticsChart) window.analyticsChart.destroy();
    window.analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Duration (minutes)',
                    data: durations,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Total Money',
                    data: totalMoney,
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Values' } },
            },
        },
    });
}

// Initialize and fetch data
async function init() {
    const table = 'frames';
    const Studio = getParameterByName('Studio') || 'Default Studio';

    const frames = await fetchData(table, Studio);
    const topupData = await fetchData(table, Studio, true);

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

// Start initialization when the window loads
window.addEventListener('load', init);

// Utility to update total table money
function updateTotalMoneyBox(totalTableMoney) {
    document.getElementById('totalMoneyBox').innerHTML = `<p>Total Table Money: ₹${totalTableMoney.toFixed(2)}</p>`;
}

// Update selected date box
function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
    const frameData = groupedData[selectedDate];
    const topupData = topupGroupedData[selectedDate];

    let content = `<h2>Selected Date: ${selectedDate}</h2>`;
    if (frameData) {
        content += `<p>Total Duration: ${frameData.duration} minutes</p>`;
        content += `<p>Total Money: ₹${frameData.totalMoney.toFixed(2)}</p>`;
    } else {
        content += '<p>No frame data available for this date.</p>';
    }

    if (topupData) {
        content += `<p>Top-up (Cash): ₹${topupData.cash.toFixed(2)}</p>`;
        content += `<p>Top-up (Online): ₹${topupData.online.toFixed(2)}</p>`;
    } else {
        content += '<p>No top-up data available for this date.</p>';
    }

    document.getElementById('selectedDateBox').innerHTML = content;
}
