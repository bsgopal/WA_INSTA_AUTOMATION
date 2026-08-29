const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.clear();
console.log('========================================================');
console.log('       RENIC AI AUTOMATION PLATFORM LAUNCHER            ');
console.log('========================================================');
console.log('');

const clientUrl = 'http://localhost:5173';
const children = [];

// Helper to kill a process tree on Windows
function cleanUp() {
  console.log('\nStopping servers...');
  for (const child of children) {
    if (child && child.pid) {
      try {
        console.log(`Killing process tree for PID ${child.pid}...`);
        execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: 'ignore' });
      } catch (err) {
        // process might already be dead
      }
    }
  }
  console.log('Cleanup finished. Goodbye!');
  process.exit(0);
}

// Register cleanUp on exit events
process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);
process.on('exit', cleanUp);

// Handle uncaught exceptions so we don't leave orphaned node processes
process.on('uncaughtException', (err) => {
  console.error('Launcher Error:', err);
  cleanUp();
});

// Step 1: Start Docker Container (WAHA)
console.log('[1/4] Starting WAHA Docker container...');
exec('docker start waha', (error, stdout, stderr) => {
  if (error) {
    console.warn('\n⚠️  WARNING: Could not start WAHA Docker container automatically.');
    console.warn('   Ensure Docker Desktop is open and running.');
    console.warn(`   Details: ${stderr.trim() || error.message.trim()}\n`);
  } else {
    console.log(`✅ WAHA Container started: ${stdout.trim() || 'waha'}`);
  }

  // Step 2: Start Backend Server
  console.log('[2/4] Starting Backend server...');
  const backendDir = path.join(__dirname, 'backend');
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  children.push(backendProcess);

  backendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[Backend] ${line.trim()}`);
    }
  });

  backendProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[Backend-Err] ${line.trim()}`);
    }
  });

  backendProcess.on('exit', (code) => {
    console.log(`[Backend] Exited with code ${code}`);
    cleanUp();
  });

  // Step 3: Start Frontend Server
  console.log('[3/4] Starting Frontend server...');
  const frontendDir = path.join(__dirname, 'frontend');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  children.push(frontendProcess);

  frontendProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[Frontend] ${line.trim()}`);
    }
  });

  frontendProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[Frontend-Err] ${line.trim()}`);
    }
  });

  frontendProcess.on('exit', (code) => {
    console.log(`[Frontend] Exited with code ${code}`);
    cleanUp();
  });

  // Step 4: Open Browser
  console.log('[4/4] Opening browser to application...');
  setTimeout(() => {
    console.log(`Opening browser to ${clientUrl}...`);
    try {
      execSync(`start ${clientUrl}`);
    } catch (err) {
      console.error('Failed to open browser automatically:', err.message);
    }
  }, 4000); // Wait 4 seconds for servers to initialize
});

// Keep launcher process alive
setInterval(() => {}, 1000);
