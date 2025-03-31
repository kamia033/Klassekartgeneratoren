const funfacts = [
    "Du kan høyreklikke for å lage andre ting som tavle og andre markører.",
    "Du kan høyreklikke på en pult for å markere den for å IKKE få tildelt elev.",
    "Bruk eksporter bilde eller kopier til utklippstavle for å lagre tavlen. Da får du høyere kvalitet og X-ene blir ikke med.",
    "Du kan dobbelklikke på en pult for å endre navn.",
    "Vil du legge til en ny elev, etter å ha generert klassekart? Høyreklikk og velg 'Elevpult'. Dobbelklikk for å endre navn.",
    "Erfaringsmessig blir elevene mindre forvirret hvis man setter tavla øverst på klassekartet."
];

let currentIndex = Math.random() * funfacts.length | 0;
const funfactContainer = document.getElementById("fact");

function showFunfact(index) {
    funfactContainer.textContent = funfacts[index];
}

function nextFunfact() {
    currentIndex = (currentIndex + 1) % funfacts.length;
    showFunfact(currentIndex);
    //fjerner intervallet

   
}

function prevFunfact() {
    currentIndex = (currentIndex - 1 + funfacts.length) % funfacts.length;
    showFunfact(currentIndex);
    
    
}

document.getElementById("next").addEventListener("click", nextFunfact);
document.getElementById("prev").addEventListener("click", prevFunfact);

setInterval(nextFunfact, 10000); // Bytter funfact hvert 10. sekund
showFunfact(currentIndex);

function changeMode(){
    let btn1 = document.getElementById("active-mode");
    let btn2 = document.getElementById("inactive-mode");
    btn1.setAttribute("id", "inactive-mode");
    btn2.setAttribute("id", "active-mode");
}