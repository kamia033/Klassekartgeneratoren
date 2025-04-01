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

// Legg til event listener for fullscreen-knappen
const fullscreenBtn = document.getElementById("mode-box");
console.log("Fullscreen button:", fullscreenBtn);
fullscreenBtn.addEventListener("click", () => {
  console.log("Fullscreen button clicked");
  utils.toggleFullscreen();
});

window.grid = grid;
window.isExporting = isExporting;
window.canvas = canvas;

window.unsavedChanges = unsavedChanges;









