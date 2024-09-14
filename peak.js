function populateHourlySlotsTable(frames) {
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

    const tableBody = document.querySelector("#hourlySlotsTable tbody");
    tableBody.innerHTML = ""; // Clear existing data

    slots.forEach((slot, index) => {
        const row = document.createElement("tr");

        const slotCell = document.createElement("td");
        slotCell.textContent = `Slot ${index + 1}`;
        row.appendChild(slotCell);

        const startTimeCell = document.createElement("td");
        startTimeCell.textContent = slot.startTime;
        row.appendChild(startTimeCell);

        const durationCell = document.createElement("td");
        durationCell.textContent = slot.duration.toFixed(2);
        row.appendChild(durationCell);

        const moneyCell = document.createElement("td");
        moneyCell.textContent = `₹${slot.totalMoney.toFixed(2)}`;
        row.appendChild(moneyCell);

        tableBody.appendChild(row);
    });
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

    // Populate the hourly slots table
    populateHourlySlotsTable(frames);
}

window.addEventListener('load', init);
