// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu, Tray, shell, ipcMain, screen, session, dialog } = require('electron');
const path = require('path');
const contextMenu = require('electron-context-menu');
const fs = require('fs');
const Store = require('electron-store');



//storage store and key identifier
const storage = new Store();
const storageKey='kestyW_';

//App theme value holder
let themeData;


let mainWindow;
let tray = Tray;
let menu = Menu;
let appName = 'WhatsApp';
let appIcon = path.join(__dirname, 'images/icons/png/1024x1024.png');
let appIconEvent = path.join(__dirname, 'images/icons/png/32x32.png');
let ipc = ipcMain;
let sysTray;
let isQuitting = false;
let unreadNotification = false;
let win;

// Change these to customize the app
let url = 'https://web.whatsapp.com/';
let height = 750;
let width = 1200;

contextMenu({
  showInspectElement : false,
  append: (defaultActions, params, browserWindow) => [
    {
      label: 'Open Link in Browser',
      // Only show it when right-clicking images
      visible: params.srcURL.length > 0,
      click: () => {
        shell.openExternal(params.linkURL).then(r => console.log('error'));
      }
    },
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
    icon: appIcon,
    webPreferences: {
      spellcheck: true,
      nodeIntegration: false, // fails without this because of CommonJS script detection
      allowRunningInsecureContent : true,
      plugins : true,
      preload: path.join(__dirname, 'js', 'browser.js')
    }
  });

  themeData = storage.get(storageKey+'theme');

  const template = [
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
          click () { mainWindow.reload() }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  //Set a default user agent
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // and load the url of the app.
  win.loadURL(url);

  win.on('focus', e => {
    if (unreadNotification) {
      unreadNotification = false;
      sysTray.setImage(appIcon);
    }
  });

  win.webContents.on('did-finish-load', function () {
    themeData = storage.get(storageKey+'theme');
    if (typeof themeData !== 'undefined' && themeData === 'dark') {
      loadDarkCss();
    }

  });

  session.defaultSession.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    // event.preventDefault();
    dialog.showSaveDialog({properties: ['openFile', 'openDirectory', 'multiSelections']}).then((result) =>  {});
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


function setSetting(key, value) {
  storage.set(storageKey+key, value);
  //refresh the storage value
  themeData = storage.get(storageKey+'theme');
}

function loadDarkCss() {
  fs.readFile(__dirname + '/css/dark.css', 'utf-8',function (error, data) {
    if(!error){
      let formattedCss = data.replace(/\s{2,10}/g, ' ').trim();
      mainWindow.webContents.insertCSS(formattedCss);
    }
  });
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
  sysTray = new tray(appIcon);
  let contextMenu = menu.buildFromTemplate([
    { label: 'Show', click: function() { showAndCenter(mainWindow); } },
    { label: 'Quit', click: function() {
        app.quit();
        sysTray.destroy();
      } }
  ]);

  sysTray.setToolTip(appName);
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

ipc.on('change-icon', () => {
  if (!unreadNotification) {
    unreadNotification = true;
    sysTray.setImage(appIconEvent);
  }
});

ipc.on('notification-click', () => {
  showAndCenter(mainWindow);
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
