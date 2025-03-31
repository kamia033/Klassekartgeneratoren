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



window.grid = grid;
window.isExporting = isExporting;
window.canvas = canvas;

window.unsavedChanges = unsavedChanges;









