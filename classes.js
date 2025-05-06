// classes.js
import * as utils from './utils.js';
import * as contextMenu from './contextMenu.js';




export class Desk {
  constructor(gridX, gridY) {
    this.type = "desk";
    this.gridX = gridX;
    this.gridY = gridY;
    this.student = null;
    this.studentIndex = undefined;
    this.dragging = false;
    this.color = null;
    this.marked = false;
  }
}

export class Blackboard {
  constructor(x, y, width = 2, height = 2) {
    this.type = "blackboard";
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.dragging = true;
    this.color = "#000000";
    this.numStudents = 0;
    this.assignedStudents = [];
    this.blackboardColor = "9f9f9f";
    this.display = false;

  }

  assignStudent(student) {
    this.assignedStudents.push(student);
  }
}

export class RoundTable {
  constructor(gridX, gridY, numSeats = 4) {
    this.type = "roundtable";
    this.gridX = gridX;
    this.gridY = gridY;
    this.numSeats = numSeats;
    this.students = new Array(numSeats).fill(null);
    this.seatStudentIndices = new Array(numSeats).fill(undefined);
    this.markedSeats = new Array(numSeats).fill(false);
    this.dragging = false;
    this.color = null;
    this.resizeStartHeight = null;
    this.resizeStartWidth = null;
    this.resizeStartX = null;
    this.resizeStartY = null;
    this.display = true;

  }
}

export class Merkelapp {
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
    this.selected = false;
    this.display = true;
    this.color = "#FFB74D";
  }
}


export class Zone{
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.assignedStudents = [];
    this.dragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.resizing = false;
    this.selected = false;
    this.mouseX = 0;
    this.mouseY = 0;

    this.display = true;
    
    grid.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX - grid.canvas.getBoundingClientRect().left;
      this.mouseY = e.clientY - grid.canvas.getBoundingClientRect().top;
      if (this.isCursorInZone(this.mouseX, this.mouseY)) {
        this.selected = true;
        
      } else {
        this.selected = false;
      }
    }
    );
  }     
  assignStudent(student) {
    this.assignedStudents.push(student);
  } 

  isCursorInZone(mouseX, mouseY) {
    return mouseX >= this.x && mouseX <= this.x + this.width && mouseY >= this.y && mouseY <= this.y + this.height;
  }

  isCursorInHandle(mouseX, mouseY) {
    const handleSize = 10;
    return mouseX >= this.x + this.width - handleSize && mouseY >= this.y + this.height - handleSize;
  }

  draw(ctx) {
    if(this.display)  {
    ctx.fillStyle = "rgba(255, 255, 0, 0.5)"; // Halvtransparent gul
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    const handleSize = 10;
    //get mouse pos
    
    //isPointInRect(this.mousePos.x, this.mousePos.y, other.x, other.y, other.width, other.height
    if(this.selected){
          ctx.save();

          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          ctx.strokeRect(this.x, this.y, this.width, this.height);
          ctx.fillStyle = 'blue';
          ctx.fillRect(this.x + this.width - handleSize, this.y + this.height - handleSize, handleSize, handleSize);
  }
  }
}
}


export default class ClassroomGrid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    //Get canvas height and width by method

    this.cellSize = 50;

    this.numCols = 30;
    this.numRows = 35;
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
    this.blackboards = [];
    this.activeDesk = null;
    this.activeOther = null;
    this.activeRoundtable = null;
    this.activeBlackboard = null;
    this.mousePos = { x: 0, y: 0 };
    this.emojis = ['🍎', '🚀', '🎸', '🐱', '🌟', '🎨', '⚽', '🎭', '🐉', '🎵'];
    this.groupEmojis = [];
    this.zones = [];

    this.currentClass = "";
    this.unsavedChanges = false;
    this.showAdvanced = false;

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
            this.unsavedChanges = true;
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
            contextMenu.showGroupContextMenu(e, group);
            return;
          }
        }
        // Toggle "marked" status for pult
        clickedDesk.marked = !clickedDesk.marked;
        this.unsavedChanges = true;
        this.draw();
        return;
      }

      //sjekk deretter om merkelapp ble trykket ov viser groupcontextmenu
      let clickedOther = null;
      for (let other of this.others) {
        if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
          other.selected= true;
          clickedOther = other;
          break;
        }
      }
      if(clickedOther) {
        contextMenu.showGroupContextMenu(e, clickedOther);
      }

      else{
        contextMenu.showContextMenu(e);
      }
      
      
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
    this.clearCanvas();
    this.drawGrid();

    if (this.currentClass === "") {
      this.drawNoClassOverlay();
    } else {
      this.drawDesks();
      this.drawGroupEmojis();
      this.drawRoundtables();
      this.drawGapGroups();
      this.drawBlackboards();
      this.drawOthers();
      this.drawZones();
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    for (let col = 0; col <= this.numCols; col++) {
      const x = col * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.strokeStyle = this.gridColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    for (let row = 0; row <= this.numRows; row++) {
      const y = row * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.strokeStyle = this.gridColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  drawNoClassOverlay() {
    const container = document.getElementById("canvas-container").getBoundingClientRect();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px 'Segoe UI', sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(
      "Velg klasse fra menyen til høyre",
      container.width / 2,
      container.height / 2
    );
  }

  drawDesks() {
    this.desks.forEach(desk => {
      const x = desk.gridX * this.cellSize;
      const y = desk.gridY * this.cellSize;
      const size = this.cellSize - 4;
      const fill = desk.color || this.deskColor;

      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x + 2, y + 2, size, size);
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x + 2, y + 2, size, size);

      if (desk.student) {
        const textColor = utils.getContrastColor(fill);
        utils.drawFittedText(
          this.ctx,
          desk.student,
          x + 2,
          y + 2,
          size,
          size,
          textColor,
          "Arial",
          "normal"
        );
      }

      this.drawDeskInteractions(desk, x, y);
    });
  }

  drawDeskInteractions(desk, x, y) {
    if (this.isPointInRect(
          this.mousePos.x,
          this.mousePos.y,
          x,
          y,
          this.cellSize,
          this.cellSize
        )) {
      // Delete icon
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(
        x + this.cellSize - this.deleteIconSize,
        y,
        this.deleteIconSize,
        this.deleteIconSize
      );
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        'x',
        x + this.cellSize - this.deleteIconSize / 2,
        y + this.deleteIconSize / 2
      );
    }

    if (!isExporting && desk.marked) {
      this.ctx.strokeStyle = 'blue';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x + 5, y + 5);
      this.ctx.lineTo(x + this.cellSize - 5, y + this.cellSize - 5);
      this.ctx.moveTo(x + this.cellSize - 5, y + 5);
      this.ctx.lineTo(x + 5, y + this.cellSize - 5);
      this.ctx.stroke();
    }
  }

  drawGroupEmojis() {
    this.groupEmojis.forEach(emoji => {
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(emoji.text, emoji.x, emoji.y);
    });
  }

  drawRoundtables() {
    this.roundtables.forEach(table => {
      const tableX = table.gridX * this.cellSize;
      const tableY = table.gridY * this.cellSize;
      const cx = tableX + this.cellSize;
      const cy = tableY + this.cellSize;
      const radius = this.cellSize;
      const tableColor = table.color || this.roundtableFill;

      this.ctx.fillStyle = tableColor;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.drawSeats(table, tableX, tableY, cx, cy, radius, tableColor);
      this.drawTableDeleteIcon(table, tableX, tableY);
    });
  }

  drawSeats(table, tableX, tableY, cx, cy, radius, tableColor) {
    const num = table.numSeats;
    const seatSize = this.cellSize * 0.8;

    for (let i = 0; i < num; i++) {
      const angle = this.computeSeatAngle(i, num);
      const sx = cx + Math.cos(angle) * radius * 0.7 - seatSize / 2;
      const sy = cy + Math.sin(angle) * radius * 0.7 - seatSize / 2;

      if (table.students[i]) {
        const textColor = utils.getContrastColor(tableColor);
        this.drawStudentAtSeat(table, i, num, tableX, tableY, sx, sy, seatSize, textColor);
      }
      this.drawSeatBoundary(cx, cy, i, num, radius);
    }
  }

  computeSeatAngle(i, num) {
    if (num === 2) return i === 0 ? 0 : Math.PI;
    return (2 * Math.PI / num) * i - Math.PI / 2;
  }

  drawStudentAtSeat(table, i, num, tableX, tableY, sx, sy, size, textColor) {
    if (num === 3) {
      // Tre seter: 0 øverst, 1 og 2 skrått ned
      if (i === 0) {
        utils.drawRotatedText(
          this.ctx,
          table.students[0],
          tableX + this.cellSize * 3 / 5,
          tableY,
          size,
          size,
          0,
          textColor,
          "Arial",
          "normal"
        );
      } else if (i === 1) {
        utils.drawRotatedText(
          this.ctx,
          table.students[1],
          tableX + this.cellSize * 1.05,
          tableY + this.cellSize * 9 / 11,
          size,
          size,
          -Math.PI / 3,
          textColor,
          "Arial",
          "normal"
        );
      } else if (i === 2) {
        utils.drawRotatedText(
          this.ctx,
          table.students[2],
          tableX + this.cellSize * 0.1,
          tableY + this.cellSize * 9 / 11,
          size,
          size,
          Math.PI / 3,
          textColor,
          "Arial",
          "normal"
        );
      }
    } else if (num === 4) {
      // Fire seter i hjørnene med 45° rotasjon
      const angles = [-Math.PI / 4, Math.PI / 4, Math.PI / 4, -Math.PI / 4];
      const seatX = tableX + (i % 2) * this.cellSize;
      const seatY = tableY + (i < 2 ? 0 : this.cellSize);
      utils.drawRotatedText(
        this.ctx,
        table.students[i],
        seatX,
        seatY,
        this.cellSize,
        this.cellSize,
        angles[i],
        textColor,
        "Arial",
        "normal"
      );
    } else {
      // Standard: fit tekst i setet
      utils.drawFittedText(
        this.ctx,
        table.students[i],
        sx,
        sy,
        size,
        size,
        textColor,
        "Arial",
        "normal"
      );
    }
  }

  drawSeatBoundary(cx, cy, i, num, radius) {
    // Radiale linjer mellom seter
    const seatRectHeight = this.cellSize * 0.8;
    let boundaryAngle;
    if (num === 2) {
      boundaryAngle = i === 0 ? Math.PI / 2 : -Math.PI / 2;
    } else if (num === 4) {
      boundaryAngle = (2 * Math.PI / num) * i - Math.PI / 4 + (Math.PI / num);
    } else {
      boundaryAngle = (2 * Math.PI / num) * i - Math.PI / 2 + (Math.PI / num);
    }
    const innerDistance = 0;
    const outerDistance = radius * 0.6 + (seatRectHeight / 2);
    const bx1 = cx + innerDistance * Math.cos(boundaryAngle);
    const by1 = cy + innerDistance * Math.sin(boundaryAngle);
    const bx2 = cx + outerDistance * Math.cos(boundaryAngle);
    const by2 = cy + outerDistance * Math.sin(boundaryAngle);

    this.ctx.beginPath();
    this.ctx.moveTo(bx1, by1);
    this.ctx.lineTo(bx2, by2);
    this.ctx.strokeStyle = this.borderColor;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawTableDeleteIcon(table, tableX, tableY) {
    const width = 2 * this.cellSize;
    const height = 2 * this.cellSize;
    if (this.isPointInRect(this.mousePos.x, this.mousePos.y, tableX, tableY, width, height)) {
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(
        tableX + width - this.deleteIconSize,
        tableY,
        this.deleteIconSize,
        this.deleteIconSize
      );
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        'x',
        tableX + width - this.deleteIconSize / 2,
        tableY + this.deleteIconSize / 2
      );
    }
  }

  drawGapGroups() {
    const groups = utils.getDeskGroups();
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    groups.forEach(group => {
      if (group.emoji) {
        this.ctx.fillText(group.emoji.text, group.emoji.x, group.emoji.y);
      }
    });
  }

  drawBlackboards() {
    this.blackboards.forEach(b => {
      const x = b.x;
      const y = b.y;
      const w = b.width * this.cellSize;
      const h = b.height * this.cellSize;
      this.ctx.fillStyle = "#f0f0f0";
      this.ctx.fillRect(x, y, w, h);
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, w, h);
    });
  }

  drawOthers() {
    this.others.forEach(o => {
      this.ctx.fillStyle = o.color;
      console.log("farge: ", o.color);
      this.ctx.fillRect(o.x, o.y, o.width, o.height);
      this.ctx.strokeStyle = this.borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(o.x, o.y, o.width, o.height);
      utils.drawFittedText(this.ctx, o.text, o.x, o.y, o.width, o.height, "black", "Arial", "normal");
      this.drawOtherHandles(o);
    });
  }

  drawOtherHandles(o) {
    if (this.isPointInRect(this.mousePos.x, this.mousePos.y, o.x, o.y, o.width, o.height)) {
      const handle = 10;
      this.ctx.save();
      this.ctx.strokeStyle = 'blue';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(o.x, o.y, o.width, o.height);
      this.ctx.fillStyle = 'blue';
      this.ctx.fillRect(o.x + o.width - handle, o.y + o.height - handle, handle, handle);
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(o.x + o.width - this.deleteIconSize, o.y, this.deleteIconSize, this.deleteIconSize);
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('x', o.x + o.width - this.deleteIconSize / 2, o.y + this.deleteIconSize / 2);
      this.ctx.restore();
    }
  }
  drawZones() {
    this.zones.forEach(zone => {
      console.log("zone: ", zone);
      zone.draw(this.ctx);
    });
  }


isDeskInZone(desk) { 
  for (let zone of this.zones) {
    if (desk.gridX * this.cellSize >= zone.x && desk.gridX * this.cellSize <= zone.x + zone.width &&
        desk.gridY * this.cellSize >= zone.y && desk.gridY * this.cellSize <= zone.y + zone.height) {
      return true;
    }
  }
  return false;
}




/*
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

    if (this.currentClass == "") {
      let height = this.canvas.height * this.cellSize / this.numRows / 2;
      let width = document.getElementById("gridCanvas").width;
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Halvtransparent svart
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = "white";
      this.ctx.font = "30px 'Segoe UI', sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      //tegner tekst i midten av synlig canvas
      this.ctx.fillText(
        "Velg klasse fra menyen til høyre",
        document.getElementById("canvas-container").getBoundingClientRect().width / 2,
        document.getElementById("canvas-container").getBoundingClientRect().height / 2
      );
    }
    else {


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
          let textColor = utils.getContrastColor(fill);
          utils.drawFittedText(this.ctx, desk.student, x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, textColor, "Arial", "normal");
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
        if (!isExporting && desk.marked) {
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


      // Tegn emojier i midten av gruppene
      this.groupEmojis.forEach(emoji => {
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji.text, emoji.x, emoji.y);
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

        // Tegn selve bordet (sirkel)
        this.ctx.fillStyle = tableColor;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Tegn seter jevnt fordelt rundt bordet



        if (table.numSeats > 0) {

          for (let i = 0; i < table.numSeats; i++) {
            let angle;
            if (table.numSeats === 2) {
              // For to seter: plasser det ene til høyre (0 rad) og det andre til venstre (π rad)
              angle = (i === 0) ? 0 : Math.PI;
            }
            else if (table.numSeats === 4) {

              angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
            }

            else {
              // Standard fordeling med første sete øverst
              angle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2;
            }

            let seatRectWidth = this.cellSize * 0.8;
            let seatRectHeight = this.cellSize * 0.8;
            // Plasser setet på en fast avstand fra midten
            let seatCenterX = cx + Math.cos(angle) * radius * 0.7;
            let seatCenterY = cy + Math.sin(angle) * radius * 0.7;
            let seatX = seatCenterX - seatRectWidth / 2;
            let seatY = seatCenterY - seatRectHeight / 2;

            // Hvis det finnes en student, tegn teksten horisontalt

            if (table.students[i]) {
              let textColor = utils.getContrastColor(tableColor);
              // Her brukes drawFittedText uten rotasjon (rotasjonsvinkelen er 0)

              //hvis det er fire seter, skal teksten tegnes med 45 graders vinkel slik at teksten er mest mulig leselig
              
              if (table.numSeats === 3) {
                let textColor = utils.getContrastColor(tableColor);
                if(table.students[0]){
                utils.drawRotatedText(this.ctx, table.students[0], tableX+this.cellSize*3/5, tableY, seatRectWidth, seatRectHeight, 0, textColor, "Arial", "normal");
              }
              if(table.students[1]){
                utils.drawRotatedText(this.ctx, table.students[1], tableX+this.cellSize*1.05, tableY+this.cellSize*9/11, seatRectWidth, seatRectHeight, -Math.PI/3, textColor, "Arial", "normal");
              }
              if(table.students[2]){
                utils.drawRotatedText(this.ctx, table.students[2], tableX+this.cellSize*0.1, tableY+this.cellSize*9/11, seatRectWidth, seatRectHeight, Math.PI/3, textColor, "Arial", "normal");
              }
                
                
              }
              
              else if (table.numSeats === 4) {


                const angles = [-Math.PI / 4, Math.PI / 4, Math.PI / 4, -Math.PI / 4];
                for (let i = 0; i < 4; i++) {
                  seatX = tableX + (i % 2) * this.cellSize;
                  seatY = tableY + (i < 2 ? 0 : this.cellSize);
                  if (table.students[i]) {
                    let textColor = utils.getContrastColor(tableColor);
                    utils.drawRotatedText(this.ctx, table.students[i], seatX, seatY, this.cellSize, this.cellSize, angles[i], textColor, "Arial", "normal");
                  }
                }

              }
              else {
                utils.drawFittedText(this.ctx, table.students[i], seatX, seatY, seatRectWidth, seatRectHeight, textColor, "Arial", "normal");
              }


            }




          }

          // Tegn radiale linjer som separerer setene
          // Her definerer vi inner- og outer-grense for setområdet basert på 70% av radius og setestørrelsen
          let seatRectHeight = this.cellSize * 0.8;
          for (let i = 0; i < table.numSeats; i++) {
            let boundaryAngle;

            // Hvis det er to seter, tegnes to vertikale linjer
            if (table.numSeats === 2) {
              boundaryAngle = (i === 0) ? Math.PI / 2 : -Math.PI / 2;
            }
            else if (table.numSeats === 4) {
              //hvis det er 4 seter, tegnes 4 linjer
              boundaryAngle = (2 * Math.PI / table.numSeats) * i - Math.PI / 4 + (Math.PI / table.numSeats);
            }



            else {
              boundaryAngle = (2 * Math.PI / table.numSeats) * i - Math.PI / 2 + (Math.PI / table.numSeats);
            }


            let innerDistance = 0;
            let outerDistance = radius * 0.6 + (seatRectHeight / 2);
            let bx1 = cx + innerDistance * Math.cos(boundaryAngle);
            let by1 = cy + innerDistance * Math.sin(boundaryAngle);
            let bx2 = cx + outerDistance * Math.cos(boundaryAngle);
            let by2 = cy + outerDistance * Math.sin(boundaryAngle);

            this.ctx.beginPath();
            this.ctx.moveTo(bx1, by1);
            this.ctx.lineTo(bx2, by2);
            this.ctx.strokeStyle = this.borderColor;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
          }

        }
        // Tegn sletteikon for bordet
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

      let groups = utils.getDeskGroups();

      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      groups.forEach(group => {
        if (group.emoji) {
          console.log("Tegner emoji");
          this.ctx.fillText(group.emoji.text, group.emoji.x, group.emoji.y);
        }
      });
      //Tegn blackboards

      this.blackboards.forEach(blackboard => {
        let x = blackboard.x;
        let y = blackboard.y;
        let width = blackboard.width;
        let height = blackboard.height;
        let fill = blackboard.color || this.blackboardColor;
        this.ctx.fillStyle = "#f0f0f0";
        this.ctx.fillRect(x, y, width * this.cellSize, height * this.cellSize);
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width * this.cellSize, height * this.cellSize);
        let textColor = utils.getContrastColor(fill);
        //draw students name next to blackboard


        //utils.drawFittedText(this.ctx, blackboard.text, x, y, width, height, textColor, "Arial", "normal");
      });

      // Tegn merkelapper
      this.others.forEach(other => {
        this.ctx.fillStyle = this.otherColor;
        this.ctx.fillRect(other.x, other.y, other.width, other.height);
        this.ctx.strokeStyle = this.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(other.x, other.y, other.width, other.height);
        utils.drawFittedText(this.ctx, other.text, other.x, other.y, other.width, other.height, "black", "Arial", "normal");
        if (this.isPointInRect(this.mousePos.x, this.mousePos.y, other.x, other.y, other.width, other.height)) {
          const handleSize = 10;
          this.ctx.save();

          this.ctx.strokeStyle = 'blue';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(other.x, other.y, other.width, other.height);
          this.ctx.fillStyle = 'blue';
          this.ctx.fillRect(other.x + other.width - handleSize, other.y + other.height - handleSize, handleSize, handleSize);

          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(other.x + other.width - this.deleteIconSize, other.y, this.deleteIconSize, this.deleteIconSize);
          this.ctx.fillStyle = 'white';
          this.ctx.font = 'bold 14px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('x', other.x + other.width - this.deleteIconSize / 2, other.y + this.deleteIconSize / 2);

          this.ctx.restore();
        }
      });
    }

    //tegn zones
    this.zones.forEach(zone => {
      zone.draw(this.ctx);
    });
  }
  */

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
          this.unsavedChanges = true;
          this.draw();
          return;
        }
        table.dragging = true;
        table.dragOffsetX = pos.x - tableX;
        table.dragOffsetY = pos.y - tableY;
        this.activeRoundtable = table;
        this.unsavedChanges = true;
        this.draw();
        return;
      }
    }

    // Merkelapp
    for (let i = this.others.length - 1; i >= 0; i--) {
      let other = this.others[i];
      // Sjekk om museklikket er innenfor merkelappens rektangel
      if (this.isPointInRect(pos.x, pos.y, other.x, other.y, other.width, other.height)) {
        // Sjekk om museklikket er på sletteikonet
        if (pos.x >= other.x + other.width - this.deleteIconSize && pos.x <= other.x + other.width &&
          pos.y >= other.y && pos.y <= other.y + this.deleteIconSize) {
          this.others.splice(i, 1);
          this.unsavedChanges = true;
          this.draw();
          return;
        }
        const handleSize = 10;
        // Sjekk om museklikket er på resize-håndtaket
        if (pos.x >= other.x + other.width - handleSize && pos.y >= other.y + other.height - handleSize) {
          other.resizing = true;
          other.resizeStartWidth = other.width;
          other.resizeStartHeight = other.height;
          other.resizeStartX = pos.x;
          other.resizeStartY = pos.y;
        } else {
          // Start dragging av merkelappen
          other.dragging = true;
          other.dragOffsetX = pos.x - other.x;
          other.dragOffsetY = pos.y - other.y;
        }
        this.unsavedChanges = true;
        this.activeOther = other;
        this.draw();
        return;
      }
    }

    //tavle

    for (let i = this.blackboards.length - 1; i >= 0; i--) {
      let table = this.blackboards[i];
      let tableX = table.x * this.cellSize;
      let tableY = table.y * this.cellSize;
      let tableWidth = 2 * this.cellSize;
      let tableHeight = 2 * this.cellSize;
      if (this.isPointInRect(pos.x, pos.y, tableX, tableY, tableWidth, tableHeight)) {
        if (pos.x >= tableX + tableWidth - this.deleteIconSize && pos.x <= tableX + tableWidth &&
          pos.y >= tableY && pos.y <= tableY + this.deleteIconSize) {
          this.roundtables.splice(i, 1);
          this.unsavedChanges = true;
          this.draw();
          return;
        }
        table.dragging = true;
        table.dragOffsetX = pos.x - tableX;
        table.dragOffsetY = pos.y - tableY;
        this.activeBlackboard = table;
        this.unsavedChanges = true;
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
        this.unsavedChanges = true;
        this.draw();
        return;
      }
      desk.dragging = true;
      this.activeDesk = desk;
      this.unsavedChanges = true;
      this.draw();
      return;
    }
    //zone
    for (let i = this.zones.length - 1; i >= 0; i--) {
      let zone = this.zones[i];
      if (zone.isCursorInZone(pos.x, pos.y)) {
        // Sjekk om museklikket er på sletteikonet
        if (pos.x >= zone.x + zone.width - this.deleteIconSize && pos.x <= zone.x + zone.width &&
          pos.y >= zone.y && pos.y <= zone.y + this.deleteIconSize) {
          this.zones.splice(i, 1);
          this.unsavedChanges = true;
          this.draw();
          return;
        }


        const handleSize = 10;
        if (pos.x >= zone.x + zone.width - handleSize && pos.y >= zone.y + zone.height - handleSize) {
          zone.resizing = true;
          zone.resizeStartWidth = zone.width;
          zone.resizeStartHeight = zone.height;
          zone.resizeStartX = pos.x;
          zone.resizeStartY = pos.y;
        } else {
          zone.dragging = true;
        zone.dragOffsetX = pos.x - zone.x;
        zone.dragOffsetY = pos.y - zone.y;
        }
        // Sjekk om museklikket er på håndtaket for å endre størrelse
        // Sjekk om museklikket er på håndtaket for å endre størrelse
        if (zone.isCursorInHandle(pos.x, pos.y)) {
          
          zone.resizing = true;
          zone.resizeStartWidth = zone.width;
          zone.resizeStartHeight = zone.height;
          zone.resizeStartX = pos.x;
          zone.resizeStartY = pos.y;
        } else {
          // Start dragging av sonen
          zone.resizing = false;
          zone.dragging = true;
          zone.dragOffsetX = pos.x - zone.x;
          zone.dragOffsetY = pos.y - zone.y;
          zone.selected = true;
        }
        // Start dragging av sonen
        
        this.activeZone = zone;
        this.unsavedChanges = true;
        this.draw();
        return;
      }
    }


    // Opprett ny pult
    let newDesk = new Desk(gridX, gridY);
    newDesk.dragging = true;
    this.desks.push(newDesk);
    this.activeDesk = newDesk;
    this.unsavedChanges = true;
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

    //zones
    if(this.activeZone && this.activeZone.dragging) {
      let newX = pos.x - this.activeZone.dragOffsetX;
      let newY = pos.y - this.activeZone.dragOffsetY;
      this.activeZone.x = newX;
      this.activeZone.y = newY;
    }
    if(this.activeZone && this.activeZone.resizing) {
      let newWidth = this.activeZone.resizeStartWidth + (pos.x - this.activeZone.resizeStartX);
      let newHeight = this.activeZone.resizeStartHeight + (pos.y - this.activeZone.resizeStartY);
      this.activeZone.width = Math.max(newWidth, 30);
      this.activeZone.height = Math.max(newHeight, 20);
    
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

    if(this.activeZone){
      this.activeZone.dragging = false;
      this.activeZone = null;
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
          this.unsavedChanges = true;
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
    let desk = this.desks.find(d => d.gridX === gridX && d.gridY === gridY /*&& d.student*/);
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
        else {
          let studentListElem = document.getElementById("studentList");
          let names = studentListElem.value.split("\n");
          names.push(newName);
          studentListElem.value = names.join("\n");
        }
        this.unsavedChanges = true;
        this.draw();
      }
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const pos = this.getMousePos(e);
    const type = e.dataTransfer.getData("text/plain");

    console.log("Drop event detected with type:", type);
    console.log("All data types available:", e.dataTransfer.types);

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
    this.unsavedChanges = true;
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

    utils.shuffleArray(available);
    //available.sort(() => Math.random() - 0.5);
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
    this.unsavedChanges = true;
    this.draw();
  }

  saveState() {
    return {
      cellSize: this.cellSize,
      desks: JSON.parse(JSON.stringify(this.desks)),
      others: JSON.parse(JSON.stringify(this.others)),
      roundtables: JSON.parse(JSON.stringify(this.roundtables)),
      blackboards: JSON.parse(JSON.stringify(this.blackboards)),
      studentList: document.getElementById("studentList").value
    };
  }

  loadState(state) {
    if (state.cellSize !== undefined) {
      this.cellSize = state.cellSize;
      document.getElementById("cellSizeSlider").value = state.cellSize;
      //document.getElementById("cellSizeValue").innerText = state.cellSize;
      this.updateCanvasSize();
    }
    // Gjenopprett objekter med riktige prototyper
    this.desks = (state.desks || []).map(d => Object.assign(new Desk(d.gridX, d.gridY), d));
    this.others = (state.others || []).map(o => Object.assign(new Merkelapp(o.x, o.y, o.width, o.height, o.text), o));
    this.roundtables = (state.roundtables || []).map(t => Object.assign(new RoundTable(t.gridX, t.gridY, t.numSeats), t));
    this.blackboards = (state.blackboards || []).map(b => Object.assign(new Blackboard(b.x, b.y, b.width, b.height), b));
    if (state.studentList !== undefined) {
      document.getElementById("studentList").value = state.studentList;
    }
    this.unsavedChanges = false;
    this.draw();
  
  }

  drawFullscreenBtn() {
    //tegner fullskjermknapp i canvas
    const btnSize = 30;
    const btnX = this.canvas.width - btnSize - 10;
    const btnY = 10;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(btnX, btnY, btnSize, btnSize);
    this.ctx.fillStyle = "black";
    this.ctx.font = "bold 20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("⛶", btnX + btnSize / 2, btnY + btnSize / 2);
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btnX, btnY, btnSize, btnSize);
    this.ctx.fillStyle = "black";
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Fullscreen", btnX + btnSize / 2, btnY + btnSize + 15);
    this.ctx.strokeStyle = "black";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(btnX, btnY + btnSize, btnSize, 20);
  }
}

function isPointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}
