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

function convertToIST(date) {
    if (!date) return null;  // Return null if date is undefined or invalid

    const utcDate = new Date(date);

    // Convert UTC to IST using toLocaleString
    const istDateString = utcDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return new Date(istDateString);
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
console.log(groupedData, totalTableMoney)
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

console.log(hourSlots)
    return hourSlots;
}


function updateSelectedDateBox(groupedData, selectedDate) {
    const selectedDateBox = document.getElementById('selectedDateBox');
    if (!selectedDateBox) {
        console.error('Element with ID "selectedDateBox" not found.');
        return;
    }

    const date = new Date(selectedDate); // Convert the selected date to a Date object
    const dateString = date.toISOString().split('T')[0]; // Format the date to YYYY-MM-DD

    const data = groupedData[dateString];

    if (data) {
        selectedDateBox.innerHTML = `
            <h2>Details for ${dateString} (${data.dayOfWeek})</h2>
            <p>Total Duration: ${data.duration.toFixed(2)} minutes</p>
            <p>Total Money: ₹${data.totalMoney.toFixed(2)}</p>
        `;
    } else {
        selectedDateBox.innerHTML = `<p>No data available for ${dateString}</p>`;
    }
}


let analyticsChart; // Define a variable to store the Chart.js instance

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

    totalMoneyBox.innerHTML = `<p>Total Table Money: ₹${totalTableMoney.toFixed(2)}</p>`;
}

function updatePeakHoursChart(hourSlots) {
    const ctx = document.getElementById('peakHoursChart').getContext('2d');

    // Adjust the hour labels to start from 05:00
    const labels = [];
    for (let i = 5; i < 24; i++) {
        labels.push(`${i}:00 - ${i + 1}:00`);
    }
    for (let i = 0; i < 5; i++) {
        labels.push(`${i}:00 - ${i + 1}:00`);
    }

    const adjustedHourSlots = [
        ...hourSlots.slice(5, 24),
        ...hourSlots.slice(0, 5)
    ];

    if (window.peakHoursChart) {
        window.peakHoursChart.destroy(); // Destroy existing chart instance if it exists
    }

    window.peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Duration (minutes)',
                data: adjustedHourSlots,
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Duration (minutes)'
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

async function init() {
    const table = 'frames';
    const Studio = 'Studio 111';

    const frames = await fetchData1(table, Studio);
    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const hourSlots = groupDataByHour(frames);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);
    populatePeakHoursTable(hourSlots);
    updatePeakHoursChart(hourSlots);

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, selectedDate);
    });
}

window.addEventListener('load', init);
