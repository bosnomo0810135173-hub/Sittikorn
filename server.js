// ========================================
// Homework System Server - Updated Version
// รองรับ 40 นักเรียน + อัปโหลดไฟล์
// ========================================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ตั้งค่า multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('ประเภทไฟล์ไม่รองรับ'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// ========================================
// Helper Functions
// ========================================

function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading data:', error);
        return initializeData();
    }
}

function initializeData() {
    const students = [];
    for (let i = 1; i <= 40; i++) {
        students.push({
            id: i,
            name: `เลขที่ ${i}`,
            userId: ''
        });
    }
    
    return {
        assignments: [],
        students: students,
        teacher: {
            name: 'คุณครู',
            userId: process.env.TEACHER_USER_ID || ''
        }
    };
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error writing data:', error);
        return false;
    }
}

// ========================================
// LINE Messaging Functions
// ========================================

async function sendLineMessage(userId, message) {
    if (!userId || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        console.log('⚠️ Missing userId or LINE token');
        return false;
    }

    try {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
                to: userId,
                messages: [{ type: 'text', text: message }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log('✅ ส่งข้อความ LINE สำเร็จ');
        return true;
    } catch (error) {
        console.error('❌ Error sending LINE message:', error.response?.data || error.message);
        return false;
    }
}

async function replyLineMessage(replyToken, messages) {
    if (!replyToken || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        return false;
    }

    try {
        await axios.post(
            'https://api.line.me/v2/bot/message/reply',
            {
                replyToken: replyToken,
                messages: messages
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                }
            }
        );
        console.log('✅ ตอบกลับข้อความ LINE สำเร็จ');
        return true;
    } catch (error) {
        console.error('❌ Error replying LINE message:', error.response?.data || error.message);
        return false;
    }
}

// ========================================
// Webhook Handler
// ========================================

app.post('/webhook', async (req, res) => {
    try {
        const events = req.body.events || [];
        
        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userId = event.source.userId;
                const text = event.message.text.trim();
                const replyToken = event.replyToken;
                
                console.log(`\n💬 ข้อความจาก User ID: ${userId}`);
                console.log(`📝 ข้อความ: ${text}`);
                
                const data = readData();
                const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
                
                // ตรวจสอบว่าเป็นครู
                if (text.toLowerCase() === 'ครู' || text.toLowerCase() === 'teacher') {
                    data.teacher.userId = userId;
                    writeData(data);
                    
                    const teacherUrl = `${baseUrl}?role=teacher&userId=${userId}`;
                    
                    await replyLineMessage(replyToken, [{
                        type: 'text',
                        text: `✅ ระบุตัวตนเป็นครูสำเร็จ\n\n📚 เข้าสู่ระบบ:\n${teacherUrl}\n\n💡 คลิกลิงก์เพื่อจัดการการบ้าน`
                    }]);
                    
                    console.log(`✅ บันทึก Teacher User ID: ${userId}`);
                }
                // ตรวจสอบว่าเป็นนักเรียน (เลขที่ 1-40)
                else if (text.match(/^เลขที่\s*([1-9]|[1-3][0-9]|40)$/i)) {
                    const studentNumber = parseInt(text.match(/\d+/)[0]);
                    
                    if (studentNumber >= 1 && studentNumber <= 40) {
                        const student = data.students.find(s => s.id === studentNumber);
                        if (student) {
                            student.userId = userId;
                            writeData(data);
                            
                            const studentUrl = `${baseUrl}?role=student&studentId=${student.id}&userId=${userId}`;
                            
                            await replyLineMessage(replyToken, [{
                                type: 'text',
                                text: `✅ ระบุตัวตนเป็น ${student.name} สำเร็จ\n\n📚 เข้าสู่ระบบ:\n${studentUrl}\n\n💡 คลิกลิงก์เพื่อดูและส่งการบ้าน`
                            }]);
                            
                            console.log(`✅ บันทึก ${student.name} User ID: ${userId}`);
                        }
                    }
                }
                // คำสั่ง help
                else if (text.toLowerCase() === 'help' || text === 'ช่วยเหลือ') {
                    await replyLineMessage(replyToken, [{
                        type: 'text',
                        text: `📚 วิธีใช้งานระบบ Homework System\n\n` +
                              `🔹 สำหรับครู:\nพิมพ์: "ครู"\n\n` +
                              `🔹 สำหรับนักเรียน:\nพิมพ์: "เลขที่ 1" ถึง "เลขที่ 40"\n\n` +
                              `✨ หลังจากระบุตัวตน คุณจะได้รับลิงก์เข้าสู่ระบบ`
                    }]);
                }
                else {
                    await replyLineMessage(replyToken, [{
                        type: 'text',
                        text: `😊 สวัสดีครับ!\n\n` +
                              `กรุณาระบุตัวตนโดยพิมพ์:\n` +
                              `• "เลขที่ 1" ถึง "เลขที่ 40" (สำหรับนักเรียน)\n\n` +
                              `พิมพ์ "help" เพื่อดูคำแนะนำ`
                    }]);
                }
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Webhook Error:', error);
        res.status(200).send('OK');
    }
});

// ========================================
// API Endpoints
// ========================================

// Get all assignments
app.get('/api/assignments', (req, res) => {
    const data = readData();
    res.json(data.assignments);
});

// Get single assignment
app.get('/api/assignments/:id', (req, res) => {
    const data = readData();
    const assignment = data.assignments.find(a => a.id === parseInt(req.params.id));
    if (assignment) {
        res.json(assignment);
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
});

// Create new assignment
app.post('/api/assignments', async (req, res) => {
    const data = readData();
    const newAssignment = {
        id: data.assignments.length > 0 ? Math.max(...data.assignments.map(a => a.id)) + 1 : 1,
        ...req.body,
        createdAt: new Date().toISOString(),
        submissions: []
    };
    
    data.assignments.push(newAssignment);
    writeData(data);
    
    // ส่งการแจ้งเตือนไปยังนักเรียนทุกคนที่มี userId
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    for (const student of data.students) {
        if (student.userId) {
            const studentUrl = `${baseUrl}?role=student&studentId=${student.id}&userId=${student.userId}`;
            await sendLineMessage(
                student.userId,
                `📢 การบ้านใหม่!\n\n` +
                `📚 ${newAssignment.title}\n` +
                `📖 วิชา: ${newAssignment.subject}\n` +
                `📝 ${newAssignment.description}\n` +
                `⏰ กำหนดส่ง: ${new Date(newAssignment.dueDate).toLocaleDateString('th-TH')}\n\n` +
                `👉 ส่งการบ้าน: ${studentUrl}`
            );
        }
    }
    
    res.json(newAssignment);
});

// Delete assignment
app.delete('/api/assignments/:id', (req, res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const index = data.assignments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        const deletedAssignment = data.assignments.splice(index, 1)[0];
        writeData(data);
        
        console.log(`🗑️ ลบการบ้าน ID: ${id} (${deletedAssignment.title})`);
        res.json({ success: true, message: 'Assignment deleted successfully' });
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
});

// Submit assignment with file upload
app.post('/api/assignments/:id/submit', upload.single('file'), async (req, res) => {
    const data = readData();
    const assignment = data.assignments.find(a => a.id === parseInt(req.params.id));
    
    if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const { studentId, studentName } = req.body;
    const file = req.file;
    
    const submission = {
        studentId: parseInt(studentId),
        studentName: studentName,
        submittedAt: new Date().toLocaleString('th-TH'),
        file: file ? file.filename : 'ไม่มีไฟล์',
        fileOriginalName: file ? file.originalname : '',
        fileUrl: file ? `/uploads/${file.filename}` : '',
        status: 'submitted',
        grade: null,
        feedback: ''
    };
    
    // ลบการส่งเก่า
    assignment.submissions = assignment.submissions.filter(
        s => s.studentId !== submission.studentId
    );
    
    assignment.submissions.push(submission);
    writeData(data);
    
    // แจ้งเตือนครู
    if (data.teacher.userId) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        const teacherUrl = `${baseUrl}?role=teacher&userId=${data.teacher.userId}`;
        await sendLineMessage(
            data.teacher.userId,
            `📬 มีการส่งการบ้านใหม่!\n\n` +
            `👤 ${submission.studentName}\n` +
            `📚 ${assignment.title}\n` +
            `📄 ไฟล์: ${submission.fileOriginalName || 'ไม่มีไฟล์'}\n` +
            `🕐 ${submission.submittedAt}\n\n` +
            `👉 ตรวจงาน: ${teacherUrl}`
        );
    }
    
    res.json(submission);
});

// Grade submission
app.post('/api/assignments/:id/grade', async (req, res) => {
    const data = readData();
    const assignment = data.assignments.find(a => a.id === parseInt(req.params.id));
    
    if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
    }
    
    const { studentId, grade, feedback } = req.body;
    const submission = assignment.submissions.find(s => s.studentId === studentId);
    
    if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
    }
    
    submission.status = 'graded';
    submission.grade = grade;
    submission.feedback = feedback;
    
    writeData(data);
    
    // แจ้งเตือนนักเรียน
    const student = data.students.find(s => s.id === studentId);
    if (student && student.userId) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
        const studentUrl = `${baseUrl}?role=student&studentId=${student.id}&userId=${student.userId}`;
        await sendLineMessage(
            student.userId,
            `📊 ครูตรวจการบ้านแล้ว!\n\n` +
            `📚 ${assignment.title}\n` +
            `🎯 คะแนน: ${grade}\n` +
            `💬 ความคิดเห็น: ${feedback || 'ไม่มี'}\n\n` +
            `👉 ดูรายละเอียด: ${studentUrl}`
        );
    }
    
    res.json(submission);
});

// Get students
app.get('/api/students', (req, res) => {
    const data = readData();
    res.json(data.students);
});

// Get student by ID
app.get('/api/students/:id', (req, res) => {
    const data = readData();
    const student = data.students.find(s => s.id === parseInt(req.params.id));
    if (student) {
        res.json(student);
    } else {
        res.status(404).json({ error: 'Student not found' });
    }
});

// Verify user
app.get('/api/verify', (req, res) => {
    const { role, userId, studentId } = req.query;
    const data = readData();
    
    if (role === 'teacher') {
        if (data.teacher.userId === userId) {
            res.json({ valid: true, role: 'teacher', name: data.teacher.name });
        } else {
            res.json({ valid: false });
        }
    } else if (role === 'student') {
        const student = data.students.find(s => s.id === parseInt(studentId) && s.userId === userId);
        if (student) {
            res.json({ valid: true, role: 'student', studentId: student.id, name: student.name });
        } else {
            res.json({ valid: false });
        }
    } else {
        res.json({ valid: false });
    }
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🎓 Homework System Server v3.0');
    console.log('========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📡 Webhook: http://localhost:${PORT}/webhook`);
    console.log('========================================');
    
    // สร้างไฟล์ data.json ถ้ายังไม่มี
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = initializeData();
        writeData(initialData);
        console.log('✅ สร้างไฟล์ data.json เริ่มต้นแล้ว (40 นักเรียน)');
    }
    
    console.log('\n💡 รองรับ:');
    console.log('• นักเรียน 40 คน (เลขที่ 1-40)');
    console.log('• อัปโหลดไฟล์ (สูงสุด 10MB)');
    console.log('• ลบงาน (สำหรับครู)');
    console.log('\n🚀 สำหรับ Deploy:');
    console.log('• ใช้ PORT=10000 สำหรับ Render.com');
    console.log('• ใช้ PORT=3000 สำหรับ Local Development');
    console.log('========================================\n');
});