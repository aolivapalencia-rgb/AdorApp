const plans = JSON.parse(localStorage.getItem("plans") || "[]");

function savePlans() {
    localStorage.setItem("plans", JSON.stringify(plans));
}
const plannerBtn = document.getElementById("plannerBtn");

if (plannerBtn) {
    plannerBtn.addEventListener("click", () => {
        alert("🚧 Planificador en construcción.\n\nMuy pronto podrás crear y guardar listas de cantos.");
    });
}
