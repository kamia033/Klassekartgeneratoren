import * as utils from './utils.js';
import * as contextMenu from './contextMenu.js';

export class DrawableElement {
  draw(ctx, config) {
    // Base class can be empty or provide default drawing if needed
  }
}

export class Desk extends DrawableElement {
  constructor(gridX, gridY) {
    super();
    this.type = "desk";
    this.gridX = gridX;
    this.gridY = gridY;
    this.student = null;
    this.studentIndex = undefined;
    this.dragging = false;
    this.color = null;
    this.marked = false;
  }

  draw(ctx, config) {
    const x = this.gridX * config.cellSize;
    const y = this.gridY * config.cellSize;
    const fill = this.color || config.deskColor;

    // Tegn pult
    ctx.fillStyle = fill;
    ctx.fillRect(x + 2, y + 2, config.cellSize - 4, config.cellSize - 4);
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, y + 2, config.cellSize - 4, config.cellSize - 4);

    // Tegn elevnavn
    if (this.student) {
      const textColor = config.utils.getContrastColor(fill);
      config.utils.drawFittedText(ctx, this.student, x + 2, y + 2, 
        config.cellSize - 4, config.cellSize - 4, textColor, "Arial", "normal");
    }

    // Tegn slett-ikon
    if (config.utils.isPointInRect(config.mousePos.x, config.mousePos.y, x, y, 
        config.cellSize, config.cellSize)) {
      ctx.fillStyle = 'red';
      ctx.fillRect(x + config.cellSize - config.deleteIconSize, y, 
        config.deleteIconSize, config.deleteIconSize);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', x + config.cellSize - config.deleteIconSize/2, 
        y + config.deleteIconSize/2);
    }

    // Tegn markering
    if (!config.isExporting && this.marked) {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 5);
      ctx.lineTo(x + config.cellSize - 5, y + config.cellSize - 5);
      ctx.moveTo(x + config.cellSize - 5, y + 5);
      ctx.lineTo(x + 5, y + config.cellSize - 5);
      ctx.stroke();
    }
  }
}

export class Blackboard extends DrawableElement {
  constructor(x, y, width = 2, height = 2) {
    super();
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
  }

  draw(ctx, config) {
    const pixelWidth = this.width * config.cellSize;
    const pixelHeight = this.height * config.cellSize;
    
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(this.x, this.y, pixelWidth, pixelHeight);
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, pixelWidth, pixelHeight);
  }

  assignStudent(student) {
    this.assignedStudents.push(student);
  }
}

export class RoundTable extends DrawableElement {
  constructor(gridX, gridY, numSeats = 4) {
    super();
    this.type = "roundtable";
    this.gridX = gridX;
    this.gridY = gridY;
    this.numSeats = numSeats;
    this.students = new Array(numSeats).fill(null);
    this.seatStudentIndices = new Array(numSeats).fill(undefined);
    this.markedSeats = new Array(numSeats).fill(false);
    this.dragging = false;
    this.color = null;
  }

  draw(ctx, config) {
    const tableX = this.gridX * config.cellSize;
    const tableY = this.gridY * config.cellSize;
    const cx = tableX + config.cellSize;
    const cy = tableY + config.cellSize;
    const radius = config.cellSize;
    const tableColor = this.color || config.roundtableFill;

    // Tegn bord
    ctx.fillStyle = tableColor;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tegn seter
    for (let i = 0; i < this.numSeats; i++) {
      const angle = (2 * Math.PI / this.numSeats) * i - Math.PI / 2;
      const seatRectWidth = config.cellSize * 0.8;
      const seatRectHeight = config.cellSize * 0.8;
      const seatCenterX = cx + Math.cos(angle) * radius * 0.7;
      const seatCenterY = cy + Math.sin(angle) * radius * 0.7;
      const seatX = seatCenterX - seatRectWidth / 2;
      const seatY = seatCenterY - seatRectHeight / 2;

      // Tegn student
      if (this.students[i]) {
        const textColor = config.utils.getContrastColor(tableColor);
        config.utils.drawFittedText(ctx, this.students[i], seatX, seatY, 
          seatRectWidth, seatRectHeight, textColor, "Arial", "normal");
      }
    }

    // Tegn slett-ikon
    if (config.utils.isPointInRect(config.mousePos.x, config.mousePos.y, 
        tableX, tableY, 2 * config.cellSize, 2 * config.cellSize)) {
      ctx.fillStyle = 'red';
      ctx.fillRect(tableX + 2 * config.cellSize - config.deleteIconSize, 
        tableY, config.deleteIconSize, config.deleteIconSize);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', tableX + 2 * config.cellSize - config.deleteIconSize/2, 
        tableY + config.deleteIconSize/2);
    }
  }
}

export class Merkelapp extends DrawableElement {
  constructor(x, y, width = 100, height = 50, text = "Merkelapp") {
    super();
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
  }

  draw(ctx, config) {
    // Tegn merkelapp
    ctx.fillStyle = config.otherColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Tegn tekst
    config.utils.drawFittedText(ctx, this.text, this.x, this.y, 
      this.width, this.height, "black", "Arial", "normal");

    // Tegn interaksjoner
    if (config.utils.isPointInRect(config.mousePos.x, config.mousePos.y, 
        this.x, this.y, this.width, this.height)) {
      const handleSize = 10;
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      
      // Resize-håndtak
      ctx.fillStyle = 'blue';
      ctx.fillRect(this.x + this.width - handleSize, 
        this.y + this.height - handleSize, handleSize, handleSize);

      // Slett-ikon
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x + this.width - config.deleteIconSize, 
        this.y, config.deleteIconSize, config.deleteIconSize);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', this.x + this.width - config.deleteIconSize/2, 
        this.y + config.deleteIconSize/2);
    }
  }
}

export class Zone extends DrawableElement {
  constructor(x, y, width, height) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.assignedStudents = [];
  }

  draw(ctx) {
    ctx.fillStyle = "rgba(178, 255, 12, 0.3)";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "rgba(178,255,12,0.1)";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }

  assignStudent(student) {
    this.assignedStudents.push(student);
  }
}

export default class ClassroomGrid {
  // ... resten av klassen som før, men med oppdatert draw()

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Tegn grid (samme som før)

    if (this.currentClass == "") {
      // Tegn overlay melding
    } else {
      const config = {
        cellSize: this.cellSize,
        deskColor: this.deskColor,
        borderColor: this.borderColor,
        deleteIconSize: this.deleteIconSize,
        roundtableFill: this.roundtableFill,
        otherColor: this.otherColor,
        mousePos: this.mousePos,
        utils: utils,
        isExporting: isExporting // Antatt tilgjengelig
      };

      // Tegn alle elementer
      this.desks.forEach(d => d.draw(this.ctx, config));
      this.roundtables.forEach(t => t.draw(this.ctx, config));
      this.blackboards.forEach(b => b.draw(this.ctx, config));
      this.others.forEach(o => o.draw(this.ctx, config));
      this.zones.forEach(z => z.draw(this.ctx));

      // Tegn gruppeemojis (hvis nødvendig)
      this.groupEmojis.forEach(emoji => {
        this.ctx.font = '24px Arial';
        this.ctx.fillText(emoji.text, emoji.x, emoji.y);
      });
    }
  }

  // ... resten av metodene som før
}