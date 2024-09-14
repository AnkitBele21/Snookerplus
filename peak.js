// Function to create 24-hour slots (6:00 AM to 5:00 AM next day)
function createHourlySlots() {
    const slots = [];
    let startHour = 6; // Start from 6:00 AM

    for (let i = 0; i < 24; i++) {
        let hourLabel = `${startHour % 24}:00 - ${(startHour + 1) % 24}:00`;
        slots.push({
            slot: hourLabel,
            frames: 0, // Initialize with 0 frames
        });
        startHour++;
    }

    return slots;
}

// Function to map frame start time to the appropriate slot
function mapFrameToSlot(startTime) {
    const date = new Date(startTime);
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Determine the hour slot based on the start time
    if (minute >= 30) {
        return (hour + 1) % 24; // Map to next hour slot if minute >= 30
    } else {
        return hour % 24; // Map to current hour slot
    }
}

// Function to populate the hourly slots with frame data
function populateHourlySlots(frames) {
    const hourlySlots = createHourlySlots();

    frames.forEach(frame => {
        const startTime = convertToIST(frame.StartTime); // Use your convertToIST function
        if (!startTime || isNaN(startTime.getTime())) {
            console.error('Invalid start time:', frame.StartTime);
            return;
        }

        const slotIndex = mapFrameToSlot(startTime);
        hourlySlots[slotIndex].frames += 1; // Increment the frame count in the appropriate slot
    });

    return hourlySlots;
}

// Function to display the hourly slots on the UI
function displayHourlySlots(hourlySlots) {
    const slotsContainer = document.getElementById('hourlySlots');
    if (!slotsContainer) {
        console.error('Element with ID "hourlySlots" not found.');
        return;
    }

    slotsContainer.innerHTML = '<h2>Hourly Slot Breakdown</h2>';
    hourlySlots.forEach(slot => {
        slotsContainer.innerHTML += `<p>${slot.slot}: ${slot.frames} frames</p>`;
    });
}

// Function to initialize the peak hours calculation and rendering
async function initPeakHours() {
    const table = 'frames';
    const Studio = getParameterByName('Studio') || 'Default Studio';

    const frames = await fetchData1(table, Studio);
    const hourlySlots = populateHourlySlots(frames);

    displayHourlySlots(hourlySlots);
}

window.addEventListener('load', initPeakHours);
