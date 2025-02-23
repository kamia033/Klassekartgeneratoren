// Hjelpefunksjon: Tegn tekst slik at den fyller boksen uten å overskride den
function drawFittedText(ctx, text, x, y, width, height, textColor = "white", fontFamily = "Arial", fontWeight = "") {
    let fontSize = height * 0.8; // Start med 80 % av høyden
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

  class ClassroomGrid {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      // Grid-innstillinger
      this.cellSize = 40;
      this.numCols = 20;
      this.numRows = 15;
      this.gridColor = "#E0E0E0";
      // Farger med god kontrast (universell utforming)
      this.deskColor = "#4CAF50";      // Grønn (brukes for grid-pulter og rundbord)
      this.occupiedColor = "#2E7D32";    // Mørkere grønn
      this.otherColor = "#FFB74D";       // Myk oransje
      this.roundtableFill = this.deskColor;  // Rundbordet får samme farge som pultene
      this.borderColor = "#424242";      // Mørk grå for ramme
      this.deleteIconSize = 15;
      // Lister over elementer
      this.desks = [];       // Grid-pulter (type "desk")
      this.others = [];      // Frittliggende elementer (type "other")
      this.roundtables = []; // Rundbord (type "roundtable")
      
      // Aktive elementer for dragging/resizing
      this.activeDesk = null;
      this.activeOther = null;
      this.activeRoundtable = null;
      
      // Museposisjon (brukes for hover-effekt)
      this.mousePos = { x: 0, y: 0 };
      
      this.updateCanvasSize();
      
      // Registrer event-lyttere
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
      this.canvas.addEventListener('dragover', e => e.preventDefault());
      this.canvas.addEventListener('drop', this.handleDrop.bind(this));
      this.canvas.addEventListener('contextmenu', e => e.preventDefault());
      
      this.draw();
    }
    
    updateCanvasSize() {
      this.canvas.width = this.numCols * this.cellSize;
      this.canvas.height = this.numRows * this.cellSize;
    }
    
    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Tegn rutenett
      this.ctx.strokeStyle = this.gridColor;
      for (let col = 0; col <= this.numCols; col++) {
        let x = col * this.cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      for (let row = 0; row <= this.numRows; row++) {
        let y = row * this.cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
      
      // Tegn grid-pulter (type "desk")
      this.desks.forEach(desk => {
        let x = desk.gridX * this.cellSize;
        let y = desk.gridY * this.cellSize;
        this.ctx.fillStyle = desk.student ? this.occupiedColor : this.deskColor;
        this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        // Ramme rundt pulten
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        if (desk.student) {
          drawFittedText(this.ctx, desk.student, x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, "white", "Arial", "normal");
        }
        // Hvis musa er over pulten, vis en rød "x" for sletting
        if (this.mousePos.x >= x && this.mousePos.x <= x + this.cellSize &&
            this.mousePos.y >= y && this.mousePos.y <= y + this.cellSize) {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(x + this.cellSize - this.deleteIconSize, y, this.deleteIconSize, this.deleteIconSize);
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('x', x + this.cellSize - this.deleteIconSize / 2, y + this.deleteIconSize / 2);
        }
      });
      
      // Tegn rundbord
      this.roundtables.forEach(table => {
        let tableX = table.gridX * this.cellSize;
        let tableY = table.gridY * this.cellSize;
        let tableWidth = 2 * this.cellSize;
        let tableHeight = 2 * this.cellSize;
        let cx = tableX + this.cellSize;
        let cy = tableY + this.cellSize;
        let radius = this.cellSize;
        // Sirkelbakgrunn
        this.ctx.fillStyle = this.roundtableFill;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // Inndelingslinjer
        this.ctx.beginPath();
        this.ctx.moveTo(cx, tableY);
        this.ctx.lineTo(cx, tableY + tableHeight);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(tableX, cy);
        this.ctx.lineTo(tableX + tableWidth, cy);
        this.ctx.stroke();
        // Tegn tekst i de fire kvartaler
        for (let i = 0; i < 4; i++) {
          let seatX = tableX + (i % 2) * this.cellSize;
          let seatY = tableY + (i < 2 ? 0 : this.cellSize);
          if (table.students[i]) {
            drawFittedText(this.ctx, table.students[i], seatX, seatY, this.cellSize, this.cellSize, "black", "Arial", "normal");
          }
        }
        // Hvis musa er over rundbordet, vis en rød "x" for sletting
        if (this.mousePos.x >= tableX && this.mousePos.x <= tableX + tableWidth &&
            this.mousePos.y >= tableY && this.mousePos.y <= tableY + tableHeight) {
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(tableX + tableWidth - this.deleteIconSize, tableY, this.deleteIconSize, this.deleteIconSize);
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('x', tableX + tableWidth - this.deleteIconSize / 2, tableY + this.deleteIconSize / 2);
        }
      });
      
      // Tegn frittliggende "annet"-elementer
      this.others.forEach(other => {
        this.ctx.fillStyle = this.otherColor;
        this.ctx.fillRect(other.x, other.y, other.width, other.height);
        // Ramme rundt elementet
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(other.x, other.y, other.width, other.height);
        drawFittedText(this.ctx, other.text, other.x, other.y, other.width, other.height, "black", "Arial", "normal");
        // Hvis elementet er krysset ut, tegn en rød strek over midten
        if (other.crossed) {
          this.ctx.strokeStyle = "red";
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(other.x, other.y + other.height / 2);
          this.ctx.lineTo(other.x + other.width, other.y + other.height / 2);
          this.ctx.stroke();
        }
        // Hvis musa er over elementet, vis håndtak for resizing og en rød "x" for sletting
        if (this.isPointInRect(this.mousePos.x, this.mousePos.y, other.x, other.y, other.width, other.height)) {
          this.ctx.strokeStyle = 'blue';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(other.x, other.y, other.width, other.height);
          const handleSize = 10;
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(other.x + other.width - handleSize, other.y + other.height - handleSize, handleSize, handleSize);
          // Vis rød "x" i øvre høyre hjørne
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(other.x + other.width - this.deleteIconSize, other.y, this.deleteIconSize, this.deleteIconSize);
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('x', other.x + other.width - this.deleteIconSize / 2, other.y + this.deleteIconSize / 2);
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
      
      // Ved høyreklikk (e.button === 2) på et "annet"-element: toggl kryssing
      if (e.button === 2) {
        for (let i = this.others.length - 1; i >= 0; i--) {
          let other = this.others[i];
          if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
            other.crossed = !other.crossed;
            this.draw();
            return;
          }
        }
      }
      
      // Sjekk først for rundbord (fra øverste lag)
      for (let i = this.roundtables.length - 1; i >= 0; i--) {
        let table = this.roundtables[i];
        let tableX = table.gridX * this.cellSize;
        let tableY = table.gridY * this.cellSize;
        let tableWidth = 2 * this.cellSize;
        let tableHeight = 2 * this.cellSize;
        if (this.isPointInRect(pos.x, pos.y, tableX, tableY, tableWidth, tableHeight)) {
          // Hvis klikk på "x" i rundbordet:
          if (pos.x >= tableX + tableWidth - this.deleteIconSize && pos.x <= tableX + tableWidth &&
              pos.y >= tableY && pos.y <= tableY + this.deleteIconSize) {
            this.roundtables.splice(i, 1);
            this.draw();
            return;
          }
          table.dragging = true;
          table.dragOffsetX = pos.x - tableX;
          table.dragOffsetY = pos.y - tableY;
          this.activeRoundtable = table;
          this.draw();
          return;
        }
      }
      
      // Sjekk for frittliggende "annet"-elementer
      for (let i = this.others.length - 1; i >= 0; i--) {
        let other = this.others[i];
        if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
          // Sjekk om klikket er i slett-ikonet (øverste høyre)
          if (pos.x >= other.x + other.width - this.deleteIconSize && pos.x <= other.x + other.width &&
              pos.y >= other.y && pos.y <= other.y + this.deleteIconSize) {
            this.others.splice(i, 1);
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
          this.activeOther = other;
          this.draw();
          return;
        }
      }
      
      // Sjekk for grid-pulter (type "desk")
      let gridX = Math.floor(pos.x / this.cellSize);
      let gridY = Math.floor(pos.y / this.cellSize);
      let desk = this.desks.find(d => d.gridX === gridX && d.gridY === gridY);
      if (desk) {
        let cellX = desk.gridX * this.cellSize;
        let cellY = desk.gridY * this.cellSize;
        if (pos.x >= cellX + this.cellSize - this.deleteIconSize && pos.x <= cellX + this.cellSize &&
            pos.y >= cellY && pos.y <= cellY + this.deleteIconSize) {
          this.desks = this.desks.filter(d => d !== desk);
          this.draw();
          return;
        }
        desk.dragging = true;
        this.activeDesk = desk;
        this.draw();
        return;
      }
      
      // Hvis ingen grid-pult finnes i denne cellen, opprett en ny grid-pult
      let newDesk = { type: "desk", gridX: gridX, gridY: gridY, student: null, studentIndex: undefined, dragging: true };
      this.desks.push(newDesk);
      this.activeDesk = newDesk;
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
      // Dobbelklikk på "annet"-element: endre tekst
      for (let i = this.others.length - 1; i >= 0; i--) {
        let other = this.others[i];
        if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
          let newText = prompt("Endre tekst:", other.text);
          if (newText !== null) {
            other.text = newText;
            this.draw();
          }
          return;
        }
      }
      // Dobbelklikk på rundbord: finn hvilken kvadrant som ble klikket, og endre teksten for den plassen
      for (let i = this.roundtables.length - 1; i >= 0; i--) {
        let table = this.roundtables[i];
        let tableX = table.gridX * this.cellSize;
        let tableY = table.gridY * this.cellSize;
        let tableWidth = 2 * this.cellSize;
        let tableHeight = 2 * this.cellSize;
        if (this.isPointInRect(pos.x, pos.y, tableX, tableY, tableWidth, tableHeight)) {
          let cx = tableX + this.cellSize;
          let cy = tableY + this.cellSize;
          let quadrant;
          if (pos.x < cx && pos.y < cy) quadrant = 0;
          else if (pos.x >= cx && pos.y < cy) quadrant = 1;
          else if (pos.x < cx && pos.y >= cy) quadrant = 2;
          else quadrant = 3;
          let newText = prompt("Endre tekst for denne plassen:", table.students[quadrant] || "");
          if (newText !== null) {
            table.students[quadrant] = newText;
            this.draw();
          }
          return;
        }
      }
      // Dobbelklikk på grid-pult med elevnavn for å endre navnet
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
        if (this.desks.find(d => d.gridX === gridX && d.gridY === gridY)) {
          alert("Det er allerede en pult her!");
          return;
        }
        this.desks.push({ type: "desk", gridX: gridX, gridY: gridY, student: null, studentIndex: undefined });
      } else if (type === "other") {
        let text = prompt("Skriv inn tekst:");
        if (text === null) return;
        this.others.push({ type: "other", x: pos.x, y: pos.y, width: 100, height: 50, text: text, crossed: false });
      } else if (type === "roundtable") {
        let gridX = Math.floor(pos.x / this.cellSize);
        let gridY = Math.floor(pos.y / this.cellSize);
        this.roundtables.push({ type: "roundtable", gridX: gridX, gridY: gridY, students: [null, null, null, null], seatStudentIndices: [undefined, undefined, undefined, undefined] });
      }
      this.draw();
    }
    
    assignStudents(studentNames) {
      // Nullstill eksisterende tildelinger
      this.desks.forEach(desk => {
        if (desk.type === "desk") {
          desk.student = null;
          desk.studentIndex = undefined;
        }
      });
      this.roundtables.forEach(table => {
        for (let i = 0; i < 4; i++) {
          table.students[i] = null;
          table.seatStudentIndices[i] = undefined;
        }
      });
      let available = [];
      this.desks.forEach(desk => {
        if (desk.type === "desk") available.push({ type: "desk", ref: desk });
      });
      this.roundtables.forEach(table => {
        for (let i = 0; i < 4; i++) {
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
      this.desks = state.desks || [];
      this.others = state.others || [];
      this.roundtables = state.roundtables || [];
      if (state.studentList !== undefined) {
        document.getElementById("studentList").value = state.studentList;
      }
      this.draw();
    }
  }
  
  const canvas = document.getElementById("gridCanvas");
  const grid = new ClassroomGrid(canvas);
  
  // Gjør elementene i drag-menyen draggable
  document.querySelectorAll(".draggable-item").forEach(item => {
    item.addEventListener("dragstart", function(e) {
      e.dataTransfer.setData("text/plain", item.getAttribute("data-type"));
    });
  });
  
  function assignStudents() {
    const names = document.getElementById("studentList").value.split("\n");
    grid.assignStudents(names);
  }
  
  function updateCellSize(value) {
    let oldSize = grid.cellSize;
    grid.cellSize = parseInt(value);
    document.getElementById("cellSizeValue").innerText = value;
    let factor = grid.cellSize / oldSize;
    // Skaler også posisjon og størrelse for alle "annet"-elementer
    grid.others.forEach(other => {
      other.x *= factor;
      other.y *= factor;
      other.width *= factor;
      other.height *= factor;
    });
    grid.updateCanvasSize();
    grid.draw();
  }
  
  // Beregn avgrensende boks for alle elementene med en buffer på to ruteelementer
  function getElementsBoundingBox() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    // Grid-pulter
    grid.desks.forEach(desk => {
      let x = desk.gridX * grid.cellSize;
      let y = desk.gridY * grid.cellSize;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + grid.cellSize);
      maxY = Math.max(maxY, y + grid.cellSize);
    });
    // Frittliggende ("annet") elementer
    grid.others.forEach(other => {
      minX = Math.min(minX, other.x);
      minY = Math.min(minY, other.y);
      maxX = Math.max(maxX, other.x + other.width);
      maxY = Math.max(maxY, other.y + other.height);
    });
    // Rundbord
    grid.roundtables.forEach(table => {
      let x = table.gridX * grid.cellSize;
      let y = table.gridY * grid.cellSize;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + 2 * grid.cellSize);
      maxY = Math.max(maxY, y + 2 * grid.cellSize);
    });
    // Hvis ingen elementer finnes, bruk hele canvasen
    if (minX === Infinity) {
      minX = 0; minY = 0;
      maxX = grid.canvas.width;
      maxY = grid.canvas.height;
    }
    // Legg til buffer (to ruteelementer)
    let buffer = 2 * grid.cellSize;
    minX = Math.max(0, minX - buffer);
    minY = Math.max(0, minY - buffer);
    maxX = Math.min(grid.canvas.width, maxX + buffer);
    maxY = Math.min(grid.canvas.height, maxY + buffer);
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }
  
  function exportImage() {
    let box = getElementsBoundingBox();
    let offscreen = document.createElement("canvas");
    offscreen.width = box.width;
    offscreen.height = box.height;
    let ctxOff = offscreen.getContext("2d");
    // Tegn regionen fra hovedcanvas med buffer
    ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
    let link = document.createElement("a");
    link.download = "klassekart.png";
    link.href = offscreen.toDataURL("image/png");
    link.click();
  }
  
  function copyImage() {
    let box = getElementsBoundingBox();
    let offscreen = document.createElement("canvas");
    offscreen.width = box.width;
    offscreen.height = box.height;
    let ctxOff = offscreen.getContext("2d");
    ctxOff.drawImage(canvas, box.minX, box.minY, box.width, box.height, 0, 0, box.width, box.height);
    offscreen.toBlob(blob => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then(() => {
        alert("Bilde kopiert til utklippstavlen");
      }).catch(err => {
        alert("Kopiering feilet: " + err);
      });
    });
  }
  
  function saveClass() {
    const className = document.getElementById("className").value;
    if (!className) return;
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    savedClasses[className] = grid.saveState();
    localStorage.setItem("classes", JSON.stringify(savedClasses));
    updateClassDropdown();
  }
  
  function loadClass(className) {
    if (!className) return;
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    if (savedClasses[className]) {
      grid.loadState(savedClasses[className]);
      // Sett klassens navn i inndatafeltet slik at det kan overskrives
      document.getElementById("className").value = className;
    }
  }
  
  function updateClassDropdown() {
    const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
    const dropdown = document.getElementById("savedClasses");
    dropdown.innerHTML = `<option value="">-- Velg lagret klasse --</option>` +
      Object.keys(savedClasses).map(c => `<option value="${c}">${c}</option>`).join('');
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