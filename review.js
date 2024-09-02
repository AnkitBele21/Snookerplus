document.addEventListener('DOMContentLoaded', async function() {
    const apiUrl = 'https://v2api.snookerplus.in/apis/data/frames/Studio%20111';
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Process data and sum durations by date
        const dateDurations = {};
        data.frames.forEach(frame => {
            const date = frame.date;
            const duration = frame.duration;
            if (!dateDurations[date]) {
                dateDurations[date] = 0;
            }
            dateDurations[date] += duration;
        });

        const labels = Object.keys(dateDurations);
        const values = Object.values(dateDurations);

        // Render duration chart
        const durationCtx = document.getElementById('durationChart').getContext('2d');
        new Chart(durationCtx, {
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

        // Example for rendering another chart (replace with relevant data)
        const otherCtx = document.getElementById('otherChart').getContext('2d');
        new Chart(otherCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Example Data',
                    data: values, // Replace with actual data
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
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
                            text: 'Value'
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
});
