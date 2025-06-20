import {
  GetProject,
  ReadFilesFromPath,
  SaveExcelFile,
  SaveProject,
  SaveTemplate
} from './../shared/types'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getFiles, getGrafState, getTemplates, saveProject, saveTemplate } from './lib'
import {
  getBinaryFiles,
  getBinaryFilesFromDirectory,
  importFilesFromLoader,
  readFilesFromPath,
  saveExcelFile
} from './lib/files'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    modal: true,
    skipTaskbar: false,
    ...(process.platform === 'linux'
      ? { icon }
      : { icon: join(__dirname, '../../resources/icon.png') }),
    visualEffectState: 'active',
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    trafficLightPosition: { x: 10, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  // Get files from current path in main process.
  ipcMain.handle('getFiles', () => getFiles())
  ipcMain.handle('getGrafState', (_, ...args: Parameters<GetProject>) => getGrafState(...args))
  ipcMain.handle('getTemplates', () => getTemplates())
  ipcMain.handle('getBinaryFiles', () => getBinaryFiles())
  ipcMain.handle('getBinaryFilesFromDirectory', () => getBinaryFilesFromDirectory())

  // Saver files to current path from renderer process.
  ipcMain.handle('saveGrafState', (_, ...args: Parameters<SaveProject>) => saveProject(...args))
  ipcMain.handle('saveTemplates', (_, ...args: Parameters<SaveTemplate>) => saveTemplate(...args))
  ipcMain.handle('saveExcelFile', (_, ...args: Parameters<SaveExcelFile>) => saveExcelFile(...args))

  // Read files from path in main process.
  ipcMain.handle('readFilesFromPath', (_, ...args: Parameters<ReadFilesFromPath>) =>
    readFilesFromPath(...args)
  )

  // Import files from loader in main process.
  ipcMain.handle('importFilesFromLoader', () => importFilesFromLoader())

  ipcMain.handle('getAppName', () => app.name)
  ipcMain.handle('getAppInfo', () => ({
    name: app.name,
    version: app.getVersion(),
    arc: process.arch,
    electronVersion: process.versions.electron
  }))

  ipcMain.handle('onLoadFileInfo', () => {
    return process.argv[1]
  })

  ipcMain.handle('quit', () => {
    app.quit()
  })

  ipcMain.handle('maximize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.isMaximized() ? window.unmaximize() : window.maximize()
    }
    return window?.isMaximized()
  })

  ipcMain.handle('minimize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.minimize()
    }
  })
  ipcMain.handle('get-window-size', async () => {
    const bounds = BrowserWindow.getFocusedWindow()?.getBounds()
    return { width: bounds?.width || 0, height: bounds?.height || 0 }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
