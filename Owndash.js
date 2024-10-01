// Helper function to get URL parameters
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`, 'i');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Filter frames data based on the selected month
function filterDataByMonth(data, selectedMonth) {
    const filteredData = data.filter(item => {
        const itemDate = new Date(item.StartTime);
        const itemMonth = itemDate.getMonth();
        const itemYear = itemDate.getFullYear();

        return (
            itemMonth === selectedMonth.getMonth() && 
            itemYear === selectedMonth.getFullYear()
        );
    });
    return filteredData;
}

// Fetch frame data
async function fetchData1(table, Studio) {
    const url = `https://app.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        return data; // Return the data without flattening
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

// Fetch top-up data
async function fetchData2(table, Studio) {
    const url = `https://app.snookerplus.in/apis/data/topup/${encodeURIComponent(Studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched topup data:', data);

        return data;
    } catch (error) {
        console.error('Error fetching topup data:', error);
        return [];
    }
}

// Convert UTC date to IST
function convertToIST(date) {
    if (!date) return null;

    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDate = new Date(utcDate.getTime() + istOffset);

    return istDate;
}

function getDayOfWeek(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeek[date.getDay()];
}

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

let analyticsChart = null;

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

function updateTotalMoneyBox(totalTableMoney) {
    const totalMoneyBox = document.getElementById('totalMoneyBox');
    if (!totalMoneyBox) {
        console.error('Element with ID "totalMoneyBox" not found.');
        return;
    }

    totalMoneyBox.innerHTML = `<p>Total Table Money: ₹${totalTableMoney.toFixed(2)}</p>`;
}

function handleMonthChange(selectedMonth, frames, topupData) {
    const filteredFrames = filterDataByMonth(frames, selectedMonth);
    const { groupedData, totalTableMoney } = groupDataByDate(filteredFrames);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);

    const topupGroupedData = groupTopupDataByDate(topupData);
    const today = new Date();
    const selectedDate = today.toISOString().split('T')[0];
    updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
}

document.addEventListener('DOMContentLoaded', async () => {
    const Studio = getParameterByName('Studio');
    const table = getParameterByName('table') || 'frames';
    const monthSelect = document.getElementById('monthSelect');

    const frames = await fetchData1(table, Studio);
    const topupData = await fetchData2(table, Studio);

    const currentMonth = new Date();

    monthSelect.addEventListener('change', () => {
        const selectedMonth = new Date(monthSelect.value);
        handleMonthChange(selectedMonth, frames, topupData);
    });

    handleMonthChange(currentMonth, frames, topupData); // Load current month data by default
});
