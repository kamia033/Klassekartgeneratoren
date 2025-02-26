// Global eksport-flag
let isExporting = false;

// --- Klassedeklarasjoner for elementene ---

class Desk {
  constructor(gridX, gridY) {
    this.type = "desk";
    this.gridX = gridX;
    this.gridY = gridY;
    this.student = null;
    this.studentIndex = undefined;
    this.dragging = false;
    this.color = null; // Bruker grid.deskColor hvis null
    this.marked = false; // Når true, skal ingen elev få denne pulten
  }
}

class RoundTable {
  constructor(gridX, gridY, numSeats = 4) {
    this.type = "roundtable";
    this.gridX = gridX;
    this.gridY = gridY;
    this.numSeats = numSeats;
    this.students = new Array(numSeats).fill(null);
    this.seatStudentIndices = new Array(numSeats).fill(undefined);
    this.markedSeats = new Array(numSeats).fill(false); // Nytt: Ett kryss per sete
    this.dragging = false;
    this.color = null; // Bruker grid.roundtableFill hvis null
  }
}

class Merkelapp {
  constructor(x, y, width = 100, height = 50, text = "Merkelapp") {
    this.type = "merkelapp";
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.crossed = false;
    this.dragging = false;
    this.resizing = false;
  }
}

// Globale variabler
let unsavedChanges = false;
let currentClass = "";
let currentGroup = null;

// Vis inline notifikasjon i øvre høyre hjørne
function showNotification(message, duration = 3000) {
  const notif = document.getElementById("notification");
  notif.innerText = message;
  notif.style.display = "block";
  setTimeout(() => { notif.style.display = "none"; }, duration);
}

// Kontrastberegning for tekst
function getContrastColor(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "black" : "white";
}

function drawFittedText(ctx, text, x, y, width, height, textColor, fontFamily = "Arial", fontWeight = "") {
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

function drawRotatedText(ctx, text, x, y, width, height, angle, textColor, fontFamily = "Arial", fontWeight = "") {
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

function getDeskGroups() {
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

function sparkleItUp() {
  const palette = ['#FF0000','#FF8700','#FFD300','#DEFF0A','#A1FF0A','#0AFF99','#0AEFFF','#147DF5','#580AFF','#BE0AFF'];
  let groups = getDeskGroups();
  groups.forEach(group => {
    const color = palette[Math.floor(Math.random() * palette.length)];
    group.forEach(desk => { desk.color = color; });
  });
  grid.roundtables.forEach(table => { table.color = palette[Math.floor(Math.random() * palette.length)]; });
  unsavedChanges = true;
  grid.draw();
}

class ClassroomGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = 40;
    this.numCols = 30;
    this.numRows = 15;
    this.gridColor = "#E0E0E0";
    this.deskColor = "#FF0000";
    this.occupiedColor = this.deskColor;
    this.otherColor = "#FFB74D";
    this.roundtableFill = this.deskColor;
    this.borderColor = "#424242";
    this.deleteIconSize = 15;
    this.desks = [];
    this.others = [];
    this.roundtables = [];
    this.activeDesk = null;
    this.activeOther = null;
    this.activeRoundtable = null;
    this.mousePos = { x: 0, y: 0 };

    this.updateCanvasSize();

    // Endret contextmenu-håndtering:
    // – Hvis et rundbordsete klikkes toggles markering (via markedSeats)
    // – Ellers vises kontekstmeny for å legge til element. Hvis "rundbord" velges, vises en undermeny.
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      let pos = this.getMousePos(e);
      
      // Sjekk først om et rundbordsete ble klikket
      for (let table of this.roundtables) {
        let tableX = table.gridX * this.cellSize;
        let tableY = table.gridY * this.cellSize;
        let cx = tableX + this.cellSize;
        let cy = tableY + this.cellSize;
        let radius = this.cellSize;
        for (let i = 0; i < table.numSeats; i++) {
          let angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
          let seatRectWidth = this.cellSize * 0.8;
          let seatRectHeight = this.cellSize * 0.8;
          let seatCenterX = cx + Math.cos(angle) * radius * 0.7;
          let seatCenterY = cy + Math.sin(angle) * radius * 0.7;
          let seatX = seatCenterX - seatRectWidth / 2;
          let seatY = seatCenterY - seatRectHeight / 2;
          if (this.isPointInRect(pos.x, pos.y, seatX, seatY, seatRectWidth, seatRectHeight)) {
            table.markedSeats[i] = !table.markedSeats[i];
            unsavedChanges = true;
            this.draw();
            return;
          }
        }
      }
      
      // Deretter sjekk om en pult ble klikket
      let clickedDesk = null;
      for (let desk of this.desks) {
        let deskX = desk.gridX * this.cellSize;
        let deskY = desk.gridY * this.cellSize;
        if (pos.x >= deskX && pos.x <= deskX + this.cellSize &&
            pos.y >= deskY && pos.y <= deskY + this.cellSize) {
          clickedDesk = desk;
          break;
        }
      }
      if (clickedDesk) {
        if (e.shiftKey) {
          let groups = getDeskGroups();
          let group = groups.find(g => g.includes(clickedDesk));
          if (group && group.length >= 2) {
            showGroupContextMenu(e, group);
            return;
          }
        }
        // Toggle "marked" status for pult
        clickedDesk.marked = !clickedDesk.marked;
        unsavedChanges = true;
        this.draw();
        return;
      }
      showContextMenu(e);
    });

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    this.canvas.addEventListener('drop', this.handleDrop.bind(this));

    this.draw();
  }

  updateCanvasSize() {
    this.canvas.width = this.numCols * this.cellSize;
    this.canvas.height = this.numRows * this.cellSize;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Tegn grid
    for (let col = 0; col <= this.numCols; col++) {
      let x = col * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.strokeStyle = this.gridColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    for (let row = 0; row <= this.numRows; row++) {
      let y = row * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.strokeStyle = this.gridColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Tegn elevpulter
    this.desks.forEach(desk => {
      let x = desk.gridX * this.cellSize;
      let y = desk.gridY * this.cellSize;
      let fill = desk.color || this.deskColor;
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
      if (desk.student) {
        let textColor = getContrastColor(fill);
        drawFittedText(this.ctx, desk.student, x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, textColor, "Arial", "normal");
      }
      if (this.isPointInRect(this.mousePos.x, this.mousePos.y, x, y, this.cellSize, this.cellSize)) {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(x + this.cellSize - this.deleteIconSize, y, this.deleteIconSize, this.deleteIconSize);
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('x', x + this.cellSize - this.deleteIconSize / 2, y + this.deleteIconSize / 2);
      }
      if (desk.marked) {
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + 5);
        this.ctx.lineTo(x + this.cellSize - 5, y + this.cellSize - 5);
        this.ctx.moveTo(x + this.cellSize - 5, y + 5);
        this.ctx.lineTo(x + 5, y + this.cellSize - 5);
        this.ctx.stroke();
      }
    });

    // Tegn rundbord med variabelt antall seter
    this.roundtables.forEach(table => {
      let tableX = table.gridX * this.cellSize;
      let tableY = table.gridY * this.cellSize;
      let tableWidth = 2 * this.cellSize;
      let tableHeight = 2 * this.cellSize;
      let cx = tableX + this.cellSize;
      let cy = tableY + this.cellSize;
      let radius = this.cellSize;
      let tableColor = table.color || this.roundtableFill;
      this.ctx.fillStyle = tableColor;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Tegn seter jevnt fordelt rundt bordet
      for (let i = 0; i < table.numSeats; i++) {
        let angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
        let seatRectWidth = this.cellSize * 0.8;
        let seatRectHeight = this.cellSize * 0.8;
        let seatCenterX = cx + Math.cos(angle) * radius * 0.7;
        let seatCenterY = cy + Math.sin(angle) * radius * 0.7;
        let seatX = seatCenterX - seatRectWidth / 2;
        let seatY = seatCenterY - seatRectHeight / 2;
        if (table.students[i]) {
          let textColor = getContrastColor(tableColor);
          drawRotatedText(this.ctx, table.students[i], seatX, seatY, seatRectWidth, seatRectHeight, angle, textColor, "Arial", "normal");
        }
        if (!isExporting && table.markedSeats[i]) {
          this.ctx.strokeStyle = 'blue';
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(seatX + 5, seatY + 5);
          this.ctx.lineTo(seatX + seatRectWidth - 5, seatY + seatRectHeight - 5);
          this.ctx.moveTo(seatX + seatRectWidth - 5, seatY + 5);
          this.ctx.lineTo(seatX + 5, seatY + seatRectHeight - 5);
          this.ctx.stroke();
        }
      }
      
      if (this.isPointInRect(this.mousePos.x, this.mousePos.y, tableX, tableY, tableWidth, tableHeight)) {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(tableX + tableWidth - this.deleteIconSize, tableY, this.deleteIconSize, this.deleteIconSize);
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('x', tableX + tableWidth - this.deleteIconSize / 2, tableY + this.deleteIconSize / 2);
      }
    });

    // Tegn merkelapper
    this.others.forEach(other => {
      this.ctx.fillStyle = this.otherColor;
      this.ctx.fillRect(other.x, other.y, other.width, other.height);
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(other.x, other.y, other.width, other.height);
      drawFittedText(this.ctx, other.text, other.x, other.y, other.width, other.height, "black", "Arial", "normal");
      if (this.isPointInRect(this.mousePos.x, this.mousePos.y, other.x, other.y, other.width, other.height)) {
        const handleSize = 10;
        this.ctx.save();
        if (this.mousePos.x >= other.x + other.width - handleSize && this.mousePos.y >= other.y + other.height - handleSize) {
          this.ctx.strokeStyle = 'blue';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(other.x, other.y, other.width, other.height);
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(other.x + other.width - handleSize, other.y + other.height - handleSize, handleSize, handleSize);
        } else {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(other.x + other.width - this.deleteIconSize, other.y, this.deleteIconSize, this.deleteIconSize);
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('x', other.x + other.width - this.deleteIconSize / 2, other.y + this.deleteIconSize / 2);
        }
        this.ctx.restore();
      }
    });
  }

  isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  handleMouseDown(e) {
    const pos = this.getMousePos(e);
    this.mousePos = pos;
    if (e.button !== 0) return;

    // Rundbord
    for (let i = this.roundtables.length - 1; i >= 0; i--) {
      let table = this.roundtables[i];
      let tableX = table.gridX * this.cellSize;
      let tableY = table.gridY * this.cellSize;
      let tableWidth = 2 * this.cellSize;
      let tableHeight = 2 * this.cellSize;
      if (this.isPointInRect(pos.x, pos.y, tableX, tableY, tableWidth, tableHeight)) {
        if (pos.x >= tableX + tableWidth - this.deleteIconSize && pos.x <= tableX + tableWidth &&
            pos.y >= tableY && pos.y <= tableY + this.deleteIconSize) {
          this.roundtables.splice(i, 1);
          unsavedChanges = true;
          this.draw();
          return;
        }
        table.dragging = true;
        table.dragOffsetX = pos.x - tableX;
        table.dragOffsetY = pos.y - tableY;
        this.activeRoundtable = table;
        unsavedChanges = true;
        this.draw();
        return;
      }
    }

    // Merkelapp
    for (let i = this.others.length - 1; i >= 0; i--) {
      let other = this.others[i];
      if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
        if (pos.x >= other.x + other.width - this.deleteIconSize && pos.x <= other.x + other.width &&
            pos.y >= other.y && pos.y <= other.y + this.deleteIconSize) {
          this.others.splice(i, 1);
          unsavedChanges = true;
          this.draw();
          return;
        }
        const handleSize = 10;
        if (pos.x >= other.x + other.width - handleSize && pos.y >= other.y + other.height - handleSize) {
          other.resizing = true;
          other.resizeStartWidth = other.width;
          other.resizeStartHeight = other.height;
          other.resizeStartX = pos.x;
          other.resizeStartY = pos.y;
        } else {
          other.dragging = true;
          other.dragOffsetX = pos.x - other.x;
          other.dragOffsetY = pos.y - other.y;
        }
        unsavedChanges = true;
        this.activeOther = other;
        this.draw();
        return;
      }
    }

    // Elevpult
    let gridX = Math.floor(pos.x / this.cellSize);
    let gridY = Math.floor(pos.y / this.cellSize);
    let desk = this.desks.find(d => d.gridX === gridX && d.gridY === gridY);
    if (desk) {
      let cellX = desk.gridX * this.cellSize;
      let cellY = desk.gridY * this.cellSize;
      if (pos.x >= cellX + this.cellSize - this.deleteIconSize && pos.x <= cellX + this.cellSize &&
          pos.y >= cellY && pos.y <= cellY + this.deleteIconSize) {
        this.desks = this.desks.filter(d => d !== desk);
        unsavedChanges = true;
        this.draw();
        return;
      }
      desk.dragging = true;
      this.activeDesk = desk;
      unsavedChanges = true;
      this.draw();
      return;
    }

    // Opprett ny pult
    let newDesk = new Desk(gridX, gridY);
    newDesk.dragging = true;
    this.desks.push(newDesk);
    this.activeDesk = newDesk;
    unsavedChanges = true;
    this.draw();
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);
    this.mousePos = pos;
    if (this.activeRoundtable && this.activeRoundtable.dragging) {
      let newX = pos.x - this.activeRoundtable.dragOffsetX;
      let newY = pos.y - this.activeRoundtable.dragOffsetY;
      this.activeRoundtable.gridX = Math.floor(newX / this.cellSize);
      this.activeRoundtable.gridY = Math.floor(newY / this.cellSize);
      this.draw();
      return;
    }
    if (this.activeOther) {
      if (this.activeOther.dragging) {
        this.activeOther.x = pos.x - this.activeOther.dragOffsetX;
        this.activeOther.y = pos.y - this.activeOther.dragOffsetY;
        this.draw();
        return;
      }
      if (this.activeOther.resizing) {
        let newWidth = this.activeOther.resizeStartWidth + (pos.x - this.activeOther.resizeStartX);
        let newHeight = this.activeOther.resizeStartHeight + (pos.y - this.activeOther.resizeStartY);
        this.activeOther.width = Math.max(newWidth, 30);
        this.activeOther.height = Math.max(newHeight, 20);
        this.draw();
        return;
      }
    }
    if (this.activeDesk && this.activeDesk.dragging) {
      let gridX = Math.floor(pos.x / this.cellSize);
      let gridY = Math.floor(pos.y / this.cellSize);
      if (!this.desks.find(d => d !== this.activeDesk && d.gridX === gridX && d.gridY === gridY)) {
        this.activeDesk.gridX = gridX;
        this.activeDesk.gridY = gridY;
      }
      this.draw();
      return;
    }
    this.draw();
  }

  handleMouseUp(e) {
    if (this.activeOther) {
      this.activeOther.dragging = false;
      this.activeOther.resizing = false;
      this.activeOther = null;
    }
    if (this.activeDesk) {
      this.activeDesk.dragging = false;
      this.activeDesk = null;
    }
    if (this.activeRoundtable) {
      this.activeRoundtable.dragging = false;
      this.activeRoundtable = null;
    }
    this.draw();
  }

  handleDoubleClick(e) {
    const pos = this.getMousePos(e);
    // Merkelapp
    for (let i = this.others.length - 1; i >= 0; i--) {
      let other = this.others[i];
      if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
        let newText = prompt("Endre tekst:", other.text);
        if (newText !== null) {
          other.text = newText;
          unsavedChanges = true;
          this.draw();
        }
        return;
      }
    }
    // Rundbord
    for (let i = this.roundtables.length - 1; i >= 0; i--) {
      let table = this.roundtables[i];
      let tableX = table.gridX * this.cellSize;
      let tableY = table.gridY * this.cellSize;
      let tableWidth = 2 * this.cellSize;
      let tableHeight = 2 * this.cellSize;
      if (this.isPointInRect(pos.x, pos.y, tableX, tableY, tableWidth, tableHeight)) {
        // Her kan du implementere redigering av hele bordet om ønskelig
        return;
      }
    }
    // Elevpult
    let gridX = Math.floor(pos.x / this.cellSize);
    let gridY = Math.floor(pos.y / this.cellSize);
    let desk = this.desks.find(d => d.gridX === gridX && d.gridY === gridY && d.student);
    if (desk) {
      let newName = prompt("Endre elevnavn:", desk.student);
      if (newName !== null) {
        desk.student = newName;
        if (desk.studentIndex !== undefined) {
          let studentListElem = document.getElementById("studentList");
          let names = studentListElem.value.split("\n");
          if (desk.studentIndex < names.length) {
            names[desk.studentIndex] = newName;
            studentListElem.value = names.join("\n");
          }
        }
        unsavedChanges = true;
        this.draw();
      }
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const pos = this.getMousePos(e);
    const type = e.dataTransfer.getData("text/plain");
    if (type === "desk") {
      let gridX = Math.floor(pos.x / this.cellSize);
      let gridY = Math.floor(pos.y / this.cellSize);
      if (grid.desks.find(d => d.gridX === gridX && d.gridY === gridY)) {
        showNotification("Det er allerede en pult her!");
        return;
      }
      this.desks.push(new Desk(gridX, gridY));
    } else if (type === "merkelapp") {
      this.others.push(new Merkelapp(pos.x, pos.y));
    } else if (type === "roundtable") {
      // Her benyttes default antall seter 4 om ingen undermeny er benyttet
      let gridX = Math.floor(pos.x / this.cellSize);
      let gridY = Math.floor(pos.y / this.cellSize);
      this.roundtables.push(new RoundTable(gridX, gridY, 4));
    }
    unsavedChanges = true;
    this.draw();
  }

  assignStudents(studentNames) {
    // Nullstill elevnavn (men la markerte pulter forbli uendret)
    this.desks.forEach(desk => {
      if (desk.type === "desk") {
        desk.student = null;
        desk.studentIndex = undefined;
      }
    });
    this.roundtables.forEach(table => {
      for (let i = 0; i < table.numSeats; i++) {
        table.students[i] = null;
        table.seatStudentIndices[i] = undefined;
      }
    });
    let available = [];
    this.desks.forEach(desk => {
      if (desk.type === "desk" && !desk.marked) available.push({ type: "desk", ref: desk });
    });
    this.roundtables.forEach(table => {
      for (let i = 0; i < table.numSeats; i++) {
        available.push({ type: "roundtable", table: table, seat: i });
      }
    });
    available.sort(() => Math.random() - 0.5);
    studentNames = studentNames.filter(name => name.trim() !== "");
    for (let i = 0; i < Math.min(studentNames.length, available.length); i++) {
      if (available[i].type === "desk") {
        available[i].ref.student = studentNames[i];
        available[i].ref.studentIndex = i;
      } else if (available[i].type === "roundtable") {
        available[i].table.students[available[i].seat] = studentNames[i];
        available[i].table.seatStudentIndices[available[i].seat] = i;
      }
    }
    let totalSeats = this.desks.length + this.roundtables.reduce((sum, table) => sum + table.numSeats, 0);
    const warnElem = document.getElementById("assignmentWarning");
    warnElem.style.display = studentNames.length > totalSeats ? "block" : "none";
    unsavedChanges = true;
    this.draw();
  }

  saveState() {
    return {
      cellSize: this.cellSize,
      desks: JSON.parse(JSON.stringify(this.desks)),
      others: JSON.parse(JSON.stringify(this.others)),
      roundtables: JSON.parse(JSON.stringify(this.roundtables)),
      studentList: document.getElementById("studentList").value
    };
  }

  loadState(state) {
    if (state.cellSize !== undefined) {
      this.cellSize = state.cellSize;
      document.getElementById("cellSizeSlider").value = state.cellSize;
      document.getElementById("cellSizeValue").innerText = state.cellSize;
      this.updateCanvasSize();
    }
    // Gjenopprett objekter med riktige prototyper
    this.desks = (state.desks || []).map(d => Object.assign(new Desk(d.gridX, d.gridY), d));
    this.others = (state.others || []).map(o => Object.assign(new Merkelapp(o.x, o.y, o.width, o.height, o.text), o));
    this.roundtables = (state.roundtables || []).map(t => Object.assign(new RoundTable(t.gridX, t.gridY, t.numSeats), t));
    if (state.studentList !== undefined) {
      document.getElementById("studentList").value = state.studentList;
    }
    unsavedChanges = false;
    this.draw();
  }
}

// ------------------ Andre funksjoner og init ------------------

const canvas = document.getElementById("gridCanvas");
const grid = new ClassroomGrid(canvas);

function assignStudents() {
  const names = document.getElementById("studentList").value.split("\n");
  grid.assignStudents(names);
}
let debounceTimeout;

function updateCellSize(value) {
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

function getElementsBoundingBox() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  grid.desks.forEach(desk => {
    let x = desk.gridX * grid.cellSize;
    let y = desk.gridY * grid.cellSize;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + grid.cellSize);
    maxY = Math.max(maxY, y + grid.cellSize);
  });
  grid.others.forEach(other => {
    minX = Math.min(minX, other.x);
    minY = Math.min(minY, other.y);
    maxX = Math.max(maxX, other.x + other.width);
    maxY = Math.max(maxY, other.y + other.height);
  });
  grid.roundtables.forEach(table => {
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

function exportImage() {
  isExporting = true;
  grid.draw();
  
  let box = getElementsBoundingBox();
  let offscreen = document.createElement("canvas");
  offscreen.width = box.width;
  offscreen.height = box.height;
  let ctxOff = offscreen.getContext("2d");
  ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
  
  isExporting = false;
  grid.draw();
  
  let link = document.createElement("a");
  link.download = "klassekart.png";
  link.href = offscreen.toDataURL("image/png");
  link.click();
}

function copyImage() {
  isExporting = true;
  grid.draw();
  
  let box = getElementsBoundingBox();
  let offscreen = document.createElement("canvas");
  offscreen.width = box.width;
  offscreen.height = box.height;
  let ctxOff = offscreen.getContext("2d");
  ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
  
  isExporting = false;
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

// Klassehåndtering
function updateClassDropdown() {
  const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
  const dropdown = document.getElementById("savedClasses");
  dropdown.innerHTML = `<option value="">-- Velg lagret klasse --</option>` +
    Object.keys(savedClasses).map(c => `<option value="${c}">${c}</option>`).join('');
  if (currentClass && savedClasses[currentClass]) {
    dropdown.value = currentClass;
  }
}

function saveSpecificClass(className) {
  const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
  savedClasses[className] = grid.saveState();
  localStorage.setItem("classes", JSON.stringify(savedClasses));
  unsavedChanges = false;
  showNotification("Klassen '" + className + "' er lagret.", 3000);
  updateClassDropdown();
}

function saveCurrentClass() {
  if (!currentClass) return;
  saveSpecificClass(currentClass);
}

function saveClass() {
  const dropdown = document.getElementById("savedClasses");
  const selected = dropdown.value;
  if (!selected) {
    alert("Vennligst velg en klasse i dropdown-menyen.");
    return;
  }
  saveSpecificClass(selected);
  currentClass = selected;
}

function loadClass(className) {
  if (!className) return;
  const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
  if (savedClasses[className]) {
    grid.loadState(savedClasses[className]);
    currentClass = className;
    document.getElementById("savedClasses").value = className;
  }
}

function handleClassChange(newClass) {
  if (newClass === currentClass) return;
  let oldClass = currentClass;
  if (unsavedChanges && oldClass) {
    if (confirm("Du har uspurte endringer i " + oldClass + ". Vil du lagre dem før du bytter klasse?")) {
      saveSpecificClass(oldClass);
    }
  }
  currentClass = newClass;
  loadClass(newClass);
}

function createNewClass() {
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
  document.getElementById("savedClasses").value = newName;
  showNotification("Klassen '" + newName + "' er opprettet og lagret.", 3000);
  unsavedChanges = false;
  currentClass = newName;
  grid.draw();
}

function deleteClass() {
  const dropdown = document.getElementById("savedClasses");
  const className = dropdown.value;
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

updateClassDropdown();

// Standard kontekstmeny
function showContextMenu(e) {
  const menu = document.getElementById("contextMenu");
  menu.style.left = e.pageX + "px";
  menu.style.top = e.pageY + "px";
  menu.style.display = "block";
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  menu.dataset.x = x;
  menu.dataset.y = y;
}

document.querySelectorAll("#contextMenu li").forEach(item => {
  item.addEventListener("mouseenter", function(e) {
    const type = this.getAttribute("data-type");
    const menu = document.getElementById("contextMenu");
    const x = parseFloat(menu.dataset.x);
    const y = parseFloat(menu.dataset.y);
    //menu.style.display = "none";
    if (type === "roundtable") {
      showRoundtableSubMenu(e, x, y);
    } else {
      addElementAt(type, x, y);
    }
  });
});

// Ny undermeny for rundbord – lar brukeren velge antall seter
function showRoundtableSubMenu(e, x, y) {
  const subMenu = document.getElementById("roundtableSubMenu");
  // Plasser undermenyen til høyre for hovedmenyen (juster offset etter behov)
  subMenu.style.left = (e.pageX + 150) + "px";
  subMenu.style.top = e.pageY + "px";
  subMenu.style.display = "block";
  subMenu.dataset.x = x;
  subMenu.dataset.y = y;
}

document.querySelectorAll("#roundtableSubMenu li").forEach(item => {
  item.addEventListener("click", function() {
    const numSeats = parseInt(this.getAttribute("data-seats"));
    const subMenu = document.getElementById("roundtableSubMenu");
    const x = parseFloat(subMenu.dataset.x);
    const y = parseFloat(subMenu.dataset.y);
    addElementAt("roundtable", x, y, numSeats);
    subMenu.style.display = "none";
  });
});

document.addEventListener("click", function(e) {
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

function addElementAt(type, x, y, numSeats) {
  if (type === "desk") {
    let gridX = Math.floor(x / grid.cellSize);
    let gridY = Math.floor(y / grid.cellSize);
    if (grid.desks.find(d => d.gridX === gridX && d.gridY === gridY)) {
      showNotification("Det er allerede en pult her!");
      return;
    }
    grid.desks.push(new Desk(gridX, gridY));
  } else if (type === "merkelapp") {
    grid.others.push(new Merkelapp(x, y));
  } else if (type === "roundtable") {
    let gridX = Math.floor(x / grid.cellSize);
    let gridY = Math.floor(y / grid.cellSize);
    // numSeats kommer fra undermenyen; hvis ikke spesifisert, bruk 4 som default
    grid.roundtables.push(new RoundTable(gridX, gridY, numSeats || 4));
  }
  unsavedChanges = true;
  grid.draw();
}


function setElementColor(color) {
  grid.desks.forEach(desk => { desk.color = color; });
  grid.roundtables.forEach(table => { table.color = color; });
  grid.deskColor = color;
  grid.roundtableFill = color;
  grid.occupiedColor = color;
  unsavedChanges = true;
  grid.draw();
}
