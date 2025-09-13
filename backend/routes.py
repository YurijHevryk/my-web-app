from flask import Blueprint, request, jsonify, Response
import bcrypt
import json
import mysql.connector
from database import get_db_connection

# Створюємо Blueprint для наших маршрутів
bp = Blueprint('api', __name__, url_prefix='/api')


def create_json_response(data, status_code):
    response = Response(
        response=json.dumps(data, ensure_ascii=False),
        status=status_code,
        mimetype="application/json"
    )
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


@bp.route('/register', methods=['POST'])
def register():
    if not request.is_json:
        return create_json_response({"error": "Request must be in JSON format"}, 400)

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return create_json_response({'error': "Username and password are required"}, 400)

    connection = get_db_connection()
    if connection is None:
        return create_json_response({'error': "Database connection failed"}, 500)

    cursor = connection.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return create_json_response({'error': "Username already exists"}, 400)

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        sql = "INSERT INTO users (username, password_hash) VALUES (%s, %s)"
        val = (username, hashed_password)
        cursor.execute(sql, val)
        connection.commit()
    except mysql.connector.Error as err:
        return create_json_response({'error': f"Database error: {err}"}, 500)
    finally:
        cursor.close()
        connection.close()

    return create_json_response({'message': 'Registration successful'}, 200)


@bp.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return create_json_response({"error": "Request must be in JSON format"}, 400)

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return create_json_response({'error': "Username and password are required"}, 400)

    connection = get_db_connection()
    if connection is None:
        return create_json_response({'error': "Database connection failed"}, 500)

    cursor = connection.cursor()

    try:
        cursor.execute("SELECT password_hash FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()

        if result:
            stored_password_hash = result[0].encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), stored_password_hash):
                return create_json_response({'message': "Login successful"}, 200)
            else:
                return create_json_response({'error': "Invalid credentials"}, 401)
        else:
            return create_json_response({'error': "Invalid credentials"}, 401)
    except mysql.connector.Error as err:
        return create_json_response({'error': f"Database error: {err}"}, 500)
    finally:
        cursor.close()
        connection.close()

    return create_json_response({'message': 'Login successful'}, 200)


@bp.route('/movies', methods=['GET'])
def get_movies():
    connection = get_db_connection()
    if connection is None:
        return create_json_response({'error': "Database connection failed"}, 500)

    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM movies")
        movies = cursor.fetchall()
    except mysql.connector.Error as err:
        return create_json_response({'error': f"Database error: {err}"}, 500)
    finally:
        cursor.close()
        connection.close()

    return create_json_response(movies, 200)


@bp.route('/movies/status', methods=['POST'])
def update_movie_status():
    if not request.is_json:
        return create_json_response({"error": "Request must be in JSON format"}, 400)

    data = request.get_json()
    movie_id = data.get('id')
    new_status = data.get('status')

    if not movie_id or not new_status:
        return create_json_response({'error': "Movie ID and status are required"}, 400)

    connection = get_db_connection()
    if connection is None:
        return create_json_response({'error': "Database connection failed"}, 500)

    cursor = connection.cursor()
    try:
        sql = "UPDATE movies SET status = %s WHERE id = %s"
        val = (new_status, movie_id)
        cursor.execute(sql, val)
        connection.commit()
    except mysql.connector.Error as err:
        return create_json_response({'error': f"Database error: {err}"}, 500)
    finally:
        cursor.close()
        connection.close()

    return create_json_response({'message': 'Movie status updated successfully'}, 200)