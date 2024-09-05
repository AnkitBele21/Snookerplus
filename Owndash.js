async function fetchData1(table, Studio) {
    const url = `https://v2api.snookerplus.in/apis/data/${table}/${encodeURIComponent(Studio)}`;
    console.log('Fetching data from:', url);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
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
    const url = `https://v2api.snookerplus.in/apis/data/topup/${encodeURIComponent(Studio)}`;
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
            console.error(`Invalid or missing RecordDate at index ${index}:`, topup);
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

function renderChart(ctx, labels, data) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Duration (minutes)',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

function populatePeakHoursTable(hourSlots) {
    const tableBody = document.getElementById('peakHoursTable');
    if (!tableBody) {
        console.error('Element with ID "peakHoursTable" not found.');
        return;
    }

    tableBody.innerHTML = ''; // Clear any existing rows

    for (let hour = 0; hour < 24; hour++) {
        const row = document.createElement('tr');
        const timeSlotCell = document.createElement('td');
        const durationCell = document.createElement('td');

        timeSlotCell.textContent = `${hour}:00 - ${hour + 1}:00`;
        durationCell.textContent = `${hourSlots[hour].toFixed(2)} minutes`;

        row.appendChild(timeSlotCell);
        row.appendChild(durationCell);
        tableBody.appendChild(row);
    }
}

document.getElementById('datePicker').addEventListener('change', async (event) => {
    const selectedDate = event.target.value;
    console.log('Selected Date:', selectedDate);

    const frames = await fetchData1('frames', 'Studio 111');
    const { groupedData } = groupDataByDate(frames);
    const hourSlots = groupDataByHour(frames);

    const topupData = await fetchData2('topup', 'Studio 111');
    const topupGroupedData = groupTopupDataByDate(topupData);

    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData).map(d => d.duration);

    renderChart(ctx, labels, data);
    populatePeakHoursTable(hourSlots);
    updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
});

(async function initializeDashboard() {
    const frames = await fetchData1('frames', 'Studio 111');
    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const hourSlots = groupDataByHour(frames);

    const topupData = await fetchData2('topup', 'Studio 111');
    const topupGroupedData = groupTopupDataByDate(topupData);

    const ctx = document.getElementById('analyticsChart').getContext('2d');
    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData).map(d => d.duration);

    renderChart(ctx, labels, data);
    populatePeakHoursTable(hourSlots);
    document.getElementById('totalMoneyBox').textContent = `₹${totalTableMoney.toFixed(2)}`;

    const selectedDate = document.getElementById('datePicker').value;
    if (selectedDate) {
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    }
})();
