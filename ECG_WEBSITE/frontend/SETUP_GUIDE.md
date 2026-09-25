# Frontend Setup & Deployment Guide

This guide explains step-by-step how to set up and run the **CardioSense AI** frontend application on any new or secondary PC (Windows, macOS, or Linux).

---

## 1. Prerequisites

Before starting, ensure the new PC has **Node.js** installed:

| Requirement | Minimum Version | Recommended Version |
|-------------|-----------------|---------------------|
| **Node.js** | `v18.0.0+`      | `v20.x` or `v22.x` (LTS) |
| **npm**     | `9.x+`          | `10.x+` (bundled with Node.js) |
| **Browser** | Modern browser  | Google Chrome, Brave, Edge, Firefox |

### How to Check if Node.js is Installed
Open your terminal (PowerShell, Command Prompt, or Bash) and run:
```bash
node -v
npm -v
```
If not installed, download the **LTS installer** from [nodejs.org](https://nodejs.org/).

---

## 2. Quickstart (New PC Setup)

### Step 1: Open the Project Directory
Copy or clone the repository to the new machine, then open your terminal in the frontend directory:
```bash
cd ECG_WEBSITE/frontend
```

### Step 2: Install Dependencies
Install all required React and Vite packages:
```bash
npm install
```
*(This creates the local `node_modules/` folder with React 18, React DOM, and Vite.)*

### Step 3: Launch the Development Server
```bash
npm run dev
```
You will see output similar to:
```text
  VITE v5.4.21  ready in 240 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 4: Open in Your Web Browser
Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 3. Running Standalone vs. Connected to Backend

The frontend is engineered with an **offline-first fallback architecture**:

- **Standalone Mode (Client Mode)**:
  - If the FastAPI backend is **not** running, the frontend automatically operates in standalone mode.
  - Realistic 12-lead ECG signals, patient records, and model inferences are synthesized locally in the browser.
  - No database or Python environment required to demo or review the UI!

- **Connected Mode (API :8000 Live)**:
  - When the FastAPI backend is running on `http://127.0.0.1:8000`, the navbar status dot will turn **Green** (`API :8000 LIVE`).
  - The frontend will dynamically fetch data from the REST API endpoints.

---

## 4. Accessing from Another Device on the Same Wi-Fi / LAN

If you want to view the web app from another computer, tablet, or phone on the same local network:

1. Run the dev server with the `--host` flag:
   ```bash
   npm run dev -- --host
   ```
2. Terminal will display your network IP:
   ```text
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.1.45:3000/
   ```
3. Open `http://<YOUR_IP>:3000` on your phone or other device.

---

## 5. Production Build & Preview

To test the optimized production bundle or verify compilation:

1. **Build the production assets**:
   ```bash
   npm run build
   ```
   *(Compiled HTML, CSS, and JS output will be placed in `dist/`.)*

2. **Preview the production build locally**:
   ```bash
   npm run preview
   ```
   *(Spins up a lightweight local server serving the optimized `dist/` bundle.)*

---

## 6. Troubleshooting Common Issues

### Issue 1: PowerShell Execution Policy Error (Windows)
**Error:** `File ... npm.ps1 cannot be loaded because running scripts is disabled on this system.`  
**Fix:** Run PowerShell as Administrator (or in current session) and run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Issue 2: Port 3000 is Already in Use
**Error:** Port 3000 is occupied by another process.  
**Fix:** Vite will automatically suggest port 3001, or you can edit [vite.config.js](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/vite.config.js):
```javascript
server: {
  port: 3001, // change to any available port
  open: false
}
```

### Issue 3: Stale Cache or Node Module Conflicts
If you encounter weird bundling issues on a new PC, reset cache and reinstall:
```bash
# On Windows (PowerShell):
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install

# On macOS/Linux:
rm -rf node_modules package-lock.json
npm install
```

---

## 7. Project File Reference

| File | Purpose |
|------|---------|
| [package.json](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/package.json) | NPM scripts & dependencies (React 18, Vite) |
| [vite.config.js](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/vite.config.js) | Vite dev server configuration (Port 3000) |
| [src/App.jsx](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/App.jsx) | Root routing & backend status polling |
| [src/index.css](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/index.css) | Medical design system & layout styling |
| [src/pages/HomePage.jsx](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/pages/HomePage.jsx) | Clinical landing page & rhythm sweep canvas |
| [src/pages/DashboardPage.jsx](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/pages/DashboardPage.jsx) | Single Page Application: Patient database & 12-lead detection studio |
| [src/pages/RealtimePage.jsx](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/pages/RealtimePage.jsx) | Real-time oscilloscope & 4.5s rolling buffer monitor |
| [src/services/api.js](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/services/api.js) | Backend HTTP client with automatic fallback |
| [src/data/mockPatients.js](file:///d:/Codes/Projects/ECG_Detection/ECG_WEBSITE/frontend/src/data/mockPatients.js) | PTB-XL schema clinical data & 12-lead signal generator |
