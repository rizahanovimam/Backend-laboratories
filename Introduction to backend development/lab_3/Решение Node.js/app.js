const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// ============ ЛОГИРОВАНИЕ (Продвинутый уровень) ============
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url} — IP: ${ip}`);
    next();
});

// ============ ДАННЫЕ ============
let students = [
    { id: 1, name: 'Иванов Иван', group: 'ПИЖ-б-о-25-2', avg_grade: 4.5 },
    { id: 2, name: 'Петрова Анна', group: 'ПИЖ-б-о-25-2', avg_grade: 4.8 },
    { id: 3, name: 'Сидоров Пётр', group: 'ПИЖ-б-о-25-1', avg_grade: 3.9 },
    { id: 4, name: 'Кузнецова Мария', group: 'ПИЖ-б-о-25-1', avg_grade: 5.0 },
    { id: 5, name: 'Смирнов Олег', group: 'ПИЖ-б-о-24-3', avg_grade: 3.5 }
];

let courses = [
    { id: 1, title: 'Математика', duration: 120, level: 'Бакалавриат', price: 50000 },
    { id: 2, title: 'Программирование', duration: 150, level: 'Бакалавриат', price: 60000 },
    { id: 3, title: 'Физика', duration: 100, level: 'Бакалавриат', price: 45000 },
    { id: 4, title: 'Базы данных', duration: 80, level: 'Магистратура', price: 70000 }
];

// ============ ЗАДАНИЕ 1. БАЗОВЫЙ УРОВЕНЬ ============

// 1.1 GET /students - все студенты
app.get('/students', (req, res) => {
    res.json({ count: students.length, students });
});

// 1.2 GET /students/:id - один студент
app.get('/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }
    res.json(student);
});

// 1.3 GET /students/:id/courses - курсы студента (вложенный ресурс)
app.get('/students/:id/courses', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }
    // Имитация: возвращаем 2 курса для любого студента
    const studentCourses = courses.slice(0, 2);
    res.json({
        student: student.name,
        courses: studentCourses
    });
});

// 1.4 GET /groups/:group/students - студенты группы (элементы категории)
app.get('/groups/:group/students', (req, res) => {
    const group = req.params.group;
    const filtered = students.filter(s =>
        s.group.toLowerCase() === group.toLowerCase()
    );
    res.json({
        group,
        count: filtered.length,
        students: filtered
    });
});

// ============ ЗАДАНИЕ 2. СРЕДНИЙ УРОВЕНЬ ============

// 2.1 GET /students?search=&sort=&order=&page=&limit=&filter=
app.get('/students', (req, res) => {
    let result = [...students];

    // Поиск по имени
    const search = req.query.search;
    if (search) {
        result = result.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Фильтр по полю (формат: field:value)
    const filter = req.query.filter;
    if (filter) {
        const [field, value] = filter.split(':');
        if (field && value) {
            result = result.filter(s =>
                String(s[field]).toLowerCase() === value.toLowerCase()
            );
        }
    }

    // Сортировка
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    const allowedSortFields = ['id', 'name', 'avg_grade', 'group'];
    if (sort) {
        if (!allowedSortFields.includes(sort)) {
            return res.status(400).json({
                error: `Поле сортировки должно быть одним из: ${allowedSortFields.join(', ')}`
            });
        }
        if (!['asc', 'desc'].includes(order)) {
            return res.status(400).json({
                error: 'Параметр order должен быть asc или desc'
            });
        }
        result.sort((a, b) => {
            if (order === 'desc') {
                return a[sort] < b[sort] ? 1 : -1;
            }
            return a[sort] > b[sort] ? 1 : -1;
        });
    }

    // Пагинация
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1) {
        return res.status(400).json({ error: 'page должен быть >= 1' });
    }
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'limit должен быть от 1 до 100' });
    }
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);

    res.json({
        count: result.length,
        page,
        limit,
        totalPages: Math.ceil(result.length / limit),
        students: paginated
    });
});

// ============ ЗАДАНИЕ 3. ПРОДВИНУТЫЙ УРОВЕНЬ ============

// 3.1 GET /categories/:catId/items - элементы категории
app.get('/categories/:catId/students', (req, res) => {
    const catId = parseInt(req.params.catId);
    if (isNaN(catId)) {
        return res.status(400).json({ error: 'catId должен быть числом' });
    }
    // Имитация: категория = группа
    const group = `ПИЖ-б-о-25-${catId}`;
    const filtered = students.filter(s => s.group === group);
    res.json({
        catId,
        count: filtered.length,
        students: filtered
    });
});

// 3.2 GET /categories/:catId/items/:itemId - элемент категории
app.get('/categories/:catId/students/:studentId', (req, res) => {
    const catId = parseInt(req.params.catId);
    const studentId = parseInt(req.params.studentId);
    if (isNaN(catId) || isNaN(studentId)) {
        return res.status(400).json({ error: 'catId и studentId должны быть числами' });
    }
    const group = `ПИЖ-б-о-25-${catId}`;
    const student = students.find(s =>
        s.id === studentId && s.group === group
    );
    if (!student) {
        return res.status(404).json({
            error: `Студент с ID=${studentId} не найден в категории ${catId}`
        });
    }
    res.json({ catId, student });
});

// 3.3 GET /users/:userId/posts/:postId/comments/:commentId - множественные параметры
app.get('/users/:userId/posts/:postId/comments/:commentId', (req, res) => {
    const { userId, postId, commentId } = req.params;
    res.json({
        message: 'Множественные параметры пути',
        userId,
        postId,
        commentId
    });
});

// 3.4 GET /students/stats - статистика
app.get('/students/stats', (req, res) => {
    const count = students.length;
    if (count === 0) {
        return res.json({ count: 0, message: 'Нет студентов' });
    }
    const avgGrades = students.map(s => s.avg_grade);
    const sum = avgGrades.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...avgGrades);
    const max = Math.max(...avgGrades);

    res.json({
        count,
        averageGrade: Math.round(avg * 100) / 100,
        minGrade: min,
        maxGrade: max
    });
});

// ============ ОБРАБОТКА ОШИБОК ============

// 404 — Wildcard-маршрут (все остальные)
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// 500 — Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка:', err.message);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});

// ============ ЗАПУСК ============
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});