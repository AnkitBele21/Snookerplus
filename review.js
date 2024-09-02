document.addEventListener('DOMContentLoaded', async function() {
    const apiUrl = 'https://v2api.snookerplus.in/apis/data/frames/Studio%20111';
    
    // Fetch data from API
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Process data: sum durations by date
    const dateDurations = {};
    data.frames.forEach(frame => {
        const date = frame.date;
        const duration = frame.duration;
        if (!dateDurations[date]) {
            dateDurations[date] = 0;
        }
        dateDurations[date] += duration;
    });

    // Prepare data for Chart.js
    const labels = Object.keys(dateDurations);
    const values = Object.values(dateDurations);

    // Create the chart
    const ctx = document.getElementById('durationChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sum of Durations per Day',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Duration (minutes)'
                    }
                }
            }
        }
    });
});
