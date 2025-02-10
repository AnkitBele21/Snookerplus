function loadScoringData() {
    let data = localStorage.getItem('snookerScoring');
    if (data) {
        data = JSON.parse(data);

        document.getElementById('player1Name').innerText = data.player1Name;
        document.getElementById('player1Score').innerText = data.player1Score;
        document.getElementById('player2Name').innerText = data.player2Name;
        document.getElementById('player2Score').innerText = data.player2Score;
        document.getElementById('rounds').innerText = `(${data.rounds})`;

        // Handle active player indicator
        document.getElementById('player1Indicator').style.display = (data.activePlayer == "1") ? 'block' : 'none';
        document.getElementById('player2Indicator').style.display = (data.activePlayer == "2") ? 'block' : 'none';

        // Handle message strip
        if (data.message) {
            let messageStrip = document.getElementById('messageStrip');
            messageStrip.innerText = data.message;
            messageStrip.style.display = 'block';
        } else {
            document.getElementById('messageStrip').style.display = 'none';
        }
    }
}

// Load data on page load
window.onload = loadScoringData;

// Auto-update the scoreboard every 2 seconds (in case control panel updates it)
setInterval(loadScoringData, 2000);
