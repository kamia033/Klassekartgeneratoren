import {Zone} from "./classes.js";

let zoneCounter = 0; // Starter på 1 fordi zone1 allerede finnes
//document.addEventListener("addZoneButton",addZone())

//document.addEventListener("addStudentButton",addStudentToZone(1))


function addStudentToZone(zoneId) {
    const names = document.getElementById("studentList").value.split("\n");
    const zoneContent = document.querySelector(`#zone${zoneId} .zoneContent`);
    if (!zoneContent) {
      console.error(`Fant ikke zoneContent for zone${zoneId}`);
      return;
    }
  
    // Hent navnene fra tekstfeltet og splitt dem til en liste
    const nameInput = document.getElementById("studentList");
    if (!nameInput) {
      console.error("Fant ikke elementet med id 'studentList'");
      return;
    }
  
  
    const studentListEl = document.createElement('div');
    studentListEl.className = 'zoneStudentListEl';
  
    const select = document.createElement('select');
    select.className = 'studentSelect';
    select.onchange = () => updateStudentName(zoneId);
  
    // Standardvalg
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Velg elev';
    select.appendChild(defaultOption);
  
    // Legg til navnene som <option>
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  
    const removeBtn = document.createElement('div');
    removeBtn.className = 'removeButton';
    removeBtn.textContent = 'X';
    removeBtn.onclick = () => studentListEl.remove();
  
    studentListEl.appendChild(select);
    studentListEl.appendChild(removeBtn);
  
    const addButton = zoneContent.querySelector('.addStudentButton');
    zoneContent.insertBefore(studentListEl, addButton);
  }

  function updateStudentName(zoneId) {
    const select = document.querySelector(`#zone${zoneId} .studentSelect:last-of-type`);
    const selectedName = select.value;
    console.log(`Valgt elev i sone ${zoneId}: ${selectedName}`);
  }

  export function deleteZone(zoneId) {
    console.log(`Deleting zone with ID: ${zoneId}`);
    const zone = document.getElementById(`zone${zoneId}`);
    if (zone) {
      zone.remove();
    }
    //delete zone from grid.zones
    for (let i = 0; i < grid.zones.length; i++) {
      if (grid.zones[i].id == zoneId) {
        grid.zones.splice(i, 1);
        console.log(grid.zones);
        break;
      }
    }
   
    grid.draw();
  }

  

export function addZone() {
  zoneCounter++;


  let zoneName = `zone${zoneCounter}`;
  let zone = new Zone(0, 0, 5, 5, zoneCounter);
  zone.name = zoneName;
 
  grid.zones.push(zone);
  grid.draw();
  zone.createZoneMenuItem(zoneCounter);
  addStudentToZone(zoneCounter)
}

function toggleZones() {
  const zoneControls = document.getElementById("zoneControls");
  if (zoneControls.style.display === "none") {
    zoneControls.style.display = "block";
    grid.zonesActive = true;
  } else {
    zoneControls.style.display = "none";
    grid.zonesActive = false;
  }
}



window.addZone = addZone;
window.addStudentToZone = addStudentToZone;
window.deleteZone = deleteZone;
window.updateStudentName = updateStudentName;
window.toggleZones = toggleZones;
