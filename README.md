# DiscoverDollar — MEAN Stack CRUD Application

A full-stack **CRUD application** built with the **MEAN stack** (MongoDB, Express.js, Angular 15, Node.js), fully containerized with **Docker** and automated with a **CI/CD pipeline** using **GitHub Actions**.

> **Repository**: [github.com/Nithyapatelr/discoverdollor](https://github.com/Nithyapatelr/discoverdollor)

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Nginx Configuration](#nginx-configuration)
- [Deployment to VM](#deployment-to-vm)
- [Screenshots](#screenshots)

---

## Features

- **Create, Read, Update, Delete** tutorials with title, description, and published status
- **Search** tutorials by title
- **Angular 15** frontend with Bootstrap UI
- **Node.js/Express** REST API backend
- **MongoDB** database with Mongoose ODM
- **Docker** containerization (multi-stage builds)
- **Nginx** reverse proxy with SPA routing
- **GitHub Actions** CI/CD with automated Docker Hub push and SSH deployment

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                           │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  build-and-push  │───▶│     deploy       │                   │
│  │  (CI Job)        │    │  (CD Job - SSH)  │                   │
│  └──────────────────┘    └──────────────────┘                   │
│         │                        │                              │
│    Docker Hub               Ubuntu VM                           │
│    ┌──────────┐          ┌──────────────────────────────────┐   │
│    │ backend  │          │  docker compose up -d             │   │
│    │ frontend │          │  ┌─────────┐ ┌───────┐ ┌───────┐ │   │
│    └──────────┘          │  │ MongoDB │ │Backend│ │Frontend│ │   │
│                          │  │ :27017  │ │ :8080 │ │  :80   │ │   │
│                          │  └─────────┘ └───────┘ └───────┘ │   │
│                          └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Request flow:**
```
Browser → :80 (Nginx/Frontend) → /api/* → :8080 (Backend) → MongoDB
```

---

## Project Structure

```
discoverdollor/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # GitHub Actions CI/CD pipeline
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   └── db.config.js       # MongoDB connection (env-aware)
│   │   ├── controllers/
│   │   │   └── tutorial.controller.js
│   │   ├── models/
│   │   │   ├── index.js
│   │   │   └── tutorial.model.js
│   │   └── routes/
│   │       └── turorial.routes.js
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile                 # Node 18 Alpine
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Angular components
│   │   │   ├── models/
│   │   │   └── services/
│   │   │       └── tutorial.service.ts
│   │   ├── index.html
│   │   └── styles.css
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile                 # Multi-stage: Node 18 + Nginx Alpine
│   ├── nginx.conf                 # SPA routing + API reverse proxy
│   ├── angular.json
│   ├── package.json
│   └── package-lock.json
├── screenshots/                   # Documentation screenshots
├── docker-compose.yml             # 3-service orchestration
└── README.md
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ | Backend runtime & Angular build |
| **npm** | 9+ | Package management |
| **MongoDB** | 6+ | Database (local dev) |
| **Docker** | 20+ | Containerization |
| **Docker Compose** | v2+ | Multi-container orchestration |
| **Angular CLI** | 15.x | Frontend dev server |
| **Git** | 2.x | Version control |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nithyapatelr/discoverdollor.git
cd discoverdollor
```

### 2. Start the Backend

```bash
cd backend
npm install
```

Update MongoDB connection in `app/config/db.config.js` if needed (defaults to `mongodb://localhost:27017/dd_db`).

```bash
node server.js
# Server running on http://localhost:8080
```

### 3. Start the Frontend

```bash
cd frontend
npm install
ng serve --port 8081
# App running on http://localhost:8081
```

Navigate to `http://localhost:8081/` to use the application.

---

## Docker Setup

### Dockerfiles

#### Backend Dockerfile (`backend/Dockerfile`)

Uses **Node 18 Alpine** for a lightweight image with layer-cached dependency installation:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

![Backend Dockerfile](screenshots/09-backend-dockerfile.png)

#### Frontend Dockerfile (`frontend/Dockerfile`)

**Multi-stage build**: Stage 1 builds the Angular app with Node 18, Stage 2 serves it via Nginx Alpine:

```dockerfile
# Stage 1: Build
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Stage 2: Serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/angular-15-crud /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

![Frontend Dockerfile](screenshots/10-frontend-dockerfile.png)

### Docker Compose (`docker-compose.yml`)

Orchestrates **three services**: MongoDB, Backend API, and Frontend with Nginx:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:6
    volumes:
      - mongo-data:/data/db

  backend:
    image: ${DOCKER_USERNAME}/discoverdollor-backend:latest
    build: ./backend
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/dd_db
    depends_on:
      - mongodb

  frontend:
    image: ${DOCKER_USERNAME}/discoverdollor-frontend:latest
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

![Docker Compose Configuration](screenshots/06-docker-compose.png)

### Build & Run with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# Check running containers
docker ps

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

---

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and triggers on every push to the `main` branch.

### Pipeline Architecture

```
Push to main
     │
     ▼
┌─────────────────────────────────────────┐
│          CI: build-and-push             │
│  1. Checkout code                       │
│  2. Login to Docker Hub                 │
│  3. Build & push backend image          │
│  4. Build & push frontend image         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            CD: deploy                   │
│  1. Checkout code                       │
│  2. SCP docker-compose.yml to VM        │
│  3. SSH into VM:                        │
│     - docker login                      │
│     - docker compose pull               │
│     - docker compose up -d              │
│     - docker image prune                │
└─────────────────────────────────────────┘
```

### CI Job — Build & Push Docker Images

The CI job runs on `ubuntu-latest` and uses:
- **`docker/login-action@v3`** to authenticate with Docker Hub
- **`docker/build-push-action@v5`** to build and push both images

Images are pushed as:
- `<DOCKER_USERNAME>/discoverdollor-backend:latest`
- `<DOCKER_USERNAME>/discoverdollor-frontend:latest`

### CD Job — Deploy via SSH

The CD job uses:
- **`appleboy/scp-action@v0.1.7`** to copy `docker-compose.yml` to the VM
- **`appleboy/ssh-action@v1.0.3`** to SSH into the VM and run deployment commands

### CI/CD Workflow File

![CI/CD Workflow Configuration](screenshots/07-cicd-workflow.png)

---

## GitHub Secrets Configuration

The pipeline requires **5 secrets** configured in the repository settings under **Settings → Secrets and variables → Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `nithyapatelr` |
| `DOCKER_PASSWORD` | Docker Hub Personal Access Token | `dckr_pat_xxx...` |
| `VM_HOST` | Public IP or hostname of the Ubuntu VM | `203.0.113.50` |
| `VM_USER` | SSH username on the VM | `ubuntu` |
| `VM_SSH_KEY` | Private SSH key (PEM format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

### How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value from the table above

---

## Nginx Configuration

The Nginx configuration (`frontend/nginx.conf`) serves two purposes:

### 1. SPA Routing
Routes all non-file requests to `index.html` for Angular client-side routing:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 2. API Reverse Proxy
Forwards all `/api/` requests to the backend container:

```nginx
location /api/ {
    proxy_pass         http://backend:8080/api/;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

This eliminates CORS issues and allows the Angular app to use relative URLs (`/api/tutorials` instead of `http://localhost:8080/api/tutorials`).

![Nginx Configuration](screenshots/08-nginx-config.png)

---

## Deployment to VM

### VM Prerequisites

Ensure your Ubuntu VM has:
- **Docker** installed (`docker --version`)
- **Docker Compose v2** installed (`docker compose version`)
- **SSH access** enabled (port 22 open)
- Your SSH public key added to `~/.ssh/authorized_keys`

### Deployment Flow

1. **Push to `main`** → GitHub Actions triggers
2. **CI builds** both Docker images and pushes to Docker Hub
3. **CD SSHes** into the VM and runs:
   ```bash
   docker compose pull          # Pull latest images
   docker compose up -d --force-recreate  # Deploy
   docker image prune -f        # Cleanup
   ```
4. App is accessible at `http://<VM_HOST>:80`

### Manual Deployment (if needed)

```bash
# SSH into your VM
ssh <VM_USER>@<VM_HOST>

# Navigate to project directory
cd ~/discoverdollor

# Login to Docker Hub
docker login

# Pull and deploy
docker compose pull
docker compose up -d --force-recreate
```

---

## Screenshots

### Repository Structure
Shows the complete project files pushed to the GitHub repository.

![Repository File Structure](screenshots/01-repo-structure.png)

### CI/CD Pipeline — Execution
The GitHub Actions pipeline running with both jobs (**build-and-push** and **deploy**) completing successfully.

![CI/CD Pipeline Success](screenshots/03-pipeline-success.png)

### Docker Image Build & Push
Detailed steps of the **build-and-push** job showing Docker Hub login, backend image build (28s), and frontend image build (1m 21s).

![Build and Push Job Steps](screenshots/04-build-push-steps.png)

### Application Deployment
Detailed steps of the **deploy** job showing SCP file transfer and SSH deployment to the VM.

![Deploy Job Steps](screenshots/05-deploy-steps.png)

### Docker Compose Configuration
The `docker-compose.yml` defining MongoDB, backend, and frontend service orchestration.

![Docker Compose File](screenshots/06-docker-compose.png)

### Nginx Setup & Infrastructure
Nginx configuration for Angular SPA routing and API reverse proxy to the backend container.

![Nginx Configuration](screenshots/08-nginx-config.png)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tutorials` | Retrieve all tutorials |
| `GET` | `/api/tutorials/:id` | Get a single tutorial |
| `POST` | `/api/tutorials` | Create a new tutorial |
| `PUT` | `/api/tutorials/:id` | Update a tutorial |
| `DELETE` | `/api/tutorials/:id` | Delete a tutorial |
| `DELETE` | `/api/tutorials` | Delete all tutorials |
| `GET` | `/api/tutorials?title=` | Search tutorials by title |

---

## Environment Variables

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `MONGODB_URI` | Backend | `mongodb://localhost:27017/dd_db` | MongoDB connection string |
| `PORT` | Backend | `8080` | Backend server port |
| `DOCKER_USERNAME` | Compose | `local` | Docker Hub username for image names |

---

## License

ISC
