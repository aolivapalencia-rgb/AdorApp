const songsContainer = document.getElementById("songs");
const searchInput = document.getElementById("search");

function renderSongs(list) {
  songsContainer.innerHTML = "";

  list.forEach(song => {
    const card = document.createElement("div");
    card.className = "song";

    card.innerHTML = `
      <h2>${song.title}</h2>
      <p><strong>Autor:</strong> ${song.artist}</p>
      <p><strong>Categoría:</strong> ${song.category}</p>
      <p><strong>Tonalidad:</strong> ${song.tone}</p>
      <p><strong>Acordes:</strong> ${song.chords.join(" ")}</p>
      <pre>${song.lyrics}</pre>
    `;

    songsContainer.appendChild(card);
  });
}

searchInput.addEventListener("input", () => {
  const text = searchInput.value.toLowerCase();

  const filtered = songs.filter(song =>
    song.title.toLowerCase().includes(text) ||
    song.artist.toLowerCase().includes(text) ||
    song.category.toLowerCase().includes(text) ||
    song.lyrics.toLowerCase().includes(text)
  );

  renderSongs(filtered);
});

renderSongs(songs);
