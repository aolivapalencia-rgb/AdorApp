const songsContainer = document.getElementById("songs");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const favoritesFilter = document.getElementById("favoritesFilter");
const darkModeBtn = document.getElementById("darkModeBtn");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let showOnlyFavorites = false;
let selectedSong = null;
let transpose = 0;
let lyricSize = 18;

const notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const categories = [...new Set(songs.map(song => song.category))];

categories.forEach(category => {
  const option = document.createElement("option");
  option.value = category;
  option.textContent = category;
  categoryFilter.appendChild(option);
});

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function transposeChord(chord, steps) {
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const note = match[1];
  const rest = match[2];
  const index = notes.indexOf(note);

  if (index === -1) return chord;

  const newIndex = (index + steps + notes.length) % notes.length;
  return notes[newIndex] + rest;
}

function getTransposedChords(song) {
  return song.chords.map(chord => transposeChord(chord, transpose));
}

function toggleFavorite(songId) {
  if (favorites.includes(songId)) {
    favorites = favorites.filter(id => id !== songId);
  } else {
    favorites.push(songId);
  }

  saveFavorites();

  if (selectedSong) {
    openSong(selectedSong.id);
  } else {
    filterSongs();
  }
}

function openSong(songId) {
  selectedSong = songs.find(song => song.id === songId);
  const isFavorite = favorites.includes(selectedSong.id);
  const currentTone = transposeChord(selectedSong.tone, transpose);
  const transposedChords = getTransposedChords(selectedSong);

  songsContainer.innerHTML = `
    <div class="song-detail">
      <button class="back-btn">← Volver</button>
      <button class="favorite-btn detail-heart" data-id="${selectedSong.id}">
        ${isFavorite ? "❤️" : "🤍"}
      </button>

      <h2>${selectedSong.title}</h2>
      <p><strong>Autor:</strong> ${selectedSong.artist}</p>
      <p><strong>Categoría:</strong> ${selectedSong.category}</p>

      <div class="transpose-box">
        <button id="downTone">−</button>
        <span>Tono: ${currentTone}</span>
        <button id="upTone">+</button>
      </div>

      <div class="font-box">
        <button id="smallText">A−</button>
        <span>Letra</span>
        <button id="bigText">A+</button>
      </div>

      <p><strong>Acordes:</strong> ${transposedChords.join(" ")}</p>
      <pre class="lyrics-text" style="font-size:${lyricSize}px">${selectedSong.lyrics}</pre>
    </div>
  `;

  document.querySelector(".back-btn").addEventListener("click", () => {
    selectedSong = null;
    transpose = 0;
    filterSongs();
  });

  document.querySelector(".detail-heart").addEventListener("click", () => {
    toggleFavorite(selectedSong.id);
  });

  document.getElementById("upTone").addEventListener("click", () => {
    transpose++;
    openSong(selectedSong.id);
  });

  document.getElementById("downTone").addEventListener("click", () => {
    transpose--;
    openSong(selectedSong.id);
  });

  document.getElementById("bigText").addEventListener("click", () => {
    lyricSize += 2;
    openSong(selectedSong.id);
  });

  document.getElementById("smallText").addEventListener("click", () => {
    if (lyricSize > 12) lyricSize -= 2;
    openSong(selectedSong.id);
  });
}

function renderSongs(list) {
  songsContainer.innerHTML = "";

  list.forEach(song => {
    const isFavorite = favorites.includes(song.id);
    const card = document.createElement("div");
    card.className = "song";

    card.innerHTML = `
      <button class="favorite-btn" data-id="${song.id}">
        ${isFavorite ? "❤️" : "🤍"}
      </button>
      <h2>${song.title}</h2>
      <p><strong>Autor:</strong> ${song.artist}</p>
      <p><strong>Categoría:</strong> ${song.category}</p>
      <p><strong>Tonalidad:</strong> ${song.tone}</p>
      <p><strong>Acordes:</strong> ${song.chords.join(" ")}</p>
      <pre>${song.lyrics}</pre>
    `;

    card.addEventListener("click", () => {
      transpose = 0;
      openSong(song.id);
    });

    card.querySelector(".favorite-btn").addEventListener("click", event => {
      event.stopPropagation();
      toggleFavorite(song.id);
    });

    songsContainer.appendChild(card);
  });
}

function filterSongs() {
  selectedSong = null;

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

    const matchesFavorite =
      !showOnlyFavorites || favorites.includes(song.id);

    return matchesText && matchesCategory && matchesFavorite;
  });

  renderSongs(filtered);
}

favoritesFilter.addEventListener("click", () => {
  showOnlyFavorites = !showOnlyFavorites;
  favoritesFilter.textContent = showOnlyFavorites
    ? "📚 Mostrar todos los cantos"
    : "❤️ Mostrar solo favoritos";
  filterSongs();
});

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  darkModeBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Modo claro"
    : "🌙 Modo oscuro";
});

searchInput.addEventListener("input", filterSongs);
categoryFilter.addEventListener("change", filterSongs);

renderSongs(songs);
