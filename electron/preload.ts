import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Example: Send a message to the main process
    sendMessage: (channel: string, data: unknown) => {
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    // Example: Receive a message from the main process
    onMessage: (channel: string, callback: (...args: unknown[]) => void) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_event, ...args) => callback(...args));
        }
    },
    // PDF Operations
    mergePdfs: (filePaths: string[], outputPath: string) => ipcRenderer.invoke('pdf:merge', filePaths, outputPath),
    rotatePdf: (filePath: string, degrees: number) => ipcRenderer.invoke('pdf:rotate', filePath, degrees),
    splitPdf: (filePath: string, outputDir: string) => ipcRenderer.invoke('pdf:split', filePath, outputDir),
    ocrConvert: (inputPath: string, outputPath: string) => ipcRenderer.invoke('ocr:convert', inputPath, outputPath),
    getPdfPageCount: (filePath: string) => ipcRenderer.invoke('pdf:getPageCount', filePath),
    extractPages: (inputPath: string, pages: number[], outputPath: string) => ipcRenderer.invoke('pdf:extract', inputPath, pages, outputPath),
    getPageCount: (inputPath: string) => ipcRenderer.invoke('pdf:count', inputPath),
    ocrPdf: (inputPath: string, outputPath: string) => ipcRenderer.invoke('pdf:ocr', inputPath, outputPath),
    compressPdf: (inputPath: string, outputPath: string) => ipcRenderer.invoke('pdf:compress', inputPath, outputPath),

    // Archive Operations
    extractArchive: (inputPath: string, outputDir: string) => ipcRenderer.invoke('archive:extract', inputPath, outputDir),
    createArchive: (inputPaths: string[], outputPath: string) => ipcRenderer.invoke('archive:create', inputPaths, outputPath),
    convertArchive: (inputPath: string, outputPath: string) => ipcRenderer.invoke('archive:convert', inputPath, outputPath),

    // Media Operations
    convertImage: (inputPath: string, outputPath: string) => ipcRenderer.invoke('media:convertImage', inputPath, outputPath),
    compressImage: (inputPath: string, outputPath: string, targetSize: number) => ipcRenderer.invoke('media:compressImage', inputPath, outputPath, targetSize),
    imagesToPdf: (inputPaths: string[], outputPath: string) => ipcRenderer.invoke('media:imagesToPdf', inputPaths, outputPath),

    // Document Operations
    convertToPdf: (inputPath: string, outputPath: string) => ipcRenderer.invoke('doc:convertToPdf', inputPath, outputPath),

    // Dialogs
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    saveFile: (defaultName: string, filters?: Electron.FileFilter[]) => ipcRenderer.invoke('dialog:saveFile', defaultName, filters),
    openFile: (filters?: Electron.FileFilter[], allowMulti?: boolean) => ipcRenderer.invoke('dialog:openFile', filters, allowMulti),
});
