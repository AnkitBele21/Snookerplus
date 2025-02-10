function loadScoringData() {
    let data = localStorage.getItem('snookerScoring');
    if (data) {
        data = JSON.parse(data);

        document.getElementById('player1Name').innerText = data.player1Name;
        document.getElementById('player1Score').innerText = data.player1Score;
        document.getElementById('player2Name').innerText = data.player2Name;
        document.getElementById('player2Score').innerText = data.player2Score;

        // Ensure totalFrames exists in the data
        let bestOfN = data.totalFrames || 1;  
        document.getElementById('rounds').innerText = `(${data.player1Wins} (Best of ${bestOfN}) ${data.player2Wins})`;

        // Handle active player indicator
        document.getElementById('player1Indicator').style.display = (data.activePlayer == "1") ? 'block' : 'none';
        document.getElementById('player2Indicator').style.display = (data.activePlayer == "2") ? 'block' : 'none';

        // Handle message strip visibility
        let messageStrip = document.getElementById('messageStrip');
        let scoreStrip = document.getElementById('scoreStrip');

        if (data.message && data.message.trim() !== "") {
            messageStrip.innerText = data.message;
            messageStrip.style.display = 'block';
            scoreStrip.style.display = 'none'; // Hide score strip
        } else {
            messageStrip.style.display = 'none';
            scoreStrip.style.display = 'flex'; // Show score strip again
        }
    }
}

// Load data on page load
window.onload = loadScoringData;

// Auto-update the scoreboard every 2 seconds (in case control panel updates it)
setInterval(loadScoringData, 2000);
