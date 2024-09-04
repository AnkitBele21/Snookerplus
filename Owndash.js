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

        return data[0];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
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

function groupTopupDataByDate(topupData) {
    const groupedData = {};

    let cashAmount = 0;
    let onlineAmount = 0;

    topupData.forEach(topup => {
        const date = new Date(topup.RecordDate).toISOString().split('T')[0];

        if (!groupedData[date]) {
            groupedData[date] = { cash: 0, online: 0 };
        }

        const amount = parseFloat(topup.Amount) || 0;

        if (topup.Mode === 'cash') {
            groupedData[date].cash += amount;
            cashAmount += amount;
        } else if (topup.Mode === 'online') {
            groupedData[date].online += amount;
            onlineAmount += amount;
        }
    });

    const totalAmount = cashAmount + onlineAmount;
    return { groupedData, cashAmount, onlineAmount, totalAmount };
}

function updateTotalReceivedBox(cashAmount, onlineAmount, totalAmount) {
    document.getElementById('cashAmount').textContent = cashAmount.toFixed(2);
    document.getElementById('onlineAmount').textContent = onlineAmount.toFixed(2);
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
}

function updateSelectedDateBox(groupedData, topupGroupedData, selectedDate) {
    const selectedDateBox = document.getElementById('selectedDateBox');
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
        document.getElementById('cashAmount').textContent = topupData.cash.toFixed(2);
        document.getElementById('onlineAmount').textContent = topupData.online.toFixed(2);
        document.getElementById('totalAmount').textContent = (topupData.cash + topupData.online).toFixed(2);
    } else {
        document.getElementById('cashAmount').textContent = '0.00';
        document.getElementById('onlineAmount').textContent = '0.00';
        document.getElementById('totalAmount').textContent = '0.00';
    }
}

async function init() {
    const table = 'frames';
    const Studio = 'Studio 111';

    const frames = await fetchData1(table, Studio);
    const topupData = await fetchData2(table, Studio);

    const { groupedData, totalTableMoney } = groupDataByDate(frames);
    const { groupedData: topupGroupedData, cashAmount, onlineAmount, totalAmount } = groupTopupDataByDate(topupData);

    updateChart(groupedData);
    updateTotalMoneyBox(totalTableMoney);
    updateTotalReceivedBox(cashAmount, onlineAmount, totalAmount);

    populatePeakHoursTable(groupDataByHour(frames));

    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', () => {
        const selectedDate = datePicker.value;
        updateSelectedDateBox(groupedData, topupGroupedData, selectedDate);
    });
}

window.addEventListener('load', init);
