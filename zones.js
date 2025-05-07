import {Zone} from "./classes.js";

let zoneCounter = 1; // Starter på 1 fordi zone1 allerede finnes
document.addEventListener("addZoneButton",addZone())

document.addEventListener("addStudentButton",addStudentToZone(1))


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
    const zone = document.getElementById(`zone${zoneId}`);
    if (zone) {
      zone.remove();
    }
  }

  

export function addZone() {
  zoneCounter++;


  let zoneName = `zone${zoneCounter}`;
  let zone = new Zone(300, 300, 200, 300);
  console.log(zone);
  zone.name = zoneName;
  grid.zones.push(zone);
    grid.draw();
  const zoneControls = document.getElementById("zoneControls");
//4., 6. 13. juni
  // Lag ny zone-element
  const zoneElement = document.createElement("div");
  zoneElement.className = "zoneListEl";
  
  zoneElement.id = zoneName;

  zoneElement.innerHTML = `
    <div class="zoneHeader">
      <div class="zoneLabel">Sone ${zoneCounter}</div>
      <div class="removeButton" onclick="deleteZone(${zoneCounter})">X</div> 
    </div>
    <div class="zoneContent">
      <div class="addStudentButton" onclick="addStudentToZone(${zoneCounter})">Legg til elev</div>
    </div>
  `;

  zoneControls.appendChild(zoneElement);
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
