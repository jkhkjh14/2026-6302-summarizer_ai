# Используем официальный образ Python 3.11
FROM python:3.11-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл с зависимостями и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код проекта
COPY . .

# Платформа RelaxDev сама подставит нужный порт через переменную PORT
# Используем Gunicorn для продакшена
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:$PORT", "app:app"]