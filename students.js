class Student {
  constructor(name, age) {
    this.name = name;
    this.assignedZone = null;
  }
}

  const editable = document.getElementById('studentList');
  const hidden = document.getElementById('hiddenTextarea');
  const students = [];

  // Hjelpe‐funksjon: setter caret sist i editable-div
  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  editable.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Les siste tekst‐node (før caret)
      const sel = window.getSelection();
      const node = sel.anchorNode;
      let text = node.textContent.trim();
      if (!text) return;

      // Lag student og pill
      const student = new Student(text);
      students.push(student);

      const pill = document.createElement('span');
      pill.className = 'student-pill';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = student.name;
      pill.appendChild(nameSpan);

      const gear = document.createElement('i');
      gear.className = 'icon fas fa-cog';
      gear.title = 'Innstillinger';
      gear.onclick = () => alert(`Innstillinger for ${student.name}`);
      pill.appendChild(gear);

      const remove = document.createElement('i');
      remove.className = 'icon fas fa-times';
      remove.title = 'Fjern student';
      remove.onclick = () => {
        pill.remove();
        const idx = students.indexOf(student);
        if (idx > -1) students.splice(idx, 1);
      };
      pill.appendChild(remove);

      // Erstatt tekst‐noden med pill + ny tom tekst‐node
      const parent = node.parentNode;
      parent.insertBefore(pill, node);
      parent.insertBefore(document.createTextNode('\u00A0'), node); // non‐breaking space
      node.textContent = ''; // fjerner teksten i node

      placeCaretAtEnd(editable);
      updateHidden();
    }
  });

  // Oppdater skjult textarea om du trenger å sende data til server
  function updateHidden() {
    hidden.value = students.map(s => s.name).join('\n');
  }