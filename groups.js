// groups.js - Håndtering av tilfeldig gruppeoppdeling
import * as utils from './utils.js';

let currentGroupStudents = [];
let generatedGroups = [];

// Tab-switching funksjonalitet
window.switchTab = function(tabName) {
  // Fjern active-klasse fra alle tabs og knapper
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Legg til active-klasse på valgt tab og knapp
  document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Håndter visning av canvas vs grupper
  const canvas = document.getElementById('gridCanvas');
  const groupsContainer = document.getElementById('groups-visual-container');
  
  if (tabName === 'grupper') {
    // Synkroniser elevliste automatisk når vi bytter til grupper-tab
    syncFromClassroom();
    canvas.style.display = 'none';
    if (generatedGroups.length > 0) {
      groupsContainer.style.display = 'block';
    }
  } else {
    canvas.style.display = 'block';
    groupsContainer.style.display = 'none';
  }
};

// Synkroniser fra klassekart (automatisk og manuelt)
window.syncFromClassroom = function() {
  const studentListValue = document.getElementById("studentList").value;
  const groupStudentList = document.getElementById("groupStudentList");
  
  if (studentListValue.trim()) {
    groupStudentList.value = studentListValue;
    currentGroupStudents = studentListValue.split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
    
    utils.showNotification(`✅ Synkroniserte ${currentGroupStudents.length} elever`, 2000);
  } else {
    utils.showNotification("⚠️ Ingen elever funnet i klassekart!", 2000);
  }
};

// Juster gruppestørrelse
window.adjustGroupSize = function(change) {
  const input = document.getElementById('groupSize');
  let currentValue = parseInt(input.value);
  let newValue = currentValue + change;
  
  // Begrens verdier
  if (newValue < 2) newValue = 2;
  if (newValue > 10) newValue = 10;
  
  input.value = newValue;
};

// Generer tilfeldige grupper
window.generateRandomGroups = function() {
  // Hent elevliste fra tekstfelt i grupper-tab
  const groupStudentListValue = document.getElementById("groupStudentList").value;
  currentGroupStudents = groupStudentListValue.split('\n')
    .map(name => name.trim())
    .filter(name => name !== '');
    
  if (currentGroupStudents.length === 0) {
    utils.showNotification("⚠️ Ingen elever i listen! Legg til elevnavn først.", 3000);
    return;
  }
  
  const groupSize = parseInt(document.getElementById('groupSize').value);
  generatedGroups = createRandomGroups(currentGroupStudents, groupSize);
  
  displayGroupsVisually();
  utils.showNotification(`🎲 Genererte ${generatedGroups.length} grupper!`, 2000);
};

// Regenerer gruppene med samme elever
window.regenerateGroups = function() {
  // Oppdater elevliste fra tekstfelt
  const groupStudentListValue = document.getElementById("groupStudentList").value;
  currentGroupStudents = groupStudentListValue.split('\n')
    .map(name => name.trim())
    .filter(name => name !== '');
    
  if (currentGroupStudents.length === 0) {
    utils.showNotification("⚠️ Ingen elever i listen! Legg til elevnavn først.", 3000);
    return;
  }
  
  generateRandomGroups();
};

// Opprett tilfeldige grupper
function createRandomGroups(students, groupSize) {
  // Shuffle elevlisten
  const shuffledStudents = [...students];
  shuffleArray(shuffledStudents);
  
  const groups = [];
  const totalStudents = shuffledStudents.length;
  const numberOfCompleteGroups = Math.floor(totalStudents / groupSize);
  const remainder = totalStudents % groupSize;
  
  // Opprett komplette grupper
  for (let i = 0; i < numberOfCompleteGroups; i++) {
    const group = shuffledStudents.slice(i * groupSize, (i + 1) * groupSize);
    groups.push(group);
  }
  
  // Håndter gjenværende elever
  if (remainder > 0) {
    const remainingStudents = shuffledStudents.slice(numberOfCompleteGroups * groupSize);
    
    if (remainder === 1 && groups.length > 0) {
      // Legg til den siste eleven i en tilfeldig gruppe
      const randomGroupIndex = Math.floor(Math.random() * groups.length);
      groups[randomGroupIndex].push(...remainingStudents);
    } else if (remainder >= groupSize / 2) {
      // Opprett en ny gruppe hvis det er nok elever
      groups.push(remainingStudents);
    } else {
      // Fordel gjenværende elever i eksisterende grupper
      remainingStudents.forEach((student, index) => {
        const targetGroupIndex = index % groups.length;
        groups[targetGroupIndex].push(student);
      });
    }
  }
  
  return groups;
}

// Fisher-Yates shuffle algoritme
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Vis genererte grupper visuelt på venstre side
function displayGroupsVisually() {
  const container = document.getElementById('groups-visual-grid');
  const visualContainer = document.getElementById('groups-visual-container');
  
  container.innerHTML = '';
  
  generatedGroups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'visual-group-item';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'visual-group-header';
    
    const numberDiv = document.createElement('div');
    numberDiv.className = 'group-number';
    numberDiv.textContent = index + 1;
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `Gruppe ${index + 1}`;
    
    headerDiv.appendChild(numberDiv);
    headerDiv.appendChild(titleSpan);
    
    const membersDiv = document.createElement('div');
    membersDiv.className = 'visual-group-members';
    
    group.forEach(student => {
      const memberDiv = document.createElement('div');
      memberDiv.className = 'group-member';
      memberDiv.textContent = student;
      membersDiv.appendChild(memberDiv);
    });
    
    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(membersDiv);
    container.appendChild(groupDiv);
  });
  
  // Vis den visuelle containeren
  visualContainer.style.display = 'block';
  // Skjul canvas
  document.getElementById('gridCanvas').style.display = 'none';
}

// Oppdater gruppe-display når elever endres (fjernet siden vi ikke bruker den gamle displayet)
function updateGroupDisplay() {
  if (generatedGroups.length > 0) {
    displayGroupsVisually();
  }
}

// Eksporter grupper som tekst
window.exportGroupsAsText = function() {
  if (generatedGroups.length === 0) {
    utils.showNotification("⚠️ Ingen grupper å eksportere!", 2000);
    return;
  }
  
  let text = "🎯 Tilfeldige grupper\n";
  text += "=" .repeat(30) + "\n\n";
  
  generatedGroups.forEach((group, index) => {
    text += `📍 Gruppe ${index + 1} (${group.length} elever):\n`;
    group.forEach(student => {
      text += `  • ${student}\n`;
    });
    text += "\n";
  });
  
  text += `📊 Totalt: ${generatedGroups.length} grupper, ${currentGroupStudents.length} elever`;
  
  // Opprett og last ned fil
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tilfeldige_grupper_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  
  utils.showNotification("📄 Grupper eksportert som tekstfil!", 2000);
};

// Kopier grupper til utklippstavle
window.copyGroupsToClipboard = function() {
  if (generatedGroups.length === 0) {
    utils.showNotification("⚠️ Ingen grupper å kopiere!", 2000);
    return;
  }
  
  let text = "🎯 Tilfeldige grupper\n\n";
  
  generatedGroups.forEach((group, index) => {
    text += `Gruppe ${index + 1}: ${group.join(', ')}\n`;
  });
  
  navigator.clipboard.writeText(text).then(() => {
    utils.showNotification("📋 Grupper kopiert til utklippstavle!", 2000);
  }).catch(() => {
    utils.showNotification("❌ Kunne ikke kopiere til utklippstavle", 2000);
  });
};

// Initialiser når siden lastes
document.addEventListener('DOMContentLoaded', () => {
  // Sett opp event listeners og initialiser komponenter
  console.log('Groups modul lastet');
  
  // Legg til event listener for elevliste-endringer
  const groupStudentList = document.getElementById('groupStudentList');
  if (groupStudentList) {
    groupStudentList.addEventListener('input', () => {
      // Oppdater currentGroupStudents når brukeren endrer listen
      currentGroupStudents = groupStudentList.value.split('\n')
        .map(name => name.trim())
        .filter(name => name !== '');
    });
  }
});
