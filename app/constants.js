const path = require('path');

const appName = 'WhatsApp';
const appIcon = path.join(__dirname, '../images/icons/png/1024x1024.png');
const appIconEvent = path.join(__dirname, '../images/icons/png/32x32.png');
const isQuitting = false;
const unreadNotification = false;
const url = 'https://web.whatsapp.com/';
const height = 750;
const width = 1200;
const storageKey = 'kestyW_';

module.exports = {
    appName : appName,
    appIcon : appIcon,
    appIconEvent : appIconEvent,
    isQuitting : isQuitting,
    unreadNotification : unreadNotification,
    url : url,
    height : height,
    width : width,
    storageKey : storageKey
}