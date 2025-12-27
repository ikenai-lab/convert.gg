import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { mergePdfs, rotatePdf, splitPdf } from './pdf-ops';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow() {
    const iconPath = path.join(__dirname, '../build/icon.png');
    console.log('Loading icon from:', iconPath);
    const icon = nativeImage.createFromPath(iconPath);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: icon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    ipcMain.handle('pdf:merge', async (_, filePaths, outputPath) => {
        await mergePdfs(filePaths, outputPath);
    });

    ipcMain.handle('pdf:rotate', async (_, filePath, degrees) => {
        await rotatePdf(filePath, degrees);
    });

    ipcMain.handle('pdf:split', async (_, filePath, outputDir) => {
        return await splitPdf(filePath, outputDir);
    });

    ipcMain.handle('ocr:convert', async (_, inputPath, outputPath) => {
        const { runOcrScript } = await import('./python-runner');
        await runOcrScript(inputPath, outputPath);
    });

    ipcMain.handle('pdf:compress', async (_, filePath, outputPath) => {
        const { compressPdf } = await import('./pdf-ops');
        await compressPdf(filePath, outputPath);
    });

    ipcMain.handle('pdf:getPageCount', async (_, filePath) => {
        const { getPdfPageCount } = await import('./pdf-ops');
        return await getPdfPageCount(filePath);
    });

    ipcMain.handle('pdf:extract', async (_, filePath, pageIndices, outputPath) => {
        const { extractPages } = await import('./pdf-ops');
        return await extractPages(filePath, pageIndices, outputPath);
    });

    // --- Archive Handlers ---
    ipcMain.handle('archive:extract', async (_, inputPath, outputDir) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('archive_tools.py', ['extract', '--input_path', inputPath, '--output_dir', outputDir]);
    });

    ipcMain.handle('pdf:decrypt', async (_, inputPath, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('pdf_tools.py', ['decrypt', '--input_path', inputPath, '--output_path', outputPath]);
    });

    ipcMain.handle('archive:create', async (_, inputPaths, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('archive_tools.py', ['create', '--inputs', ...inputPaths, '--output_path', outputPath]);
    });

    ipcMain.handle('archive:convert', async (_, inputPath, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('archive_tools.py', ['convert', '--input_path', inputPath, '--output_path', outputPath]);
    });

    // --- Media Handlers ---
    ipcMain.handle('media:convertImage', async (_, inputPath, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('media_tools.py', ['convert_image', '--input_path', inputPath, '--output_path', outputPath]);
    });

    ipcMain.handle('media:compressImage', async (_, inputPath, outputPath, targetSize) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('media_tools.py', ['compress_image', '--input_path', inputPath, '--output_path', outputPath, '--target_size', targetSize.toString()]);
    });

    ipcMain.handle('media:imagesToPdf', async (_, inputPaths, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        // We pass inputPaths as positional args, then output path named arg
        await runPythonScript('media_tools.py', ['images_to_pdf', ...inputPaths, '--output_path', outputPath]);
    });

    ipcMain.handle('doc:convertToPdf', async (_, inputPath, outputPath) => {
        const { runPythonScript } = await import('./python-runner');
        await runPythonScript('doc_tools.py', ['convert_to_pdf', '--input_path', inputPath, '--output_path', outputPath]);
    });

    // --- Dialog Handlers ---
    const { dialog } = require('electron');

    // Select Output FOLDER (for extraction)
    ipcMain.handle('dialog:selectDirectory', async () => {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openDirectory', 'createDirectory']
        });
        return result.filePaths[0] || null;
    });

    // Save File Dialog (for outputs)
    ipcMain.handle('dialog:saveFile', async (_, defaultName, filters) => {
        const result = await dialog.showSaveDialog(mainWindow!, {
            defaultPath: defaultName,
            filters: filters || []
        });
        return result.filePath || null;
    });

    // Open File Dialog (general)
    ipcMain.handle('dialog:openFile', async (_, filters, allowMultiSelection) => {
        const properties: ('openFile' | 'multiSelections')[] = ['openFile'];
        if (allowMultiSelection) properties.push('multiSelections');

        const result = await dialog.showOpenDialog(mainWindow!, {
            properties,
            filters
        });
        return result.filePaths;
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
