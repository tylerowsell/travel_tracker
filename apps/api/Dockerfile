FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=true
ENV PYTHONPATH=/app

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

CMD ["/app/entrypoint.sh"]
