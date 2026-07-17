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
      <pre>${renderExactChart(song.lyrics)}</pre>
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

      <button class="planner-action" onclick="convertCurrentTextToChordPro()">🎼 Formato ChordPro</button>
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

    const result = await Tesseract.recognize(file, "spa+eng", {
      logger: m => {
        const progress = document.getElementById("ocrProgress");
        if (progress && m.status) {
          const percent = m.progress ? Math.round(m.progress * 100) : "";
          progress.textContent = `${m.status} ${percent}%`;
        }
      }
    });

    const text = buildSongFromOCRWords(result.data).trim();

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

      <button class="planner-action" onclick="smartCleanCurrentOCRText()">🧠 Ordenar inteligente</button>
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


/* ===== Limpieza OCR acordes/letra ===== */

function isChordLine(line) {
  const clean = line.trim();
  if (!clean) return false;
  return /^([A-G](#|b)?(m|maj7|m7|7|sus|sus2|sus4|dim|aug|add9)?(\/[A-G](#|b)?)?\s*)+$/.test(clean);
}

function cleanOCRLyrics(raw) {
  let lines = raw
    .replace(/lacu(erda|erda\.net|da\.net)/gi, "")
    .replace(/Follow.*$/gim, "")
    .replace(/on Bandsintown/gi, "")
    .replace(/ESPERO QUE LES GUSTE MUCHO/gi, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l);

  let output = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (isChordLine(line) && lines[i + 1]) {
      output.push(`[${line.replace(/\s+/g, " ")}] ${lines[i + 1]}`);
      i++;
    } else {
      output.push(line);
    }
  }

  return output.join("\n");
}

function cleanCurrentOCRText() {
  const area = document.getElementById("ocrSongLyrics");
  const chordBox = document.getElementById("ocrSongChords");
  if (!area) return;

  area.value = cleanOCRLyrics(area.value);

  const chords = detectChordsFromText(area.value);
  if (chordBox) chordBox.value = chords.join(" ");
}


/* ===== Importador Inteligente v2 ===== */

function smartIsChordLine(line) {
  const clean = line.trim();
  if (!clean) return false;

  const chord = String.raw`[A-G](?:#|b)?(?:m|maj7|m7|7|sus|sus2|sus4|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?`;
  const re = new RegExp(`^(${chord}\\s*)+$`);
  return re.test(clean);
}

function smartCleanOCRLyrics(raw) {
  let lines = raw
    .replace(/lacu(erda|erda\.net|da\.net)/gi, "")
    .replace(/Follow.*$/gim, "")
    .replace(/on Bandsintown/gi, "")
    .replace(/ESPERO QUE LES GUSTE MUCHO/gi, "")
    .replace(/Desconocido/gi, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l);

  let output = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (/^(verso|estrofa|coro|puente|intro|instrumental|solo|interlude|final)/i.test(line)) {
      output.push("");
      output.push(line.toUpperCase());
      continue;
    }

    if (smartIsChordLine(line) && lines[i + 1]) {
      output.push(`[${line.replace(/\s+/g, " ")}] ${lines[i + 1]}`);
      i++;
      continue;
    }

    output.push(line);
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function smartCleanCurrentOCRText() {
  const area = document.getElementById("ocrSongLyrics");
  const chordBox = document.getElementById("ocrSongChords");
  const toneBox = document.getElementById("ocrSongTone");

  if (!area) return;

  area.value = smartCleanOCRLyrics(area.value);

  const chords = detectChordsFromText(area.value);
  if (chordBox) chordBox.value = chords.join(" ");
  if (toneBox && chords[0]) toneBox.value = chords[0];

  alert("Letra ordenada con Importador Inteligente v2.");
}


/* ===== Importador Inteligente v3 con posición visual ===== */

function buildSongFromOCRWords(data) {
  if (!data || !data.words) {
    return data.text || "";
  }

  const words = data.words
    .filter(w => w.text && w.text.trim())
    .map(w => ({
      text: w.text.trim(),
      x: w.bbox.x0,
      y: w.bbox.y0,
      h: w.bbox.y1 - w.bbox.y0
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const lines = [];

  words.forEach(word => {
    let line = lines.find(l => Math.abs(l.y - word.y) < 14);
    if (!line) {
      line = { y: word.y, words: [] };
      lines.push(line);
    }
    line.words.push(word);
  });

  lines.sort((a, b) => a.y - b.y);
  lines.forEach(l => l.words.sort((a, b) => a.x - b.x));

  const chordRegex = /^[A-G](#|b)?(m|maj7|m7|7|sus|sus2|sus4|dim|aug|add9)?(\/[A-G](#|b)?)?$/;

  function lineText(line) {
    return line.words.map(w => w.text).join(" ");
  }

  function isChordOnlyLine(line) {
    return line.words.length > 0 && line.words.every(w => chordRegex.test(w.text));
  }

  function placeChords(chordLine, lyricLine) {
    const lyricWords = lyricLine.words;
    let output = "";

    lyricWords.forEach((word, index) => {
      const chordsHere = chordLine.words
        .filter(chord => {
          const next = lyricWords[index + 1];
          if (!next) return chord.x >= word.x - 18;
          return chord.x >= word.x - 18 && chord.x < next.x - 18;
        })
        .map(c => c.text);

      if (chordsHere.length) {
        output += "[" + chordsHere.join(" ") + "] ";
      }

      output += word.text + " ";
    });

    return output.trim();
  }

  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    let currentText = lineText(current)
      .replace(/lacu(erda|erda\.net|da\.net)/gi, "")
      .replace(/Follow.*$/gi, "")
      .replace(/on Bandsintown/gi, "")
      .trim();

    if (!currentText) continue;

    if (isChordOnlyLine(current) && next && !isChordOnlyLine(next)) {
      result.push(placeChords(current, next));
      i++;
      continue;
    }

    if (/^(verso|estrofa|coro|puente|intro|instrumental|solo|interlude|final)/i.test(currentText)) {
      result.push("");
      result.push(currentText.toUpperCase());
      continue;
    }

    result.push(currentText);
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}


/* ===== Corrector rápido para pegar cantos ===== */

function quickFormatOCRText(text) {
  return text
    .replace(/Cc\b/g, "C")
    .replace(/\biF\b/g, "F")
    .replace(/II\s*0\s*</g, "")
    .replace(/[|<>]/g, "")
    .replace(/\s+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatCurrentSongText() {
  const area =
    document.getElementById("newSongLyrics") ||
    document.getElementById("ocrSongLyrics");

  if (!area) {
    alert("No encontré el cuadro de letra.");
    return;
  }

  area.value = quickFormatOCRText(area.value);
  alert("Texto limpiado. Revisa y guarda.");
}


/* ===== Render profesional de letras con acordes ===== */


function renderChordLyrics(rawLyrics) {
  return renderChordPro(rawLyrics);
}


/* ===== Editor profesional de cantos v2.2 ===== */

function enhanceLyricsEditorPro() {
  const area = document.getElementById("newSongLyrics") || document.getElementById("ocrSongLyrics");
  if (!area || area.dataset.proEditor === "1") return;

  area.dataset.proEditor = "1";

  const shell = document.createElement("div");
  shell.className = "pro-editor-shell";

  const toolbar = document.createElement("div");
  toolbar.className = "pro-editor-toolbar";
  toolbar.innerHTML = `
    <button type="button" onclick="convertCurrentTextToChordPro()">🎼 ChordPro</button>
    <button type="button" onclick="insertSongExample()">📄 Ejemplo</button>
    <button type="button" onclick="toggleEditorFullscreen()">⛶ Pantalla</button>
  `;

  const body = document.createElement("div");
  body.className = "pro-editor-body";

  const nums = document.createElement("div");
  nums.className = "line-numbers";

  area.parentNode.insertBefore(shell, area);
  shell.appendChild(toolbar);
  shell.appendChild(body);
  body.appendChild(nums);
  body.appendChild(area);

  area.classList.add("pro-lyrics-editor");

  function updateLines() {
    const count = Math.max(area.value.split("\n").length, 1);
    nums.innerHTML = Array.from({ length: count }, (_, i) => i + 1).join("<br>");
  }

  area.addEventListener("input", () => {
    updateLines();
    updateDetectedChordsFromEditor();
  });

  area.addEventListener("scroll", () => {
    nums.scrollTop = area.scrollTop;
  });

  updateLines();
  updateDetectedChordsFromEditor();
}

function updateDetectedChordsFromEditor() {
  const area = document.getElementById("newSongLyrics") || document.getElementById("ocrSongLyrics");
  const chordBox = document.getElementById("newSongChords") || document.getElementById("ocrSongChords");
  if (!area || !chordBox) return;

  const chords = detectChordsFromText(area.value);
  chordBox.value = chords.join(" ");
}

function insertSongExample() {
  const area = document.getElementById("newSongLyrics") || document.getElementById("ocrSongLyrics");
  if (!area) return;

  area.value = `VERSO:

[E]
Abre mis ojos oh Cristo

[B/D#]
Abre mis ojos Te pido

[E/A]
Yo quiero verte

[E]
Yo quiero verte


CORO:

[B]        [C#m]
Y contemplar Tu Majestad

[A]        [Bsus]
Y el resplandor de Tu Gloria

[B]        [C#m]
Derrama Tu amor y poder

[A]
Cuando cantamos:

[Bsus]        [B]
Santo, Santo`;
  area.dispatchEvent(new Event("input"));
}

function toggleEditorFullscreen() {
  const shell = document.querySelector(".pro-editor-shell");
  if (!shell) return;
  shell.classList.toggle("editor-fullscreen");
}

const originalOpenAddSongEditorPro = typeof openAddSongEditor === "function" ? openAddSongEditor : null;
if (originalOpenAddSongEditorPro) {
  openAddSongEditor = function() {
    originalOpenAddSongEditorPro();
    setTimeout(enhanceLyricsEditorPro, 50);
  }
}

const originalOpenOCRReviewEditorPro = typeof openOCRReviewEditor === "function" ? openOCRReviewEditor : null;
if (originalOpenOCRReviewEditorPro) {
  openOCRReviewEditor = function(rawText) {
    originalOpenOCRReviewEditorPro(rawText);
    setTimeout(enhanceLyricsEditorPro, 50);
  }
}

/* ===== Activar editor REAL estilo código ===== */
function activarEditorReal() {
  const area = document.getElementById("newSongLyrics") || document.getElementById("ocrSongLyrics");
  if (!area || area.dataset.realEditor === "1") return;

  document.body.classList.add("pro-song-editor-mode");
  area.dataset.realEditor = "1";

  const box = document.createElement("div");
  box.className = "pro-editor-box";

  const bar = document.createElement("div");
  bar.className = "pro-editor-bar";
  bar.innerHTML = `
    <button type="button" onclick="convertCurrentTextToChordPro()">🎼 ChordPro</button>
    <button type="button" onclick="insertSongExample()">📄 Ejemplo</button>
    <button type="button" onclick="document.querySelector('.pro-editor-box').classList.toggle('fullscreen')">⛶</button>
  `;

  const content = document.createElement("div");
  content.className = "pro-editor-content";

  const nums = document.createElement("div");
  nums.className = "pro-line-numbers";

  area.parentNode.insertBefore(box, area);
  box.appendChild(bar);
  box.appendChild(content);
  content.appendChild(nums);
  content.appendChild(area);

  area.classList.add("pro-code-area");

  function updateNums() {
    const total = area.value.split("\n").length || 1;
    nums.innerHTML = Array.from({length: total}, (_, i) => i + 1).join("<br>");
  }

  area.addEventListener("input", updateNums);
  area.addEventListener("scroll", () => nums.scrollTop = area.scrollTop);
  updateNums();
}

const editorObserver = new MutationObserver(() => activarEditorReal());
editorObserver.observe(document.body, { childList:true, subtree:true });
setInterval(activarEditorReal, 500);


/* ===== ChordPro oficial para AdorApp ===== */

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderChordPro(raw) {
  if (!raw) return "";

  return raw.split("\n").map(line => {
    const clean = line.trimEnd();

    if (!clean.trim()) return "<br>";

    if (/^(VERSO|VERSO:|CORO|CORO:|PUENTE|PUENTE:|INTRO|INTRO:|FINAL|FINAL:|INSTRUMENTAL|INSTRUMENTAL:)$/i.test(clean.trim())) {
      return `<div class="song-section-title">${escapeHTML(clean.trim())}</div>`;
    }

    let chordLine = "";
    let lyricLine = "";
    let lyricPos = 0;

    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(clean)) !== null) {
      const before = clean.slice(lastIndex, match.index);
      lyricLine += before;
      lyricPos += before.length;

      const chord = match[1];
      while (chordLine.length < lyricPos) chordLine += " ";
      chordLine += chord;

      lastIndex = regex.lastIndex;
    }

    lyricLine += clean.slice(lastIndex);

    if (chordLine.trim()) {
      return `
        <div class="chordpro-line">
          <div class="chordpro-chords">${escapeHTML(chordLine)}</div>
          <div class="chordpro-lyrics">${escapeHTML(lyricLine)}</div>
        </div>
      `;
    }

    return `<div class="chordpro-lyrics">${escapeHTML(clean)}</div>`;
  }).join("");
}

function normalizeToChordPro(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/^\s*([A-G](?:#|b)?(?:m|maj7|m7|7|sus|sus2|sus4|dim|aug|add9)?(?:\/[A-G](?:#|b)?)?)\s*$/gm, "[$1]")
    .replace(/\[([^\]]+)\]\s+/g, "[$1]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function convertCurrentTextToChordPro() {
  const area = document.getElementById("newSongLyrics") || document.getElementById("ocrSongLyrics");
  if (!area) return alert("No encontré el editor.");
  area.value = normalizeToChordPro(area.value);
  area.dispatchEvent(new Event("input"));
  alert("Formato ChordPro aplicado.");
}


/* ===== Mostrar canto EXACTO como fue escrito ===== */
function renderExactChart(raw) {
  if (!raw) return "";
  return `<pre class="exact-chart">${String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;
}

/* ===== Modo llenar fichas manualmente ===== */

function getAdorSongs() {
  return JSON.parse(localStorage.getItem("adorapp_custom_songs") || "null") || songs;
}

function saveAdorSongs(list) {
  localStorage.setItem("adorapp_custom_songs", JSON.stringify(list));
  window.songs = list;
}

function escapeAdorHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderExactChart(raw) {
  return `<pre class="exact-chart">${escapeAdorHTML(raw || "")}</pre>`;
}

/* ocultar botones que ya no se usarán */
setInterval(() => {
  ["addSongBtn", "importImageBtn", "imageImportInput", "importImageInput"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}, 500);

/* editor directo de ficha existente */
function openEditSongSheet(songId) {
  const list = getAdorSongs();
  const song = list.find(s => String(s.id) === String(songId));
  if (!song) return alert("No encontré este canto.");

  const main = document.querySelector("main") || document.body;

  main.innerHTML = `
    <section class="edit-sheet">
      <button onclick="renderSongs()" class="back-btn">← Volver</button>

      <h1>Editar ficha</h1>

      <label>Título</label>
      <input id="editTitle" value="${escapeAdorHTML(song.title || "")}">

      <label>Autor</label>
      <input id="editAuthor" value="${escapeAdorHTML(song.author || "")}">

      <label>Categoría</label>
      <input id="editCategory" value="${escapeAdorHTML(song.category || "")}">

      <label>Tonalidad</label>
      <input id="editKey" value="${escapeAdorHTML(song.key || song.originalKey || "")}">

      <label>Letra con acordes</label>
      <textarea id="editLyrics">${escapeAdorHTML(song.lyrics || "")}</textarea>

      <div class="edit-actions">
        <button class="cancel-edit-btn" onclick="renderSongs()">Cancelar</button>
        <button class="save-edit-btn" onclick="saveEditedSong('${song.id}')">Guardar</button>
      </div>
    </section>
  `;
}

function saveEditedSong(songId) {
  const list = getAdorSongs();
  const index = list.findIndex(s => String(s.id) === String(songId));
  if (index === -1) return alert("No encontré este canto.");

  list[index].title = document.getElementById("editTitle").value.trim();
  list[index].author = document.getElementById("editAuthor").value.trim();
  list[index].category = document.getElementById("editCategory").value.trim();
  list[index].key = document.getElementById("editKey").value.trim();
  list[index].originalKey = document.getElementById("editKey").value.trim();
  list[index].chords = "";
  list[index].lyrics = document.getElementById("editLyrics").value;

  saveAdorSongs(list);
  alert("Ficha guardada.");
  renderSongs();
}

/* reemplazar vista de detalle para agregar editar */
const oldShowSongDetailManual = typeof showSongDetail === "function" ? showSongDetail : null;

if (oldShowSongDetailManual) {
  showSongDetail = function(songId) {
    oldShowSongDetailManual(songId);

    setTimeout(() => {
      const container = document.querySelector(".song-detail") || document.querySelector("main");
      if (!container || document.getElementById("editExistingSongBtn")) return;

      const btn = document.createElement("button");
      btn.id = "editExistingSongBtn";
      btn.className = "planner-action";
      btn.textContent = "✏️ Editar ficha";
      btn.onclick = () => openEditSongSheet(songId);

      const back = container.querySelector("button");
      if (back && back.parentNode) {
        back.parentNode.insertBefore(btn, back.nextSibling);
      } else {
        container.prepend(btn);
      }

      container.innerHTML = container.innerHTML
        .replace(/<p><strong>Acordes:<\/strong>.*?<\/p>/s, "")
        .replace(/<strong>Acordes:<\/strong>.*?<br>/s, "");
    }, 100);
  };
}

/* si existe render viejo, mantener canciones desde localStorage */
const oldRenderSongsManual = typeof renderSongs === "function" ? renderSongs : null;

if (oldRenderSongsManual) {
  renderSongs = function() {
    window.songs = getAdorSongs();
    oldRenderSongsManual();

    setTimeout(() => {
      document.querySelectorAll(".song-card").forEach(card => {
        card.classList.add("small-song-card");
      });
    }, 100);
  };
}

/* usar vista exacta si existe render ChordPro viejo */
if (typeof renderChordPro === "function") {
  renderChordPro = function(raw) {
    return renderExactChart(raw);
  };
}

if (typeof renderChordLyrics === "function") {
  renderChordLyrics = function(raw) {
    return renderExactChart(raw);
  };
}

/* ===== Corrección definitiva: editar fichas desde openSong ===== */

const adorOriginalOpenSong = openSong;

openSong = function(songId) {
  adorOriginalOpenSong(songId);

  setTimeout(() => {
    const main = document.querySelector("main");
    if (!main) return;

    /* Evitar botones duplicados */
    document.getElementById("editExistingSongBtn")?.remove();

    const editBtn = document.createElement("button");
    editBtn.id = "editExistingSongBtn";
    editBtn.type = "button";
    editBtn.className = "edit-existing-song-btn";
    editBtn.innerHTML = "✏️ Editar ficha";
    editBtn.addEventListener("click", () => openEditSongSheet(songId));

    /*
      Colocarlo después del botón Volver.
      Si no se encuentra, se coloca al inicio de la ficha.
    */
    const buttons = [...main.querySelectorAll("button")];
    const backButton = buttons.find(btn =>
      btn.textContent.toLowerCase().includes("volver")
    );

    if (backButton) {
      backButton.insertAdjacentElement("afterend", editBtn);
    } else {
      main.prepend(editBtn);
    }

    /* Ocultar visualmente la información "Acordes" sin reconstruir la ficha */
    main.querySelectorAll("p, div").forEach(element => {
      const text = element.textContent.trim();

      if (
        /^Acordes:/i.test(text) &&
        element.children.length <= 2
      ) {
        element.style.display = "none";
      }
    });
  }, 100);
};

/* =========================================================
   ADORAPP — EDITOR DEFINITIVO DE LAS 125 FICHAS EXISTENTES
   ========================================================= */

const ADOR_EDIT_STORAGE = "adorapp_song_edits_v1";

function adorEscapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adorTextareaValue(value) {
  return adorEscapeHTML(value).replace(/<\/textarea/gi, "&lt;/textarea");
}

function adorReadSavedEdits() {
  try {
    return JSON.parse(localStorage.getItem(ADOR_EDIT_STORAGE) || "{}");
  } catch (error) {
    console.error("No se pudieron leer las fichas editadas:", error);
    return {};
  }
}

function adorWriteSavedEdits(edits) {
  localStorage.setItem(ADOR_EDIT_STORAGE, JSON.stringify(edits));
}

function adorApplySavedEdits() {
  const edits = adorReadSavedEdits();

  if (typeof songs === "undefined" || !Array.isArray(songs)) return;

  songs.forEach(song => {
    const saved = edits[String(song.id)];
    if (saved) Object.assign(song, saved);
  });
}

function adorReturnToList() {
  stopAutoScroll();

  document.body.classList.remove("projection-mode");
  selectedSong = null;
  transpose = 0;

  if (typeof filterSongs === "function") {
    filterSongs();
  } else {
    renderSongs(songs);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openExistingSongEditor(songId) {
  stopAutoScroll();
  document.body.classList.remove("projection-mode");

  const song = songs.find(item => String(item.id) === String(songId));

  if (!song) {
    alert("No se encontró esta ficha.");
    return;
  }

  songsContainer.innerHTML = `
    <section class="ador-edit-sheet">
      <div class="ador-edit-header">
        <button
          type="button"
          class="ador-edit-back"
          id="adorCancelEditTop"
        >
          ← Volver
        </button>

        <h2>Editar ficha</h2>
      </div>

      <p class="ador-edit-help">
        Escribe la letra y los acordes exactamente como deseas verlos.
        Los espacios y saltos de línea serán respetados.
      </p>

      <label for="adorEditTitle">Título</label>
      <input
        id="adorEditTitle"
        type="text"
        value="${adorEscapeHTML(song.title || "")}"
        autocomplete="off"
      >

      <label for="adorEditArtist">Autor / Grupo</label>
      <input
        id="adorEditArtist"
        type="text"
        value="${adorEscapeHTML(song.artist || "")}"
        autocomplete="off"
      >

      <label for="adorEditCategory">Categoría</label>
      <input
        id="adorEditCategory"
        type="text"
        value="${adorEscapeHTML(song.category || "")}"
        autocomplete="off"
      >

      <label for="adorEditTone">Tonalidad</label>
      <input
        id="adorEditTone"
        type="text"
        value="${adorEscapeHTML(song.tone || "")}"
        autocomplete="off"
      >

      <label for="adorEditLyrics">Letra con acordes</label>
      <textarea
        id="adorEditLyrics"
        wrap="off"
        spellcheck="false"
        autocapitalize="sentences"
      >${adorTextareaValue(song.lyrics || "")}</textarea>

      <div class="ador-edit-actions">
        <button
          type="button"
          class="ador-cancel-button"
          id="adorCancelEdit"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="ador-save-button"
          id="adorSaveEdit"
        >
          💾 Guardar ficha
        </button>
      </div>
    </section>
  `;

  document.getElementById("adorCancelEditTop").onclick = () => openSong(song.id);
  document.getElementById("adorCancelEdit").onclick = () => openSong(song.id);
  document.getElementById("adorSaveEdit").onclick = () => saveExistingSongEdit(song.id);

  window.scrollTo({ top: songsContainer.offsetTop, behavior: "smooth" });
}

function saveExistingSongEdit(songId) {
  const song = songs.find(item => String(item.id) === String(songId));

  if (!song) {
    alert("No se encontró esta ficha.");
    return;
  }

  const title = document.getElementById("adorEditTitle").value.trim();
  const artist = document.getElementById("adorEditArtist").value.trim();
  const category = document.getElementById("adorEditCategory").value.trim();
  const tone = document.getElementById("adorEditTone").value.trim();
  const lyrics = document.getElementById("adorEditLyrics").value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  if (!title) {
    alert("La ficha necesita un título.");
    document.getElementById("adorEditTitle").focus();
    return;
  }

  const updatedData = {
    title,
    artist: artist || "Pendiente",
    category: category || "Pendiente",
    tone: tone || "C",
    lyrics: lyrics || "Letra y acordes pendientes de agregar.",
    chords: []
  };

  Object.assign(song, updatedData);

  const edits = adorReadSavedEdits();
  edits[String(song.id)] = updatedData;
  adorWriteSavedEdits(edits);

  openSong(song.id);

  setTimeout(() => {
    const notice = document.createElement("div");
    notice.className = "ador-save-notice";
    notice.textContent = "✅ Ficha guardada correctamente";
    document.body.appendChild(notice);

    setTimeout(() => notice.remove(), 2200);
  }, 100);
}

/*
  Sustituye directamente la función real que abre las fichas.
  Ya no depende de showSongDetail ni de parches anteriores.
*/
openSong = function(songId) {
  stopAutoScroll();
  document.body.classList.remove("projection-mode");

  selectedSong = songs.find(song => String(song.id) === String(songId));

  if (!selectedSong) {
    alert("No se encontró este canto.");
    return;
  }

  const isFavorite = favorites.includes(selectedSong.id);
  const currentTone = transposeChord(selectedSong.tone, transpose);
  const displayedLyrics = transposeLyrics(selectedSong.lyrics, transpose);

  songsContainer.innerHTML = `
    <article class="song-detail ador-song-detail">
      <div class="ador-detail-topbar">
        <button
          id="projectionBtn"
          class="projection-btn"
          type="button"
        >
          🎥 Proyección
        </button>

        <button
          class="back-btn"
          type="button"
        >
          ← Volver
        </button>

        <button
          class="favorite-btn detail-heart"
          type="button"
          data-id="${adorEscapeHTML(selectedSong.id)}"
          aria-label="Favorito"
        >
          ${isFavorite ? "❤️" : "🤍"}
        </button>
      </div>

      <button
        id="editExistingSongBtn"
        class="edit-existing-song-btn"
        type="button"
      >
        ✏️ Editar ficha
      </button>

      <h2>${adorEscapeHTML(selectedSong.title)}</h2>

      <p>
        <strong>Autor:</strong>
        ${adorEscapeHTML(selectedSong.artist || "Pendiente")}
      </p>

      <p>
        <strong>Categoría:</strong>
        ${adorEscapeHTML(selectedSong.category || "Pendiente")}
      </p>

      <div class="transpose-box">
        <button id="downTone" type="button">−</button>
        <span>
          Tono:
          <strong>${adorEscapeHTML(currentTone)}</strong>
        </span>
        <button id="upTone" type="button">+</button>
      </div>

      <div class="font-box">
        <button id="smallText" type="button">A−</button>
        <span>Letra</span>
        <button id="bigText" type="button">A+</button>
      </div>

      <div class="scroll-box">
        <button id="slowScroll" type="button">−</button>
        <button id="toggleScroll" type="button">▶</button>
        <button id="fastScroll" type="button">+</button>
      </div>

      <pre
        class="lyrics-text ador-exact-lyrics"
        style="font-size:${lyricSize}px"
      >${adorEscapeHTML(displayedLyrics)}</pre>
    </article>
  `;

  document.querySelector(".back-btn").onclick = adorReturnToList;

  document.getElementById("editExistingSongBtn").onclick = () => {
    openExistingSongEditor(selectedSong.id);
  };

  document.querySelector(".detail-heart").onclick = event => {
    event.stopPropagation();
    toggleFavorite(selectedSong.id);
    openSong(selectedSong.id);
  };

  document.getElementById("projectionBtn").onclick = () => {
    document.body.classList.add("projection-mode");
    window.scrollTo({
      top: songsContainer.offsetTop,
      behavior: "smooth"
    });
  };

  document.getElementById("upTone").onclick = () => {
    transpose++;
    openSong(selectedSong.id);
  };

  document.getElementById("downTone").onclick = () => {
    transpose--;
    openSong(selectedSong.id);
  };

  document.getElementById("bigText").onclick = () => {
    lyricSize += 2;
    openSong(selectedSong.id);
  };

  document.getElementById("smallText").onclick = () => {
    if (lyricSize > 12) lyricSize -= 2;
    openSong(selectedSong.id);
  };

  document.getElementById("slowScroll").onclick = () => {
    scrollSpeed = Math.max(1, scrollSpeed - 1);
  };

  document.getElementById("fastScroll").onclick = () => {
    scrollSpeed++;
  };

  document.getElementById("toggleScroll").onclick = event => {
    if (scrollInterval) {
      stopAutoScroll();
      event.currentTarget.textContent = "▶";
      return;
    }

    event.currentTarget.textContent = "⏸";
    scrollInterval = setInterval(() => {
      window.scrollBy(0, scrollSpeed);
    }, 40);
  };

  window.scrollTo({
    top: songsContainer.offsetTop,
    behavior: "smooth"
  });
};

/* Cargar las modificaciones guardadas en este teléfono */
adorApplySavedEdits();

/* Volver a mostrar la lista con los datos recuperados */
setTimeout(() => {
  if (!selectedSong) {
    if (typeof filterSongs === "function") {
      filterSongs();
    } else {
      renderSongs(songs);
    }
  }
}, 150);


/* ===== CORRECCIÓN: recuperar y mostrar las 125 fichas ===== */

if (typeof oldRenderSongsManual === "function") {
  renderSongs = function(list) {
    const songList = Array.isArray(list) ? list : songs;

    oldRenderSongsManual(songList);

    setTimeout(() => {
      document.querySelectorAll(".song-card").forEach(card => {
        card.classList.add("small-song-card");
      });
    }, 50);
  };
}

/* Volver a aplicar las ediciones guardadas sin reemplazar el catálogo */
if (typeof adorApplySavedEdits === "function") {
  adorApplySavedEdits();
}

/* Mostrar nuevamente el catálogo */
setTimeout(() => {
  if (typeof filterSongs === "function") {
    filterSongs();
  } else if (typeof renderSongs === "function") {
    renderSongs(songs);
  }
}, 100);

