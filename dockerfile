FROM node:20-bullseye

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend setup
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

# Copy everything
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app

# Install frontend dependencies
RUN cd frontend && npm install

EXPOSE 3000 5000
ENTRYPOINT ["/app/backend/init.sh"]
# Start both servers
CMD bash -c "cd backend && FLASK_APP=app.py FLASK_RUN_HOST=0.0.0.0 flask run --reload & cd frontend && npm run dev"
