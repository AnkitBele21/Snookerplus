document.addEventListener('DOMContentLoaded', async function() {
    const apiUrl = 'https://v2api.snookerplus.in/apis/data/frames/Studio%20111';
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data); // Inspect the full data structure
        
        const tableBody = document.getElementById('frameTableBody');
        
        if (Array.isArray(data)) {
            data.forEach(frame => {
                const row = document.createElement('tr');

                const frameIdCell = document.createElement('td');
                frameIdCell.textContent = frame.FrameId;
                row.appendChild(frameIdCell);

                const durationCell = document.createElement('td');
                durationCell.textContent = frame.Duration;
                row.appendChild(durationCell);

                const winnerCell = document.createElement('td');
                winnerCell.textContent = frame.Winner;
                row.appendChild(winnerCell);

                const looserCell = document.createElement('td');
                looserCell.textContent = frame.Looser;
                row.appendChild(looserCell);

                const totalMoneyCell = document.createElement('td');
                totalMoneyCell.textContent = frame.TotalMoney;
                row.appendChild(totalMoneyCell);

                tableBody.appendChild(row);
            });
        } else {
            console.error('Unexpected data format:', data);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
