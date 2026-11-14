const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notariaDesktop', {
  getStatus: () => ipcRenderer.invoke('app:get-status'),
  bootstrapAdmin: (input) => ipcRenderer.invoke('auth:bootstrap-admin', input),
  login: (input) => ipcRenderer.invoke('auth:login', input),
  logout: () => ipcRenderer.invoke('auth:logout'),
  listClients: () => ipcRenderer.invoke('clients:list'),
  saveClient: (client) => ipcRenderer.invoke('clients:save', client),
  deleteClient: (id) => ipcRenderer.invoke('clients:delete', id),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  saveSetting: (key, value) => ipcRenderer.invoke('settings:save', { key, value }),
});
