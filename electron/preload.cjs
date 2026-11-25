const { contextBridge, ipcRenderer } = require('electron');

const desktopBridge = {
  isDesktop: true,
  isElectron: true,
  platform: process.platform,
  openProjectDialog: () => ipcRenderer.invoke('slidemotion:open-file'),
  saveProjectDialog: (suggestedName, content) =>
    ipcRenderer.invoke('slidemotion:save-file', { suggestedName, content }),
  listDisplays: () => ipcRenderer.invoke('slidemotion:list-displays'),
  openPresenterDisplay: (initialPayload) =>
    ipcRenderer.invoke('slidemotion:open-presenter-display', initialPayload),
  syncAudienceDisplay: (payload) => ipcRenderer.send('slidemotion:sync-audience', payload),
  closePresenterDisplay: () => ipcRenderer.invoke('slidemotion:close-presenter-display'),
  onMenuAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('slidemotion:menu-action', listener);
    return () => ipcRenderer.removeListener('slidemotion:menu-action', listener);
  },
  onAudienceSync: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('slidemotion:audience-sync', listener);
    return () => ipcRenderer.removeListener('slidemotion:audience-sync', listener);
  },
  onAudienceClosed: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('slidemotion:audience-closed', listener);
    return () => ipcRenderer.removeListener('slidemotion:audience-closed', listener);
  },
};

contextBridge.exposeInMainWorld('desktop', desktopBridge);
contextBridge.exposeInMainWorld('electronAPI', desktopBridge);
