from flask import Flask
from flask_cors import CORS
from routes import bp as routes_bp
from database import create_tables_and_populate_movies

app = Flask(__name__, static_folder='static')
CORS(app)

app.register_blueprint(routes_bp)

if __name__ == '__main__':
    create_tables_and_populate_movies()
    app.run(debug=True)
