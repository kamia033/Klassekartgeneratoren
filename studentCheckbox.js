// Student Checkbox Management System

let currentInputMode = 'checkbox'; // 'textarea' or 'checkbox'
let currentGroupInputMode = 'checkbox';

// Initialize checkbox system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeStudentCheckboxSystem();
});

function initializeStudentCheckboxSystem() {
  // Convert existing textarea content to checkbox list
  updateCheckboxListFromTextarea('studentList', 'studentCheckboxList');
  updateCheckboxListFromTextarea('groupStudentList', 'groupStudentCheckboxList');
  
  // Show checkbox lists by default
  showCheckboxMode();
  showGroupCheckboxMode();
  
  // Add event listeners for textarea changes
  const studentList = document.getElementById('studentList');
  const groupStudentList = document.getElementById('groupStudentList');
  
  if (studentList) {
    studentList.addEventListener('input', function() {
      if (currentInputMode === 'textarea') {
        updateCheckboxListFromTextarea('studentList', 'studentCheckboxList');
      }
    });
  }
  
  if (groupStudentList) {
    groupStudentList.addEventListener('input', function() {
      if (currentGroupInputMode === 'textarea') {
        updateCheckboxListFromTextarea('groupStudentList', 'groupStudentCheckboxList');
      }
    });
  }
}

function updateCheckboxListFromTextarea(textareaId, checkboxListId) {
  const textarea = document.getElementById(textareaId);
  const checkboxContainer = document.getElementById(checkboxListId);
  
  if (!textarea || !checkboxContainer) return;
  
  const names = textarea.value.split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  // Clear existing checkboxes
  checkboxContainer.innerHTML = '';
  
  // Create checkbox for each student
  names.forEach((name, index) => {
    const checkboxItem = document.createElement('div');
    checkboxItem.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${textareaId}_checkbox_${index}`;
    checkbox.value = name;
    checkbox.checked = true; // Default to checked
    checkbox.addEventListener('change', function() {
      updateTextareaFromCheckboxList(textareaId, checkboxListId);
    });
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = name;
    label.className = 'checkbox-label';
    
    checkboxItem.appendChild(checkbox);
    checkboxItem.appendChild(label);
    checkboxContainer.appendChild(checkboxItem);
  });
}

function updateTextareaFromCheckboxList(textareaId, checkboxListId) {
  const checkboxContainer = document.getElementById(checkboxListId);
  const textarea = document.getElementById(textareaId);
  
  if (!checkboxContainer || !textarea) return;
  
  const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
  const allNames = Array.from(checkboxes).map(cb => cb.value);
  const checkedNames = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  // Update textarea with all names (not just checked ones) to preserve the full list
  textarea.value = allNames.join('\n');
  
  // Store checked status separately
  const checkboxData = {};
  Array.from(checkboxes).forEach(cb => {
    checkboxData[cb.value] = cb.checked;
  });
  
  // Store in localStorage or data attribute for persistence
  const storageKey = `${textareaId}_checkbox_states`;
  localStorage.setItem(storageKey, JSON.stringify(checkboxData));
}

function getCheckedStudents(textareaId, checkboxListId) {
  const checkboxContainer = document.getElementById(checkboxListId);
  
  if (!checkboxContainer) {
    // Fallback to textarea if checkboxes not available
    const textarea = document.getElementById(textareaId);
    return textarea ? textarea.value.split('\n').map(name => name.trim()).filter(name => name.length > 0) : [];
  }
  
  const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function toggleStudentInputMode() {
  if (currentInputMode === 'checkbox') {
    showTextareaMode();
  } else {
    showCheckboxMode();
  }
}

function toggleGroupStudentInputMode() {
  if (currentGroupInputMode === 'checkbox') {
    showGroupTextareaMode();
  } else {
    showGroupCheckboxMode();
  }
}

function showTextareaMode() {
  currentInputMode = 'textarea';
  document.getElementById('studentList').style.display = 'block';
  document.getElementById('studentCheckboxList').style.display = 'none';
  document.getElementById('toggleInputMode').textContent = '☑️ Velg elever';
}

function showCheckboxMode() {
  currentInputMode = 'checkbox';
  document.getElementById('studentList').style.display = 'none';
  document.getElementById('studentCheckboxList').style.display = 'block';
  document.getElementById('toggleInputMode').textContent = '📝 Rediger liste';
  
  // Update checkbox list when switching back
  updateCheckboxListFromTextarea('studentList', 'studentCheckboxList');
  restoreCheckboxStates('studentList');
}

function showGroupTextareaMode() {
  currentGroupInputMode = 'textarea';
  document.getElementById('groupStudentList').style.display = 'block';
  document.getElementById('groupStudentCheckboxList').style.display = 'none';
  document.getElementById('toggleGroupInputMode').textContent = '☑️ Velg elever';
}

function showGroupCheckboxMode() {
  currentGroupInputMode = 'checkbox';
  document.getElementById('groupStudentList').style.display = 'none';
  document.getElementById('groupStudentCheckboxList').style.display = 'block';
  document.getElementById('toggleGroupInputMode').textContent = '📝 Rediger liste';
  
  // Update checkbox list when switching back
  updateCheckboxListFromTextarea('groupStudentList', 'groupStudentCheckboxList');
  restoreCheckboxStates('groupStudentList');
}

function restoreCheckboxStates(textareaId) {
  const storageKey = `${textareaId}_checkbox_states`;
  const savedStates = localStorage.getItem(storageKey);
  
  if (savedStates) {
    try {
      const checkboxData = JSON.parse(savedStates);
      const checkboxListId = textareaId === 'studentList' ? 'studentCheckboxList' : 'groupStudentCheckboxList';
      const checkboxContainer = document.getElementById(checkboxListId);
      
      if (checkboxContainer) {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]');
        Array.from(checkboxes).forEach(cb => {
          if (checkboxData.hasOwnProperty(cb.value)) {
            cb.checked = checkboxData[cb.value];
          }
        });
      }
    } catch (e) {
      console.error('Error restoring checkbox states:', e);
    }
  }
}

function selectAllStudents() {
  const checkboxes = document.getElementById('studentCheckboxList').querySelectorAll('input[type="checkbox"]');
  Array.from(checkboxes).forEach(cb => {
    cb.checked = true;
  });
  updateTextareaFromCheckboxList('studentList', 'studentCheckboxList');
}

function deselectAllStudents() {
  const checkboxes = document.getElementById('studentCheckboxList').querySelectorAll('input[type="checkbox"]');
  Array.from(checkboxes).forEach(cb => {
    cb.checked = false;
  });
  updateTextareaFromCheckboxList('studentList', 'studentCheckboxList');
}

function selectAllGroupStudents() {
  const checkboxes = document.getElementById('groupStudentCheckboxList').querySelectorAll('input[type="checkbox"]');
  Array.from(checkboxes).forEach(cb => {
    cb.checked = true;
  });
  updateTextareaFromCheckboxList('groupStudentList', 'groupStudentCheckboxList');
}

function deselectAllGroupStudents() {
  const checkboxes = document.getElementById('groupStudentCheckboxList').querySelectorAll('input[type="checkbox"]');
  Array.from(checkboxes).forEach(cb => {
    cb.checked = false;
  });
  updateTextareaFromCheckboxList('groupStudentList', 'groupStudentCheckboxList');
}

// Export functions to global scope for HTML onclick handlers
window.toggleStudentInputMode = toggleStudentInputMode;
window.toggleGroupStudentInputMode = toggleGroupStudentInputMode;
window.selectAllStudents = selectAllStudents;
window.deselectAllStudents = deselectAllStudents;
window.selectAllGroupStudents = selectAllGroupStudents;
window.deselectAllGroupStudents = deselectAllGroupStudents;
window.getCheckedStudents = getCheckedStudents;
window.updateCheckboxListFromTextarea = updateCheckboxListFromTextarea;
