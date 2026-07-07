let plans = JSON.parse(localStorage.getItem("plans") || "[]");
let currentPlanId = null;

function savePlans() {
    localStorage.setItem("plans", JSON.stringify(plans));
}

const plannerBtn = document.getElementById("plannerBtn");

function openPlanner() {
    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="location.reload()">← Volver</button>
            <h2>📋 Planificador de Cultos</h2>
            <p>Crea una lista de cantos para tu próximo servicio.</p>

            <input id="planName" type="text" placeholder="Nombre del culto, ejemplo: Domingo AM">

            <button class="planner-action" onclick="saveCurrentPlan()">
                💾 Guardar culto
            </button>

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

function renderPlansList() {
    const plansList = document.getElementById("plansList");
    if (!plansList) return;

    if (plans.length === 0) {
        plansList.innerHTML = "<p>No hay cultos guardados todavía.</p>";
        return;
    }

    plansList.innerHTML = plans.map(plan => `
        <div class="plan-card" onclick="openPlan(${plan.id})">
            <strong>📋 ${plan.name}</strong>
            <p>${plan.songs.length} cantos</p>
        </div>
    `).join("");
}

function openPlan(planId) {
    currentPlanId = planId;
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="openPlanner()">← Volver</button>
            <h2>📋 ${plan.name}</h2>
            <p>${plan.songs.length} cantos agregados</p>

            <button class="planner-action" onclick="openSongSelector(${plan.id})">
                ➕ Agregar cantos
            </button>

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

    planSongs.innerHTML = plan.songs.map(songId => {
        const song = songs.find(s => String(s.id) === String(songId));
        if (!song) return "";

        return `
            <div class="plan-song" onclick="openSong(${song.id})">
                <h3>🎵 ${song.title}</h3>
                <p>${song.artist || "Autor desconocido"}</p>

                <button onclick="event.stopPropagation(); removeSongFromPlan(${plan.id}, ${song.id})">
                    🗑 Quitar
                </button>
            </div>
        `;
    }).join("");
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
        </div>
    `).join("");
}

function addSongToPlan(songId) {
    const plan = plans.find(p => String(p.id) === String(currentPlanId));
    if (!plan) return;

    if (!plan.songs.some(id => String(id) === String(songId))) {
        plan.songs.push(songId);
        savePlans();
    }

    openPlan(currentPlanId);
}

function removeSongFromPlan(planId, songId) {
    const plan = plans.find(p => String(p.id) === String(planId));
    if (!plan) return;

    plan.songs = plan.songs.filter(id => String(id) !== String(songId));
    savePlans();
    openPlan(planId);
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
