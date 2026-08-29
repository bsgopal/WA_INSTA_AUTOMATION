const { contextBridge } = require('electron');

const portArg = process.argv.find((a) => a.startsWith('--renic-api-port='));
const apiPort = portArg ? Number(portArg.split('=')[1]) : 5000;

contextBridge.exposeInMainWorld('renicAPI', {
  apiBase: `http://localhost:${apiPort}/api`,
  apiOrigin: `http://localhost:${apiPort}`,
  apiPort: apiPort
});
