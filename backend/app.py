from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models after db is defined
from backend.models import User

@app.route("/")
def home():
    return "Hello, Flask with SQLite + Migrations! 🚀"

if __name__ == "__main__":
    app.run(debug=True)
