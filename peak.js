function createHourlyBarChart(slots) {
    const ctx = document.getElementById('hourlyBarChart').getContext('2d');
    
    const labels = slots.map(slot => slot.startTime); // Extract time slots
    const durationData = slots.map(slot => slot.duration.toFixed(2)); // Duration for each slot
    const totalMoneyData = slots.map(slot => slot.totalMoney.toFixed(2)); // Total money for each slot

    const hourlyBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // Time labels (6:00 AM, 7:00 AM, etc.)
            datasets: [
                {
                    label: 'Duration (Min)',
                    data: durationData, // Data for duration
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Money (₹)',
                    data: totalMoneyData, // Data for total money
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function populateHourlySlotsData(frames) {
    const slots = Array(24).fill().map((_, i) => ({
        startTime: `${(i + 6) % 24}:00`,
        duration: 0,
        totalMoney: 0
    }));

    frames.forEach(frame => {
        const startDate = convertToIST(frame.StartTime);
        if (!startDate || isNaN(startDate.getTime())) return; // Skip invalid dates

        const hour = startDate.getHours();
        const duration = parseInt(frame.Duration, 10) || 0;
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        // Assign to the appropriate hour slot (0 index corresponds to 6:00 AM)
        const slotIndex = (hour >= 6 ? hour - 6 : hour + 18); // Mapping 6:00 AM to 5:00 AM next day
        slots[slotIndex].duration += duration;
        slots[slotIndex].totalMoney += totalMoney;
    });

    // Create the hourly bar chart
    createHourlyBarChart(slots);
}

async function init() {
    const table = 'frames';

    // Get the Studio parameter from the URL
    const Studio = getParameterByName('Studio') || 'Default Studio';
    console.log('Studio:', Studio);

    const frames = await fetchData1(table, Studio);
    const topupData = await fetchData2(table, Studio);

    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const topupGroupedData = groupTopupDataByDate(topupData);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    });

    // Populate the hourly slots data for bar chart
    populateHourlySlotsData(frames);
}

window.addEventListener('load', init);
