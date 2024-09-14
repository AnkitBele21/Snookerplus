// Function to convert a UTC date/time string to Indian Standard Time (IST)
function convertToIST(dateString) {
    const date = new Date(dateString); // Parse the incoming date string (assuming it's in UTC)
    const offsetIST = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    return new Date(date.getTime() + offsetIST); // Return the IST-adjusted date
}

// Function to create the hourly bar chart
function createHourlyBarChart(slots) {
    const ctx = document.getElementById('hourlyBarChart').getContext('2d');

    const labels = slots.map(slot => slot.startTime); // Extract time slots
    const durationData = slots.map(slot => slot.duration); // Duration for each slot

    new Chart(ctx, {
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
                    title: {
                        display: true,
                        text: 'Time Slot'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Duration (Min)'
                    }
                }
            }
        }
    });
}

// Function to populate hourly slots data and create the bar chart
function populateHourlySlotsData(frames) {
    // Create 24 slots for each hour starting at 6:00 AM (IST)
    const slots = Array(24).fill().map((_, i) => ({
        startTime: `${String((i + 6) % 24).padStart(2, '0')}:00 - ${String((i + 7) % 24).padStart(2, '0')}:00`,
        duration: 0
    }));

    frames.forEach(frame => {
        const startDate = convertToIST(frame.StartTime); // Convert the frame's start time to IST
        if (!startDate || isNaN(startDate.getTime())) return; // Skip invalid dates

        let startHour = startDate.getHours();
        let duration = parseInt(frame.Duration, 10) || 0;

        // Determine the slot index
        let startSlotIndex = startHour >= 6 ? startHour - 6 : startHour + 18;

        // Distribute duration across slots
        while (duration > 0) {
            // Calculate remaining minutes in the current slot
            const currentSlotMinutes = 60 - (startDate.getMinutes() || 0);
            const minutesInCurrentSlot = Math.min(duration, currentSlotMinutes);

            // Update the current slot
            slots[startSlotIndex].duration += minutesInCurrentSlot;

            // Move to the next slot
            duration -= minutesInCurrentSlot;
            startDate.setHours(startDate.getHours() + 1);
            startSlotIndex = startDate.getHours() >= 6 ? startDate.getHours() - 6 : startDate.getHours() + 18;
        }
    });

    // Log the slots data to debug
    console.log(slots);

    // Create the hourly bar chart
    createHourlyBarChart(slots);
}

async function init() {
    const table = 'frames';

    // Get the Studio parameter from the URL
    const Studio = getParameterByName('Studio') || 'Default Studio';
    console.log('Studio:', Studio);

    // Fetch the frame data
    const frames = await fetchData1(table, Studio);

    // Populate the hourly slots data for bar chart
    populateHourlySlotsData(frames);
}

// Function to get query parameter by name
function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Event listener for window load
window.addEventListener('load', init);
