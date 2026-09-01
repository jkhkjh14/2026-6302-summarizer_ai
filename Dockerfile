FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Правильные инструкции
EXPOSE 8080
ENV PORT=8080
ENV HOST=0.0.0.0

# Команда запуска
CMD gunicorn -w 4 -b 0.0.0.0:$PORT app:app