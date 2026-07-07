let plans = JSON.parse(localStorage.getItem("plans") || "[]");
let currentPlanId = null;
let currentCultSongIndex = 0;

const plannerBtn = document.getElementById("plannerBtn");
const NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

function normalizePlanSongs(plan) {
    plan.songs = (plan.songs || []).map(item => {
        if (typeof item === "object") return item;
        const song = songs.find(s => String(s.id) === String(item));
        return { id: item, tone: song ? song.tone : "C" };
    });
}

plans.forEach(normalizePlanSongs);
savePlans();

function savePlans() {
    localStorage.setItem("plans", JSON.stringify(plans));
}

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
    return NOTES.indexOf(toTone) - NOTES.indexOf(fromTone);
}

function getTransposedChordsForPlan(song, targetTone) {
    const steps = getToneSteps(song.tone, targetTone);
    return song.chords.map(chord => transposeChord(chord, steps));
}

function openPlanner() {
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
                <p><strong>Tono del culto:</strong> ${item.tone}</p>

                <button onclick="changePlanSongTone(${plan.id}, ${index}, -1)">− Tono</button>
                <button onclick="changePlanSongTone(${plan.id}, ${index}, 1)">+ Tono</button>
                <button onclick="moveSongUp(${plan.id}, ${index})">⬆️</button>
                <button onclick="moveSongDown(${plan.id}, ${index})">⬇️</button>
                <button onclick="removeSongFromPlan(${plan.id}, ${song.id})">🗑 Quitar</button>
            </div>
        `;
    }).join("");
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

    document.getElementById("songs").innerHTML = `
        <div class="song-detail cult-mode-screen">
            <button class="back-btn" onclick="openPlan(${plan.id})">← Salir del culto</button>

            <div class="cult-header">
                <h2>${plan.name}</h2>
                <p>${currentCultSongIndex + 1} de ${plan.songs.length}</p>
            </div>

            <h2>${song.title}</h2>
            <p><strong>Tono del culto:</strong> ${item.tone}</p>
            <p><strong>Acordes:</strong> ${transposedChords.join(" ")}</p>

            <pre class="lyrics-text">${song.lyrics}</pre>

            <div class="cult-nav">
                <button class="planner-action" onclick="previousCultSong()">⬅️ Anterior</button>
                <button class="planner-action" onclick="nextCultSong()">Siguiente ➡️</button>
            </div>
        </div>
    `;
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
        navigator.share({
            title: plan.name,
            text: text
        });
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
