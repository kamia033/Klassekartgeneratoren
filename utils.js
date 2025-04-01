// Globale variabler
let unsavedChanges = false;
let currentClass = "";
let currentGroup = null;

import {Desk, Merkelapp, RoundTable} from "./classes.js";

// Vis inline notifikasjon i øvre høyre hjørne
export function showNotification(message, duration = 3000) {
  const notif = document.getElementById("notification");
  notif.innerText = message;
  notif.style.display = "block";
  setTimeout(() => { notif.style.display = "none"; }, duration);
}

// Kontrastberegning for tekst
export function getContrastColor(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "black" : "white";
}

export function drawFittedText(ctx, text, x, y, width, height, textColor, fontFamily = "Arial", fontWeight = "") {
  let fontSize = height * 0.8;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let measuredWidth = ctx.measureText(text).width;
  while (measuredWidth > width * 0.9 && fontSize > 5) {
    fontSize -= 1;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    measuredWidth = ctx.measureText(text).width;
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
}

export function drawRotatedText(ctx, text, x, y, width, height, angle, textColor, fontFamily = "Arial", fontWeight = "") {
  const cx = x + width / 2;
  const cy = y + height / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  let fontSize = height * 0.8;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  let measuredWidth = ctx.measureText(text).width;
  while (measuredWidth > width * 0.9 && fontSize > 5) {
    fontSize -= 1;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    measuredWidth = ctx.measureText(text).width;
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function getDeskGroups() {
  let desks = grid.desks;
  let visited = new Set();
  let groups = [];
  for (let desk of desks) {
    if (visited.has(desk)) continue;
    let group = [];
    let stack = [desk];
    while (stack.length) {
      let current = stack.pop();
      if (!visited.has(current)) {
        visited.add(current);
        group.push(current);
        for (let other of desks) {
          if (!visited.has(other)) {
            if ((other.gridX === current.gridX + 1 && other.gridY === current.gridY) ||
              (other.gridX === current.gridX - 1 && other.gridY === current.gridY) ||
              (other.gridY === current.gridY + 1 && other.gridX === current.gridX) ||
              (other.gridY === current.gridY - 1 && other.gridX === current.gridX)) {
              stack.push(other);
            }
          }
        }
      }
    }
    groups.push(group);
  }
  return groups;
}


export function sparkleItUp() {
  
    let palette = ['#FF0000', '#FF8700', '#FFD300', '#DEFF0A', '#A1FF0A', '#0AFF99', '#0AEFFF', '#147DF5', '#580AFF', '#BE0AFF'];
    let emojis = grid.emojis;
    let groups = getDeskGroups();
  
    palette = palette.sort(() => Math.random() - 0.5);
    emojis = emojis.sort(() => Math.random() - 0.5);
  
    let groupEmojis = [];
    groups.forEach((group, index) => {
      if (index < palette.length) {
        const color = palette[index];
        const emoji = emojis[0];
        group.forEach(group => { group.color = color; });
        console.log("Emoji:", emoji);
        // Bruk gridX/gridY for posisjon
        let centerX = group.reduce((sum, desk) => sum + (desk.gridX * grid.cellSize), 0) / group.length + grid.cellSize/2;
        let centerY = group.reduce((sum, desk) => sum + (desk.gridY * grid.cellSize), 0) / group.length + grid.cellSize/2;
  
        //groupEmojis.push({ text: emoji, x: centerX, y: centerY });
      }
    });
  
    grid.groupEmojis = groupEmojis; // Lagre for bruk i draw()
    
    // Tildel unike farger til rundbordene også (som før)
    let availableColors = [...palette];
    grid.roundtables.forEach(table => {
      if (availableColors.length > 0) {
        table.color = availableColors.pop();
      }
    });
  
    unsavedChanges = true;
    grid.draw();
  }



  
export function assignStudents() {
    const names = document.getElementById("studentList").value.split("\n");
    grid.assignStudents(names);
  }
  let debounceTimeout;
  
  export function updateCellSize(value) {
    let oldSize = grid.cellSize;
    grid.cellSize = parseInt(value);
    document.getElementById("cellSizeValue").innerText = value;
    let factor = grid.cellSize / oldSize;
    grid.others.forEach(other => {
      other.x *= factor;
      other.y *= factor;
      other.width *= factor;
      other.height *= factor;
    });
    grid.updateCanvasSize();
    unsavedChanges = true;
    grid.draw();
  }
  
  export function getElementsBoundingBox(gridObject) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    gridObject.desks.forEach(desk => {
      let x = desk.gridX * grid.cellSize;
      let y = desk.gridY * grid.cellSize;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + grid.cellSize);
      maxY = Math.max(maxY, y + grid.cellSize);
    });
    gridObject.others.forEach(other => {
      minX = Math.min(minX, other.x);
      minY = Math.min(minY, other.y);
      maxX = Math.max(maxX, other.x + other.width);
      maxY = Math.max(maxY, other.y + other.height);
    });
    gridObject.roundtables.forEach(table => {
      let x = table.gridX * grid.cellSize;
      let y = table.gridY * grid.cellSize;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 2 * grid.cellSize);
      maxY = Math.max(maxY, y + 2 * grid.cellSize);
    });
    if (minX === Infinity) {
      minX = 0; minY = 0;
      maxX = grid.canvas.width;
      maxY = grid.canvas.height;
    }
    let buffer = 2 * grid.cellSize;
    minX = Math.max(0, minX - buffer);
    minY = Math.max(0, minY - buffer);
    maxX = Math.min(grid.canvas.width, maxX + buffer);
    maxY = Math.min(grid.canvas.height, maxY + buffer);
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }
  

  // Klassehåndtering for den nye dropdown-menyen
  export function updateClassDropdown() {
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    const dropdown = document.querySelector(".dropdown-options");
    dropdown.innerHTML = Object.keys(savedClasses).map(c => `<li data-value="${c}" onclick="selectOption(this)">${c}</li>`).join('');
  
    // Hvis det er en valgt klasse, vis den i den valgte dropdownen
    if (currentClass && savedClasses[currentClass]) {
      document.querySelector('.dropdown-selected').textContent = currentClass;
    }
  }
  
  export function saveSpecificClass(className) {
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    savedClasses[className] = grid.saveState();
    localStorage.setItem("classes", JSON.stringify(savedClasses));
    unsavedChanges = false;
    showNotification("Klassen '" + className + "' er lagret.", 3000);
    updateClassDropdown();
  }
  
  export function saveCurrentClass() {
    if (!currentClass) return;
    saveSpecificClass(currentClass);
  }
  
  export function saveClass() {
    const selected = document.querySelector('.dropdown-selected').textContent;
    if (!selected) {
      alert("Vennligst velg en klasse i dropdown-menyen.");
      return;
    }
    saveSpecificClass(selected);
    grid.currentClass = selected;
  }
  
  export function loadClass(className) {
    if (!className) return;
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    if (savedClasses[className]) {
      grid.loadState(savedClasses[className]);
      grid.currentClass = className;
      document.querySelector('.dropdown-selected').textContent = className;
    }
  }
  
  export function handleClassChange(newClass) {
    if (newClass === currentClass) return;
    let oldClass = currentClass;
    if (unsavedChanges && oldClass) {
      if (confirm("Du har uspurte endringer i " + oldClass + ". Vil du lagre dem før du bytter klasse?")) {
        saveSpecificClass(oldClass);
      }
    }
    grid.currentClass = newClass;
    loadClass(newClass);
  }
  
  export function createNewClass() {
    const newName = prompt("Oppgi navn for den nye klassen:");
    if (!newName) return;
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    if (savedClasses[newName]) {
      if (!confirm("Klassen finnes allerede. Er du sikker på at du vil overskrive den?")) {
        return;
      }
    }
    grid.desks = [];
    grid.others = [];
    grid.roundtables = [];
    document.getElementById("studentList").value = "";
    savedClasses[newName] = grid.saveState();
    localStorage.setItem("classes", JSON.stringify(savedClasses));
    updateClassDropdown();
    document.querySelector('.dropdown-selected').textContent = newName;
    showNotification("Klassen '" + newName + "' er opprettet og lagret.", 3000);
    unsavedChanges = false;
    grid.currentClass = newName;
    grid.draw();
  }
  
  export function deleteClass() {
    const className = document.querySelector('.dropdown-selected').textContent;
    if (!className) return;
    if (confirm(`Er du sikker på at du vil slette klassen '${className}'?`)) {
      const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
      delete savedClasses[className];
      localStorage.setItem("classes", JSON.stringify(savedClasses));
      updateClassDropdown();
      grid.desks = [];
      grid.others = [];
      grid.roundtables = [];
      grid.draw();
      document.getElementById("studentList").value = "";
    }
  }


  
  export function setElementColor(color) {
    grid.desks.forEach(desk => { desk.color = color; });
    grid.roundtables.forEach(table => { table.color = color; });
    grid.deskColor = color;
    grid.roundtableFill = color;
    grid.occupiedColor = color;
    unsavedChanges = true;
    grid.draw();
  }
  
  export function toggleDropdown() {
    const options = document.querySelector('.dropdown-options');
    options.style.display = options.style.display === 'block' ? 'none' : 'block';
  }
  
  export function selectOption(element) {
    const value = element.getAttribute('data-value');
    const text = element.textContent;
    document.querySelector('.dropdown-selected').textContent = text;
    toggleDropdown();
  
    // Kall handleClassChange for å beholde onchange-funksjonalitet
    handleClassChange(value);
  }
  
function exportImage() {
    isExporting = true;
    grid.draw();
    
    let box = getElementsBoundingBox(grid);
    let offscreen = document.createElement("canvas");
    offscreen.width = box.width;
    offscreen.height = box.height;
    let ctxOff = offscreen.getContext("2d");
    ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
  
    isExporting=false;
  
  
   
    grid.draw();
  
    let link = document.createElement("a");
    link.download = "klassekart.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }

  
function copyImage() {
      isExporting = true;
      let tempCellSize = grid.cellSize;
      updateCellSize(80);
      grid.draw();
    
      let box = getElementsBoundingBox(grid);
      let offscreen = document.createElement("canvas");
      offscreen.width = box.width;
      offscreen.height = box.height;
      let ctxOff = offscreen.getContext("2d");
      ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
    
      isExporting=false;
      updateCellSize(tempCellSize);
      grid.draw();
    
      offscreen.toBlob(blob => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => {
          showNotification("Bilde kopiert til utklippstavlen", 2000);
        }).catch(err => {
          showNotification("Kopiering feilet: " + err, 3000);
        });
      });
    }
    

    export function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    function enableFullscreen() {
      let tempCellSize = grid.cellSize;
      updateCellSize(250);
      grid.draw();
    
      let box = getElementsBoundingBox(grid);
      let offscreen = document.getElementById("offScreenCanvas");
      offscreen.width = box.width;
      offscreen.height = box.height;
      offscreen.style.display = "block";
      let ctxOff = offscreen.getContext("2d");
      ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
      
      const elem = offscreen;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
      }
      
    }
    
document.addEventListener("fullscreenchange", function() {
      if (!document.fullscreenElement) {
        let offscreen = document.getElementById("offScreenCanvas");
        offscreen.style.display = "none";
        updateCellSize(60);
        grid.draw();
      }
    });

    function disableFullscreen() {
      if (document.exitFullscreen) {
        
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
      }
    }

    export function toggleFullscreen() {
      console.log("Toggling fullscreen");
      if (!document.fullscreenElement) {
        enableFullscreen();
      } else {
        disableFullscreen();
      }
    }
    

    


window.exportImage = exportImage;
window.copyImage = copyImage;
window.toggleDropdown = toggleDropdown;
window.updateCellSize= updateCellSize;
window.createNewClass = createNewClass;
window.saveClass = saveClass;
window.deleteClass = deleteClass;
window.assignStudents = assignStudents;
window.sparkleItUp = sparkleItUp;
window.selectOption = selectOption;
