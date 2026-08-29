const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const http = require('http');

let mainWindow;
let splashWindow;
let backendProcess;
let ngrokProcess;
const children = [];
let activeNgrokUrl = null;
let backendPort = 5000;

// Setup file logging
const logDir = app.getPath('userData');
const logPath = path.join(logDir, 'launcher.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch (e) {
    // ignore logging failure
  }
  console.log(msg);
}

function checkServerReady(port, callback) {
  const client = new net.Socket();
  client.connect({ port: port, host: '127.0.0.1' }, () => {
    client.end();
    callback(true);
  });
  client.on('error', () => {
    client.destroy();
    callback(false);
  });
}

// Find a free port for the backend. If the default port is already taken
// (e.g. another instance of the app is running), pick the next free one so
// multiple instances can run side by side without interfering.
function findFreePort(startPort, callback) {
  const probe = (port) => {
    if (port > startPort + 20) {
      callback(startPort);
      return;
    }
    const server = net.createServer();
    server.once('error', () => {
      server.close(() => probe(port + 1));
    });
    server.listen({ port: port, host: '127.0.0.1' }, () => {
      server.close(() => callback(port));
    });
  };
  probe(startPort);
}

function startWahaContainer(callback) {
  log('Checking WAHA Docker container...');
  exec('docker start waha', (err, stdout, stderr) => {
    if (err) {
      log('WAHA container not found or stopped. Attempting to create and run devlikeapro/waha...');
      exec('docker run -d -p 3000:3000 --name waha --restart always devlikeapro/waha', (runErr, runStdout, runStderr) => {
        if (runErr) {
          log(`❌ Failed to start WAHA in Docker: ${runErr.message}`);
          log(`Docker stderr: ${runStderr}`);
        } else {
          log(`✅ WAHA Docker container created and started: ${runStdout.trim()}`);
        }
        callback();
      });
    } else {
      log(`✅ WAHA Docker container started successfully: ${stdout.trim() || 'waha'}`);
      callback();
    }
  });
}

function startDockerServices(callback) {
  log('Checking MongoDB Docker container...');
  exec('docker start mongodb', (err, stdout, stderr) => {
    if (err) {
      log('MongoDB container not found or stopped. Attempting to create and run mongo:latest...');
      exec('docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest', (runErr, runStdout, runStderr) => {
        if (runErr) {
          log(`❌ Failed to start MongoDB in Docker: ${runErr.message}`);
          log(`Docker stderr: ${runStderr}`);
        } else {
          log(`✅ MongoDB Docker container created and started: ${runStdout.trim()}`);
        }
        startWahaContainer(callback);
      });
    } else {
      log(`✅ MongoDB Docker container started successfully: ${stdout.trim() || 'mongodb'}`);
      startWahaContainer(callback);
    }
  });
}

function startBackend() {
  log('Starting launcher process...');
  log(`App Packaged status: ${app.isPackaged}`);
  log(`User Data Path: ${logDir}`);

  // Guard against duplicate backend instances
  if (backendProcess && backendProcess.exitCode === null) {
    log('Backend already running. Skipping duplicate start.');
    return;
  }

  // Resolve backend server path (packaged vs dev)
  let backendPath;
  let workingDir;

  if (app.isPackaged) {
    backendPath = path.join(process.resourcesPath, 'backend', 'server.js');
    workingDir = path.join(process.resourcesPath, 'backend');
  } else {
    backendPath = path.join(__dirname, '..', 'backend', 'server.js');
    workingDir = path.join(__dirname, '..', 'backend');
  }

  log(`Backend Script Path: ${backendPath}`);
  log(`Backend Working Directory: ${workingDir}`);

  // Check if file exists
  if (!fs.existsSync(backendPath)) {
    log(`❌ ERROR: Backend server file does not exist at ${backendPath}`);
    return;
  }

  // Spawn backend server using Electron node runtime if packaged
  const env = { ...process.env, PORT: String(backendPort) };
  log(`Backend will listen on port ${backendPort}`);
  if (app.isPackaged) {
    env.ELECTRON_RUN_AS_NODE = '1';
    log(`Spawning backend using Electron Node runtime... (shell: false)`);
    backendProcess = spawn(process.execPath, [backendPath], {
      cwd: workingDir,
      shell: false,
      env: env
    });
  } else {
    log(`Spawning backend using system Node...`);
    backendProcess = spawn('node', [backendPath], {
      cwd: workingDir,
      shell: true,
      env: env
    });
  }

  children.push(backendProcess);

  backendProcess.stdout.on('data', (data) => {
    log(`[Backend-Out] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    log(`[Backend-Err] ${data.toString().trim()}`);
  });

  backendProcess.on('error', (err) => {
    log(`❌ Backend process spawn error: ${err.message}`);
  });

  backendProcess.on('exit', (code) => {
    log(`Backend process exited with code ${code}. Restarting backend in 3s...`);
    // Auto-restart the backend so the server never stays down
    setTimeout(() => {
      if (!app.isQuitting) {
        startBackend();
      }
    }, 3000);
  });
}

function createSplashWindow() {
  log('Creating splash window...');
  splashWindow = new BrowserWindow({
    width: 460,
    height: 360,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashHTML = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3a8a, #0f172a);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
            border-radius: 16px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
            background: linear-gradient(to right, #60a5fa, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .subtitle {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 35px;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid rgba(255,255,255,0.08);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .status {
            margin-top: 24px;
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="title">RENIC AUTOMATION</div>
        <div class="subtitle">Starting backend services & Docker engines...</div>
        <div class="spinner"></div>
        <div class="status">Please wait a moment</div>
      </body>
    </html>
  `;
  
  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
}

function createMainWindow() {
  log('Creating main browser window...');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Renic Automation",
    show: false, // Don't show the window until it is ready-to-show
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: [`--renic-api-port=${backendPort}`]
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    log('Loading dev server URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const htmlPath = path.join(__dirname, 'dist', 'index.html');
    log(`Loading production HTML file: ${htmlPath}`);
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(0.9);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    log('Browser window closed.');
    mainWindow = null;
  });
}

app.on('ready', () => {
  createSplashWindow();

  // Start Docker database and WAHA container first
  startDockerServices(() => {
    // Reserve a free port for this instance (avoids clashing with an
    // already-running copy of the app on the default port)
    findFreePort(5000, (freePort) => {
      backendPort = freePort;
      log(`Selected backend port: ${backendPort}`);

      // Start backend server
      startBackend();

      // Start polling to wait for backend port to be open
      let attempts = 0;
      let windowOpened = false;
      function pollServer() {
        checkServerReady(backendPort, (ready) => {
          if (ready) {
            log(`✅ Backend server port ${backendPort} is open. Opening main window...`);
            if (!windowOpened) {
              windowOpened = true;
              createMainWindow();
              if (splashWindow) {
                try {
                  splashWindow.close();
                } catch(e) {}
              }
            }
          } else {
            attempts++;
            if (attempts >= 60 && !windowOpened) { // After 30s show window anyway, keep polling in background
              log('⚠️ Backend server slow to respond. Opening window anyway, still waiting for backend...');
              windowOpened = true;
              createMainWindow();
              if (splashWindow) {
                try {
                  splashWindow.close();
                } catch(e) {}
              }
            }
            setTimeout(pollServer, 500);
          }
        });
      }

      // Delay the first check slightly to let processes spin up
      setTimeout(pollServer, 800);
    });
  });
});

function cleanUp() {
  app.isQuitting = true;
  log('Cleaning up child processes...');
  for (const child of children) {
    if (child && child.pid) {
      try {
        log(`Killing child PID ${child.pid}...`);
        execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: 'ignore' });
      } catch (err) {
        log(`Taskkill warn for PID ${child.pid}: ${err.message}`);
      }
    }
  }
}

app.on('window-all-closed', () => {
  cleanUp();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
