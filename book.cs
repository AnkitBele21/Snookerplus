* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    color: #333;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 20px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
}

.dashboard-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
}

input[type="date"] {
    padding: 5px;
    font-size: 1rem;
}

button {
    padding: 6px 12px;
    font-size: 1rem;
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #218838;
}

.chart-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto 20px auto;
}

.info-box {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 20px;
}

.info-box h2 {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

footer {
    text-align: center;
    margin-top: 30px;
}
