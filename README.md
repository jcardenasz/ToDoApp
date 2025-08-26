# TodoApp

A small full-stack Todo application used for CI/CD practice. Every service should have its own container (nginx proxy server, todo-app, mysql server):
- **Backend**: Node.js + Express
- **Persistence**: MySQL (default)
- **Frontend**: Static HTML/CSS/JS served via Nginx
- **Containerization**: Docker + Docker Compose
- **Reverse proxy**: Nginx (container)
- **Target runtime**: Vagrant VM with Docker installed

---

## Quick start (with Docker Compose)

> Run these commands **inside your Vagrant VM** (where Docker is installed).

# 1) Clone and enter the project
```
git clone https://github.com/jcardenasz/ToDoApp.git
cd ToDoApp
```
# 2) Bring up the full stack (db + app + nginx)
```
docker compose up -d --build
```

# 3) Open the app
```
curl http://localhost:8080
```

## Project structure
.
├─ src/
│  ├─ index.js               # Express app: routes + static files + bootstrap
│  ├─ routes/                # /items CRUD handlers
│  ├─ persistence/           # mysql.js and sqlite.js implementations
│  └─ static/                # index.html, css/, js/ (frontend)
├─ spec/                     # minimal tests regarding
├─ Dockerfile                # app image definition
├─ docker-compose.yml        # db + app + nginx
├─ nginx.conf                # reverse proxy config (proxies to app:3000)
├─ package.json / yarn.lock
└─ README.md

## Nginx server config
```
server {
    listen 80;
    server_name _;

    # Proxy all requests to the Node app container
    location / {
        proxy_pass         http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}
```

## Acknowledgments

This repo is a fork used for educational CI/CD practice and containerization exercises. Original structure and idea credits to the upstream project and contributors. ChatGPT5 was used in the development of this project.