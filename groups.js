// groups.js - Håndtering av tilfeldig gruppeoppdeling
// import * as utils from './utils.js';

console.log('groups.js loaded successfully');

let currentGroupStudents = [];
let generatedGroups = [];

// Midlertidige utils-funksjoner
function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

// Legg til event listener når DOM er klar
document.addEventListener('DOMContentLoaded', function() {
  const groupStudentList = document.getElementById('groupStudentList');
  if (groupStudentList) {
    // Oppdater localStorage og forhåndsvisning når brukeren endrer på listen
    groupStudentList.addEventListener('input', function() {
      updateGroupPreview();
      // Debounce localStorage-oppdatering for å unngå for mange kall
      clearTimeout(groupStudentList.updateTimeout);
      groupStudentList.updateTimeout = setTimeout(() => {
        syncFromGroupsToClassroom();
      }, 500);
    });
  }
  
  // Legg til event listener for "hold ekstra elever separat" checkbox
  const keepExtraStudentsSeparate = document.getElementById('keepExtraStudentsSeparate');
  if (keepExtraStudentsSeparate) {
    keepExtraStudentsSeparate.addEventListener('change', function() {
      updateGroupPreview();
    });
  }
  
  // Vis initial forhåndsvisning
  updateGroupPreview();
});

// Juster gruppestørrelse
window.adjustGroupSize = function(change) {
  const input = document.getElementById('groupSize');
  let currentValue = parseInt(input.value);
  let newValue = currentValue + change;
  
  // Begrens verdier
  if (newValue < 2) newValue = 2;
  if (newValue > 10) newValue = 10;
  
  input.value = newValue;
  
  // Oppdater automatisk antall grupper
  updateGroupSizeFromInput();
};

// Kontroller for gruppeantall
window.adjustGroupCount = function(delta) {
  const input = document.getElementById('groupCount');
  const currentValue = parseInt(input.value);
  const newValue = Math.max(parseInt(input.min), Math.min(parseInt(input.max), currentValue + delta));
  input.value = newValue;
  updateGroupCountFromInput();
};

// Oppdater gruppe størrelse input
window.updateGroupSizeFromInput = function() {
  const groupSize = parseInt(document.getElementById('groupSize').value);
  const studentCount = getStudentsFromGroupTab().length;
  
  if (studentCount > 0) {
    const maxGroups = Math.floor(studentCount / groupSize);
    const groupCountInput = document.getElementById('groupCount');
    
    // Oppdater antall grupper basert på størrelse
    if (maxGroups > 0) {
      groupCountInput.value = maxGroups;
    }
  }
};

window.updateGroupCountFromInput = function() {
  const groupCount = parseInt(document.getElementById('groupCount').value);
  const studentCount = getStudentsFromGroupTab().length;
  
  if (studentCount > 0) {
    const maxGroupSize = Math.floor(studentCount / groupCount);
    const groupSizeInput = document.getElementById('groupSize');
    
    // Oppdater gruppestørrelse basert på antall grupper
    if (maxGroupSize > 0) {
      groupSizeInput.value = Math.max(2, maxGroupSize);
    }
  }
};

// Funksjon for å generere tilfeldige grupper med Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Funksjon for å dele elever i grupper
function createGroups(students, groupSize, groupCount, keepExtraStudentsSeparate) {
  const shuffledStudents = shuffleArray(students);
  const groups = [];
  
  // Opprett grupper basert på valg
  let studentsPerGroup = Math.floor(shuffledStudents.length / groupCount);
  let extraStudents = shuffledStudents.length % groupCount;
  
  let currentIndex = 0;
  
  for (let i = 0; i < groupCount; i++) {
    const group = {
      name: `Gruppe ${i + 1}`,
      students: []
    };
    
    // Legg til basisantall elever
    for (let j = 0; j < studentsPerGroup; j++) {
      if (currentIndex < shuffledStudents.length) {
        group.students.push(shuffledStudents[currentIndex++]);
      }
    }
    
    // Distribuer ekstra elever jevnt hvis ikke valgt å holde separat
    if (!keepExtraStudentsSeparate && extraStudents > 0 && i < extraStudents) {
      if (currentIndex < shuffledStudents.length) {
        group.students.push(shuffledStudents[currentIndex++]);
      }
    }
    
    groups.push(group);
  }
  
  // Håndter eventuelle gjenværende elever
  if (keepExtraStudentsSeparate && currentIndex < shuffledStudents.length) {
    const extraGroup = {
      name: `Gruppe ${groups.length + 1}`,
      students: shuffledStudents.slice(currentIndex)
    };
    groups.push(extraGroup);
  }
  
  return groups;
}

// Hovedfunksjon for å generere tilfeldige grupper
window.generateRandomGroups = function() {
  const students = getStudentsFromGroupTab();
  
  if (students.length === 0) {
    alert('Legg til elever først!');
    return;
  }
  
  const groupSize = parseInt(document.getElementById('groupSize').value);
  const groupCount = parseInt(document.getElementById('groupCount').value);
  const keepExtraStudentsSeparate = document.getElementById('keepExtraStudentsSeparate').checked;
  const selectGroupLeaders = document.getElementById('selectGroupLeaders').checked;
  const showAnimation = document.getElementById('showAnimation').checked;
  
  // Generer gruppene
  generatedGroups = createGroups(students, groupSize, groupCount, keepExtraStudentsSeparate);
  
  // Legg til gruppeledere hvis valgt
  if (selectGroupLeaders) {
    generatedGroups.forEach(group => {
      if (group.students.length > 0) {
        group.leader = group.students[0]; // Første elev blir gruppeleder
      }
    });
  }
  
  // Vis gruppene
  if (showAnimation) {
    displayGroupsWithAnimation();
  } else {
    displayGroups();
  }
  
  // Lagre til localStorage
  saveToLocalStorage('lastGeneratedGroups', generatedGroups);
};

// Gjør funksjonen tilgjengelig globalt
window.generateRandomGroups = generateRandomGroups;

// Funksjon for å hente elever fra grupper-tab
function getStudentsFromGroupTab() {
  // Use checkbox system if available, otherwise fall back to textarea
  if (window.getCheckedStudents) {
    return window.getCheckedStudents('groupStudentList', 'groupStudentCheckboxList');
  } else {
    const studentList = document.getElementById('groupStudentList').value;
    return studentList
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
  }
}

// Vis gruppene uten animasjon
function displayGroups() {
  const container = document.getElementById('groups-visual-container');
  if (!container) {
    // Opprett container hvis den ikke finnes
    createGroupsContainer();
  }
  
  const visualContainer = document.getElementById('groups-visual-container');
  visualContainer.innerHTML = '';
  
  generatedGroups.forEach((group, index) => {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.style.backgroundColor = getUniqueGroupColor(index);
    
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = group.name;
    groupCard.appendChild(groupTitle);
    
    const studentsList = document.createElement('ul');
    group.students.forEach(student => {
      const studentItem = document.createElement('li');
      if (group.leader === student) {
        studentItem.classList.add('group-leader');
        studentItem.textContent = student + ' 👑';
      } else {
        studentItem.textContent = student;
      }
      studentsList.appendChild(studentItem);
    });
    
    groupCard.appendChild(studentsList);
    visualContainer.appendChild(groupCard);
  });
  
  visualContainer.style.display = 'block';
}

// Vis gruppene med animasjon
function displayGroupsWithAnimation() {
  const container = document.getElementById('groups-visual-container');
  if (!container) {
    createGroupsContainer();
  }
  
  const visualContainer = document.getElementById('groups-visual-container');
  visualContainer.innerHTML = '';
  visualContainer.style.display = 'block';
  
  let currentGroupIndex = 0;
  
  function animateNextGroup() {
    if (currentGroupIndex >= generatedGroups.length) return;
    
    const group = generatedGroups[currentGroupIndex];
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card';
    groupCard.style.backgroundColor = getUniqueGroupColor(currentGroupIndex);
    groupCard.style.opacity = '0';
    groupCard.style.transform = 'scale(0.8)';
    
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = group.name;
    groupCard.appendChild(groupTitle);
    
    const studentsList = document.createElement('ul');
    group.students.forEach(student => {
      const studentItem = document.createElement('li');
      if (group.leader === student) {
        studentItem.classList.add('group-leader');
        studentItem.textContent = student + ' 👑';
      } else {
        studentItem.textContent = student;
      }
      studentsList.appendChild(studentItem);
    });
    
    groupCard.appendChild(studentsList);
    visualContainer.appendChild(groupCard);
    
    // Animer inn
    setTimeout(() => {
      groupCard.style.transition = 'all 0.3s ease';
      groupCard.style.opacity = '1';
      groupCard.style.transform = 'scale(1)';
    }, 10);
    
    currentGroupIndex++;
    setTimeout(animateNextGroup, 200);
  }
  
  animateNextGroup();
}

// Opprett container for gruppene hvis den ikke finnes
function createGroupsContainer() {
  const mainContent = document.querySelector('#grupper-tab') || document.body;
  const container = document.createElement('div');
  container.id = 'groups-visual-container';
  container.className = 'groups-container';
  mainContent.appendChild(container);
}

// Generer unike farger for grupper
function getUniqueGroupColor(index) {
  const colors = [
    '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFFAE5', '#F0E5FF',
    '#FFE5F0', '#E5FFFF', '#FFE5CC', '#E5E5FF', '#F5FFE5',
    '#FFCCE5', '#E5FFCC', '#CCE5FF', '#FFCC99', '#CCFFCC'
  ];
  return colors[index % colors.length];
}

// Synkroniseringsfunksjoner
function syncFromClassroomToGroups() {
  const classroomList = document.getElementById('studentList');
  const groupsList = document.getElementById('groupStudentList');
  
  if (classroomList && groupsList) {
    groupsList.value = classroomList.value;
    currentGroupStudents = getStudentsFromGroupTab();
    
    // Update checkbox lists if available
    if (window.updateCheckboxListFromTextarea) {
      window.updateCheckboxListFromTextarea('groupStudentList', 'groupStudentCheckboxList');
    }
  }
}

// Gjør funksjonen tilgjengelig globalt for main.js
window.syncFromClassroomToGroups = syncFromClassroomToGroups;

function syncFromGroupsToClassroom() {
  const groupsList = document.getElementById('groupStudentList');
  const classroomList = document.getElementById('studentList');
  
  if (groupsList && classroomList) {
    classroomList.value = groupsList.value;
    currentGroupStudents = getStudentsFromGroupTab();
    
    // Update checkbox lists if available
    if (window.updateCheckboxListFromTextarea) {
      window.updateCheckboxListFromTextarea('studentList', 'studentCheckboxList');
    }
    
    // Trigger samme localStorage oppdatering som klassekart-tab
    saveToLocalStorage('currentStudentList', classroomList.value);
  }
}

// Forhåndsvisningsfunksjon (viser kvadrater for hver gruppe - minimal)
function updateGroupPreview() {
  const students = getStudentsFromGroupTab();
  const groupSize = parseInt(document.getElementById('groupSize').value) || 4;
  const groupCount = parseInt(document.getElementById('groupCount').value) || 3;
  const keepExtraStudentsSeparate = document.getElementById('keepExtraStudentsSeparate')?.checked || false;
  
  const previewContent = document.getElementById('group-preview-content');
  if (!previewContent) return;
  
  if (students.length === 0) {
    previewContent.innerHTML = '';
    return;
  }
  
  // Beregn hvordan elevene vil bli fordelt
  const studentsPerGroup = Math.floor(students.length / groupCount);
  const extraStudents = students.length % groupCount;
  
  let html = `<div class="group-preview-grid">`;
  
  // Lag kvadrater for hver hovedgruppe
  for (let i = 0; i < groupCount; i++) {
    let studentsInThisGroup;
    if (keepExtraStudentsSeparate) {
      // Hvis ekstra elever holdes separat, får alle hovedgrupper samme antall
      studentsInThisGroup = studentsPerGroup;
    } else {
      // Hvis ekstra elever fordeles, får noen grupper en ekstra elev
      studentsInThisGroup = studentsPerGroup + (i < extraStudents ? 1 : 0);
    }
    
    html += `
      <div class="group-preview-item">
        <div class="group-preview-square">${studentsInThisGroup}</div>
      </div>
    `;
  }
  
  // Legg til ekstra gruppe hvis nødvendig
  if (keepExtraStudentsSeparate && extraStudents > 0) {
    html += `
      <div class="group-preview-item">
        <div class="group-preview-square">${extraStudents}</div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  previewContent.innerHTML = html;
}

// Dropdown-funksjonalitet for grupper
window.toggleGroupDropdown = function() {
  const dropdown = document.getElementById('group-dropdown-options');
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    loadGroupClassOptions();
  }
};

function loadGroupClassOptions() {
  const dropdown = document.getElementById('group-dropdown-options');
  const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
  
  dropdown.innerHTML = '';
  
  // Hvis ingen klasser eksisterer, legg til en hjelpetekst
  if (Object.keys(savedClasses).length === 0) {
    const noClassesOption = document.createElement('li');
    noClassesOption.textContent = 'Ingen klasser funnet - lag en klasse først på Klassekart-fanen';
    noClassesOption.style.color = '#6c757d';
    noClassesOption.style.fontStyle = 'italic';
    dropdown.appendChild(noClassesOption);
    return;
  }
  
  Object.keys(savedClasses).forEach(className => {
    const option = document.createElement('li');
    option.textContent = className;
    option.onclick = () => selectGroupClass(className);
    dropdown.appendChild(option);
  });
}

function selectGroupClass(className) {
  const savedClasses = JSON.parse(localStorage.getItem("classes")) || {};
  const classData = savedClasses[className];
  
  if (classData && classData.studentList) {
    document.getElementById('groupStudentList').value = classData.studentList;
    document.getElementById('group-dropdown-selected').textContent = `🧑‍🏫 ${className}`;
    
    // Update checkbox lists if available
    if (window.updateCheckboxListFromTextarea) {
      window.updateCheckboxListFromTextarea('groupStudentList', 'groupStudentCheckboxList');
    }
    
    syncFromGroupsToClassroom();
    updateGroupPreview();
  }
  
  document.getElementById('group-dropdown-options').style.display = 'none';
}

// Lukk dropdown når man klikker utenfor
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('group-dropdown-options');
  const dropdownBtn = document.getElementById('group-dropdown-selected');
  
  if (dropdown && dropdownBtn && 
      !dropdown.contains(e.target) && 
      !dropdownBtn.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

function adjustGroupSize(change) {
  const input = document.getElementById('groupSize');
  let currentValue = parseInt(input.value);
  let newValue = currentValue + change;
  
  // Begrens verdier
  if (newValue < 2) newValue = 2;
  if (newValue > 10) newValue = 10;
  
  input.value = newValue;
  
  // Oppdater automatisk antall grupper
  updateGroupSizeFromInput();
}

function adjustGroupCount(delta) {
  const input = document.getElementById('groupCount');
  const currentValue = parseInt(input.value);
  const newValue = Math.max(parseInt(input.min), Math.min(parseInt(input.max), currentValue + delta));
  input.value = newValue;
  updateGroupCountFromInput();
}

function updateGroupSizeFromInput() {
  const groupSize = parseInt(document.getElementById('groupSize').value);
  const studentCount = getStudentsFromGroupTab().length;
  
  if (studentCount > 0) {
    const maxGroups = Math.floor(studentCount / groupSize);
    const groupCountInput = document.getElementById('groupCount');
    
    // Oppdater antall grupper basert på størrelse
    if (maxGroups > 0) {
      groupCountInput.value = maxGroups;
    }
  }
  
  // Oppdater forhåndsvisningen
  updateGroupPreview();
}

function updateGroupCountFromInput() {
  const groupCount = parseInt(document.getElementById('groupCount').value);
  const studentCount = getStudentsFromGroupTab().length;
  
  if (studentCount > 0) {
    const maxGroupSize = Math.floor(studentCount / groupCount);
    const groupSizeInput = document.getElementById('groupSize');
    
    // Oppdater gruppestørrelse basert på antall grupper
    if (maxGroupSize > 0) {
      groupSizeInput.value = Math.max(2, maxGroupSize);
    }
  }
  
  // Oppdater forhåndsvisningen
  updateGroupPreview();
}

function toggleGroupDropdown() {
  const dropdown = document.getElementById('group-dropdown-options');
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible) {
    loadGroupClassOptions();
  }
}

// Eksporter alle nødvendige funksjoner til global scope for HTML onclick handlers
window.generateRandomGroups = generateRandomGroups;
window.adjustGroupSize = adjustGroupSize;
window.adjustGroupCount = adjustGroupCount;
window.updateGroupSizeFromInput = updateGroupSizeFromInput;
window.updateGroupCountFromInput = updateGroupCountFromInput;
window.toggleGroupDropdown = toggleGroupDropdown;
