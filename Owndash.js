async function fetchData1(table, Studio) {
    const url = https://v2api.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)};
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(HTTP error! Status: ${response.status});
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        return data[0];  // Flatten the nested arrays into a single array
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

async function fetchData2(table, Studio) {
    const url = https://v2api.snookerplus.in/apis/data/topup/${encodeURIComponent(Studio)};
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(HTTP error! Status: ${response.status});
        }

        const data = await response.json();
        console.log('Fetched topup data:', data);

        return data;
    } catch (error) {
        console.error('Error fetching topup data:', error);
        return [];
    }
}

function convertToIST(date) {
    if (!date) return null;  // Return null if date is undefined or invalid

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
        if (!date || isNaN(date.getTime())) {  // Handle invalid dates
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const duration = parseInt(frame.Duration, 10) || 0; // Assuming duration is already in minutes
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        const dateString = date.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format
        const dayOfWeek = getDayOfWeek(date);

        if (!groupedData[dateString]) {
            groupedData[dateString] = { duration: 0, totalMoney: 0, dayOfWeek };
        }

        groupedData[dateString].duration += duration;    // Sum the duration for each date
        groupedData[dateString].totalMoney += totalMoney; // Sum the total money for each date
        totalTableMoney += totalMoney; // Add to total table money
    });

    return { groupedData, totalTableMoney };
}

function groupDataByHour(frames) {
    const hourSlots = Array(24).fill(0); // Initialize 24 slots for each hour

    frames.forEach(frame => {
        const startTime = convertToIST(frame.StartTime);
        if (!startTime || isNaN(startTime.getTime())) {  // Handle invalid dates
            console.error('Invalid date:', frame.StartTime);
            return;
        }

        const startHour = startTime.getHours();
        const duration = parseInt(frame.Duration, 10) || 0; // Duration in minutes

        // Calculate the end time
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const endHour = endTime.getHours();

        if (startHour === endHour) {
            // If the start and end time are within the same hour, add the duration to that hour
            hourSlots[startHour] += duration;
        } else {
            // If the duration spans multiple hours, distribute the time accordingly
            const minutesInStartHour = 60 - startTime.getMinutes();
            hourSlots[startHour] += minutesInStartHour;

            let remainingDuration = duration - minutesInStartHour;
            let currentHour = (startHour + 1) % 24;

            while (remainingDuration > 0) {
                const minutesToAdd = Math.min(remainingDuration, 60);
                hourSlots[currentHour] += minutesToAdd;
                remainingDuration -= minutesToAdd;
                currentHour = (currentHour + 1) % 24;
            }
        }
    });

    return hourSlots;
}

function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach((topup, index) => {
        const date = new Date(topup.RecordDate);

        if (!topup.RecordDate || isNaN(date.getTime())) {
            console.error(Invalid or missing RecordDate at index ${index}:, topup);
            return; // Skip entries with invalid or missing RecordDate
        }

        const dateString = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        const amount = parseFloat(topup.Amount) || 0; // Parse Amount safely

        // Initialize the date entry in groupedData if not already present
        if (!groupedData[dateString]) {
            groupedData[dateString] = { cash: 0, online: 0 };
        }

        // Accumulate amounts based on the payment mode (cash or online)
        if (topup.Mode === 'cash') {
            groupedData[dateString].cash += amount;
        } else if (topup.Mode === 'online') {
            groupedData[dateString].online += amount;
        } else {
            console.error('Unknown payment mode:', topup.Mode, topup); // Log unknown payment modes
        }
    });

    return groupedData;
}





function updateTotalReceivedBox(cashAmount, onlineAmount) {
    const totalAmount = cashAmount + onlineAmount;

    document.getElementById('cashAmount').textContent = cashAmount.toFixed(2);
    document.getElementById('onlineAmount').textContent = onlineAmount.toFixed(2);
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
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
        selectedDateBox.innerHTML = 
            <h2>Details for ${dateString} (${data.dayOfWeek})</h2>
            <p>Total Duration: ${data.duration.toFixed(2)} minutes</p>
            <p>Total Money: ₹${data.totalMoney.toFixed(2)}</p>
        ;
    } else {
        selectedDateBox.innerHTML = <p>No data available for ${dateString}</p>;
    }

    if (topupData) {
        updateTotalReceivedBox(topupData.cash, topupData.online);
    } else {
        updateTotalReceivedBox(0, 0);
    }
}

let analyticsChart = null; // Initialize as null

function updateChart(groupedData) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');

    const labels = Object.keys(groupedData);
    const durations = labels.map(date => groupedData[date].duration);
    const totalMoney = labels.map(date => groupedData[date].totalMoney);

    if (analyticsChart) {
        analyticsChart.destroy(); // Destroy existing chart instance if it exists
    }

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Duration (minutes)',
                    data: durations,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
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

    totalMoneyBox.innerHTML = <p>Total Table Money: ₹${totalTableMoney.toFixed(2)}</p>;
}

function populatePeakHoursTable(hourSlots) {
    const peakHoursTable = document.getElementById('peakHoursTable');
    if (!peakHoursTable) {
        console.error('Element with ID "peakHoursTable" not found.');
        return;
    }

    peakHoursTable.innerHTML = '';  // Clear any existing rows

    hourSlots.forEach((duration, index) => {
        const row = peakHoursTable.insertRow();
        const hourCell = row.insertCell(0);
        const durationCell = row.insertCell(1);

        hourCell.textContent = ${index}:00 - ${index + 1}:00;
        durationCell.textContent = ${duration} minutes;
    });
}

async function init() {
    const table = 'frames';
    const Studio = 'Studio 111';

    const frames = await fetchData1(table, Studio);
    const topupData = await fetchData2(table, Studio);

    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const topupGroupedData = groupTopupDataByDate(topupData);
    const hourSlots = groupDataByHour(frames);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);
    updateTotalReceivedBox(
        Object.values(topupGroupedData).reduce((sum, { cash }) => sum + cash, 0),
        Object.values(topupGroupedData).reduce((sum, { online }) => sum + online, 0)
    );
    populatePeakHoursTable(hourSlots);

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    });
}

window.addEventListener('load', init);
