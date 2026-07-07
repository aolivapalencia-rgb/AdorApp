const plans = JSON.parse(localStorage.getItem("plans") || "[]");

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

            <button id="savePlanBtn" class="planner-action">
                💾 Guardar culto
            </button>

            <div id="plansList"></div>
        </div>
    `;
}

if (plannerBtn) {
    plannerBtn.addEventListener("click", openPlanner);
}
