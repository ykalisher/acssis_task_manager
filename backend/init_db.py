#!/usr/bin/env python3

from app import app, db, User, Task
from datetime import datetime, timedelta
import sys

def init_db():
    with app.app_context():
        print("Creating tables...")
        db.create_all()
        
        if User.query.first():
            print("Database already has data, skipping.")
            return
        
        # Add some test users
        users = [
            {"name": "John Doe", "email": "john@example.com", "password": "password123"},
            {"name": "Jane Smith", "email": "jane@example.com", "password": "securepass456"},
            {"name": "Bob Johnson", "email": "bob@example.com", "password": "bobspassword789"}
        ]
        
        for u in users:
            user = User(name=u["name"], email=u["email"])
            user.set_password(u["password"])
            db.session.add(user)
        
        db.session.commit()
        print(f"Added {len(users)} users")
        
        # Add some sample tasks
        john = User.query.filter_by(email="john@example.com").first()
        jane = User.query.filter_by(email="jane@example.com").first()
        
        tasks = [
            Task(title="Setup project repo", description="Init git and basic structure", 
                 priority="high", user_id=john.id, due_date=datetime.now() + timedelta(days=2),status='todo'),
            Task(title="Database design", description="Create ERD and tables", 
                 priority="medium", user_id=john.id, due_date=datetime.now() + timedelta(days=5),status='todo'),
            Task(title="API docs", description="Document endpoints", 
                 priority="medium", user_id=jane.id, completed=True, 
                 due_date=datetime.now() - timedelta(days=1),status='todo'),
            Task(title="Auth system", description="User login/register", 
                 priority="high", user_id=jane.id, due_date=datetime.now() + timedelta(days=7),status='todo'),
            Task(title="Unit tests", description="Test coverage", 
                 priority="low", user_id=john.id, due_date=datetime.now() + timedelta(days=10),status='todo')
        ]
        
        for task in tasks:
            db.session.add(task)
        
        db.session.commit()
        print(f"Added {len(tasks)} tasks")
        print("Done!")

def reset_db():
    with app.app_context():
        print("Dropping tables...")
        db.drop_all()
        db.create_all()
        print("Reset complete")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        reset_db()
        init_db()
    else:
        init_db()