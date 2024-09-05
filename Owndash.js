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

        return data[0];  // Flatten the nested arrays into a single array
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

    topupData.forEach(topup => {
        const date = convertToIST(topup.RecordDate);
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
    const dateString = new Date(selectedDate).toISOString().split('T')[0];
    const data = groupedData[dateString];
    const topupData = topupGroupedData[dateString];

    if (data) {
        selectedDateBox.innerHTML = `
            <h2>Details for ${dateString}</h2>
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

function updateTotalReceivedBox(cashAmount, onlineAmount) {
    const totalAmount = cashAmount + onlineAmount;

    document.getElementById('cashAmount').textContent = cashAmount.toFixed(2);
    document.getElementById('onlineAmount').textContent = onlineAmount.toFixed(2);
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
}

function updateTotalMoneyBox(totalTableMoney) {
    document.getElementById('totalMoneyBox').textContent = `₹${totalTableMoney.toFixed(2)}`;
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
    updateSelectedDateBox(groupedData, topupGroupedData, datePicker.value);
}

window.addEventListener('load', init);
