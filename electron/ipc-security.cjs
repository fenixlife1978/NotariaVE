function assertTrustedIpcSender({ mainWindow, sender, senderFrameUrl, isPackaged, expectedFileUrl }) {
  if (!mainWindow || sender !== mainWindow.webContents) {
    throw new Error('Solicitud IPC rechazada: emisor no autorizado.');
  }
  let trusted = false;
  if (isPackaged) {
    trusted = senderFrameUrl === expectedFileUrl;
  } else {
    try {
      const parsed = new URL(senderFrameUrl || '');
      trusted = parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1' && parsed.port === '5173';
    } catch {
      trusted = false;
    }
  }
  if (!trusted) throw new Error('Solicitud IPC rechazada: origen no autorizado.');
  return true;
}

module.exports = { assertTrustedIpcSender };
