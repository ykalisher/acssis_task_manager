# Task Manager Backend API

Simple REST API for task manager.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user and get access token
- `GET /api/auth/me` - Get current user info (requires authentication)
- `DELETE /api/auth/delete-account` - Delete account and all user's tasks (requires authentication)

### Tasks (All require authentication)

- `GET /api/tasks` - Get current user's tasks (supports filtering)
- `POST /api/tasks` - Create a new task for current user
- `GET /api/tasks/<id>` - Get a specific task (if owned by current user)
- `PUT /api/tasks/<id>` - Update a specific task (if owned by current user)
- `DELETE /api/tasks/<id>` - Delete a specific task (if owned by current user)

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
DATABASE_URL=sqlite:///taskmanager.db
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

### 3. Initialize Database

```bash
python init_db.py
```

This will create the database and add sample users and tasks for testing.

### 4. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5001`

## API Usage Examples

### User Registration

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### User Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Get Current User (Protected)

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Delete Account (Protected)

```bash
curl -X DELETE http://localhost:5001/api/auth/delete-account \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create a Task (Protected)

```bash
curl -X POST http://localhost:5001/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the task manager",
    "priority": "high",
    "due_date": "2025-10-01T12:00:00Z"
  }'
```

### Get Your Tasks (Protected)

```bash
curl -X GET http://localhost:5001/api/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter Your Tasks (Protected)

```bash
# Get completed tasks
curl -X GET "http://localhost:5001/api/tasks?completed=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get high priority tasks
curl -X GET "http://localhost:5001/api/tasks?priority=high" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update a Task (Protected)

```bash
curl -X PUT http://localhost:5001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "completed": true
  }'
```

## Data Models

### Task Model Structure

```json
{
  "id": 1,
  "title": "Task title",
  "description": "Task description",
  "completed": false,
  "priority": "medium",
  "created_at": "2025-09-24T10:00:00",
  "updated_at": "2025-09-24T10:00:00",
  "due_date": "2025-10-01T12:00:00",
  "user_id": 1
}
```

### User Model Structure

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2025-09-24T10:00:00",
  "is_active": true
}
```

## Development Notes

- Database file created as `taskmanager.db` in the backend directory
- All datetime fields use ISO format
- Priority levels: "low", "medium", "high"