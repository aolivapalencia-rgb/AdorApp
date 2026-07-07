const songsContainer = document.getElementById("songs");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");

// Llenar categorías
const categories = [...new Set(songs.map(song => song.category))];

categories.forEach(category => {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category;
  categoryFilter.appendChild(option);
});

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

function filterSongs() {
  const text = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = songs.filter(song => {
    const matchesText =
      song.title.toLowerCase().includes(text) ||
      song.artist.toLowerCase().includes(text) ||
      song.category.toLowerCase().includes(text) ||
      song.lyrics.toLowerCase().includes(text);

    const matchesCategory =
      category === "Todas" || song.category === category;

    return matchesText && matchesCategory;
  });

  renderSongs(filtered);
}

searchInput.addEventListener("input", filterSongs);
categoryFilter.addEventListener("change", filterSongs);

renderSongs(songs);
