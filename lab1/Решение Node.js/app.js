const express = require('express');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send('Мой бэкенд');
});

app.get('/api/students', (req, res) => {
    res.json([
        { id: 1, name: 'Иван Иванов', group: 'ПИЖ-6-0-25-1', course: 1 },
        { id: 2, name: 'Петр Петров', group: 'ПИЖ-6-0-25-1', course: 1 },
        { id: 3, name: 'Мария Сидорова', group: 'ПИЖ-6-0-25-2', course: 1 },
        { id: 4, name: 'Алексей Смирнов', group: 'ПИЖ-6-0-25-2', course: 1 }
    ]);
});

app.get('/api/courses', (req, res) => {
    res.json({
        courses: [
            { id: 1, name: 'Программирование', teacher: 'Доцент Иванова' },
            { id: 2, name: 'Базы данных', teacher: 'Профессор Смирнов' },
            { id: 3, name: 'Веб-разработка', teacher: 'Старший преподаватель Петров' },
            { id: 4, name: 'Алгоритмы', teacher: 'Профессор Сидоров' }
        ]
    });
});

app.get('/api/students/:id', (req, res) => {
    const students = [
        { id: 1, name: 'Иван Иванов', group: 'ПИЖ-6-0-25-1', course: 1 },
        { id: 2, name: 'Петр Петров', group: 'ПИЖ-6-0-25-1', course: 1 },
        { id: 3, name: 'Мария Сидорова', group: 'ПИЖ-6-0-25-2', course: 1 },
        { id: 4, name: 'Алексей Смирнов', group: 'ПИЖ-6-0-25-2', course: 1 }
    ];
    
    const studentId = parseInt(req.params.id);
    const student = students.find(s => s.id === studentId);
    
    if (student) {
        res.json({
            message: 'Информация о студенте',
            requestedId: studentId,
            status: 'success',
            data: student
        });
    } else {
        res.status(404).json({
            message: 'Студент не найден',
            requestedId: studentId,
            status: 'error'
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});



