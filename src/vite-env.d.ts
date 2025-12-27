/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        sendMessage: (channel: string, data: unknown) => void;
        onMessage: (channel: string, callback: (...args: unknown[]) => void) => void;
        mergePdfs: (filePaths: string[], outputPath: string) => Promise<void>;
        rotatePdf: (filePath: string, degrees: number) => Promise<void>;
        splitPdf: (filePath: string, outputDir: string) => Promise<string[]>;
        extractPages: (inputPath: string, pages: number[], outputPath: string) => Promise<void>;
        getPageCount: (inputPath: string) => Promise<number>;
        ocrPdf: (inputPath: string, outputPath: string) => Promise<void>;
        compressPdf: (inputPath: string, outputPath: string) => Promise<void>;
        // Archive
        extractArchive: (inputPath: string, outputDir: string) => Promise<void>;
        createArchive: (inputPaths: string[], outputPath: string) => Promise<void>;
        convertArchive: (inputPath: string, outputPath: string) => Promise<void>;
        // Media
        convertImage: (inputPath: string, outputPath: string) => Promise<void>;
        compressImage: (inputPath: string, outputPath: string, targetSize: number) => Promise<void>;
        imagesToPdf: (inputPaths: string[], outputPath: string) => Promise<void>;
        // Documents
        convertToPdf: (inputPath: string, outputPath: string) => Promise<void>;
        // Dialogs
        selectDirectory: () => Promise<string | null>;
        saveFile: (defaultName: string, filters?: { name: string, extensions: string[] }[]) => Promise<string | null>;
        openFile: (filters?: { name: string, extensions: string[] }[], allowMulti?: boolean) => Promise<string[]>;
    }
}
