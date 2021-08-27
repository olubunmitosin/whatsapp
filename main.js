// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, Tray, shell, ipcMain, screen, session, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const isDev = require('electron-is-dev');
const Constants = require('./app/constants');
const electronLocalShortcut = require('electron-localshortcut');
// try {
//   require('electron-reloader')(module)
// } catch (_) {}

//storage store and key identifier
const storage = new Store();

//App theme value holder
let themeData;
let mainWindow;
let menu = Menu;
let ipc = ipcMain;
let sysTray;
let win;
let height = Constants.height;
let width = Constants.width;
let unreadNotification = Constants.unreadNotification;
let isQuitting = Constants.isQuitting;

contextMenu({
  showInspectElement : false,
  append: (defaultActions, params, browserWindow) => [
    {
      label: 'Search Google for “{selection}”',
      // Only show it when right-clicking text
      visible: params.selectionText.trim().length > 0,
      click: () => {
        shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`).then(r => {});
      }
    }
  ]
});

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: width,
    height: height,
    icon: Constants.appIcon,
    webPreferences: {
      allowRendererProcessReuse : true,
      spellcheck: true,
      nodeIntegration: false, // fails without this because of CommonJS script detection
      allowRunningInsecureContent : true,
      plugins : true,
    }
  });

  //for development
  win.webContents.openDevTools();

  electronLocalShortcut.register(win, 'Ctrl+F', () => {
    setFullScreen();
  });

  electronLocalShortcut.register(win, 'Esc', () => {
    //Exit full screen
    win.setFullScreen(false);
  });

  themeData = storage.get(Constants.storageKey+'theme');

  let template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          click () { app.exit() }
        }
      ]
    },
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Light',
          click () {

            //do nothing if theme data was not set.
            if ( typeof themeData ===  'undefined' || themeData === 'light') {
              return false;
            }

            removeDarkCss();
            clearStorage();
          }
        },

        {
          label: 'Dark',
          click () {

            if ( typeof themeData ===  'undefined' || themeData === 'light') {
              //it's empty, so set dark setting
              setSetting('theme', 'dark');

              //load dark theme
              loadDarkCss();
            }

            if (themeData === 'dark') {
              return false;
            }

          } //click ends

        }
      ]
    },
    {
      label: 'Action',
      submenu: [
        {
          label:  typeof storage.get(Constants.storageKey + 'sound') !== 'undefined' && storage.get(Constants.storageKey + 'sound') === true ? 'Unmute Sound' : 'Mute Sound',
          click () {
            handleSoundNotificationSound();
          }
        },
        {
          label: 'Clear App Data',
          click () {
            let dataPath = app.getPath('userData');
            shell.moveItemToTrash(dataPath);
            app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
            app.exit(0);
            sysTray.destroy();
          }
        },
        {
          label: 'Reload Application',
          click () {
            app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
            app.exit(0);
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Cmd+F',
          click() {
           setFullScreen();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  function setFullScreen() {
    win.setFullScreen(!win.isFullScreen());
    notify('Fullscreen Enabled', 'Press Esc key to leave full screen mode.')
  }

  function handleSoundNotificationSound () {
    let enableSound = storage.get(Constants.storageKey + 'sound');

    if (typeof enableSound === "undefined" || !enableSound) {
      //this was not never set, and it's false by default so, mute the sound
      storage.set(Constants.storageKey+'sound', true);
      template[2].submenu[0].label = "Unmute Sound";
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
      win.webContents.audioMuted = true;
      notify('Sound Muted', 'App sound has been muted completely. Audio, video, and any other sound.');
      return false;
    }

    if (enableSound === true) {
      //Unmute sound
      storage.set(Constants.storageKey+'sound', false);
      template[2].submenu[0].label = "Mute Sound";

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
      win.webContents.audioMuted = false;
      notify('Sound Enabled', 'App sound has been re-enabled');
      return false;
    }
  }

  //Set a default user agent
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // and load the url of the app.
  win.loadURL(Constants.url);

  win.on('focus', e => {
    if (unreadNotification) {
      unreadNotification = false;
      sysTray.setImage(Constants.appIcon);
    }
  });

  win.webContents.on('did-finish-load', function () {
    themeData = storage.get(Constants.storageKey+'theme');
    if (typeof themeData !== 'undefined' && themeData === 'dark') {
     setTimeout(() => { loadDarkCss();}, 1000);
    }
  });

  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    //event.preventDefault();
    win.allowRendererProcessReuse = true;
    win.blur();
  });


  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }

    return false;
  });


  return win;
}

function notify(title, message) {
  return (new Notification({title : title, body : message})).show();
}


function setSetting(key, value) {
  storage.set(Constants.storageKey + key, value);
  //refresh the storage value
  themeData = storage.get(Constants.storageKey+'theme');
}

function loadDarkCss() {
  let code = 'document.querySelector("script").remove(); var pageBody = document.querySelector("body"); if (!pageBody.classList.contains("dark")) { pageBody.classList.add("dark"); }';
      mainWindow.webContents.executeJavaScript(code, true);
}


function removeDarkCss() {
  setSetting('theme', 'light');
  mainWindow.reload();
}


function clearStorage() {
  // storage.delete(storageKey + 'theme');
}


function showAndCenter(win) {
  center(win);
  win.show();
  win.focus();
}

function center(win) {
  let size = screen.getPrimaryDisplay().workAreaSize;
  let x = Math.round(size.width / 2 - width / 2);
  let y = Math.round(size.height / 2 - height / 2);
  win.setPosition(x, y);
}


setProcess = function() {
  sysTray = new Tray(Constants.appIcon);
  // Ignore double click events for the tray icon
  sysTray.setIgnoreDoubleClickEvents(true);
  let contextMenu = menu.buildFromTemplate([
    { label: 'Show', click: function() { showAndCenter(mainWindow); } },
    { label: 'Quit', click: function() {
        app.quit();
        sysTray.destroy();
      } }
  ]);

  sysTray.setToolTip(Constants.appName);
  sysTray.setContextMenu(contextMenu);

  sysTray.on('click', () => {
    showAndCenter(mainWindow);
  });

  mainWindow = createWindow();

  let page = mainWindow.webContents;

  page.on('dom-ready', () => {
    showAndCenter(mainWindow);
  });

  page.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(setProcess)


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
    sysTray.destroy();
  }
});

app.on('activate', () => {
  showAndCenter(mainWindow);
});

app.on('before-quit', () => {
  isQuitting = true;
});

ipc.on('change-icon', (event) => {
  console.log(event);
  if (!unreadNotification) {
    unreadNotification = true;
    sysTray.setImage(Constants.appIconEvent);
  }
});

ipc.on('notification-click', () => {
  showAndCenter(mainWindow);
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
