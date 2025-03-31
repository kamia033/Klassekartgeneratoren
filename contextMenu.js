  import * as utils from './utils.js'
  import {Desk, Merkelapp, RoundTable, Blackboard} from './classes.js'
  // Standard kontekstmeny
  export function showContextMenu(e) {
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
    item.addEventListener("click", function (e) {
      e.stopPropagation();
      const type = this.getAttribute("data-type");
      const menu = document.getElementById("contextMenu");
      const x = parseFloat(menu.dataset.x);
      const y = parseFloat(menu.dataset.y);
  
      if (type === "roundtable") {
        console.log("viser undermeny for rundbord!")
        showRoundtableSubMenu(e, x, y);
      } else {
        addElementAt(type, x, y);
        console.log("tegner element av typen: ", type)
      }
      menu.style.display = "none";
    });
  });
  
  // Ny undermeny for rundbord – lar brukeren velge antall seter
  export function showRoundtableSubMenu(e, x, y) {
    const subMenu = document.getElementById("roundtableSubMenu");
  
    // Offset for å plassere undermenyen til høyre og litt ned fra hovedmenyen
    const offsetX = 20;
    const offsetY = 0;
  
    let left = e.pageX + offsetX;
    let top = e.pageY + offsetY;
  
    // Sjekk om undermenyen går utenfor skjermen (horisontalt)
    if (left + subMenu.offsetWidth > window.innerWidth) {
      left = window.innerWidth - subMenu.offsetWidth - offsetX;
    }
  
    // Sjekk om undermenyen går utenfor skjermen (vertikalt)
    if (top + subMenu.offsetHeight > window.innerHeight) {
      top = window.innerHeight - subMenu.offsetHeight - offsetY;
    }
  
    subMenu.style.left = left + "px";
    subMenu.style.top = top + "px";
    subMenu.style.display = "block";
    subMenu.style.listStyleType = "none";
    subMenu.dataset.x = x;
    subMenu.dataset.y = y;
  }
  
  document.querySelectorAll("#roundtableSubMenu li").forEach(item => {
    item.addEventListener("click", function () {
      const numSeats = parseInt(this.getAttribute("data-seats"));
      console.log(numSeats)
      const subMenu = document.getElementById("roundtableSubMenu");
      const x = parseFloat(subMenu.dataset.x);
      const y = parseFloat(subMenu.dataset.y);
      addElementAt("roundtable", x, y, numSeats);
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
  
  export function addElementAt(type, x, y, numSeats) {
    
    if (type === "desk") {
      let gridX = Math.floor(x / grid.cellSize);
      let gridY = Math.floor(y / grid.cellSize);
      if (grid.desks.find(d => d.gridX === gridX && d.gridY === gridY)) {
        utils.showNotification("Det er allerede en pult her!");
        return;
      }
      grid.desks.push(new Desk(gridX, gridY));
    } else if (type === "merkelapp") {
      grid.others.push(new Merkelapp(x, y));
    } else if (type === "roundtable") {
      let gridX = Math.floor(x / grid.cellSize);
      let gridY = Math.floor(y / grid.cellSize);
      // numSeats kommer fra undermenyen; hvis ikke spesifisert, bruk 4 som default
      grid.roundtables.push(new RoundTable(gridX, gridY, numSeats));
    } else if (type ==="blackboard"){
      grid.blackboards.push(new Blackboard(x,y))
    }
    unsavedChanges = true;
    grid.draw();
  }
  