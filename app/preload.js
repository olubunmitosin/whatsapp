const { ipcRenderer } = require('electron');

// WhatsApp Web prefixes the document title with an unread count,
// e.g. "(3) John Doe" or "(12) Marketing Team".
function getUnreadInfo() {
  const title = document.title || '';
  const match = title.match(/^\((\d+)\)\s*(.*)$/);
  if (match) {
    return { count: Math.max(0, parseInt(match[1], 10) || 0), text: match[2] || '' };
  }
  return { count: 0, text: title };
}

function sendUnread() {
  ipcRenderer.send('unread-changed', getUnreadInfo());
}

function observeTitle() {
  const title = document.querySelector('title');
  if (title) {
    const observer = new MutationObserver(sendUnread);
    observer.observe(title, { childList: true, subtree: true, characterData: true });
  }
}

sendUnread();
observeTitle();
setInterval(sendUnread, 3000);