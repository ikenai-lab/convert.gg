
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function ImagesToPdf() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setStatus('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']
        }
    });

    const handleConvert = async () => {
        if (files.length === 0) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            const defaultName = 'images.pdf';
            const filterObj = { name: 'PDF Document', extensions: ['pdf'] };

            // 1. Ask user for save location
            const savePath = await window.electronAPI.saveFile(defaultName, [filterObj]);

            if (!savePath) {
                setStatus('Conversion cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Combining ${files.length} images into PDF...`);

            const filePaths = files.map(f => (f as any).path);

            // 2. Call backend
            await window.electronAPI.imagesToPdf(filePaths, savePath);

            setStatus('Success! PDF created.');
            setFiles([]);
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to create PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
            <button onClick={() => navigate('/')} className="mb-8 flex items-center text-gray-500 hover:text-[var(--text-primary)]">
                <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
            </button>

            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-semibold mb-2">Images to PDF</h1>
                <p className="text-gray-500 mb-8">Combine multiple images into a single PDF document.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:scale-105 active:scale-95'}`}
                >
                    <input {...getInputProps()} />
                    <PhotoIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Drag & drop images here</p>
                </div>

                {files.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-medium mb-2">Selected Images ({files.length}):</h3>
                        <ul className="text-sm text-gray-500 max-h-40 overflow-y-auto border rounded p-2 border-[var(--card-border)] space-y-1">
                            {files.map((f, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500">{i + 1}</span>
                                    <span className="truncate">{f.name}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setFiles([])} className="text-xs text-red-500 mt-2 hover:underline">Clear all</button>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleConvert}
                        disabled={files.length === 0 || isProcessing}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Creating PDF...' : 'Create PDF'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
