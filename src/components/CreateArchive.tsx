
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const FORMATS = [
    { id: 'zip', label: 'ZIP' },
    { id: 'tar', label: 'TAR' },
    { id: 'tar.gz', label: 'TAR.GZ' },
    { id: '7z', label: '7-Zip' },
];

export default function CreateArchive() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [outputFormat, setOutputFormat] = useState('zip');
    const [status, setStatus] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setStatus('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true
    });

    const handleCreate = async () => {
        if (files.length === 0) return;

        try {
            setIsProcessing(true);
            setStatus('Choosing destination...');

            const defaultName = `archive.${outputFormat}`;
            // Fix: logic to handle tar.gz extension mapping if needed, 
            // but usually 'tar.gz' works if system supports it.
            // We will rely on defaultName.

            // 1. Ask user for save location
            // We limit the filter to the selected format to ensure consistency
            const filterExtensions = outputFormat === 'tar.gz' ? ['tar.gz', 'gz', 'tgz'] : [outputFormat];

            const savePath = await window.electronAPI.saveFile(defaultName, [
                { name: `${outputFormat.toUpperCase()} Archive`, extensions: filterExtensions }
            ]);

            if (!savePath) {
                setStatus('Creation cancelled');
                setIsProcessing(false);
                return;
            }

            setStatus(`Creating archive at ${savePath}...`);

            // 2. Call backend
            const filePaths = files.map(f => (f as any).path);
            await window.electronAPI.createArchive(filePaths, savePath);

            setStatus('Success! Archive created.');
            setFiles([]);
        } catch (error) {
            console.error(error);
            setStatus('Error: Failed to create archive.');
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
                <h1 className="text-3xl font-semibold mb-2">Create Archive</h1>
                <p className="text-gray-500 mb-8">Combine files into Zip, Tar, or 7z.</p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'}`}
                >
                    <input {...getInputProps()} />
                    <FolderPlusIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Drag & drop files here to add to archive</p>
                </div>

                {/* Format Selection */}
                {files.length > 0 && (
                    <div className="mb-8">
                        <p className="font-medium mb-3">Select Format:</p>
                        <div className="flex gap-3">
                            {FORMATS.map(fmt => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setOutputFormat(fmt.id)}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                ${outputFormat === fmt.id
                                            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                        }`}
                                >
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="mb-8">
                        <h3 className="font-medium mb-2">Selected Files ({files.length}):</h3>
                        <ul className="text-sm text-gray-500 max-h-40 overflow-y-auto border rounded p-2 border-[var(--card-border)]">
                            {files.map((f, i) => (
                                <li key={i}>{f.name}</li>
                            ))}
                        </ul>
                        <button onClick={() => setFiles([])} className="text-xs text-red-500 mt-2 hover:underline">Clear all</button>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={handleCreate}
                        disabled={files.length === 0 || isProcessing}
                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isProcessing ? 'Creating...' : 'Create Archive'}
                    </button>

                    {status && <p className="text-sm font-medium animate-pulse">{status}</p>}
                </div>
            </div>
        </div>
    );
}
