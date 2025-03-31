const funfacts = [
    "Du kan høyreklikke for å lage andre ting som tavle og andre markører.",
    "Du kan høyreklikke på en pult for å markere den for å IKKE få tildelt elev.",
    "Bruk eksporter bilde eller kopier til utklippstavle for å lagre tavlen. Da får du høyere kvalitet og X-ene blir ikke med.",
    "Erfaringsmessig blir elevene mindre forvirret hvis man setter tavla øverst på klassekartet."
];

let currentIndex = Math.floor(Math.random() * funfacts.length);
let funfactContainer = null;

export function initializeFunfacts() {
    funfactContainer = document.getElementById("fact");
    if (!funfactContainer) return;

    document.getElementById("next")?.addEventListener("click", nextFunfact);
    document.getElementById("prev")?.addEventListener("click", prevFunfact);

    setInterval(nextFunfact, 10000); // Bytter funfact hvert 10. sekund
    showFunfact(currentIndex);
}

function showFunfact(index) {
    if (funfactContainer) {
        funfactContainer.textContent = funfacts[index];
    }
}

function nextFunfact() {
    currentIndex = (currentIndex + 1) % funfacts.length;
    showFunfact(currentIndex);
}

function prevFunfact() {
    currentIndex = (currentIndex - 1 + funfacts.length) % funfacts.length;
    showFunfact(currentIndex);
}

export function changeMode() {
    let btn1 = document.getElementById("active-mode");
    let btn2 = document.getElementById("inactive-mode");
    if (btn1 && btn2) {
        btn1.setAttribute("id", "inactive-mode");
        btn2.setAttribute("id", "active-mode");
    }
}
