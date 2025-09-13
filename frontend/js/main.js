import mysql.connector
import os
import bcrypt

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "1234")
DB_NAME = os.environ.get("DB_NAME", "my_app_db")

MOVIES_DATA = [
    {"title": "Inception", "year": 2010, "status": "all", "image_url": "static/images/inception.jpg", "description": "A thief who enters the dreams of others to steal their secrets."},
    {"title": "The Matrix", "year": 1999, "status": "all", "image_url": "static/images/matrix.jpg", "description": "A computer hacker learns the truth about his reality."},
    {"title": "Interstellar", "year": 2014, "status": "all", "image_url": "static/images/interstellar.jpg", "description": "A team of explorers travel through a wormhole in space."},
    {"title": "The Godfather", "year": 1972, "status": "all", "image_url": "static/images/godfather.jpg", "description": "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son."},
    {"title": "Pulp Fiction", "year": 1994, "status": "all", "image_url": "static/images/pulp_fiction.jpg", "description": "The lives of two mob hitmen, a boxer, a gangster's wife, and a pair of diner bandits intertwine."},
    {"title": "Fight Club", "year": 1999, "status": "all", "image_url": "static/images/fight_club.jpg", "description": "An insomniac office worker looking for a way to change his life crosses paths with a devil-may-care soap maker."},
    {"title": "Forrest Gump", "year": 1994, "status": "all", "image_url": "static/images/forrest_gump.jpg", "description": "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75."},
    {"title": "The Dark Knight", "year": 2008, "status": "all", "image_url": "static/images/dark_knight.jpg", "description": "When the menace known as the Joker emerges from his mysterious past, he wreaks havoc and chaos on the people of Gotham."},
    {"title": "Lord of the Rings", "year": 2001, "status": "all", "image_url": "static/images/lotr.jpg", "description": "A young hobbit named Frodo Baggins inherits a magical ring that must be destroyed."},
    {"title": "Star Wars: A New Hope", "year": 1977, "status": "all", "image_url": "static/images/star_wars.jpg", "description": "Luke Skywalker joins forces with a Jedi Knight, a cocky pilot, a Wookiee, and two droids to save the galaxy from the Empire."},
    {"title": "Parasite", "year": 2019, "status": "all", "image_url": "static/images/parasite.jpg", "description": "A poor family, the Kims, con their way into becoming the servants of a rich family."},
    {"title": "Joker", "year": 2019, "status": "all", "image_url": "static/images/joker.jpg", "description": "A failed comedian is driven insane and becomes a psychopathic killer."},
    {"title": "Spider-Man: Into the Spider-Verse", "year": 2018, "status": "all", "image_url": "static/images/spiderman.jpg", "description": "Teen Miles Morales becomes Spider-Man of his reality, and crosses paths with five counterparts from other dimensions to stop a threat to all realities."},
    {"title": "Avengers: Endgame", "year": 2019, "status": "all", "image_url": "static/images/endgame.jpg", "description": "The Avengers assemble to take on Thanos, who has wiped out half of all life in the universe."},
    {"title": "Whiplash", "year": 2014, "status": "all", "image_url": "static/images/whiplash.jpg", "description": "A young drummer enrolls at a cutthroat music conservatory and is pushed to his limits by his instructor."},
    {"title": "The Lion King", "year": 1994, "status": "all", "image_url": "static/images/lion_king.jpg", "description": "Lion cub Simba is born and grows up to become king of the jungle."},
    {"title": "Blade Runner 2049", "year": 2017, "status": "all", "image_url": "static/images/blade_runner.jpg", "description": "A young blade runner discovers a long-buried secret that has the potential to plunge what's left of society into chaos."},
    {"title": "Dune", "year": 2021, "status": "all", "image_url": "static/images/dune.jpg", "description": "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset."},
    {"title": "Tenet", "year": 2020, "status": "all", "image_url": "static/images/tenet.jpg", "description": "A secret agent is given a mission to prevent World War III through time manipulation."},
    {"title": "La La Land", "year": 2016, "status": "all", "image_url": "static/images/la_la_land.jpg", "description": "A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles."},
]

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def create_tables_and_populate_movies():
    connection = get_db_connection()
    if connection is None:
        print("Failed to create tables, database connection failed.")
        return

    cursor = connection.cursor()

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS movies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                year INT NOT NULL,
                status VARCHAR(50) NOT NULL,
                image_url TEXT,
                description TEXT
            )
        """)
        connection.commit()
        
        cursor.execute("SELECT COUNT(*) FROM movies")
        if cursor.fetchone()[0] == 0:
            print("Adding dummy movie data...")
            movies_to_insert = [(m['title'], m['year'], m['status'], m['image_url'], m['description']) for m in MOVIES_DATA]
            cursor.executemany("INSERT INTO movies (title, year, status, image_url, description) VALUES (%s, %s, %s, %s, %s)", movies_to_insert)
            connection.commit()
            
    except mysql.connector.Error as err:
        print(f"Error creating tables: {err}")
    finally:
        cursor.close()
        connection.close()

def save_new_user(username, password_hash):
    connection = get_db_connection()
    if connection is None:
        return False

    cursor = connection.cursor()
    try:
        sql = "INSERT INTO users (username, password_hash) VALUES (%s, %s)"
        val = (username, password_hash)
        cursor.execute(sql, val)
        connection.commit()
        return True
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return False
    finally:
        cursor.close()
        connection.close()
