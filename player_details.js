// Your API Key and Sheet ID
const API_KEY = 'AIzaSyCfxg14LyZ1hrs18WHUuGOnSaJ_IJEtDQc';
const SHEET_ID = '1Bcl1EVN-7mXUP7M1FL9TBB5v4O4AFxGTVB6PwqOn9ss';
const PLAYER_SHEET_NAME = 'snookerplus';
const FRAMES_SHEET_NAME = 'Frames';
const RANK_SHEET_NAME = 'Rank'; // Assuming you have a sheet named 'Rank'

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(function () {
        const urlParams = new URLSearchParams(window.location.search);
        const playerName = urlParams.get('player');
        
        if (playerName) {
            fetchPlayerInfo(playerName);
            fetchFramesInfo(playerName);
            fetchRankInfo(playerName); // Fetching rank info
        } else {
            console.error('Player name not provided.');
        }
    });
}

function fetchPlayerInfo(playerName) {
    // ... (Same as before)
}

function fetchFramesInfo(playerName) {
    // ... (Same as before)
}

function fetchRankInfo(playerName) {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: RANK_SHEET_NAME,
    }).then(function (response) {
        const values = response.result.values;
        const rankInfo = values.find(row => row[/*Index for Player Name*/] === playerName);
        if (rankInfo) {
            displayRankInfo(rankInfo);
        } else {
            console.log('Rank info not found.');
        }
    }, function (response) {
        console.error('Error fetching rank data:', response.result.error.message);
    });
}

function displayPlayerInfo(playerInfo) {
    // ... (Same as before)
}

function displayFramesInfo(framesData) {
    // ... (Same as before)
}

function displayRankInfo(rankInfo) {
    // Example: Display rank and apply color to player card
    document.getElementById('playerRank').innerText = `Rank: ${rankInfo[/*Index for Rank*/]}`;
    document.getElementById('playerCard').style.backgroundColor = rankInfo[/*Index for Color of Profile Card*/];
}

// Load the Google API client and call initClient
gapi.load('client', initClient);
