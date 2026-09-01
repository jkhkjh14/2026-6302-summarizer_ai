FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# shell-форма — переменная PORT подставится
gunicorn -w 4 -b 0.0.0.0:$PORT app:app