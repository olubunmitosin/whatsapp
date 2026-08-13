const path = require('path');

const appName = 'WhatsApp';
const appIcon = path.join(__dirname, '../images/icons/png/1024x1024.png');
const appIconTray = path.join(__dirname, '../images/icons/png/48x48.png');
const appIconEvent = path.join(__dirname, '../images/app_event.png');
const url = 'https://web.whatsapp.com/';
const height = 750;
const width = 1200;
const storageKey = 'kestyW_';

module.exports = {
    appName: appName,
    appIcon: appIcon,
    appIconTray: appIconTray,
    appIconEvent: appIconEvent,
    url: url,
    height: height,
    width: width,
    storageKey: storageKey
}