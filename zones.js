
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