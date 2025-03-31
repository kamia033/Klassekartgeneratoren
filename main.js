import ClassroomGrid from './classes.js';
import * as utils from './utils.js';
import * as contextMenu from './contextMenu.js';

const canvas = document.getElementById("gridCanvas");
const grid = new ClassroomGrid(canvas);
let unsavedChanges = false;
let currentClass = null;
let isExporting = false;

utils.updateClassDropdown();

grid.draw();



//Initialiserer eventlistnere

document.querySelectorAll("#contextMenu li").forEach(item => {
  item.addEventListener("click", function (e) {
    e.stopPropagation();
    const type = this.getAttribute("data-type");
    const menu = document.getElementById("contextMenu");
    const x = parseFloat(menu.dataset.x);
    const y = parseFloat(menu.dataset.y);

    if (type === "roundtable") {
      console.log("viser undermeny for rundbord!")
      contextMenu.showRoundtableSubMenu(e, x, y);
    } else {
      contextMenu.addElementAt(type, x, y);
    }
    menu.style.display = "none";
  });
});



document.querySelectorAll("#roundtableSubMenu li").forEach(item => {
  item.addEventListener("click", function () {
    const numSeats = parseInt(this.getAttribute("data-seats"));
    console.log(numSeats)
    const subMenu = document.getElementById("roundtableSubMenu");
    const x = parseFloat(subMenu.dataset.x);
    const y = parseFloat(subMenu.dataset.y);
    contextMenu.addElementAt("roundtable", x, y, numSeats);
    subMenu.style.display = "none";
  });
});

document.addEventListener("click", function (e) {
  const menu1 = document.getElementById("contextMenu");
  const menu2 = document.getElementById("groupContextMenu");
  const subMenu = document.getElementById("roundtableSubMenu");
  if (menu1.style.display === "block" && !menu1.contains(e.target)) {
    menu1.style.display = "none";
  }
  if (menu2.style.display === "block" && !menu2.contains(e.target)) {
    menu2.style.display = "none";
  }
  if (subMenu.style.display === "block" && !subMenu.contains(e.target)) {
    subMenu.style.display = "none";
  }
});

window.grid = grid;
window.isExporting = isExporting;
window.canvas = canvas;

window.unsavedChanges = unsavedChanges;









