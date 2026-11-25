const { app, BrowserWindow, Menu, dialog, ipcMain, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow = null;
let audienceWindow = null;

const isDev = process.env.ELECTRON_DEV === '1';
const DEV_SERVER_URL = 'http://localhost:3000';

function attachExternalLinkHandlers(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const isLocalDev = isDev && url.startsWith(DEV_SERVER_URL);
    const isLocalFile = url.startsWith('file://');
    if (!isLocalDev && !isLocalFile && /^https?:\/\//i.test(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: '#0f172a',
    title: 'SlideMotion Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  attachExternalLinkHandlers(mainWindow);

  if (isDev) {
    mainWindow.loadURL(`${DEV_SERVER_URL}/#/designer`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/designer',
    });
  }

  mainWindow.on('closed', () => {
    if (audienceWindow && !audienceWindow.isDestroyed()) {
      audienceWindow.close();
    }
    mainWindow = null;
  });

  buildAppMenu();
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Project…',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('slidemotion:menu-action', 'open');
          },
        },
        {
          label: 'Save Project As…',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('slidemotion:menu-action', 'save');
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Present',
      submenu: [
        {
          label: 'Start Presenter Mode',
          accelerator: 'F5',
          click: () => {
            mainWindow?.webContents.send('slidemotion:menu-action', 'present');
          },
        },
        {
          label: 'Rehearse Timings',
          accelerator: 'Shift+F5',
          click: () => {
            mainWindow?.webContents.send('slidemotion:menu-action', 'rehearse');
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('slidemotion:open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open SlideMotion Project',
    filters: [{ name: 'SlideMotion Project', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('slidemotion:save-file', async (_event, { suggestedName, content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save SlideMotion Project',
    defaultPath: suggestedName || 'presentation.slidemotion.json',
    filters: [{ name: 'SlideMotion Project', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return false;
  await fs.promises.writeFile(result.filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('slidemotion:list-displays', () => {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().map((d, idx) => ({
    id: d.id,
    label:
      d.id === primary.id
        ? `Primary Monitor (${d.size.width}×${d.size.height})`
        : `External Monitor ${idx + 1} (${d.size.width}×${d.size.height})`,
    width: d.size.width,
    height: d.size.height,
    isPrimary: d.id === primary.id,
  }));
});

ipcMain.handle('slidemotion:open-presenter-display', (_event, initialPayload) => {
  const primary = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  const target = displays.find((d) => d.id !== primary.id) || primary;

  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.focus();
    audienceWindow.webContents.send('slidemotion:audience-sync', initialPayload);
    return { opened: true, external: target.id !== primary.id };
  }

  audienceWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    title: 'SlideMotion Audience Display',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  attachExternalLinkHandlers(audienceWindow);

  if (isDev) {
    audienceWindow.loadURL(`${DEV_SERVER_URL}/#/audience`);
  } else {
    audienceWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/audience',
    });
  }

  audienceWindow.webContents.once('did-finish-load', () => {
    if (audienceWindow && !audienceWindow.isDestroyed()) {
      audienceWindow.webContents.send('slidemotion:audience-sync', initialPayload);
    }
  });

  audienceWindow.on('closed', () => {
    audienceWindow = null;
    mainWindow?.webContents.send('slidemotion:audience-closed');
  });

  return { opened: true, external: target.id !== primary.id };
});

ipcMain.on('slidemotion:sync-audience', (_event, payload) => {
  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.webContents.send('slidemotion:audience-sync', payload);
  }
});

ipcMain.handle('slidemotion:close-presenter-display', () => {
  if (audienceWindow && !audienceWindow.isDestroyed()) {
    audienceWindow.close();
    audienceWindow = null;
  }
  return true;
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
