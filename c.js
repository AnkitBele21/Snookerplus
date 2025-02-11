const firebaseConfig = {
    databaseURL: "https://score-8e601-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const ref = db.ref("snookerScoring");

function updateScoring() {
    let data = {
        player1Name: document.getElementById("player1Name").value || "Player 1",
        player1Score: document.getElementById("player1Score").value || "0",
        player2Name: document.getElementById("player2Name").value || "Player 2",
        player2Score: document.getElementById("player2Score").value || "0",
        rounds: document.getElementById("rounds").value || "0-0",
        activePlayer: activePlayer,
        message: document.getElementById("message").value || ""
    };

    ref.set(data);
}

ref.on("value", (snapshot) => {
    let data = snapshot.val();
    if (data) {
        document.getElementById("player1Name").innerText = data.player1Name;
        document.getElementById("player1Score").innerText = data.player1Score;
        document.getElementById("player2Name").innerText = data.player2Name;
        document.getElementById("player2Score").innerText = data.player2Score;
        document.getElementById("rounds").innerText = `(${data.rounds})`;
        document.getElementById("messageStrip").innerText = data.message;

        document.getElementById("messageStrip").style.display = data.message ? "block" : "none";
        document.getElementById("scoreStrip").style.display = data.message ? "none" : "flex";
    }
});
