# Cloud & Web Deployment Guide: Mechanized Desludging Decision Support System
**SIH Problem Statement SIH-26258**

This application is designed as a unified full-stack architecture where the Python FastAPI backend serves both the calculation API endpoints (`/api/*`) and the high-performance React/Vite 3D WebGL single-page application (`dist/`).

---

## Deployment Options at a Glance

| Hosting Provider | Type | Cost | Setup Time | Best For |
|---|---|---|---|---|
| **Render.com** | Full-Stack Web Service | 100% Free | 3 minutes | **Recommended**: 24/7 live URL with custom domain |
| **Hugging Face Spaces** | Docker Web App (16GB RAM) | 100% Free | 2 minutes | High-reliability free Docker container |
| **Railway.app** | Full-Stack PaaS | Free Trial | 2 minutes | Instant GitHub import |
| **Vercel + Render** | Split Frontend/Backend | 100% Free | 5 minutes | Edge CDN frontend |
| **Localtunnel** | Instant Live Tunnel | Free | 10 seconds | **Immediate testing / live demo on mobile** |

---

## Method 1: 1-Click Deployment on Render.com (Recommended)

Render provides free cloud hosting with automatic SSL (HTTPS), continuous deployment from GitHub, and automated health checks.

### Step-by-Step Instructions:
1. **Initialize Git & Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete mechanized desludging decision support system with 3D simulation"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [https://dashboard.render.com/](https://dashboard.render.com/) and sign in with GitHub.
   - Click **"New +"** $\to$ **"Web Service"**.
   - Select your GitHub repository.
   - Configure the following settings:
     - **Name**: `mechanized-desludging-system` (or custom name)
     - **Region**: Oregon (US) or Singapore (Asia)
     - **Language**: `Docker` (or select `render.yaml` blueprint)
     - **Branch**: `main`
     - **Instance Type**: `Free`
   - Click **"Create Web Service"**.

3. **Live Website**:
   - Render will build the Docker container (compiling React Vite frontend and packaging Python FastAPI backend).
   - Once build finishes, your live website will be available at:
     `https://<your-service-name>.onrender.com`

---

## Method 2: Deploying to Hugging Face Spaces (Free Docker 16GB RAM)

Hugging Face Spaces offers completely free Docker containers with permanent HTTPS URLs.

1. Go to [https://huggingface.co/spaces](https://huggingface.co/spaces) and click **"Create new Space"**.
2. Give your space a name (e.g. `sih-desludging-simulator`).
3. Select **Space SDK**: **Docker** $\to$ **Blank**.
4. Clone the space repository locally or push your files:
   ```bash
   git remote add space https://huggingface.co/spaces/<YOUR_USERNAME>/<SPACE_NAME>
   git push space main
   ```
5. Hugging Face will automatically detect the root `Dockerfile`, build the application, and launch the website at:
   `https://<username>-<space-name>.hf.space`

---

## Method 3: Deploying with Docker (Any VPS, AWS, or DigitalOcean)

If deploying to your own cloud VM or server:
```bash
# Build the Docker image
docker build -t desludging-system:latest .

# Run the container
docker run -d -p 8000:8000 --name desludging-app desludging-system:latest
```
Access at `http://<your-server-ip>:8000`.

---

## Method 4: Instant Public URL for Testing & Hackathon Demos

To generate a live public URL from your computer right now:
```powershell
# 1. Start the unified backend & frontend server
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. In another terminal, expose to the internet via localtunnel
npx --yes localtunnel --port 8000 --subdomain sih-desludging-demo
```
This gives an instant HTTPS URL accessible worldwide: `https://sih-desludging-demo.loca.lt`.
