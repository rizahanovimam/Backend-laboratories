from flask import Flask, jsonify, request
import time

app = Flask(__name__)

@app.before_request
def log_request():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {request.method} {request.path}")

@app.route('/')
def home():
    return 'Мой бэкенд'

@app.route('/api/students')
def get_students():
    return jsonify([
        {"id": 1, "name": "Иван Иванов", "group": "ПИЖ-6-0-25-1", "course": 1},
        {"id": 2, "name": "Петр Петров", "group": "ПИЖ-6-0-25-1", "course": 1},
        {"id": 3, "name": "Мария Сидорова", "group": "ПИЖ-6-0-25-2", "course": 1},
        {"id": 4, "name": "Алексей Смирнов", "group": "ПИЖ-6-0-25-2", "course": 1},
        {"id": 5, "name": "Елена Кузнецова", "group": "ПИЖ-6-0-25-3", "course": 1}
    ])

@app.route('/api/courses')
def get_courses():
    return jsonify({
        "courses": [
            {"id": 1, "name": "Программирование", "teacher": "Доцент Иванова"},
            {"id": 2, "name": "Базы данных", "teacher": "Профессор Смирнов"},
            {"id": 3, "name": "Веб-разработка", "teacher": "Старший преподаватель Петров"},
            {"id": 4, "name": "Алгоритмы", "teacher": "Профессор Сидоров"},
            {"id": 5, "name": "Операционные системы", "teacher": "Доцент Козлов"}
        ]
    })

@app.route('/api/students/<int:user_id>')
def get_student(user_id):
    students = [
        {"id": 1, "name": "Иван Иванов", "group": "ПИЖ-6-0-25-1", "course": 1},
        {"id": 2, "name": "Петр Петров", "group": "ПИЖ-6-0-25-1", "course": 1},
        {"id": 3, "name": "Мария Сидорова", "group": "ПИЖ-6-0-25-2", "course": 1},
        {"id": 4, "name": "Алексей Смирнов", "group": "ПИЖ-6-0-25-2", "course": 1},
        {"id": 5, "name": "Елена Кузнецова", "group": "ПИЖ-6-0-25-3", "course": 1}
    ]
    
    student = next((s for s in students if s["id"] == user_id), None)
    
    if student:
        return jsonify({
            "message": "Информация о студенте",
            "requestedId": user_id,
            "status": "success",
            "data": student
        })
    else:
        return jsonify({
            "message": "Студент не найден",
            "requestedId": user_id,
            "status": "error"
        }), 404

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found"}), 404

if __name__ == '__main__':
    app.run(port=3000, debug=True)