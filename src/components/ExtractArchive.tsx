
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function ExtractArchive() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/zip': ['.zip'],
            'application/x-tar': ['.tar'],
            'application/gzip': ['.gz', '.tgz', '.tar.gz'],
            'application/x-7z-compressed': ['.7z'],
            'application/vnd.rar': ['.rar']
        }
    });

    const handleExtract = async () => {
        if (!file) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            // 1. Ask user for destination folder
            const outputDir = await window.electronAPI.selectDirectory();

            if (!outputDir) {
                setStatus('Extraction cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Extracting to ${outputDir}...`);

            // 2. Call backend
            // We need the full path of the input file. 
            // In Electron renderer, File object has 'path' property exposing absolute path.
            // @ts-ignore
            await window.electronAPI.extractArchive(file.path, outputDir);

            setStatus('Success! Archive extracted.');
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to extract archive.');
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
                <h1 className="text-3xl font-semibold mb-2">Extract Archive</h1>
                <p className="text-gray-500 mb-8">Unzip .zip, .tar, .7z, .rar and more.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}
                >
                    <input {...getInputProps()} />
                    <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                    {file ? (
                        <p className="text-lg font-medium">{file.name}</p>
                    ) : (
                        <p className="text-gray-500">Drag & drop archive here, or click to select</p>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleExtract}
                        disabled={!file || isProcessing}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Extracting...' : 'Extract Files'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
