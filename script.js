// ==================== Data Management ====================
const DATA_FILE = 'data.json';
let students = [];
let editingId = null;

// ==================== DOM Elements ====================
const studentForm = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const studentNameInput = document.getElementById('studentName');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const marksInput = document.getElementById('marks');
const gradeInput = document.getElementById('grade');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const cancelEditBtn = document.getElementById('cancelEdit');

// ==================== Navigation Function ====================
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// ==================== Event Listeners ====================
function setupEventListeners() {
    if (studentForm) studentForm.addEventListener('submit', handleFormSubmit);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (exportBtn) exportBtn.addEventListener('click', exportToJSON);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEdit);
    if (marksInput) marksInput.addEventListener('change', updateGradeAutomatically);
}

// ==================== Form Submission ====================
function handleFormSubmit(e) {
    e.preventDefault();

    const studentId = studentIdInput.value.trim();
    const studentName = studentNameInput.value.trim();
    const email = emailInput.value.trim();
    const subject = subjectInput.value;
    const marks = parseInt(marksInput.value);
    const grade = gradeInput.value;

    // Validation
    if (!studentId || !studentName || !email || !subject || !marks || !grade) {
        showToast('Please fill all fields', 'error');
        return;
    }

    if (marks < 0 || marks > 100) {
        showToast('Marks must be between 0 and 100', 'error');
        return;
    }

    if (editingId) {
        // Update existing record
        const index = students.findIndex(s => s.id === editingId);
        if (index !== -1) {
            students[index] = {
                id: editingId,
                studentId,
                studentName,
                email,
                subject,
                marks,
                grade,
                timestamp: students[index].timestamp,
                updatedAt: new Date().toISOString()
            };
            showToast('Student record updated successfully', 'success');
            editingId = null;
            cancelEditBtn.style.display = 'none';
        }
    } else {
        // Add new record
        const newRecord = {
            id: generateId(),
            studentId,
            studentName,
            email,
            subject,
            marks,
            grade,
            timestamp: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        students.push(newRecord);
        showToast('Student record added successfully', 'success');
    }

    saveData();
    resetForm();
    renderTable();
    updateStatistics();
}

// ==================== Auto-generate Grade ====================
function updateGradeAutomatically() {
    const marks = parseInt(marksInput.value) || 0;
    let grade = '';

    if (marks >= 90) grade = 'A+';
    else if (marks >= 80) grade = 'A';
    else if (marks >= 70) grade = 'B+';
    else if (marks >= 60) grade = 'B';
    else if (marks >= 50) grade = 'C';
    else grade = 'F';

    gradeInput.value = grade;
}

// ==================== Render Table ====================
function renderTable(dataToRender = students) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return; // Exit if tableBody doesn't exist on this page
    
    if (dataToRender.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No student records found. Add a new student to get started!</td></tr>';
        return;
    }

    tbody.innerHTML = dataToRender.map(student => `
        <tr>
            <td><strong>${escapeHtml(student.studentId)}</strong></td>
            <td>${escapeHtml(student.studentName)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.subject)}</td>
            <td><strong>${student.marks}</strong></td>
            <td><strong>${student.grade}</strong></td>
            <td>
                <span class="status-badge ${student.marks >= 50 ? 'status-pass' : 'status-fail'}">
                    ${student.marks >= 50 ? '✓ Pass' : '✗ Fail'}
                </span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-edit" onclick="editRecord('${student.id}')" title="Edit">✏️</button>
                    <button class="btn-delete" onclick="deleteRecord('${student.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ==================== Search Functionality ====================
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        renderTable(students);
        return;
    }

    const filtered = students.filter(student =>
        student.studentName.toLowerCase().includes(searchTerm) ||
        student.studentId.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm)
    );

    renderTable(filtered);
}

// ==================== Edit Record ====================
function editRecord(id) {
    const student = students.find(s => s.id === id);
    if (!student) {
        showToast('Student not found', 'error');
        return;
    }

    // Populate form with student data
    studentIdInput.value = student.studentId;
    studentNameInput.value = student.studentName;
    emailInput.value = student.email;
    subjectInput.value = student.subject;
    marksInput.value = student.marks;
    gradeInput.value = student.grade;

    editingId = id;
    cancelEditBtn.style.display = 'block';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });

    // Change button text
    const submitBtn = studentForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Student';
    submitBtn.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
}

// ==================== Cancel Edit ====================
function cancelEdit() {
    editingId = null;
    resetForm();
    cancelEditBtn.style.display = 'none';
    const submitBtn = studentForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Student';
    submitBtn.style.background = '';
}

// ==================== Delete Record ====================
function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this student record?')) {
        return;
    }

    students = students.filter(s => s.id !== id);
    saveData();
    renderTable();
    updateStatistics();
    showToast('Student record deleted successfully', 'success');
}

// ==================== Update Statistics ====================
function updateStatistics() {
    const totalStudents = document.getElementById('totalStudents');
    const avgMarks = document.getElementById('avgMarks');
    const highestMarks = document.getElementById('highestMarks');
    const lowestMarks = document.getElementById('lowestMarks');

    if (students.length === 0) {
        if (totalStudents) totalStudents.textContent = '0';
        if (avgMarks) avgMarks.textContent = '0.00';
        if (highestMarks) highestMarks.textContent = '0';
        if (lowestMarks) lowestMarks.textContent = '0';
        updateHeaderStatistics();
        return;
    }

    const marks = students.map(s => s.marks);
    const total = marks.length;
    const avg = (marks.reduce((a, b) => a + b, 0) / total).toFixed(2);
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);

    if (totalStudents) totalStudents.textContent = total;
    if (avgMarks) avgMarks.textContent = avg;
    if (highestMarks) highestMarks.textContent = highest;
    if (lowestMarks) lowestMarks.textContent = lowest;
    
    updateHeaderStatistics();
}

// ==================== Update Header Statistics ====================
function updateHeaderStatistics() {
    const headerTotalStudents = document.getElementById('headerTotalStudents');
    const headerAvgPerformance = document.getElementById('headerAvgPerformance');
    const headerPassRate = document.getElementById('headerPassRate');
    const headerTopScore = document.getElementById('headerTopScore');

    if (students.length === 0) {
        if (headerTotalStudents) headerTotalStudents.textContent = '0';
        if (headerAvgPerformance) headerAvgPerformance.textContent = '0%';
        if (headerPassRate) headerPassRate.textContent = '0%';
        if (headerTopScore) headerTopScore.textContent = '0';
        return;
    }

    const marks = students.map(s => s.marks);
    const total = marks.length;
    const avg = Math.round((marks.reduce((a, b) => a + b, 0) / total));
    const passCount = students.filter(s => s.marks >= 50).length;
    const passRate = Math.round((passCount / total) * 100);
    const highest = Math.max(...marks);

    if (headerTotalStudents) headerTotalStudents.textContent = total;
    if (headerAvgPerformance) headerAvgPerformance.textContent = avg + '%';
    if (headerPassRate) headerPassRate.textContent = passRate + '%';
    if (headerTopScore) headerTopScore.textContent = highest;
}

// ==================== Data Persistence ====================
function loadData() {
    try {
        const savedData = localStorage.getItem('studentData');
        if (savedData) {
            students = JSON.parse(savedData);
        } else if (typeof initialData !== 'undefined') {
            // Load from initialData (data.js) if localStorage is empty
            students = initialData;
            saveData(); // Save to localStorage
            console.log('Loaded', students.length, 'records from data.js');
            showToast('Loaded ' + students.length + ' records from database', 'success');
        } else {
            students = [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        students = [];
    }
}

// Load data from data.js file (kept for manual reload button)
function loadFromJSON() {
    if (typeof initialData !== 'undefined') {
        students = initialData;
        saveData(); // Save to localStorage
        console.log('Loaded', students.length, 'records from data.js');
        showToast('Loaded ' + students.length + ' records from database', 'success');
        return true;
    }
    return false;
}

function saveData() {
    try {
        localStorage.setItem('studentData', JSON.stringify(students));
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data', 'error');
    }
}

// ==================== Export to JSON ====================
function exportToJSON() {
    if (students.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    const dataStr = JSON.stringify(students, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_performance_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully', 'success');
}

// ==================== Utility Functions ====================
function generateId() {
    return 'STU_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function resetForm() {
    studentForm.reset();
    editingId = null;
}

function showToast(message, type = 'success') {
    const toastElement = document.getElementById('toast');
    if (!toastElement) {
        console.log('Toast:', message);
        return;
    }
    toastElement.textContent = message;
    toastElement.className = `toast show ${type}`;

    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
