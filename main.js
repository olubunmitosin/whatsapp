// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, MenuItem, Tray, shell, ipcMain, screen, platform, systemPreferences, nativeImage, session, Notification } = require('electron');
const Store = require('electron-store');
const Constants = require('./app/constants');
const electronLocalShortcut = require('electron-localshortcut');
require('update-electron-app')();

// Storage store and key identifier
const storage = new Store();

// App theme value holder
let themeData;
let mainWindow;
let sysTray;
let unreadNotification = Constants.unreadNotification;
let isQuitting = Constants.isQuitting;

// Context menu setup
require('electron-context-menu')({
  showInspectElement: false,
  append: (defaultActions, params) => params.selectionText.trim().length > 0 ? [{
    label: `Search Google for “${params.selectionText}”`,
    click: () => shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`).then(() => {})
  }] : []
});

function createWindow() {
  const { width, height, appIcon, url } = Constants;

  const win = new BrowserWindow({
    width,
    height,
    icon: appIcon,
    webPreferences: {
      allowRendererProcessReuse: true,
      spellcheck: true,
      nodeIntegration: false,
      allowRunningInsecureContent: true,
      plugins: true,
    }
  });

  // Development: win.webContents.openDevTools();

  if (platform === "darwin") {
    systemPreferences.askForMediaAccess('microphone').then(() => {});
    systemPreferences.askForMediaAccess('camera').then(() => {});
  }

  electronLocalShortcut.register(win, 'Ctrl+F', () => setFullScreen(win));
  electronLocalShortcut.register(win, 'Esc', () => win.setFullScreen(false));

  loadMenu(win);

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    let userAgent;
    if (platform === "darwin") {
      userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"; // Updated Chrome for macOS
    } else if (platform === "win32" || platform === 'win64') {
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"; // Updated Chrome for Windows
    } else {
      userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'; // Updated Chrome for Linux
    }
    callback({ cancel: false, requestHeaders: { ...details.requestHeaders, 'User-Agent': userAgent } });
  });

  win.loadURL(url);

  win.on('focus', () => {
    if (unreadNotification) {
      unreadNotification = false;
      sysTray.setImage(Constants.appIcon);
    }
  });

  win.webContents.on('did-finish-load', () => {
    themeData = storage.get(Constants.storageKey + 'theme');
    if (themeData === 'dark') {
      setTimeout(() => loadDarkCss(win), 1000);
    }
  });

  win.webContents.on('context-menu', (event, params) => {
    const menu = Menu.buildFromTemplate(params.dictionarySuggestions.map(suggestion => ({
      label: suggestion,
      click: () => win.webContents.replaceMisspelling(suggestion)
    })));

    if (params.misspelledWord) {
      menu.append(new MenuItem({
        label: 'Add to dictionary',
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      }));
    }

    menu.popup();
  });

  session.defaultSession.on('will-download', () => {
    win.allowRendererProcessReuse = true;
    win.blur();
  });

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  return win;
}

function notify(title, message) {
  new Notification({ title, body: message }).show();
}

function setSetting(key, value) {
  storage.set(Constants.storageKey + key, value);
  themeData = storage.get(Constants.storageKey + 'theme');
}

function loadDarkCss(win) {
  win.webContents.executeJavaScript('document.querySelector("script").remove(); document.body.classList.toggle("dark", true);', true);
}

function removeDarkCss(win) {
  setSetting('theme', 'light');
  win.webContents.executeJavaScript('document.querySelector("script").remove(); document.body.classList.toggle("dark", false);', true);
}

function showAndCenter(win) {
  const { width, height } = Constants;
  const size = screen.getPrimaryDisplay().workAreaSize;
  win.setPosition(Math.round(size.width / 2 - width / 2), Math.round(size.height / 2 - height / 2));
  win.show();
  win.focus();
}

function setFullScreen(win) {
  win.setFullScreen(!win.isFullScreen());
  notify('Fullscreen Enabled', 'Press Esc key to leave full screen mode.');
}

function loadMenu(win) {
  const template = [
    {
      label: 'File',
      submenu: [{ label: 'Exit', click: () => app.exit() }]
    },
    {
      label: 'Theme',
      submenu: [
        { label: 'Light', click: () => (themeData !== 'light' && removeDarkCss(win)) },
        { label: 'Dark', click: () => (themeData !== 'dark' && setSetting('theme', 'dark') && loadDarkCss(win)) }
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
  try {
    shell.trashItem(dataPath).then(() => {
      app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
      app.exit(0);
      sysTray.destroy();
    }).catch(error => {
      console.error("Error moving to trash:", error);
    });
  } catch (error) {
    console.error("Error moving to trash:", error);
  }
}

function reloadApp() {
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit(0);
}

function setupTray() {
  sysTray = new Tray(nativeImage.createFromPath(Constants.appIcon));
  sysTray.setIgnoreDoubleClickEvents(true);
  sysTray.setToolTip(Constants.appName);
  sysTray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => showAndCenter(mainWindow) },
    { label: 'Quit', click: () => { app.quit(); sysTray.destroy(); } }
  ]));
  sysTray.on('click', () => showAndCenter(mainWindow));
}

function setupMainWindow() {
  mainWindow = createWindow();
  mainWindow.setOverlayIcon(nativeImage.createFromPath(Constants.appIcon), Constants.appName);

  mainWindow.webContents.on('dom-ready', () => showAndCenter(mainWindow));
  mainWindow.webContents.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
}
function handleIconChange() {
  if (!unreadNotification) {
    unreadNotification = true;
    sysTray.setIcon(nativeImage.createFromPath(Constants.appIconEvent));
  }
}

// Event listeners
app.whenReady().then(() => {
  setupTray();
  setupMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    sysTray.destroy();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) setupMainWindow();
  showAndCenter(mainWindow);
});

app.on('before-quit', () => {
  isQuitting = true;
});

ipcMain.on('change-icon', handleIconChange);
ipcMain.on('notification-click', () => showAndCenter(mainWindow));