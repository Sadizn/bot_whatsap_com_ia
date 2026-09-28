const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
const SERVER_URL = 'http://localhost:3000';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Edith - Centro de Controlo Desktop',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Tentar conectar ao servidor Express do Gateway
  loadServerUrlWithRetry(SERVER_URL, 15);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function loadServerUrlWithRetry(url, maxRetries = 15, currentRetry = 0) {
  if (!mainWindow) return;

  http.get(url, (res) => {
    if (mainWindow) {
      mainWindow.loadURL(url);
    }
  }).on('error', () => {
    if (currentRetry < maxRetries) {
      setTimeout(() => {
        loadServerUrlWithRetry(url, maxRetries, currentRetry + 1);
      }, 1000);
    } else {
      if (mainWindow) {
        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
          <html>
            <body style="background:#0f172a; color:#f8fafc; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
              <h2>Aguardando inicialização do servidor da Edith...</h2>
              <p style="color:#94a3b8;">Inicie o backend com <code>npm start</code> ou <code>npm run dev</code>.</p>
              <button onclick="location.reload()" style="padding:10px 20px; background:#6366f1; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:bold; margin-top:16px;">Tentar Novamente</button>
            </body>
          </html>
        `)}`);
      }
    }
  });
}

// IPC Handlers para controle de janela
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
