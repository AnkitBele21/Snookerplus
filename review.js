document.addEventListener('DOMContentLoaded', async function() {
    const apiUrl = 'https://v2api.snookerplus.in/apis/data/frames/Studio%20111';
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data); // Log the data structure for debugging
        
        // Populate the table with duration entries
        const tableBody = document.getElementById('durationTableBody');
        if (data && data.frames) {
            data.frames.forEach(frame => {
                const row = document.createElement('tr');
                const dateCell = document.createElement('td');
                const durationCell = document.createElement('td');

                dateCell.textContent = frame.date;
                durationCell.textContent = frame.duration;

                row.appendChild(dateCell);
                row.appendChild(durationCell);
                tableBody.appendChild(row);
            });
        } else {
            console.log('No frames data available');
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
