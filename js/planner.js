let plans = JSON.parse(localStorage.getItem("plans") || "[]");

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
        <div class="plan-card" data-id="${plan.id}">
            <strong>📋 ${plan.name}</strong>
            <p>${plan.songs.length} cantos</p>
        </div>
    `).join("");
}

function openPlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    document.getElementById("songs").innerHTML = `
        <div class="song-detail">
            <button class="back-btn" onclick="openPlanner()">← Volver</button>
            <h2>📋 ${plan.name}</h2>
            <p>${plan.songs.length} cantos agregados</p>

            <button class="planner-action">
                ➕ Agregar cantos
            </button>

            <div id="planSongs">
                ${plan.songs.length === 0 ? "<p>Este culto aún no tiene cantos.</p>" : ""}
            </div>
        </div>
    `;
}

if (plannerBtn) {
    plannerBtn.addEventListener("click", openPlanner);
}

document.addEventListener("click", (event) => {
    const card = event.target.closest(".plan-card");
    if (!card) return;

    const planId = Number(card.dataset.id);
    openPlan(planId);
});
