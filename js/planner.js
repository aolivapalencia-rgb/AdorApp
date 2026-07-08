let plans = JSON.parse(localStorage.getItem("plans") || "[]");
let currentPlanId = null;
let currentCultSongIndex = 0;
let cultLyricSize = Number(localStorage.getItem("cultLyricSize") || 24);
let wakeLock = null;
let touchStartX = 0;
let touchStartY = 0;

const plannerBtn = document.getElementById("plannerBtn");
const NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

function savePlans() {
    localStorage.setItem("plans", JSON.stringify(plans));
}

function normalizePlanSongs(plan) {
    plan.songs = (plan.songs || []).map(item => {
        if (typeof item === "object" && item !== null) {
            return {
                id: item.id,
                tone: item.tone || getSongTone(item.id)
            };
        }
        return { id: item, tone: getSongTone(item) };
    });
}

function getSongTone(songId) {
    const song = songs.find(s => String(s.id) === String(songId));
    return song ? song.tone : "C";
}

plans.forEach(normalizePlanSongs);
savePlans();

function transposeChord(chord, steps) {
    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) return chord;

    const note = match[1];
    const rest = match[2];
    const index = NOTES.indexOf(note);
    if (index === -1) return chord;

    return NOTES[(index + steps + NOTES.length) % NOTES.length] + rest;
}

function getToneSteps(fromTone, toTone) {
    const from = NOTES.indexOf(fromTone);
    const to = NOTES.indexOf(toTone);
    if (from === -1 || to === -1) return 0;
    return to - from;
}

function getTransposedChordsForPlan(song, targetTone) {
    const steps = getToneSteps(song.tone, targetTone);
    return song.chords.map(chord => transposeChord(chord, steps));
}

function openPlanner() {
    releaseWakeLock();
    document.body.classList.remove("cult-pro-active");

    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="location.reload()">← Volver</button>
            <h2>📋 Planificador de Cultos</h2>
            <p>Crea una lista de cantos para tu próximo servicio.</p>

            <input id="planName" type="text" placeholder="Nombre del culto, ejemplo: Domingo AM">

            <button class="planner-action" onclick="saveCurrentPlan()">💾 Guardar culto</button>

            <div id="plansList"></div>
        </div>
    `;

    renderPlansList();
}

function saveCurrentPlan() {
    const input = document.getElementById("planName");
    const planName = input ? input.value.trim() : "";

    if (!planName) {
        alert("Escribe un nombre para el culto.");
        return;
    }

    plans.push({
        id: Date.now(),
        name: planName,
        songs: []
    });

    savePlans();
    openPlanner();
}

function deletePlan(planId) {
    if (!confirm("¿Eliminar este culto?")) return;

    plans = plans.filter(p => String(p.id) !== String(planId));
    savePlans();
    openPlanner();
}

function renderPlansList() {
    const plansList = document.getElementById("plansList");
    if (!plansList) return;

    if (plans.length === 0) {
        plansList.innerHTML = "<p>No hay cultos guardados todavía.</p>";
        return;
    }

    plansList.innerHTML = plans.map(plan => `
        <div class="plan-card">
            <strong onclick="openPlan(${plan.id})">📋 ${plan.name}</strong>
            <p>${plan.songs.length} cantos</p>
            <button onclick="deletePlan(${plan.id})">🗑 Eliminar culto</button>
        </div>
    `).join("");
}

function openPlan(planId) {
    releaseWakeLock();
    document.body.classList.remove("cult-pro-active");

    currentPlanId = planId;
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    normalizePlanSongs(plan);
    savePlans();

    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="openPlanner()">← Volver</button>
            <h2>📋 ${plan.name}</h2>
            <p>${plan.songs.length} cantos agregados</p>

            <button class="planner-action" onclick="openSongSelector(${plan.id})">➕ Agregar cantos</button>
            <button class="planner-action" onclick="startCultMode(${plan.id})">▶️ Iniciar culto</button>
            <button class="planner-action share-plan-btn" onclick="sharePlan(${plan.id})">📤 Compartir culto</button>

            <div id="planSongs"></div>
        </div>
    `;

    renderPlanSongs(plan);
}

function renderPlanSongs(plan) {
    const planSongs = document.getElementById("planSongs");
    if (!planSongs) return;

    if (plan.songs.length === 0) {
        planSongs.innerHTML = "<p>Este culto aún no tiene cantos.</p>";
        return;
    }

    planSongs.innerHTML = plan.songs.map((item, index) => {
        const song = songs.find(s => String(s.id) === String(item.id));
        if (!song) return "";

        return `
            <div class="plan-song">
                <h3 onclick="openSong(${song.id})">🎵 ${index + 1}. ${song.title}</h3>
                <p>${song.artist || "Autor desconocido"}</p>
                <div class="tone-pill">Tono del culto: <strong>${item.tone}</strong></div>

                <div class="plan-row-actions">
                    <button onclick="changePlanSongTone(${plan.id}, ${index}, -1)">◀ ${previousNote(item.tone)}</button>
                    <button onclick="changePlanSongTone(${plan.id}, ${index}, 1)">${nextNote(item.tone)} ▶</button>
                    <button onclick="moveSongUp(${plan.id}, ${index})">⬆️</button>
                    <button onclick="moveSongDown(${plan.id}, ${index})">⬇️</button>
                    <button onclick="removeSongFromPlan(${plan.id}, ${song.id})">🗑 Quitar</button>
                </div>
            </div>
        `;
    }).join("");
}

function previousNote(tone) {
    const i = NOTES.indexOf(tone);
    return NOTES[(i - 1 + NOTES.length) % NOTES.length] || tone;
}

function nextNote(tone) {
    const i = NOTES.indexOf(tone);
    return NOTES[(i + 1) % NOTES.length] || tone;
}

function changePlanSongTone(planId, index, direction) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    const item = plan.songs[index];
    const currentIndex = NOTES.indexOf(item.tone);
    if (currentIndex === -1) return;

    item.tone = NOTES[(currentIndex + direction + NOTES.length) % NOTES.length];
    savePlans();
    openPlan(planId);
}

function changeCurrentCultTone(direction) {
    const plan = plans.find(p => String(p.id) === String(currentPlanId));
    if (!plan) return;

    const item = plan.songs[currentCultSongIndex];
    const currentIndex = NOTES.indexOf(item.tone);
    if (currentIndex === -1) return;

    item.tone = NOTES[(currentIndex + direction + NOTES.length) % NOTES.length];
    savePlans();
    showCultSong();
}

function moveSongUp(planId, index) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan || index === 0) return;

    [plan.songs[index - 1], plan.songs[index]] = [plan.songs[index], plan.songs[index - 1]];
    savePlans();
    openPlan(planId);
}

function moveSongDown(planId, index) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan || index >= plan.songs.length - 1) return;

    [plan.songs[index + 1], plan.songs[index]] = [plan.songs[index], plan.songs[index + 1]];
    savePlans();
    openPlan(planId);
}

function openSongSelector(planId) {
    currentPlanId = planId;

    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="openPlan(${planId})">← Volver</button>
            <h2>➕ Agregar cantos</h2>
            <p>Toca un canto para agregarlo al culto.</p>

            <input id="songSelectorSearch" type="text" placeholder="Buscar canto...">

            <div id="songSelectorList"></div>
        </div>
    `;

    renderSongSelector(songs);
}

function renderSongSelector(list) {
    const songSelectorList = document.getElementById("songSelectorList");
    if (!songSelectorList) return;

    songSelectorList.innerHTML = list.map(song => `
        <div class="plan-card" onclick="addSongToPlan(${song.id})">
            <strong>🎵 ${song.title}</strong>
            <p>${song.artist || "Autor desconocido"}</p>
            <p>Tono original: ${song.tone}</p>
        </div>
    `).join("");
}

function addSongToPlan(songId) {
    const plan = plans.find(p => String(p.id) === String(currentPlanId));
    const song = songs.find(s => String(s.id) === String(songId));
    if (!plan || !song) return;

    if (!plan.songs.some(item => String(item.id) === String(songId))) {
        plan.songs.push({
            id: songId,
            tone: song.tone
        });
        savePlans();
    }

    openPlan(currentPlanId);
}

function removeSongFromPlan(planId, songId) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    plan.songs = plan.songs.filter(item => String(item.id) !== String(songId));
    savePlans();
    openPlan(planId);
}

function startCultMode(planId) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan || plan.songs.length === 0) {
        alert("Este culto no tiene cantos.");
        return;
    }

    currentPlanId = planId;
    currentCultSongIndex = 0;
    showCultSong();
}

function showCultSong() {
    const plan = plans.find(p => String(p.id) === String(currentPlanId));
    if (!plan) return;

    const item = plan.songs[currentCultSongIndex];
    const song = songs.find(s => String(s.id) === String(item.id));
    if (!song) return;

    const transposedChords = getTransposedChordsForPlan(song, item.tone);
    document.body.classList.add("cult-pro-active");

    document.getElementById("songs").innerHTML = `
        <div class="cult-pro-screen" id="cultProScreen">
            <div class="cult-topbar">
                <button onclick="openPlan(${plan.id})">✕</button>
                <div>
                    <strong>${plan.name}</strong>
                    <span>${currentCultSongIndex + 1} / ${plan.songs.length}</span>
                </div>
                <button onclick="toggleCultList()">☰</button>
            </div>

            <div class="cult-song-body">
                <h1>${song.title}</h1>
                <p class="cult-artist">${song.artist || ""}</p>

                <div class="cult-tone-control">
                    <button onclick="changeCurrentCultTone(-1)">◀</button>
                    <span>${item.tone}</span>
                    <button onclick="changeCurrentCultTone(1)">▶</button>
                </div>

                <p class="cult-chords"><strong>Acordes:</strong> ${transposedChords.join(" ")}</p>
                <pre class="lyrics-text cult-lyrics" style="font-size:${cultLyricSize}px">${song.lyrics}</pre>
            </div>

            <div class="cult-bottom-bar">
                <button onclick="previousCultSong()">⬅️</button>
                <button onclick="decreaseCultLyricSize()">A−</button>
                <button onclick="toggleWakeLock()">🔒</button>
                <button onclick="increaseCultLyricSize()">A+</button>
                <button onclick="nextCultSong()">➡️</button>
            </div>

            <div id="cultQuickList" class="cult-quick-list hidden">
                <h3>Lista del culto</h3>
                ${renderCultQuickList(plan)}
            </div>
        </div>
    `;

    setupCultGestures();
}

function renderCultQuickList(plan) {
    return plan.songs.map((item, index) => {
        const song = songs.find(s => String(s.id) === String(item.id));
        if (!song) return "";
        const active = index === currentCultSongIndex ? "active" : "";
        return `<div class="cult-list-item ${active}" onclick="jumpToCultSong(${index})">${index + 1}. ${song.title} <span>${item.tone}</span></div>`;
    }).join("");
}

function toggleCultList() {
    const list = document.getElementById("cultQuickList");
    if (list) list.classList.toggle("hidden");
}

function jumpToCultSong(index) {
    currentCultSongIndex = index;
    showCultSong();
}

function previousCultSong() {
    if (currentCultSongIndex > 0) {
        currentCultSongIndex--;
        showCultSong();
    }
}

function nextCultSong() {
    const plan = plans.find(p => String(p.id) === String(currentPlanId));
    if (!plan) return;

    if (currentCultSongIndex < plan.songs.length - 1) {
        currentCultSongIndex++;
        showCultSong();
    } else {
        alert("Fin del culto.");
    }
}

function increaseCultLyricSize() {
    cultLyricSize = Math.min(42, cultLyricSize + 2);
    localStorage.setItem("cultLyricSize", cultLyricSize);
    showCultSong();
}

function decreaseCultLyricSize() {
    cultLyricSize = Math.max(16, cultLyricSize - 2);
    localStorage.setItem("cultLyricSize", cultLyricSize);
    showCultSong();
}

async function toggleWakeLock() {
    if (wakeLock) {
        releaseWakeLock();
        alert("Pantalla normal.");
        return;
    }

    try {
        if ("wakeLock" in navigator) {
            wakeLock = await navigator.wakeLock.request("screen");
            alert("Pantalla activa durante el culto.");
        } else {
            alert("Tu navegador no permite mantener la pantalla encendida.");
        }
    } catch (error) {
        alert("No se pudo activar pantalla encendida.");
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

function setupCultGestures() {
    const screen = document.getElementById("cultProScreen");
    if (!screen) return;

    screen.addEventListener("touchstart", event => {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    }, { passive: true });

    screen.addEventListener("touchend", event => {
        const dx = event.changedTouches[0].screenX - touchStartX;
        const dy = event.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) nextCultSong();
            else previousCultSong();
        }
    }, { passive: true });
}

function sharePlan(planId) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    let text = `📋 ${plan.name}\n\n`;

    plan.songs.forEach((item, index) => {
        const song = songs.find(s => String(s.id) === String(item.id));
        if (song) {
            text += `${index + 1}. ${song.title} — Tono: ${item.tone}\n`;
        }
    });

    if (navigator.share) {
        navigator.share({ title: plan.name, text });
    } else {
        navigator.clipboard.writeText(text);
        alert("Culto copiado al portapapeles.");
    }
}

document.addEventListener("input", event => {
    if (event.target.id === "songSelectorSearch") {
        const term = event.target.value.toLowerCase();
        const filtered = songs.filter(song =>
            song.title.toLowerCase().includes(term) ||
            (song.artist || "").toLowerCase().includes(term)
        );
        renderSongSelector(filtered);
    }
});

if (plannerBtn) {
    plannerBtn.addEventListener("click", openPlanner);
}
