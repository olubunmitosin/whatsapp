// Modules to control application life and create native browser window
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, Menu, MenuItem, Tray, shell, ipcMain, screen, systemPreferences, nativeImage, session, Notification } = require('electron');
const Store = require('electron-store');
const Constants = require('./app/constants');
const electronLocalShortcut = require('electron-localshortcut');

// Storage store and key identifier
const storage = new Store();

const darkCss = fs.readFileSync(path.join(__dirname, 'css', 'dark.css'), 'utf8');

// App state
let themeData;
let mainWindow;
let sysTray;
let isQuitting = false;
let unreadCount = 0;
let darkCssKey = null;

function createWindow() {
  const { url, appIcon } = Constants;
  const state = getWindowState();

  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    icon: appIcon,
    show: false,
    backgroundColor: '#111b21',
    webPreferences: {
      spellcheck: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'app', 'preload.js'),
      // Intentionally enabled: some WhatsApp Web media features require it.
      allowRunningInsecureContent: true,
      plugins: true,
    }
  });

  if (state.maximized) win.maximize();

  // Development: win.webContents.openDevTools();

  if (process.platform === 'darwin') {
    systemPreferences.askForMediaAccess('microphone').then(() => {});
    systemPreferences.askForMediaAccess('camera').then(() => {});
  }

  electronLocalShortcut.register(win, 'Ctrl+F', () => setFullScreen(win));
  electronLocalShortcut.register(win, 'Esc', () => win.setFullScreen(false));

  loadMenu(win);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let userAgent;
    if (process.platform === 'darwin') {
      userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    } else if (process.platform === 'win32') {
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    } else {
      userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
    }
    callback({ cancel: false, requestHeaders: { ...details.requestHeaders, 'User-Agent': userAgent } });
  });

  // Allow only mic/camera, screen sharing and persistent storage (needed for
  // calls and local caching); deny everything else.
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'display-capture' || permission === 'persistent-storage');
  });

  win.loadURL(url);

  win.on('focus', () => {
    if (unreadCount > 0) {
      unreadCount = 0;
      setTrayIcon();
      setBadge(0);
    }
  });

  win.webContents.on('did-finish-load', () => {
    themeData = storage.get(Constants.storageKey + 'theme');
    if (themeData === 'dark') {
      setTimeout(() => setDarkTheme(win, true), 1000);
    }
  });

  // Spell check + search selection in one context menu
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion)
        }));
      }
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: 'Add to dictionary',
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    const selection = (params.selectionText || '').trim();
    if (selection) {
      menu.append(new MenuItem({
        label: `Search Google for “${selection}”`,
        click: () => shell.openExternal(`https://google.com/search?q=${encodeURIComponent(selection)}`)
      }));
    }

    if (menu.items.length > 0) {
      menu.popup({ window: win });
    }
  });

  // Open external links in the system browser instead of app windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    let external = true;
    try {
      external = new URL(url).hostname !== 'web.whatsapp.com';
    } catch (error) {
      external = true;
    }
    if (external) {
      event.preventDefault();
      if (/^https?:/i.test(url)) {
        shell.openExternal(url);
      }
    }
  });

  win.on('close', (e) => {
    saveWindowState(win);
    // Only hide-to-tray when a tray is actually available; otherwise close
    // normally so the app never becomes invisible and unreachable.
    if (!isQuitting && sysTray) {
      e.preventDefault();
      win.hide();
    }
  });

  return win;
}

function notify(title, message) {
  if (!Notification.isSupported()) return;
  const notification = new Notification({ title, body: message, icon: Constants.appIcon });
  notification.on('click', () => showAndCenter(mainWindow));
  notification.show();
}

function setSetting(key, value) {
  storage.set(Constants.storageKey + key, value);
  themeData = storage.get(Constants.storageKey + 'theme');
}

function setDarkTheme(win, enabled) {
  win.webContents.executeJavaScript(`document.body.classList.toggle('dark', ${enabled});`, true);
  if (enabled && darkCssKey === null && darkCss) {
    win.webContents.insertCSS(darkCss).then((key) => {
      darkCssKey = key;
    }).catch(() => {});
  } else if (!enabled && darkCssKey !== null) {
    const key = darkCssKey;
    darkCssKey = null;
    win.webContents.removeInsertedCSS(key).catch(() => {});
  }
}

function setTheme(win, theme) {
  setSetting('theme', theme);
  setDarkTheme(win, theme === 'dark');
}

function showAndCenter(win) {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function setFullScreen(win) {
  const next = !win.isFullScreen();
  win.setFullScreen(next);
  if (next) {
    notify('Fullscreen Enabled', 'Press Esc key to leave full screen mode.');
  }
}

function loadMenu(win) {
  const template = [
    {
      label: 'File',
      submenu: [{ label: 'Exit', click: () => app.quit() }]
    },
    {
      label: 'Theme',
      submenu: [
        { label: 'Light', click: () => (themeData !== 'light' && setTheme(win, 'light')) },
        { label: 'Dark', click: () => (themeData !== 'dark' && setTheme(win, 'dark')) }
      ]
    },
    {
      label: 'Action',
      submenu: [
        { label: storage.get(Constants.storageKey + 'sound') ? 'Unmute Sound' : 'Mute Sound', click: () => handleSoundNotificationSound(win) },
        { label: 'Clear App Data', click: () => clearAppData() },
        { label: 'Reload Application', click: () => reloadApp() },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Cmd+F', click: () => setFullScreen(win) }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function handleSoundNotificationSound(win) {
  const soundEnabled = storage.get(Constants.storageKey + 'sound');
  const newSoundState = !soundEnabled;
  storage.set(Constants.storageKey + 'sound', newSoundState);
  loadMenu(win); // Update menu label
  win.webContents.audioMuted = newSoundState;
  notify(newSoundState ? 'Sound Muted' : 'Sound Enabled', `App sound has been ${newSoundState ? 'muted completely. Audio, video, and any other sound.' : 're-enabled'}.`);
}

function clearAppData() {
  const dataPath = app.getPath('userData');
  if (!fs.existsSync(dataPath)) {
    reloadApp();
    return;
  }
  shell.trashItem(dataPath).then(() => {
    reloadApp();
  }).catch(error => {
    console.error('Error moving app data to trash:', error);
    notify('Clear App Data', 'Could not clear app data.');
  });
}

function reloadApp() {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit(0);
}

function setBadge(count) {
  if (!mainWindow) return;
  try {
    if (process.platform === 'darwin') {
      app.dock.setBadge(count > 0 ? String(count) : '');
    } else {
      mainWindow.setBadgeCount(count);
    }
  } catch (error) { /* badge not supported by this desktop environment */ }
}

function setTrayIcon() {
  if (!sysTray) return;
  const icon = nativeImage.createFromPath(unreadCount > 0 ? Constants.appIconEvent : Constants.appIconTray);
  if (process.platform === 'linux') {
    sysTray.setIcon(icon);
  } else {
    sysTray.setImage(icon);
  }
}

function setupTray() {
  try {
    sysTray = new Tray(nativeImage.createFromPath(Constants.appIconTray));
    if (process.platform !== 'linux') {
      sysTray.setIgnoreDoubleClickEvents(true);
    }
    sysTray.setToolTip(Constants.appName);
    sysTray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Show', click: () => showAndCenter(mainWindow) },
      { label: 'Quit', click: () => { app.quit(); sysTray.destroy(); } }
    ]));
    sysTray.on('click', () => showAndCenter(mainWindow));
  } catch (error) {
    console.error('System tray unavailable:', error);
    sysTray = null;
  }
}

function setupMainWindow() {
  mainWindow = createWindow();
  mainWindow.webContents.on('dom-ready', () => showAndCenter(mainWindow));
}

function handleUnreadChange(event, info) {
  const count = Math.max(0, Number(info && info.count) || 0);
  const hadUnread = unreadCount > 0;
  unreadCount = count;
  setTrayIcon();
  setBadge(count);

  // Notify about new messages only when the window is not in focus
  if (count > 0 && !hadUnread && mainWindow && !mainWindow.isFocused()) {
    const message = (info && info.text)
      ? `New message from ${info.text}`
      : `You have ${count} new message${count === 1 ? '' : 's'}.`;
    notify(Constants.appName, message);
  }
}

function getWindowState() {
  const defaultState = { width: Constants.width, height: Constants.height };
  const saved = storage.get(Constants.storageKey + 'windowBounds');
  if (!saved || typeof saved !== 'object') return defaultState;

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = Math.max(320, Number(saved.width) || Constants.width);
  const height = Math.max(320, Number(saved.height) || Constants.height);
  const x = Math.min(Math.max(Number(saved.x) || 0, workArea.x), Math.max(workArea.x, workArea.x + workArea.width - width));
  const y = Math.min(Math.max(Number(saved.y) || 0, workArea.y), Math.max(workArea.y, workArea.y + workArea.height - height));
  return { x, y, width, height, maximized: !!saved.maximized };
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getNormalBounds();
  storage.set(Constants.storageKey + 'windowBounds', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized: win.isMaximized()
  });
}

// Event listeners
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showAndCenter(mainWindow));

  app.whenReady().then(() => {
    setupTray();
    setupMainWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    setupMainWindow();
  } else {
    showAndCenter(mainWindow);
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

ipcMain.on('unread-changed', handleUnreadChange);
