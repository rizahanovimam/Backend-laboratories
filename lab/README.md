# Лабораторная работа №2. HTTP-методы: обработка GET, POST, PUT, DELETE

**Студент:** Ризаханов Имам Заурович 
**Группа:** ПИЖ-б-о-25-2  
**Вариант:** 7  

---

## Цель работы

Освоить обработку различных HTTP-методов (GET, POST, PUT, DELETE) в Express/Flask. Научиться реализовывать CRUD-операции над коллекцией объектов, хранящейся в памяти сервера, а также возвращать корректные HTTP-коды ответов (200, 201, 404)

---

## Теоретическое обоснование

### CRUD

CRUD — это акроним, обозначающий четыре базовые операции над данными:

| Операция | Расшифровка | HTTP-метод | SQL-аналог |
|----------|-------------|------------|------------|
| Create | Создание | POST | INSERT |
| Read | Чтение | GET | SELECT |
| Update | Обновление | PUT / PATCH | UPDATE |
| Delete | Удаление | DELETE | DELETE |

### HTTP-методы

**GET** — запрос данных. Тело запроса отсутствует. Идемпотентен, безопасен. Коды ответов: 200 OK, 404 Not Found.

**POST** — создание нового ресурса. Тело запроса содержит данные нового ресурса. Не идемпотентен, не безопасен. Коды ответов: 201 Created, 400 Bad Request.

**PUT** — полное обновление существующего ресурса. Тело запроса содержит новые данные ресурса. Идемпотентен, не безопасен. Коды ответов: 200 OK, 404 Not Found.

**DELETE** — удаление ресурса. Тело запроса отсутствует. Идемпотентен, не безопасен. Коды ответов: 200 OK, 204 No Content, 404 Not Found.

### Коды состояния HTTP

| Код | Название | Когда используется |
|-----|----------|-------------------|
| 200 | OK | Успешный GET, PUT, DELETE |
| 201 | Created | Успешный POST (ресурс создан) |
| 204 | No Content | Успешный DELETE (нет тела ответа) |
| 400 | Bad Request | Ошибка в данных запроса |
| 404 | Not Found | Ресурс не найден |
| 500 | Internal Server Error | Ошибка на сервере |

## Выполнение практического задания

## ---------- Node.js ----------

## Настройка Postman

Postman — это инструмент для тестирования API. Он позволяет отправлять HTTP-запросы (GET, POST, PUT, DELETE) к серверу и просматривать ответы в удобном формате без необходимости писать код.

В Postman была создана коллекция "Lab2_CRUD API" со следующей структурой:

![Структура Postman](screenshots/Решение%20Node.js/струк%20postman.png)

#### GET /cities — тесты

Скриншот показывает вкладку **Scripts** → **After response** с кодом тестов для запроса **GET All Cities**. Проверяется статус 200, формат JSON, наличие полей `count` и `cities`.

![GET All Cities Tests](screenshots/Решение%20Node.js/2026-09-14_20-29-10.png)

#### POST /cities — тесты

Скриншот показывает вкладку **Scripts** → **After response** с кодом тестов для запроса **POST Create City**. Проверяется статус 201 Created и наличие поля `id` в ответе.

![POST Create City Tests](screenshots/Решение%20Node.js/2026-09-14_20-29-47.png)

#### GET /cities/999 — тесты

Скриншот показывает вкладку **Scripts** → **After response** с кодом тестов для запроса **GET Nonexistent City**. Проверяется статус 404 Not Found и наличие поля `error` в ответе.

![GET 404 Tests](screenshots/Решение%20Node.js/2026-09-14_20-30-19.png)



## Базовый уровень

```javascript

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

let cities = [
    { id: 1, name: 'Москва', population: 13000000 },
    { id: 2, name: 'Санкт-Петербург', population: 5600000 },
    { id: 3, name: 'Новосибирск', population: 1600000 }
];

let nextId = 4;


app.get('/cities', (req, res) => {
    res.json({
        count: cities.length,
        cities: cities
    });
});

app.get('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);
    
    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    res.json(city);
});

app.post('/cities', (req, res) => {
    const { name, population } = req.body;
    
    if (!name || population === undefined) {
        return res.status(400).json({
            error: 'Поля name и population обязательны'
        });
    }
    
    const newCity = {
        id: nextId++,
        name: name,
        population: population
    };
    
    cities.push(newCity);
    res.status(201).json(newCity);
});

app.put('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const { name, population } = req.body;
    
    cities[index] = {
        id: id,
        name: name || cities[index].name,
        population: population !== undefined ? population : cities[index].population
    };
    
    res.json(cities[index]);
});

app.delete('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const deletedCity = cities.splice(index, 1)[0];
    
    res.json({
        message: 'Город удалён',
        deleted: deletedCity
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

```


#### GET /cities — все города

![GET All Cities](screenshots/Решение%20Node.js/2026-09-14_20-47-50.png)


#### POST /cities — создание

![POST Create City](screenshots/Решение%20Node.js/2026-09-14_20-49-03.png)


#### PUT /cities/1 — обновление

![PUT Update City](screenshots/Решение%20Node.js/2026-09-14_20-49-23.png)


#### GET /cities/1 — один город

![GET City by ID](screenshots/Решение%20Node.js/2026-09-14_20-50-05.png)


#### DELETE /cities/3 — удаление

![DELETE City](screenshots/Решение%20Node.js/2026-09-14_20-50-20.png)


#### GET /cities — все города (проверка обновления и удаления)

![GET All Cities](screenshots/Решение%20Node.js/2026-09-14_20-51-24.png)


#### GET /cities/999 — ошибка 404

![GET 404](screenshots/Решение%20Node.js/2026-09-14_20-50-37.png)


---


## Средний уровень

```javascript

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

let cities = [
    { id: 1, name: 'Москва', population: 13000000, country: 'Россия', area: 2561 },
    { id: 2, name: 'Санкт-Петербург', population: 5600000, country: 'Россия', area: 1439 },
    { id: 3, name: 'Новосибирск', population: 1600000, country: 'Россия', area: 505 },
    { id: 4, name: 'Екатеринбург', population: 1500000, country: 'Россия', area: 1112 },
    { id: 5, name: 'Казань', population: 1250000, country: 'Россия', area: 425 }
];

let nextId = 6;


app.get('/cities', (req, res) => {
    let result = [...cities];
    
    const search = req.query.search;
    if (search) {
        result = result.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    if (sort) {
        result.sort((a, b) => {
            if (order === 'desc') {
                return b[sort] > a[sort] ? 1 : -1;
            }
            return a[sort] > b[sort] ? 1 : -1;
        });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = result.slice(start, end);
    
    res.json({
        count: result.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.length / limit),
        cities: paginated
    });
});

app.get('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);
    
    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    res.json(city);
});

app.post('/cities', (req, res) => {
    const { name, population, country, area } = req.body;
    
    if (!name || population === undefined) {
        return res.status(400).json({
            error: 'Поля name и population обязательны'
        });
    }
    
    if (typeof name !== 'string') {
        return res.status(400).json({
            error: 'Поле name должно быть строкой'
        });
    }
    
    if (typeof population !== 'number' || population < 0) {
        return res.status(400).json({
            error: 'Поле population должно быть положительным числом'
        });
    }
    
    const newCity = {
        id: nextId++,
        name: name,
        population: population,
        country: country || 'Не указана',
        area: area || 0
    };
    
    cities.push(newCity);
    res.status(201).json(newCity);
});

app.put('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const { name, population, country, area } = req.body;
    
    if (population !== undefined && (typeof population !== 'number' || population < 0)) {
        return res.status(400).json({
            error: 'Поле population должно быть положительным числом'
        });
    }
    
    cities[index] = {
        id: id,
        name: name || cities[index].name,
        population: population !== undefined ? population : cities[index].population,
        country: country || cities[index].country,
        area: area !== undefined ? area : cities[index].area
    };
    
    res.json(cities[index]);
});

app.delete('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    cities.splice(index, 1);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
```
#### GET /cities?search=Москва — поиск по названию

![Search Москва](screenshots/Решение%20Node.js/2026-09-15_21-05-46.png)


#### GET /cities?search=бург — поиск по подстроке

![Search бург](screenshots/Решение%20Node.js/2026-09-15_21-26-07.png)


#### GET /cities?page=1&limit=3 — пагинация

![Pagination page 1 limit 3](screenshots/Решение%20Node.js/2026-09-15_21-09-33.png)


#### GET /cities?page=2&limit=3 — пагинация

![Pagination page 2 limit 3](screenshots/Решение%20Node.js/2026-09-15_21-09-58.png)


#### GET /cities?sort=population&order=asc — сортировка по возрастанию

![Sort population asc](screenshots/Решение%20Node.js/2026-09-15_21-06-51.png)


#### GET /cities?sort=population&order=desc — сортировка по убыванию

![Sort population desc](screenshots/Решение%20Node.js/2026-09-15_21-07-16.png)

---


## Повышенный уровень

``` javascript

const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    fs.appendFile('access.log', log, (err) => {
        if (err) console.error('Ошибка записи лога:', err);
    });
    console.log(log.trim());
    next();
});

let cities = [
    { id: 1, name: 'Москва', population: 13000000, country: 'Россия', area: 2561 },
    { id: 2, name: 'Санкт-Петербург', population: 5600000, country: 'Россия', area: 1439 },
    { id: 3, name: 'Алматы', population: 2000000, country: 'Казахстан', area: 682 },
    { id: 4, name: 'Екатеринбург', population: 1500000, country: 'Россия', area: 1112 },
    { id: 5, name: 'Казань', population: 1250000, country: 'Россия', area: 425 }
];

let nextId = 6;

app.get('/cities/stats', (req, res) => {
    const totalPopulation = cities.reduce((sum, c) => sum + c.population, 0);
    const avgPopulation = cities.length > 0 ? totalPopulation / cities.length : 0;
    const totalArea = cities.reduce((sum, c) => sum + (c.area || 0), 0);
    
    res.json({
        totalCities: cities.length,
        totalPopulation: totalPopulation,
        averagePopulation: Math.round(avgPopulation),
        totalArea: totalArea
    });
});

app.get('/cities', (req, res) => {
    let result = [...cities];
    
    const search = req.query.search;
    if (search) {
        result = result.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    if (sort) {
        result.sort((a, b) => {
            if (order === 'desc') {
                return b[sort] > a[sort] ? 1 : -1;
            }
            return a[sort] > b[sort] ? 1 : -1;
        });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = result.slice(start, end);
    
    res.json({
        count: result.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.length / limit),
        cities: paginated
    });
});

app.get('/cities/:id/related', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);
    
    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const related = cities.filter(c => 
        c.country === city.country && c.id !== id
    );
    
    res.json({
        city: city.name,
        relatedBy: 'country',
        country: city.country,
        related: related
    });
});

app.get('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);
    
    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    res.json(city);
});

app.post('/cities/bulk', (req, res) => {
    const newCities = req.body;
    
    if (!Array.isArray(newCities)) {
        return res.status(400).json({
            error: 'Тело запроса должно быть массивом'
        });
    }
    
    const created = [];
    for (const item of newCities) {
        if (!item.name || item.population === undefined) {
            continue;
        }
        
        const newCity = {
            id: nextId++,
            name: item.name,
            population: item.population,
            country: item.country || 'Не указана',
            area: item.area || 0
        };
        
        cities.push(newCity);
        created.push(newCity);
    }
    
    res.status(201).json({
        message: `Создано городов: ${created.length}`,
        created: created
    });
});

app.post('/cities', (req, res) => {
    const { name, population, country, area } = req.body;
    
    if (!name || population === undefined) {
        return res.status(400).json({
            error: 'Поля name и population обязательны'
        });
    }
    
    if (typeof name !== 'string') {
        return res.status(400).json({
            error: 'Поле name должно быть строкой'
        });
    }
    
    if (typeof population !== 'number' || population < 0) {
        return res.status(400).json({
            error: 'Поле population должно быть положительным числом'
        });
    }
    
    const newCity = {
        id: nextId++,
        name: name,
        population: population,
        country: country || 'Не указана',
        area: area || 0
    };
    
    cities.push(newCity);
    res.status(201).json(newCity);
});

app.patch('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const updates = req.body;
    
    for (const key in updates) {
        if (key !== 'id') {
            cities[index][key] = updates[key];
        }
    }
    
    res.json(cities[index]);
});

app.put('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    const { name, population, country, area } = req.body;
    
    if (population !== undefined && (typeof population !== 'number' || population < 0)) {
        return res.status(400).json({
            error: 'Поле population должно быть положительным числом'
        });
    }
    
    cities[index] = {
        id: id,
        name: name || cities[index].name,
        population: population !== undefined ? population : cities[index].population,
        country: country || cities[index].country,
        area: area !== undefined ? area : cities[index].area
    };
    
    res.json(cities[index]);
});

app.delete('/cities', (req, res) => {
    const count = cities.length;
    cities = [];
    nextId = 1;
    
    res.json({
        message: `Удалено городов: ${count}`,
        deletedCount: count
    });
});

app.delete('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }
    
    cities.splice(index, 1);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

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


#### GET /cities/stats — статистика

![Stats](screenshots/Решение%20Node.js/2026-09-16_20-12-59.png)


#### GET /cities/1/related — связанные города

![Related](screenshots/Решение%20Node.js/2026-09-16_20-14-40.png)


#### POST /cities/bulk — массовое создание

![Bulk Create](screenshots/Решение%20Node.js/2026-09-16_20-17-02.png)


#### PATCH /cities/1 — частичное обновление

![PATCH](screenshots/Решение%20Node.js/2026-09-16_20-18-11.png)


#### DELETE /cities — массовое удаление

![Bulk Delete](screenshots/Решение%20Node.js/2026-09-16_20-19-46.png)


#### access.log — логирование в файл

![Access Log](screenshots/Решение%20Node.js/2026-09-16_20-20-55.png)


---
---

## Контрольные вопросы

## Базовый уровень

**1. Что такое CRUD? Расшифруйте каждую букву.**

CRUD — акроним четырёх базовых операций над данными:
- **C** — Create (создание)
- **R** — Read (чтение)
- **U** — Update (обновление)
- **D** — Delete (удаление)

---

**2. Какие HTTP-методы соответствуют операциям CRUD?**

- Create → **POST**
- Read → **GET**
- Update → **PUT** / **PATCH**
- Delete → **DELETE**

---

**3. Что такое идемпотентность HTTP-методов? Какие методы идемпотентны?**

Идемпотентность — свойство метода, при котором повторный запрос даёт тот же результат, что и первый.

**Идемпотентные методы:**
- GET
- PUT
- DELETE

**Не идемпотентный:**
- POST

---

**4. Какой код ответа возвращается при успешном создании ресурса (POST)?**

**201 Created**

---

**5. Какой код ответа возвращается при успешном удалении ресурса?**

**200 OK** (с телом) или **204 No Content** (без тела).

---

**6. Что такое middleware в Express? Для чего используется express.json()?**

**Middleware** — функция, выполняющаяся между получением запроса и отправкой ответа. Имеет доступ к `req`, `res` и `next`.

**`express.json()`** — middleware для парсинга JSON из тела запроса. Без него `req.body` будет пустым.

---

**7. Как получить параметры из тела POST-запроса в Express?**

Через `req.body` (после подключения `express.json()`):

```javascript
const { name, price } = req.body;
```