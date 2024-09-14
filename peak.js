// Function to convert date/time to Indian Standard Time (IST)
function convertToIST(dateString) {
    const date = new Date(dateString); // Parse the incoming date string (assuming it's in UTC)
    
    // Convert UTC to IST (UTC+5:30)
    const offsetIST = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istDate = new Date(date.getTime() + offsetIST);

    return istDate; // Return the IST-adjusted date
}

// Function to create the hourly bar chart
function createHourlyBarChart(slots) {
    const ctx = document.getElementById('hourlyBarChart').getContext('2d');
    
    const labels = slots.map(slot => slot.startTime); // Extract time slots
    const durationData = slots.map(slot => slot.duration); // Duration for each slot

    const hourlyBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // Time labels (e.g., "06:00 - 07:00", "07:00 - 08:00", etc.)
            datasets: [
                {
                    label: 'Duration (Min)',
                    data: durationData, // Data for duration
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        autoSkip: false
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to populate hourly slots data and create the bar chart
function populateHourlySlotsData(frames) {
    // Create 24 slots for each hour from 00:00 to 23:00
    const slots = Array(24).fill().map((_, i) => ({
        startTime: `${i.toString().padStart(2, '0')}:00 - ${(i + 1) % 24.toString().padStart(2, '0')}:00`,
        duration: 0
    }));

    frames.forEach(frame => {
        const startDate = convertToIST(frame.StartTime); // Convert the frame's start time to IST
        if (!startDate || isNaN(startDate.getTime())) return; // Skip invalid dates

        const hour = startDate.getHours(); // Use the IST-adjusted hour
        const duration = parseInt(frame.Duration, 10) || 0;

        // Assign to the appropriate hour slot (0 index corresponds to 00:00)
        const slotIndex = hour; // Directly map hour to index
        slots[slotIndex].duration += duration;
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
