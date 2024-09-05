// Fetch data from the frames API
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

        return data[0];  // Assuming data[0] contains relevant data
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return an empty array or handle the error as needed
    }
}

// Fetch data from the topup API
async function fetchData2(Studio) {
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
    const utcDate = new Date(date);
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDate = new Date(utcDate.getTime() + istOffset);

    return istDate;
}

function groupDataByDate(frames) {
    const groupedData = {};
    let totalTableMoney = 0;

    frames.forEach(frame => {
        const date = convertToIST(frame.StartTime);
        const duration = parseInt(frame.Duration, 10) || 0; // Duration in minutes
        const totalMoney = parseFloat(frame.TotalMoney) || 0;

        const dateString = date.toISOString().split('T')[0]; // Get the date in YYYY-MM-DD format

        if (!groupedData[dateString]) {
            groupedData[dateString] = { duration: 0, totalMoney: 0 };
        }

        groupedData[dateString].duration += duration;    // Sum the duration for each date
        groupedData[dateString].totalMoney += totalMoney; // Sum the total money for each date
        totalTableMoney += totalMoney; // Add to total table money
    });

    return { groupedData, totalTableMoney };
}

function groupTopupDataByDate(topupData) {
    const groupedData = {};

    topupData.forEach((record, index) => {
        const recordDate = record.RecordDate;

        // Check if RecordDate is valid
        if (!recordDate || isNaN(new Date(recordDate).getTime())) {
            console.error(`Invalid or missing RecordDate at index ${index}:`, record);
            return; // Skip this record
        }

        const date = new Date(recordDate).toISOString().split('T')[0]; // Get only the date part (YYYY-MM-DD)
        const paymentMode = record.PaymentMode; // Assuming the field is 'PaymentMode'
        const amount = record.Amount || 0;

        // Initialize the date entry if it doesn't exist
        if (!groupedData[date]) {
            groupedData[date] = { cash: 0, online: 0 };
        }

        // Group by payment mode
        if (paymentMode === 'cash') {
            groupedData[date].cash += amount;
        } else if (paymentMode === 'online') {
            groupedData[date].online += amount;
        } else {
            console.error(`Unknown PaymentMode at index ${index}:`, paymentMode);
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

function updateTotalMoneyBox(totalTableMoney) {
    document.getElementById('totalMoneyBox').textContent = `₹${totalTableMoney.toFixed(2)}`;
}

function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
    // Validate selectedDate
    if (!selectedDate || isNaN(new Date(selectedDate).getTime())) {
        console.error("Invalid selected date:", selectedDate);
        return;
    }

    const dateKey = new Date(selectedDate).toISOString().split('T')[0]; // Convert to YYYY-MM-DD

    const dateData = groupedData[dateKey];
    const topupData = topupGroupedData[dateKey];

    if (dateData) {
        updateTotalMoneyBox(dateData.totalMoney);
    } else {
        console.warn(`No data found for selected date: ${selectedDate}`);
    }

    if (topupData) {
        updateTotalReceivedBox(topupData.cash, topupData.online);
    } else {
        console.warn(`No top-up data found for selected date: ${selectedDate}`);
        updateTotalReceivedBox(0, 0); // Set to zero if no data is found
    }
}

async function init() {
    const frames = await fetchData1('frames', 'Studio 111');
    const topupData = await fetchData2('Studio 111');

    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const topupGroupedData = groupTopupDataByDate(topupData);

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    });

    updateTotalMoneyBox(totalTableMoney);
    if (datePicker.value) {
        updateSelectedDateBox(groupedData, topupGroupedData, datePicker.value); // Initial load
    }
}

window.addEventListener('load', init);
