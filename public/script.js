// ========================================
// Frontend Script - Updated Version
// รองรับ 40 นักเรียน + อัปโหลดไฟล์ + ลบงาน
// ========================================

let currentRole = null;
let currentUserId = null;
let currentStudentId = null;
let currentUserName = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    const userId = urlParams.get('userId');
    const studentId = urlParams.get('studentId');
    
    if (role && userId) {
        const verification = await verifyUser(role, userId, studentId);
        
        if (verification.valid) {
            currentRole = role;
            currentUserId = userId;
            currentUserName = verification.name;
            
            if (role === 'student') {
                currentStudentId = parseInt(studentId);
            }
            
            hideRoleSwitcher();
            updateHeaderForRole();
            
            if (role === 'teacher') {
                switchRole('teacher');
            } else {
                switchRole('student');
            }
        } else {
            showUnauthorizedMessage();
        }
    } else {
        showLineAuthMessage();
    }
});

async function verifyUser(role, userId, studentId) {
    try {
        const params = new URLSearchParams({ role, userId });
        if (studentId) params.append('studentId', studentId);
        
        const response = await fetch(`/api/verify?${params}`);
        return await response.json();
    } catch (error) {
        console.error('Error verifying user:', error);
        return { valid: false };
    }
}

function hideRoleSwitcher() {
    const roleSwitcher = document.querySelector('.role-switcher');
    if (roleSwitcher) {
        roleSwitcher.style.display = 'none';
    }
}

function updateHeaderForRole() {
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        if (currentRole === 'teacher') {
            subtitle.textContent = `👨‍🏫 ครู: ${currentUserName}`;
        } else if (currentRole === 'student') {
            subtitle.textContent = `👨‍🎓 ${currentUserName}`;
        }
    }
}

function showUnauthorizedMessage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="glass-effect" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
            <h2 style="color: #ef4444; margin-bottom: 16px;">ไม่สามารถเข้าถึงได้</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">
                ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว
            </p>
            <p style="color: #64748b;">
                กรุณาระบุตัวตนใหม่ผ่าน LINE Bot<br>
                โดยพิมพ์ "ครู" หรือ "เลขที่ 1" ถึง "เลขที่ 40"
            </p>
        </div>
    `;
}

function showLineAuthMessage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="glass-effect" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">📱</div>
            <h2 style="color: #0ea5e9; margin-bottom: 16px;">กรุณาระบุตัวตนผ่าน LINE</h2>
            <p style="color: #94a3b8; margin-bottom: 32px;">
                เพื่อเข้าใช้งานระบบ กรุณาแอดบอท LINE และระบุตัวตน
            </p>
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
                        padding: 24px; border-radius: 16px; margin-bottom: 24px;
                        border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #22c55e; margin-bottom: 16px;">🔹 สำหรับครู</h3>
                <p style="color: #cbd5e1; margin-bottom: 8px;">พิมพ์ในแชท LINE Bot:</p>
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;
                            font-family: 'Courier New', monospace; color: #22c55e;">
                    ครู
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
                        padding: 24px; border-radius: 16px;
                        border: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: #3b82f6; margin-bottom: 16px;">🔹 สำหรับนักเรียน</h3>
                <p style="color: #cbd5e1; margin-bottom: 8px;">พิมพ์ในแชท LINE Bot:</p>
                <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;
                            font-family: 'Courier New', monospace; color: #3b82f6;">
                    เลขที่ 1 / เลขที่ 2 / ... / เลขที่ 40
                </div>
            </div>
            
            <p style="color: #64748b; margin-top: 32px; font-size: 14px;">
                💡 หลังจากระบุตัวตน คุณจะได้รับลิงก์เข้าสู่ระบบผ่าน LINE
            </p>
        </div>
    `;
    
    const roleSwitcher = document.querySelector('.role-switcher');
    if (roleSwitcher) {
        roleSwitcher.style.display = 'none';
    }
}

function switchRole(role) {
    if (!currentRole) {
        return;
    }
    
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${role}Btn`)?.classList.add('active');
    
    if (currentRole === 'teacher') {
        loadTeacherView();
    } else if (currentRole === 'student') {
        loadStudentView();
    }
}

// ========================================
// Teacher View
// ========================================

async function loadTeacherView() {
    showLoading();
    
    const assignments = await fetchAssignments();
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <section class="card glass-effect fade-in">
            <div class="section-header">
                <h2 class="section-title">📝 สร้างการบ้านใหม่</h2>
            </div>
            <div class="form-group">
                <label class="form-label">หัวข้อการบ้าน</label>
                <input type="text" id="assignmentTitle" class="form-input" placeholder="เช่น การบ้านวิชาคณิตศาสตร์">
            </div>
            <div class="form-group">
                <label class="form-label">วิชา</label>
                <input type="text" id="assignmentSubject" class="form-input" placeholder="เช่น คณิตศาสตร์">
            </div>
            <div class="form-group">
                <label class="form-label">รายละเอียด</label>
                <textarea id="assignmentDesc" class="form-input" rows="3" placeholder="รายละเอียดการบ้าน..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">กำหนดส่ง</label>
                <input type="date" id="assignmentDue" class="form-input">
            </div>
            <button class="btn btn-primary" onclick="createAssignment()">
                ✨ สร้างการบ้าน
            </button>
        </section>

        <section class="card glass-effect fade-in" style="animation-delay: 0.1s;">
            <div class="section-header">
                <h2 class="section-title">📚 การบ้านทั้งหมด (${assignments.length})</h2>
            </div>
            <div class="assignments-grid" id="assignmentsList">
                ${assignments.length === 0 ? 
                    '<div class="empty-state">ยังไม่มีการบ้าน</div>' :
                    assignments.map(assignment => renderTeacherAssignmentCard(assignment)).join('')
                }
            </div>
        </section>
    `;
    
    hideLoading();
}

function renderTeacherAssignmentCard(assignment) {
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < new Date();
    const submittedCount = assignment.submissions.length;
    
    return `
        <div class="assignment-card glass-effect fade-in">
            <div class="assignment-header">
                <div>
                    <h3 class="assignment-title">${assignment.title}</h3>
                    <span class="subject-badge">${assignment.subject}</span>
                </div>
                ${isOverdue ? '<span class="status-badge overdue">⏰ เลยกำหนด</span>' : ''}
            </div>
            <p class="assignment-desc">${assignment.description}</p>
            <div class="assignment-meta">
                <div class="meta-item">
                    <span class="meta-label">📅 กำหนดส่ง:</span>
                    <span class="meta-value">${dueDate.toLocaleDateString('th-TH')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">📬 ส่งแล้ว:</span>
                    <span class="meta-value">${submittedCount}/40 คน</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" style="flex: 1;" onclick="viewSubmissions(${assignment.id})">
                    📊 ดูงานที่ส่ง
                </button>
                <button class="btn" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 14px 20px;" onclick="deleteAssignment(${assignment.id})">
                    🗑️ ลบ
                </button>
            </div>
        </div>
    `;
}

async function createAssignment() {
    const title = document.getElementById('assignmentTitle').value.trim();
    const subject = document.getElementById('assignmentSubject').value.trim();
    const description = document.getElementById('assignmentDesc').value.trim();
    const dueDate = document.getElementById('assignmentDue').value;
    
    if (!title || !subject || !description || !dueDate) {
        alert('❌ กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, subject, description, dueDate })
        });
        
        if (response.ok) {
            alert('✅ สร้างการบ้านสำเร็จ! ระบบได้ส่งการแจ้งเตือนไปยังนักเรียนแล้ว');
            loadTeacherView();
        } else {
            alert('❌ เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาด');
    }
    
    hideLoading();
}

async function deleteAssignment(id) {
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบงานชิ้นนี้?\nข้อมูลการส่งงานของนักเรียนจะหายไปทั้งหมด!')) {
        return;
    }

    showLoading();
    
    try {
        const response = await fetch(`/api/assignments/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('✅ ลบงานเรียบร้อยแล้ว');
            loadTeacherView();
        } else {
            alert('❌ เกิดข้อผิดพลาดในการลบงาน');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
    
    hideLoading();
}

async function viewSubmissions(assignmentId) {
    showLoading();
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}`);
        const assignment = await response.json();
        const students = await fetchStudents();
        
        const modalBody = `
            <div class="submissions-list">
                <div class="assignment-info" style="margin-bottom: 20px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px;">
                    <h4 style="color: #0ea5e9; margin-bottom: 8px;">${assignment.title}</h4>
                    <p style="color: #94a3b8; font-size: 14px;">${assignment.description}</p>
                </div>
                ${students.map(student => {
                    const submission = assignment.submissions.find(s => s.studentId === student.id);
                    return renderSubmissionItem(student, submission, assignmentId);
                }).join('')}
            </div>
        `;
        
        showModal('📊 งานที่ส่ง - ' + assignment.title, modalBody, '', false);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาด');
    }
    
    hideLoading();
}

function renderSubmissionItem(student, submission, assignmentId) {
    if (!submission) {
        return `
            <div class="submission-item" style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444;">
                <div class="submission-header">
                    <div>
                        <div class="student-name">${student.name}</div>
                        <span class="status-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">
                            ❌ ยังไม่ส่ง
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    const isGraded = submission.status === 'graded';
    
    return `
        <div class="submission-item" style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e;">
            <div class="submission-header">
                <div>
                    <div class="student-name">${student.name}</div>
                    <span class="status-badge" style="background: rgba(34, 197, 94, 0.2); color: #86efac;">
                        ✅ ส่งแล้ว
                    </span>
                    ${isGraded ? `<span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd;">
                        📊 ตรวจแล้ว
                    </span>` : ''}
                </div>
                ${isGraded ? `<div class="grade-display">${submission.grade}</div>` : ''}
            </div>
            <div class="submission-meta">
                <div>📄 ${submission.fileOriginalName || submission.file}</div>
                ${submission.fileUrl ? `<a href="${submission.fileUrl}" target="_blank" style="color: #0ea5e9;">📥 ดาวน์โหลด</a>` : ''}
                <div>🕐 ${submission.submittedAt}</div>
            </div>
            ${isGraded && submission.feedback ? `
                <div class="feedback-box">
                    <strong>💬 ความเห็น:</strong> ${submission.feedback}
                </div>
            ` : ''}
            ${!isGraded ? `
                <button class="btn btn-primary btn-small" onclick="gradeSubmission(${assignmentId}, ${student.id})">
                    📝 ให้คะแนน
                </button>
            ` : `
                <button class="btn btn-secondary btn-small" onclick="gradeSubmission(${assignmentId}, ${student.id})">
                    ✏️ แก้ไขคะแนน
                </button>
            `}
        </div>
    `;
}

async function gradeSubmission(assignmentId, studentId) {
    const grade = prompt('ให้คะแนน (0-100):');
    if (grade === null) return;
    
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
        alert('❌ กรุณาใส่คะแนนที่ถูกต้อง (0-100)');
        return;
    }
    
    const feedback = prompt('ความคิดเห็น (ถ้ามี):') || '';
    
    showLoading();
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, grade: gradeNum, feedback })
        });
        
        if (response.ok) {
            alert('✅ ให้คะแนนสำเร็จ! ระบบได้ส่งการแจ้งเตือนไปยังนักเรียนแล้ว');
            closeModal();
            viewSubmissions(assignmentId);
        } else {
            alert('❌ เกิดข้อผิดพลาด');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาด');
    }
    
    hideLoading();
}

// ========================================
// Student View
// ========================================

async function loadStudentView() {
    if (!currentStudentId) {
        alert('❌ ไม่พบข้อมูลนักเรียน');
        return;
    }
    
    showLoading();
    
    const assignments = await fetchAssignments();
    const student = await fetchStudent(currentStudentId);
    
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <section class="card glass-effect fade-in">
            <div class="section-header">
                <h2 class="section-title">📚 การบ้านของฉัน</h2>
                <div class="stats-summary">
                    <div class="stat-item">
                        <div class="stat-value">${assignments.length}</div>
                        <div class="stat-label">ทั้งหมด</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" style="color: #22c55e;">
                            ${assignments.filter(a => a.submissions.some(s => s.studentId === currentStudentId)).length}
                        </div>
                        <div class="stat-label">ส่งแล้ว</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" style="color: #ef4444;">
                            ${assignments.filter(a => !a.submissions.some(s => s.studentId === currentStudentId)).length}
                        </div>
                        <div class="stat-label">ยังไม่ส่ง</div>
                    </div>
                </div>
            </div>
            <div class="assignments-grid" id="studentAssignmentsList">
                ${assignments.length === 0 ? 
                    '<div class="empty-state">ยังไม่มีการบ้าน</div>' :
                    assignments.map(assignment => renderStudentAssignmentCard(assignment, student)).join('')
                }
            </div>
        </section>
    `;
    
    hideLoading();
}

function renderStudentAssignmentCard(assignment, student) {
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < new Date();
    const submission = assignment.submissions.find(s => s.studentId === student.id);
    
    let statusBadge = '';
    let actionButton = '';
    
    if (submission) {
        if (submission.status === 'graded') {
            statusBadge = '<span class="status-badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd;">📊 ตรวจแล้ว</span>';
            actionButton = `<button class="btn btn-secondary btn-full" onclick="viewMySubmission(${assignment.id})">📄 ดูผลงาน</button>`;
        } else {
            statusBadge = '<span class="status-badge" style="background: rgba(34, 197, 94, 0.2); color: #86efac;">✅ ส่งแล้ว</span>';
            actionButton = `<button class="btn btn-secondary btn-full" onclick="submitAssignment(${assignment.id})">✏️ ส่งใหม่</button>`;
        }
    } else {
        if (isOverdue) {
            statusBadge = '<span class="status-badge overdue">⏰ เลยกำหนด</span>';
        } else {
            statusBadge = '<span class="status-badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5;">❌ ยังไม่ส่ง</span>';
        }
        actionButton = `<button class="btn btn-primary btn-full" onclick="submitAssignment(${assignment.id})">📤 ส่งการบ้าน</button>`;
    }
    
    return `
        <div class="assignment-card glass-effect fade-in">
            <div class="assignment-header">
                <div>
                    <h3 class="assignment-title">${assignment.title}</h3>
                    <span class="subject-badge">${assignment.subject}</span>
                </div>
                ${statusBadge}
            </div>
            <p class="assignment-desc">${assignment.description}</p>
            <div class="assignment-meta">
                <div class="meta-item">
                    <span class="meta-label">📅 กำหนดส่ง:</span>
                    <span class="meta-value">${dueDate.toLocaleDateString('th-TH')}</span>
                </div>
                ${submission?.grade ? `
                    <div class="meta-item">
                        <span class="meta-label">🎯 คะแนน:</span>
                        <span class="meta-value" style="color: #22c55e; font-weight: 600;">${submission.grade}</span>
                    </div>
                ` : ''}
            </div>
            ${actionButton}
        </div>
    `;
}

async function submitAssignment(assignmentId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('❌ ไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
            return;
        }
        
        showLoading();
        
        try {
            const student = await fetchStudent(currentStudentId);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('studentId', student.id);
            formData.append('studentName', student.name);
            
            const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('✅ ส่งการบ้านสำเร็จ! ระบบได้ส่งการแจ้งเตือนไปยังครูแล้ว');
                loadStudentView();
            } else {
                alert('❌ เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ เกิดข้อผิดพลาด');
        }
        
        hideLoading();
    };
    
    fileInput.click();
}

async function viewMySubmission(assignmentId) {
    showLoading();
    
    try {
        const response = await fetch(`/api/assignments/${assignmentId}`);
        const assignment = await response.json();
        const submission = assignment.submissions.find(s => s.studentId === currentStudentId);
        
        if (!submission) {
            alert('❌ ไม่พบข้อมูลการส่งงาน');
            hideLoading();
            return;
        }
        
        const modalBody = `
            <div class="submission-detail">
                <div class="detail-section">
                    <h4 style="color: #0ea5e9; margin-bottom: 12px;">📚 ${assignment.title}</h4>
                    <p style="color: #94a3b8; margin-bottom: 20px;">${assignment.description}</p>
                </div>
                
                <div class="detail-section">
                    <div class="detail-item">
                        <span class="detail-label">📄 ไฟล์:</span>
                        <span class="detail-value">${submission.fileOriginalName || submission.file}</span>
                        ${submission.fileUrl ? `<br><a href="${submission.fileUrl}" target="_blank" style="color: #0ea5e9;">📥 ดาวน์โหลดไฟล์</a>` : ''}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🕐 ส่งเมื่อ:</span>
                        <span class="detail-value">${submission.submittedAt}</span>
                    </div>
                    ${submission.grade ? `
                        <div class="detail-item">
                            <span class="detail-label">🎯 คะแนน:</span>
                            <span class="detail-value" style="color: #22c55e; font-weight: 600; font-size: 24px;">
                                ${submission.grade}
                            </span>
                        </div>
                    ` : ''}
                    ${submission.feedback ? `
                        <div class="detail-item">
                            <span class="detail-label">💬 ความคิดเห็นจากครู:</span>
                            <div class="feedback-box" style="margin-top: 8px;">
                                ${submission.feedback}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        showModal('📄 รายละเอียดการส่งงาน', modalBody, '', false);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาด');
    }
    
    hideLoading();
}

// ========================================
// API Helper Functions
// ========================================

async function fetchAssignments() {
    try {
        const response = await fetch('/api/assignments');
        return await response.json();
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
    }
}

async function fetchStudents() {
    try {
        const response = await fetch('/api/students');
        return await response.json();
    } catch (error) {
        console.error('Error fetching students:', error);
        return [];
    }
}

async function fetchStudent(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching student:', error);
        return null;
    }
}

// ========================================
// UI Helper Functions
// ========================================

function showModal(title, body, submitBtnText = 'ตกลง', showActions = true) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalSubmitBtn.textContent = submitBtnText;
    
    if (!showActions) {
        document.querySelector('.modal-actions').style.display = 'none';
    } else {
        document.querySelector('.modal-actions').style.display = 'flex';
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}