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