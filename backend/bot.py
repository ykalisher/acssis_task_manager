import os
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from flask import Flask, request, jsonify

app = None
db = None  
User = None
Task = None

class TaskBot:
    def __init__(self, flask_app=None, database=None, user_model=None, task_model=None):
        global app, db, User, Task
        
        if flask_app:
            app = flask_app
        if database:
            db = database
        if user_model:
            User = user_model
        if task_model:
            Task = task_model
            
        self.token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN not found")
        
        self.application = Application.builder().token(self.token).build()
        self.setup_handlers()
        self.initialized = False
    
    async def initialize(self):
        if not self.initialized:
            await self.application.initialize()
            self.initialized = True
    
    def setup_handlers(self):
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("link", self.link_account))
        self.application.add_handler(CommandHandler("new", self.add_task))
        self.application.add_handler(CommandHandler("tasks", self.list_tasks))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "Hi! I'm your task manager bot.\n\n"
            "First, link your account with: /link your@email.com password\n"
            "Then you can add tasks with: /new Buy groceries\n"
            "Type /help for more commands."
        )
    
    async def link_account(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if len(context.args) != 2:
            await update.message.reply_text("Usage: /link email password")
            return
        
        email, password = context.args
        telegram_id = update.effective_user.id
        
        with app.app_context():
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                user.telegram_id = telegram_id
                db.session.commit()
                await update.message.reply_text("Account linked! You can now add tasks.")
            else:
                await update.message.reply_text("Invalid email or password.")
    
    async def add_task(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        telegram_id = update.effective_user.id
        
        if not context.args:
            await update.message.reply_text("Usage: /new Your task description")
            return
        
        task_text = ' '.join(context.args)
        priority = "medium"
        
        if any(word in task_text.lower() for word in ['urgent', 'important']):
            priority = "high"
        elif any(word in task_text.lower() for word in ['later', 'someday', 'maybe']):
            priority = "low"
        
        with app.app_context():
            user = User.query.filter_by(telegram_id=telegram_id).first()
            if not user:
                await update.message.reply_text("Please link your account first: /link email password")
                return
            
            task = Task(
                title=task_text,
                user_id=user.id,
                priority=priority
            )
            db.session.add(task)
            db.session.commit()
            
            await update.message.reply_text(f"Task added: {task_text} (priority: {priority})")
    
    async def list_tasks(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        telegram_id = update.effective_user.id
        
        with app.app_context():
            user = User.query.filter_by(telegram_id=telegram_id).first()
            if not user:
                await update.message.reply_text("Please link your account first: /link email password")
                return
            
            tasks = Task.query.filter_by(user_id=user.id, completed=False).limit(100).all()
            
            if not tasks:
                await update.message.reply_text("No pending tasks!")
                return
            
            message = "Your tasks:\n\n"
            for i, task in enumerate(tasks, 1):
                priority_text = f"[{task.priority.upper()}]"
                
                task_line = f"{i}. {priority_text} <b>{task.title}</b>"
                if task.description:
                    task_line += f"\n   📝 {task.description}"
                
                if task.due_date:
                    task_line += f"\n   📅 Due: {task.due_date.strftime('%Y-%m-%d')}"
                
                message += task_line + "\n\n"
            
            await update.message.reply_text(message, parse_mode='HTML')
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        help_text = """
Commands:
/start - Start the bot
/link email password - Link your account
/new description - Add a new task
/tasks - List your pending tasks
/help - Show this help

Tips:
- Use words like 'urgent' or '!!!' for high priority
- Use words like 'later' or 'maybe' for low priority
        """
        await update.message.reply_text(help_text)
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        text = update.message.text
        telegram_id = update.effective_user.id
        
        with app.app_context():
            user = User.query.filter_by(telegram_id=telegram_id).first()
            if not user:
                await update.message.reply_text("Link your account first: /link email password")
                return
        
        if len(text) > 3 and not text.startswith('/'):
            if any(word in text.lower() for word in ['urgent', 'important']):
                priority = "high"
            elif any(word in text.lower() for word in ['later', 'someday', 'maybe']):
                priority = "low"
            else:
                priority="medium"

            task = Task(
                title=text,
                user_id=user.id,
                priority=priority
            )
            
            with app.app_context():
                db.session.add(task)
                db.session.commit()
            
            await update.message.reply_text(f"Task added: {text} (priority: {priority})")
        else:
            await update.message.reply_text("Type /help for commands")

    async def handle_webhook(self, update_data):
        try:
            await self.initialize()
            
            update = Update.de_json(update_data, self.application.bot)
            await self.application.process_update(update)
            return True
        except Exception as e:
            print(f"Error processing update: {e}")
            return False
    
    async def set_webhook(self, webhook_url):
        try:
            await self.initialize()
            
            await self.application.bot.set_webhook(url=webhook_url)
            print(f"Webhook set to: {webhook_url}")
            return True
        except Exception as e:
            print(f"Error setting webhook: {e}")
            return False
    
    async def delete_webhook(self):
        try:
            await self.initialize()
            
            await self.application.bot.delete_webhook()
            print("Webhook deleted")
            return True
        except Exception as e:
            print(f"Error deleting webhook: {e}")
            return False

bot_instance = None

def get_bot_instance(flask_app=None, database=None, user_model=None, task_model=None):
    global bot_instance
    if bot_instance is None:
        bot_instance = TaskBot(flask_app, database, user_model, task_model)
    return bot_instance    