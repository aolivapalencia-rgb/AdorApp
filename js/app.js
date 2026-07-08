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
let scrollInterval = null;
let scrollSpeed = 2;

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

function stopAutoScroll() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
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
  stopAutoScroll();
  document.body.classList.remove("projection-mode");

  selectedSong = songs.find(song => song.id === songId);
  const isFavorite = favorites.includes(selectedSong.id);
  const currentTone = transposeChord(selectedSong.tone, transpose);
  const transposedChords = getTransposedChords(selectedSong);

  songsContainer.innerHTML = `
    <div class="song-detail">
      <button id="projectionBtn" class="projection-btn">🎥 Proyección</button>
      <button class="back-btn">← Volver</button>
      <button class="favorite-btn detail-heart" data-id="${selectedSong.id}">
        ${isFavorite ? "❤️" : "🤍"}
      </button>


      <h2>${selectedSong.title}</h2>
      <p class="song-meta"><strong>Autor:</strong> ${selectedSong.artist}</p>
      <p class="song-meta"><strong>Categoría:</strong> ${selectedSong.category}</p>

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

      <div class="scroll-box">
        <button id="slowScroll">−</button>
        <button id="toggleScroll">▶</button>
        <button id="fastScroll">+</button>
      </div>

      <p class="chords-line"><strong>Acordes:</strong> ${transposedChords.join(" ")}</p>
      <pre class="lyrics-text" style="font-size:${lyricSize}px">${selectedSong.lyrics}</pre>
    </div>
  `;

  document.querySelector(".back-btn").addEventListener("click", () => {
    stopAutoScroll();
    document.body.classList.remove("projection-mode");
    selectedSong = null;
    transpose = 0;
    filterSongs();
  });

  document.querySelector(".detail-heart").addEventListener("click", event => {
    event.stopPropagation();
    toggleFavorite(selectedSong.id);
  });

  document.getElementById("projectionBtn").addEventListener("click", () => {
    document.body.classList.add("projection-mode");
    window.scrollTo({ top: songsContainer.offsetTop, behavior: "smooth" });
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

  document.getElementById("slowScroll").addEventListener("click", () => {
    scrollSpeed = Math.max(1, scrollSpeed - 1);
  });

  document.getElementById("fastScroll").addEventListener("click", () => {
    scrollSpeed += 1;
  });

  document.getElementById("toggleScroll").addEventListener("click", event => {
    if (scrollInterval) {
      stopAutoScroll();
      event.target.textContent = "▶";
      return;
    }

    event.target.textContent = "⏸";
    scrollInterval = setInterval(() => {
      window.scrollBy(0, scrollSpeed);
    }, 40);
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
  stopAutoScroll();
  document.body.classList.remove("projection-mode");

  const text = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = songs.filter(song => {
    const matchesText =
      song.title.toLowerCase().includes(text) ||
      song.artist.toLowerCase().includes(text) ||
      song.category.toLowerCase().includes(text) ||
      song.lyrics.toLowerCase().includes(text);

    const matchesCategory = category === "Todas" || song.category === category;
    const matchesFavorite = !showOnlyFavorites || favorites.includes(song.id);

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

document.addEventListener("click", () => {
  if (document.body.classList.contains("projection-mode")) {
    document.body.classList.remove("projection-mode");
    stopAutoScroll();
  }
});

songsContainer.addEventListener("click", event => {
  if (event.target.id === "projectionBtn") {
    event.stopPropagation();
  }
});

renderSongs(songs);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("Service Worker registrado"))
    .catch((error) => console.log("Error registrando Service Worker:", error));
}

window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    if (splash) splash.classList.add("hide");
  }, 2000);
});

/* ================= Historial de cantos ================= */

function saveRecentSong(songId) {
  let recentSongs = JSON.parse(localStorage.getItem("recentSongs") || "[]");
  recentSongs = recentSongs.filter(id => String(id) !== String(songId));
  recentSongs.unshift(songId);
  recentSongs = recentSongs.slice(0, 10);
  localStorage.setItem("recentSongs", JSON.stringify(recentSongs));
}

const originalOpenSong = openSong;

openSong = function(songId) {
  saveRecentSong(songId);
  originalOpenSong(songId);
};


/* ================= Editor de cantos ================= */

const addSongBtn = document.getElementById("addSongBtn");

function openAddSongEditor() {
  stopAutoScroll();
  document.body.classList.remove("projection-mode");
  document.body.classList.remove("cult-active");

  songsContainer.innerHTML = `
    <div class="song-detail">
      <button class="back-btn" onclick="filterSongs()">← Volver</button>
      <h2>🎵 Agregar nuevo canto</h2>

      <div class="editor-help">
        <strong>Formato recomendado:</strong><br>
        Usa acordes entre corchetes en la letra.<br><br>
        Ejemplo:<br>
        [C] Todo es posible<br>
        [G] Para el que cree
      </div>

      <label>Título</label>
      <input id="newSongTitle" type="text" placeholder="Ejemplo: Todo es posible">

      <label>Autor / Grupo</label>
      <input id="newSongArtist" type="text" placeholder="Ejemplo: Ricardo Rodríguez">

      <label>Categoría</label>
      <input id="newSongCategory" type="text" placeholder="Ejemplo: Alabanza">

      <label>Tono original</label>
      <input id="newSongTone" type="text" placeholder="Ejemplo: C">

      <label>Acordes principales</label>
      <textarea id="newSongChords" placeholder="Ejemplo: C G Am F"></textarea>

      <label>Letra con acordes</label>
      <textarea id="newSongLyrics" placeholder="[C] Todo es posible
[G] Si puedes creer
[Am] Se mueve la mano de Dios
[F] En su palabra viva"></textarea>

      <button class="planner-action" onclick="saveNewSong()">💾 Guardar canto</button>
    </div>
  `;
}

function saveNewSong() {
  const title = document.getElementById("newSongTitle").value.trim();
  const artist = document.getElementById("newSongArtist").value.trim() || "Autor desconocido";
  const category = document.getElementById("newSongCategory").value.trim() || "Sin categoría";
  const tone = document.getElementById("newSongTone").value.trim() || "C";
  const chordsText = document.getElementById("newSongChords").value.trim();
  const lyrics = document.getElementById("newSongLyrics").value.trim();

  if (!title || !lyrics) {
    alert("Escribe al menos el título y la letra.");
    return;
  }

  const newSong = {
    id: Date.now(),
    title,
    artist,
    category,
    tone,
    chords: chordsText ? chordsText.split(/\s+/) : [tone],
    lyrics
  };

  customSongs.push(newSong);
  saveCustomSongs();

  alert("Canto guardado correctamente.");

  const exists = [...categoryFilter.options].some(option => option.value === category);
  if (!exists) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  }

  filterSongs();
}

if (addSongBtn) {
  addSongBtn.addEventListener("click", openAddSongEditor);
}


/* ================= Importar canto desde imagen ================= */

const importImageBtn = document.getElementById("importImageBtn");
const imageImportInput = document.getElementById("imageImportInput");

function openImageImport() {
  imageImportInput.click();
}

async function processImportedImage(file) {
  if (!file) return;

  songsContainer.innerHTML = `
    <div class="song-detail">
      <button class="back-btn" onclick="filterSongs()">← Volver</button>
      <h2>📷 Analizando imagen...</h2>
      <p>Esto puede tardar unos segundos.</p>
      <p id="ocrProgress">Preparando lectura...</p>
    </div>
  `;

  try {
    if (!window.Tesseract) {
      alert("No se pudo cargar el lector de imágenes. Revisa tu conexión e intenta otra vez.");
      filterSongs();
      return;
    }

    const result = await Tesseract.recognize(file, "eng", {
      logger: m => {
        const progress = document.getElementById("ocrProgress");
        if (progress && m.status) {
          const percent = m.progress ? Math.round(m.progress * 100) : "";
          progress.textContent = `${m.status} ${percent}%`;
        }
      }
    });

    const text = result.data.text.trim();

    openOCRReviewEditor(text);

  } catch (error) {
    console.error(error);
    alert("No se pudo leer la imagen.");
    filterSongs();
  }
}

function detectChordsFromText(text) {
  const chordRegex = /\b[A-G](?:#|b)?(?:m|maj7|m7|7|sus4|sus2|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?\b/g;
  const found = text.match(chordRegex) || [];
  return [...new Set(found)];
}

function openOCRReviewEditor(rawText) {
  const chords = detectChordsFromText(rawText);
  const guessedTone = chords[0] || "C";

  songsContainer.innerHTML = `
    <div class="song-detail">
      <button class="back-btn" onclick="filterSongs()">← Volver</button>
      <h2>📷 Revisar canto importado</h2>

      <div class="editor-help">
        Revisa el texto antes de guardar. El lector puede equivocarse en algunas palabras o acordes.
      </div>

      <label>Título</label>
      <input id="ocrSongTitle" type="text" placeholder="Título del canto">

      <label>Autor / Grupo</label>
      <input id="ocrSongArtist" type="text" placeholder="Autor o grupo">

      <label>Categoría</label>
      <input id="ocrSongCategory" type="text" value="Adoración">

      <label>Tono original</label>
      <input id="ocrSongTone" type="text" value="${guessedTone}">

      <label>Acordes detectados</label>
      <textarea id="ocrSongChords">${chords.join(" ")}</textarea>

      <label>Letra con acordes</label>
      <textarea id="ocrSongLyrics">${rawText}</textarea>

      <button class="planner-action" onclick="saveOCRSong()">💾 Guardar canto</button>
    </div>
  `;
}

function saveOCRSong() {
  const title = document.getElementById("ocrSongTitle").value.trim();
  const artist = document.getElementById("ocrSongArtist").value.trim() || "Autor desconocido";
  const category = document.getElementById("ocrSongCategory").value.trim() || "Adoración";
  const tone = document.getElementById("ocrSongTone").value.trim() || "C";
  const chordsText = document.getElementById("ocrSongChords").value.trim();
  const lyrics = document.getElementById("ocrSongLyrics").value.trim();

  if (!title || !lyrics) {
    alert("Revisa que tenga título y letra.");
    return;
  }

  const newSong = {
    id: Date.now(),
    title,
    artist,
    category,
    tone,
    chords: chordsText ? chordsText.split(/\s+/) : [tone],
    lyrics,
    status: "completo"
  };

  customSongs.push(newSong);
  saveCustomSongs();

  alert("Canto importado correctamente.");
  filterSongs();
}

if (importImageBtn && imageImportInput) {
  importImageBtn.addEventListener("click", openImageImport);

  imageImportInput.addEventListener("change", event => {
    const file = event.target.files[0];
    processImportedImage(file);
  });
}
