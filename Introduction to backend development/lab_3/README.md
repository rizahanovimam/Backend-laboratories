# Лабораторная работа №3. Маршрутизация, параметры пути и query-параметры

* **Студент:** Ризаханов Имам Заурович
* **Группа:** ПИЖ-б-о-25-2
* **Вариант:** 7
* **Технология:** Node.js + Express

---

## Цель работы
Изучить механизмы маршрутизации в Express. Освоить способы передачи данных через URL: параметры пути (`req.params`), query-параметры (`req.query`) и вложенные маршруты. Научиться реализовывать валидацию входных данных и обрабатывать ошибки (400, 404). Создать REST-подобный API с гибкой маршрутизацией на основе данных из ЛБ2.

---

## Теоретическое обоснование
**Маршрутизация (routing)** — это механизм сопоставления HTTP-запроса (метод + URL) с кодом-обработчиком на сервере. Каждый маршрут определяет, какой код выполнится при обращении клиента по конкретному адресу. В Express маршрут описывается как `app.METHOD(PATH, HANDLER)`.

### Три источника данных в запросе:

| Источник | Где находится | Express | Flask |
| :--- | :--- | :--- | :--- |
| **Параметры пути** | Часть URL: `/cities/42` | `req.params.id` | `<int:city_id>` |
| **Query-параметры** | После `?`: `/cities?search=Москва` | `req.query.search` | `request.args.get('search')` |
| **Тело запроса** | Тело POST/PUT/PATCH | `req.body` | `request.json` |

* **Параметры пути** — именованная часть URL, которая извлекается сервером и передаётся в обработчик. В Express параметр всегда строка, поэтому нужно преобразование (`parseInt`). Во Flask можно указать тип прямо в маршруте (`<int:city_id>`).
* **Query-параметры** — пары «ключ=значение» после `?`. Используются для фильтрации, sorting, пагинации, поиска. Всегда строки, нужно приводить типы.
* **Вложенные маршруты** отражают иерархию ресурсов: `/users/42/posts/7` — пост 7 пользователя 42.
* **Валидация параметров** — проверка, что параметры соответствуют ожидаемому типу и диапазону. При невалидных данных возвращается **400 Bad Request**. При отсутствии ресурса — **404 Not Found**.
* **Правило порядка маршрутов:** более специфичные маршруты должны идти раньше более общих. Express проверяет маршруты в порядке объявления.

---

## Практическая часть

### 3.1. Код сервера `app.js`
```javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Middleware для логирования запросов (метод + URL + время + IP)
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

// ============ БАЗОВЫЙ УРОВЕНЬ ============

// GET /students - все студенты
app.get('/students', (req, res) => {
    res.json({ count: students.length, students });
});

// GET /students/:id - один студент
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

// GET /students/:id/courses - курсы студента (вложенный ресурс)
app.get('/students/:id/courses', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }
    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }
    const studentCourses = courses.slice(0, 2);
    res.json({ student: student.name, courses: studentCourses });
});

// GET /groups/:group/students - студенты группы
app.get('/groups/:group/students', (req, res) => {
    const group = req.params.group;
    const filtered = students.filter(s =>
        s.group.toLowerCase() === group.toLowerCase()
    );
    res.json({ group, count: filtered.length, students: filtered });
});

// ============ СРЕДНИЙ УРОВЕНЬ ============

// GET /students с query-параметрами (search, filter, sort, order, page, limit)
app.get('/students', (req, res) => {
    let result = [...students];
    const search = req.query.search;
    if (search) {
        result = result.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    const filter = req.query.filter;
    if (filter) {
        const [field, value] = filter.split(':');
        if (field && value) {
            result = result.filter(s =>
                String(s[field]).toLowerCase() === value.toLowerCase()
            );
        }
    }

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
            return res.status(400).json({ error: 'Параметр order должен быть asc или desc' });
        }
        result.sort((a, b) => {
            if (order === 'desc') {
                return a[sort] < b[sort] ? 1 : -1;
            }
            return a[sort] > b[sort] ? 1 : -1;
        });
    }

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

// ============ ПРОДВИНУТЫЙ УРОВЕНЬ ============

// GET /categories/:catId/students - студенты категории
app.get('/categories/:catId/students', (req, res) => {
    const catId = parseInt(req.params.catId);
    if (isNaN(catId)) {
        return res.status(400).json({ error: 'catId должен быть числом' });
    }
    const group = `ПИЖ-б-о-25-${catId}`;
    const filtered = students.filter(s => s.group === group);
    res.json({ catId, count: filtered.length, students: filtered });
});

// GET /categories/:catId/students/:studentId - student в категории
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

// GET /users/:userId/posts/:postId/comments/:commentId
app.get('/users/:userId/posts/:postId/comments/:commentId', (req, res) => {
    const { userId, postId, commentId } = req.params;
    res.json({ message: 'Множественные параметры пути', userId, postId, commentId });
});

// GET /students/stats - статистика
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

// 404 — Wildcard
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// 500 — Глобальный обработчик
app.use((err, req, res, next) => {
    console.error('Ошибка:', err.message);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
```

### 3.2. Краткое объяснение основных моментов кода

1. **Логирование запросов (продвинутый уровень):**
```javascript
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url} — IP: ${ip}`);
    next();
});
```
   Middleware срабатывает на каждый запрос. Записывает в консоль время, метод, URL и IP-адрес клиента. Вызывает `next()`, чтобы передать управление дальше.

2. **Базовые маршруты с параметрами пути:**
   * `GET /students/:id` — извлекает `id` из `req.params`, проверяет, что это число (`isNaN`). Если нет — возвращает статус **400**. Ищет студента через метод `.find()`. Если объект не найден — возвращает статус **404**.
   * `GET /students/:id/courses` — вложенный ресурс. Сначала находит студента, потом отдаёт его курсы (в коде представлена имитация через метод `.slice()`).

3. **Query-параметры (средний уровень):**
   * `search` — фильтр по имени с использованием метода `.includes()`.
   * `filter` — фильтр по полю в формате `field:value` (например, `group:ПИЖ-б-о-25-2`). Строка разбивается через метод `.split(':')`.
   * `sort + order` — сортировка по полю из **белого списка** (`id`, `name`, `avg_grade`, `group`). Если переданное поле отсутствует в списке — возвращается ошибка **400**. Параметр `order` принимает строго значения `asc` или `desc`.
   * `page + limit` — пагинация. Введена валидация диапазонов: `page >= 1`, значение `limit` должно быть в границах от 1 до 100. Иначе сервер возвращает статус **400**. В ответе формируются метаданные: `count`, `page`, `limit`, `totalPages`, `students`.

4. **Продвинутые маршруты:**
   * `GET /categories/:catId/students` — вложенный ресурс, имитирует категорию как группу.
   * `GET /categories/:catId/students/:studentId` — обработка двух параметров пути одновременно.
   * `GET /users/:userId/posts/:postId/comments/:commentId` — пример работы с тремя параметрами пути.
   * `GET /students/stats` — эндпоинт агрегации статистики. Вычисляет общее количество, средний балл, минимальную и максимальную оценки. Для расчетов используются методы массивов и математические функции: `.reduce()`, `Math.min()`, `Math.max()`.

5. **Обработка ошибок:**
   * **404 (Wildcard)** — middleware-перехватчик срабатывает в случае, если ни один из объявленных маршрутов не совпал с URL запроса. Данный блок должен располагаться строго последним среди всех GET-маршрутов.
   * **500 (Глобальный)** — перехватывает любые исключения в коде (ошибки рантайма). Принимает 4 обязательных аргумента `(err, req, res, next)`. Логирует системную ошибку и возвращает клиенту валидный JSON со статусом **500**.



### 3.3. Коллекция запросов в Postman

<img src="screenshots/Решение Node.js/2026-10-21_16-24-47.png" width="250" alt="Скриншот: Коллекция Postman">

#### Корректные запросы:

| № | Имя запроса | Метод | URL |
| :-: | :--- | :-: | :--- |
| 1 | GET All Students | GET | `http://localhost:3000/students` |
| 2 | GET Student by ID | GET | `http://localhost:3000/students/1` |
| 3 | GET Student Courses | GET | `http://localhost:3000/students/1/courses` |
| 4 | GET Group Students | GET | `http://localhost:3000/groups/ПИЖ-б-о-25-2/students` |
| 5 | GET Search Students | GET | `http://localhost:3000/students?search=Иван` |
| 6 | GET Sort Students | GET | `http://localhost:3000/students?sort=avg_grade&order=desc` |
| 7 | GET Pagination Students | GET | `http://localhost:3000/students?page=1&limit=2` |
| 8 | GET Category Students | GET | `http://localhost:3000/categories/2/students` |
| 9 | GET Multi Params | GET | `http://localhost:3000/users/1/posts/2/comments/3` |
| 10 | GET Students Stats | GET | `http://localhost:3000/students/stats` |

#### Ошибочные запросы:

| № | Имя запроса | Метод | URL | Ожидаемый код |
| :-: | :--- | :-: | :--- | :-: |
| 11 | GET Student 404 | GET | `http://localhost:3000/students/999` | **404** |
| 12 | GET Student 400 | GET | `http://localhost:3000/students/abc` | **400** |
| 13 | GET 404 Wildcard | GET | `http://localhost:3000/anything-else` | **404** |


---

## Итог

В ходе лабораторной работы №3 были изучены механизмы маршрутизации в Express. Освоены параметры пути (`req.params`), query-параметры (`req.query`), вложенные маршруты и множественные параметры.

**Реализованы:**
* **Базовый уровень:** Валидация `id`, обработка 404, построение базовых эндпоинтов.
* **Средний уровень:** Полноценный роутинг с фильтрацией, поиском, пагинацией и сортировкой по белому списку.
* **Продвинутый уровень:** Глубокая вложенность путей, сквозное логирование (Time + Method + URL + IP), сбор агрегированной статистики и глобальный обработчик ошибок сервера (500).

---

## Контрольные вопросы

1. **Что такое маршрутизация? Как она работает в Express?**
   Маршрутизация — механизм сопоставления HTTP-запроса (метод + URL) с кодом-обработчиком. В Express описывается как `app.METHOD(PATH, HANDLER)`, где Express последовательно перебирает объявленные пути сверху вниз до первого совпадения.
2. **Чем отличаются `req.params`, `req.query` и `req.body`?**
   `req.params` содержит параметры пути (часть URL-структуры). `req.query` содержит параметры строки запроса (после знака `?`). `req.body` содержит данные из тела запроса (передаются в POST/PUT запросах).
3. **Как получить параметр пути в Express? Во Flask?**
   В Express: через объект `req.params.id`. Во Flask: параметр передается аргументом в функцию, имя которой совпадает с переменной в декораторе `@app.route('/url/<int:id>')`.
4. **Что произойдёт, если не преобразовать параметр пути в число?**
   Параметр извлечется как тип `String`. При строгом сравнении (`===`) с числовыми идентификаторами в базе данных/массиве программа выдаст ошибку логики (объект не будет найден, вернется 404).
5. **Как обработать ситуацию, когда параметр пути отсутствует?**
   Если параметр обязательный (например, `/users/:id`), то при его отсутствии (запрос на `/users/`) роутер Express не сопоставит этот маршрут и передаст запрос дальше — в wildcard 404.
6. **Что такое вложенные маршруты? Приведите пример.**
   Маршруты, отражающие иерархические связи ресурсов (отношение "один ко многим"). Пример: `GET /users/:userId/posts/:postId/comments`.
7. **Какой код ответа возвращается, если ресурс не найден?**
   `404 Not Found`.
8. **Какой код ответа возвращается при невалидном параметре?**
   `400 Bad Request`.
9. **Как объявить необязательный параметр пути в Express?**
   С помощью знака вопроса после имени параметра: `app.get('/users/:id?', ...)`.
10. **Как работает порядок объявления маршрутов в Express? Почему он важен?**
    Маршруты проверяются в порядке их написания. Если объявить общий маршрут (например, `/:id`) выше специфичного (`/stats`), то запрос `/stats` перехватится общим роутером, где слово `"stats"` запишется в переменную `id`. Специфичные роуты всегда пишутся выше.

