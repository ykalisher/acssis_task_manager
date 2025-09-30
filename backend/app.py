from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
cors = CORS(app)  
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        from flask_bcrypt import generate_password_hash
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        from flask_bcrypt import check_password_hash
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def validate_email(email):
        import re
        return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email) is not None

    @staticmethod
    def validate_password(password):
        import re
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not re.search(r'[A-Za-z]', password):
            return False, "Password must contain at least one letter"
        if not re.search(r'[0-9]', password):
            return False, "Password must contain at least one number"
        return True, "Password is valid"

    def to_dict(self, include_password=False):
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_active': self.is_active
        }
        if include_password:
            user_dict['password_hash'] = self.password_hash
        return user_dict

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.String(10), default='medium', nullable=False)  # low, medium, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'user_id': self.user_id
        }

@app.route("/")
def home():
    return jsonify({
        "message": "Task Manager API",
        "version": "1.0",
        "endpoints": {
            "auth": {
                "register": "/api/auth/register",
                "login": "/api/auth/login"
            },
            "tasks": "/api/tasks"
        }
    })

@app.route("/api/auth/register", methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()  
    password = data.get('password', '')
    
    if not all([name, email, password]):
        return jsonify({'error': 'Missing fields'}), 400
    
    if not User.validate_email(email):
        return jsonify({'error': 'Invalid email'}), 400
    
    valid, msg = User.validate_password(password)
    if not valid:
        return jsonify({'error': msg}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email exists'}), 409
    
    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=str(user.id))
    return jsonify({'user': user.to_dict(), 'token': token})

@app.route("/api/auth/login", methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account disabled'}), 403
    
    token = create_access_token(identity=str(user.id))
    return jsonify({'user': user.to_dict(), 'token': token})

@app.route("/api/auth/me", methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get_or_404(current_user_id)
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/api/auth/delete-account", methods=['DELETE'])
@jwt_required()
def delete_account():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get_or_404(current_user_id)
        
        Task.query.filter_by(user_id=current_user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Account and all associated tasks deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route("/api/tasks", methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id = int(get_jwt_identity())
    completed = request.args.get('completed')
    priority = request.args.get('priority')
    
    query = Task.query
    
    query = query.filter_by(user_id=current_user_id)
    
    if completed is not None:
        completed_bool = completed.lower() == 'true'
        query = query.filter_by(completed=completed_bool)
    if priority:
        query = query.filter_by(priority=priority)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route("/api/tasks", methods=['POST'])
@jwt_required()
def create_task():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400
        
        user_id = data.get('user_id', current_user_id)
        
        if user_id != current_user_id:
            return jsonify({'error': 'You can only create tasks for yourself'}), 403
        
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            user_id=user_id
        )
        
        if 'due_date' in data and data['due_date']:
            try:
                task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid due_date format. Use ISO format.'}), 400
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify(task.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route("/api/tasks/<int:task_id>", methods=['GET'])
@jwt_required()
def get_task(task_id):
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)
    
    if task.user_id != current_user_id:
        return jsonify({'error': 'Access denied. You can only view your own tasks.'}), 403
    
    return jsonify(task.to_dict())

@app.route("/api/tasks/<int:task_id>", methods=['PUT'])
@jwt_required()
def update_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.get_or_404(task_id)
        
        if task.user_id != current_user_id:
            return jsonify({'error': 'Access denied. You can only update your own tasks.'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'completed' in data:
            task.completed = data['completed']
        if 'priority' in data:
            task.priority = data['priority']
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'error': 'Invalid due_date format. Use ISO format.'}), 400
            else:
                task.due_date = None
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(task.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route("/api/tasks/<int:task_id>", methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    try:
        current_user_id = int(get_jwt_identity())
        task = Task.query.get_or_404(task_id)
        
        if task.user_id != current_user_id:
            return jsonify({'error': 'Access denied. You can only delete your own tasks.'}), 403
        
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 401

@app.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    try:
        from bot import get_bot_instance
        from async_utils import run_async_safe
        
        bot = get_bot_instance(app, db, User, Task)
        
        update_data = request.get_json()
        
        success = run_async_safe(bot.handle_webhook(update_data))
        return jsonify({'ok': success}), 200 if success else 500
            
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': 'Webhook processing failed'}), 500

@app.route('/telegram/set-webhook', methods=['POST'])
def set_telegram_webhook():
    try:
        from bot import get_bot_instance
        from async_utils import run_async_safe
        
        webhook_url = request.json.get('webhook_url')
        if not webhook_url:
            return jsonify({'error': 'webhook_url required'}), 400
        
        bot = get_bot_instance(app, db, User, Task)
        
        success = run_async_safe(bot.set_webhook(webhook_url))
        return jsonify({'ok': success, 'webhook_url': webhook_url}), 200 if success else 500
            
    except Exception as e:
        print(f"Set webhook error: {e}")
        return jsonify({'error': 'Failed to set webhook'}), 500

@app.route('/telegram/delete-webhook', methods=['POST'])
def delete_telegram_webhook():
    """Delete the webhook (switch back to polling if needed)"""
    try:
        from bot import get_bot_instance
        from async_utils import run_async_safe
        
        bot = get_bot_instance(app, db, User, Task)
        
        success = run_async_safe(bot.delete_webhook())
        return jsonify({'ok': success}), 200 if success else 500
            
    except Exception as e:
        print(f"Delete webhook error: {e}")
        return jsonify({'error': 'Failed to delete webhook'}), 500

if __name__ == "__main__":
    if os.getenv('TELEGRAM_BOT_TOKEN'):
        from bot import get_bot_instance
        bot = get_bot_instance(app, db, User, Task)
        print("Telegram bot initialized (webhook mode)")
        print("Use /telegram/set-webhook endpoint to configure webhook URL")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
