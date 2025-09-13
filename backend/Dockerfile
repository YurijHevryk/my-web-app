# Використовуємо офіційний образ Python
FROM python:3.10-slim

# Встановлюємо робочу директорію в контейнері
WORKDIR /app

# Копіюємо requirements.txt і встановлюємо залежності
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код вашого застосунку
COPY . .

# Команда для запуску застосунку за допомогою Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]