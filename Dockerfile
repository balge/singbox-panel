# Stage 1: build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
COPY frontend/ ./
RUN npm run build

# Stage 2: runtime
FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn python-jose[cryptography] passlib[bcrypt] python-multipart httpx pydantic pydantic-settings
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/static
ENV PYTHONPATH=/app
ENV STATIC_DIR=/app/static
ENV PANELS_DIR=/panels
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
