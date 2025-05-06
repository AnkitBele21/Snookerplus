document.addEventListener('DOMContentLoaded', function() {
  const apiUrl = 'https://app.snookerplus.in/apis/data/masterplayer';

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const playerTable = document.querySelector('#player-table tbody');

      data.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${player.Players || ''}</td>
          <td>${player.Total || 0}</td>
          <td>${player.pin || ''}</td>
          <td>${player.Balance_Limit || 0}</td>
        `;
        playerTable.appendChild(row);
      });
    })
    .catch(error => console.error('Error fetching player data:', error));
});
