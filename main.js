import ClassroomGrid from './classes.js';
import * as classes from './classes.js';
import * as utils from './utils.js';
import * as contextMenu from './contextMenu.js';

// Global switchTab function for tab navigation
window.switchTab = function(tabName) {
  console.log('switchTab called with:', tabName);
  // Fjern active-klasse fra alle tabs og knapper
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Fjern active-tab klasse fra alle knapper
  document.querySelectorAll('button[id*="btn"]').forEach(btn => btn.classList.remove('active-tab'));
  
  // Legg til active-klasse på valgt tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Sett active-tab klasse på riktige knapper
  if (tabName === 'klassekart') {
    document.getElementById('klassekart-btn')?.classList.add('active-tab');
    document.getElementById('klassekart-btn-2')?.classList.add('active-tab');
  } else {
    document.getElementById('grupper-btn')?.classList.add('active-tab');
    document.getElementById('grupper-btn-2')?.classList.add('active-tab');
  }
  
  // Håndter visning av canvas vs grupper
  const canvas = document.getElementById('gridCanvas');
  const groupsContainer = document.getElementById('groups-visual-container');
  const canvasControls = document.getElementById('canvas-controls');
  const fullscreenBtn = document.getElementById('fullscreen-button');
  
  if (tabName === 'grupper') {
    // Synkroniser elevliste automatisk når vi bytter til grupper-tab
    if (window.syncFromClassroomToGroups) {
      window.syncFromClassroomToGroups();
    }
    if (canvas) canvas.style.display = 'none';
    if (canvasControls) canvasControls.style.display = 'none';
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
    if (groupsContainer) {
      groupsContainer.style.display = 'block';
    }
  } else {
    if (canvas) canvas.style.display = 'block';
    if (canvasControls) canvasControls.style.display = 'flex';
    if (fullscreenBtn) fullscreenBtn.style.display = 'block';
    if (groupsContainer) groupsContainer.style.display = 'none';
  }
};

const canvas = document.getElementById("gridCanvas");
const grid = new ClassroomGrid(canvas);
let unsavedChanges = false;
let currentClass = null;
let isExporting = false;

utils.updateClassDropdown();

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









