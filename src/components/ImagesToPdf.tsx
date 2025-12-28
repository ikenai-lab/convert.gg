import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    PlusIcon,
    FolderIcon,
    DocumentIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function ImagesToPdf() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('idle');

    const handleAddFolder = useCallback(async () => {
        try {
            const dirPath = await window.electronAPI.selectDirectory();
            if (!dirPath) return;

            setStatus('Reading folder...');
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
            const imagePaths = await window.electronAPI.listFiles(dirPath, imageExtensions);

            const newFiles = imagePaths.map(p => ({
                name: p.split(/[\\/]/).pop() || 'unknown.png',
                path: p
            } as unknown as File));

            setFiles(prev => {
                const existingPaths = new Set(prev.map(f => (f as any).path));
                const uniqueNew = newFiles.filter(f => !existingPaths.has((f as any).path));
                return [...prev, ...uniqueNew];
            });
            setStatus('idle');
        } catch (error) {
            console.error('Error adding folder:', error);
            setStatus('error');
        }
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setStatus('idle');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'] },
        disabled: isProcessing
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setStatus('Choosing destination...');

        try {
            const defaultName = 'images.pdf';
            const savePath = await window.electronAPI.saveFile(defaultName, [{ name: 'PDF Document', extensions: ['pdf'] }]);

            if (!savePath) {
                setIsProcessing(false);
                setStatus('idle');
                return;
            }

            setStatus(`Combining ${files.length} images...`);
            const filePaths = files.map(f => (f as any).path);
            await window.electronAPI.imagesToPdf(filePaths, savePath);

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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Images to PDF</h1>
                    <p className="text-gray-500">Combine multiple images into a single PDF document.</p>
                </div>

                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div
                            {...getRootProps()}
                            className={`
                                flex-1 group border border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer text-center
                                ${isProcessing ? 'bg-blue-50 border-blue-200 opacity-50' :
                                    isDragActive ? 'bg-blue-50 border-blue-400' :
                                        'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 group-hover:text-gray-800">
                                <PlusIcon className="w-6 h-6" />
                                <span className="text-sm font-medium">Click to add Images</span>
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
                            {status === 'success' && <span className="text-green-600 font-medium">✨ PDF created successfully!</span>}
                            {status === 'error' && <span className="text-red-600 font-medium">❌ Error creating PDF.</span>}
                            {status !== 'idle' && status !== 'success' && status !== 'error' && <span className="text-gray-500">{status}</span>}
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={files.length === 0 || isProcessing}
                            className={`
                                px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                                ${files.length === 0 || isProcessing ? 'bg-gray-200 text-gray-400' : 'bg-black hover:bg-gray-800 shadow-sm'}
                            `}
                        >
                            {isProcessing ? 'Creating...' : (files.length > 1 ? `Create PDF (${files.length} images)` : 'Create PDF')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
