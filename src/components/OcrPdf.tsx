import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    XMarkIcon,
    SparklesIcon,
    FolderIcon,
    PlusIcon,
    DocumentIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const joinPath = (dir: string, file: string) => {
    const sep = dir.includes('\\') ? '\\' : '/';
    return `${dir.replace(/[\\/]$/, '')}${sep}${file}`;
};

export default function OcrPdf() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('idle');

    const handleAddFolder = useCallback(async () => {
        try {
            const dirPath = await window.electronAPI.selectDirectory();
            if (!dirPath) return;

            setStatus('idle');
            const pdfPaths = await window.electronAPI.listFiles(dirPath, ['.pdf']);

            const newFiles = pdfPaths.map(p => ({
                name: p.split(/[\\/]/).pop() || 'unknown.pdf',
                path: p
            } as unknown as File));

            setFiles(prev => {
                const existingPaths = new Set(prev.map(f => (f as any).path));
                const uniqueNew = newFiles.filter(f => !existingPaths.has((f as any).path));
                return [...prev, ...uniqueNew];
            });
        } catch (error) {
            console.error('Error adding folder:', error);
            setStatus('Error reading folder.');
        }
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setStatus('idle');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        disabled: isProcessing
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setStatus('Converting...');

        try {
            let outputTarget: string | null = null;
            const isBatch = files.length > 1;

            if (isBatch) {
                // Batch: Select Output Directory
                outputTarget = await window.electronAPI.selectDirectory();
                if (!outputTarget) {
                    setIsProcessing(false);
                    setStatus('idle');
                    return;
                }
            } else {
                // Single: Save File Dialog (DOCX)
                const f = files[0];
                const defaultName = f.name.replace('.pdf', '_ocr.docx');
                outputTarget = await window.electronAPI.saveFile(defaultName, [{ name: 'Word Document', extensions: ['docx'] }]);
                if (!outputTarget) {
                    setIsProcessing(false);
                    setStatus('idle');
                    return;
                }
            }

            // Process Files
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const filePath = (f as any).path;
                let outputPath = '';

                if (isBatch) {
                    const name = f.name.replace('.pdf', '_ocr.docx');
                    outputPath = joinPath(outputTarget!, name);
                } else {
                    outputPath = outputTarget!;
                }

                setStatus(`Converting ${i + 1}/${files.length}: ${f.name}...`);
                await window.electronAPI.ocrPdf(filePath, outputPath);
            }

            setStatus('success');
            setFiles([]);
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm mb-6">
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">PDF to Word (OCR)</h1>
                    <p className="text-gray-500">Convert scanned PDFs into editable Word documents.</p>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div
                            {...getRootProps()}
                            className={`
                                flex-1 group border border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer text-center
                                ${isProcessing ? 'bg-green-50 border-green-200 opacity-50' :
                                    isDragActive ? 'bg-green-50 border-green-400' :
                                        'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 group-hover:text-gray-800">
                                <PlusIcon className="w-6 h-6" />
                                <span className="text-sm font-medium">Click to add PDFs</span>
                            </div>
                        </div>

                        <button
                            onClick={handleAddFolder}
                            disabled={isProcessing}
                            className="flex flex-col items-center justify-center border border-gray-300 rounded-lg p-4 px-8 text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all gap-2"
                        >
                            <FolderIcon className="w-6 h-6" />
                            <span className="text-sm font-medium">Add Folder</span>
                        </button>
                    </div>

                    {files.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</span>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</span>
                            </div>
                            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {files.map((file, idx) => (
                                    <li key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 group">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <DocumentIcon className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            disabled={isProcessing}
                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-sm min-h-[20px]">
                            {status === 'success' && <span className="text-green-600 font-medium flex items-center"><SparklesIcon className="w-4 h-4 mr-1" /> Converted successfully!</span>}
                            {status === 'error' && <span className="text-red-600 font-medium">❌ Error converting.</span>}
                            {status !== 'idle' && status !== 'success' && status !== 'error' && <span className="text-gray-500 animate-pulse">{status}</span>}
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={files.length === 0 || isProcessing}
                            className={`
                                px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                                ${files.length === 0 || isProcessing ? 'bg-gray-200 text-gray-400' : 'bg-black hover:bg-gray-800 shadow-sm'}
                            `}
                        >
                            {isProcessing ? 'Converting...' : (files.length > 1 ? `Convert ${files.length} Files` : 'Convert to Word')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
