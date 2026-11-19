const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTrustedIpcSender } = require('../electron/ipc-security.cjs');

const mainWindow = { webContents: { id: 1 } };

test('accepts only the main renderer and the loopback development origin', () => {
  assert.equal(assertTrustedIpcSender({
    mainWindow, sender: mainWindow.webContents,
    senderFrameUrl: 'http://127.0.0.1:5173/', isPackaged: false,
  }), true);
});

test('rejects missing windows, foreign senders, and untrusted development origins', () => {
  assert.throws(() => assertTrustedIpcSender({
    mainWindow: null, sender: mainWindow.webContents,
    senderFrameUrl: 'http://127.0.0.1:5173/', isPackaged: false,
  }), /emisor no autorizado/);
  assert.throws(() => assertTrustedIpcSender({
    mainWindow, sender: { id: 2 },
    senderFrameUrl: 'http://127.0.0.1:5173/', isPackaged: false,
  }), /emisor no autorizado/);
  for (const url of ['https://127.0.0.1:5173/', 'http://localhost:5173/', 'http://127.0.0.1:3000/', 'file:///tmp/evil.html']) {
    assert.throws(() => assertTrustedIpcSender({
      mainWindow, sender: mainWindow.webContents, senderFrameUrl: url, isPackaged: false,
    }), /origen no autorizado/);
  }
});

test('accepts only the exact packaged local renderer file', () => {
  const expectedFileUrl = 'file:///C:/Program%20Files/NotariaVE/dist/index.html';
  assert.equal(assertTrustedIpcSender({
    mainWindow, sender: mainWindow.webContents, senderFrameUrl: expectedFileUrl,
    isPackaged: true, expectedFileUrl,
  }), true);
  assert.throws(() => assertTrustedIpcSender({
    mainWindow, sender: mainWindow.webContents, senderFrameUrl: 'file:///tmp/evil.html',
    isPackaged: true, expectedFileUrl,
  }), /origen no autorizado/);
});
