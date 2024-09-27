document.addEventListener('DOMContentLoaded', function() {
  const apiUrl = 'https://app.snookerplus.in/apis/data/masterplayer/Studio%20111';

  // Fetch the data from the API
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const playerTable = document.querySelector('#player-table tbody');
      // Data for one player, you can adjust based on your API response structure
      const player = data; 

      // Create a new row
      const row = document.createElement('tr');

      // Add columns to the row
      row.innerHTML = `
        <td>${player.Players}</td>
        <td>${player.Total}</td>
        <td>${player.pin}</td>
        <td>${player.Balance_Limit}</td>
      `;

      // Append the row to the table body
      playerTable.appendChild(row);
    })
    .catch(error => console.error('Error fetching data:', error));
});
