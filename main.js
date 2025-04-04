import ClassroomGrid from './classes.js';
import * as classes from './classes.js';
import * as utils from './utils.js';
import * as contextMenu from './contextMenu.js';

const canvas = document.getElementById("gridCanvas");
const grid = new ClassroomGrid(canvas);
let unsavedChanges = false;
let currentClass = null;
let isExporting = false;



utils.updateClassDropdown();
grid.zones[0]= new classes.Zone(300, 300, 200, 300);
grid.draw();
grid.drawFullscreenBtn();


// Legg til event listener for fullscreen-knappen
const fullscreenBtn = document.getElementById("fullscreen-button");
fullscreenBtn.addEventListener("click", () => {
  console.log("Fullscreen button clicked");
  utils.toggleFullscreen();
});

window.grid = grid;
window.isExporting = isExporting;
window.canvas = canvas;

window.unsavedChanges = unsavedChanges;









