import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    PlusIcon,
    DocumentIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const FORMATS = [
    { id: 'zip', label: 'ZIP' },
    { id: 'tar', label: 'TAR' },
    { id: 'tar.gz', label: 'TAR.GZ' },
    { id: '7z', label: '7-Zip' },
];

export default function CreateArchive() {
    const [files, setFiles] = useState<File[]>([]);
    const [outputFormat, setOutputFormat] = useState('zip');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('idle');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles]);
        setStatus('idle');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        disabled: isProcessing
    });

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setStatus('Choosing destination...');

        try {
            const defaultName = `archive.${outputFormat}`;
            const filterExtensions = outputFormat === 'tar.gz' ? ['tar.gz', 'gz', 'tgz'] : [outputFormat];

            const savePath = await window.electronAPI.saveFile(defaultName, [
                { name: `${outputFormat.toUpperCase()} Archive`, extensions: filterExtensions }
            ]);

            if (!savePath) {
                setIsProcessing(false);
                setStatus('idle');
                return;
            }

            setStatus(`Creating archive...`);
            const filePaths = files.map(f => (f as any).path);
            await window.electronAPI.createArchive(filePaths, savePath);

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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create Archive</h1>
                    <p className="text-gray-500">Combine files into Zip, Tar, or 7z.</p>
                </div>

                <div className="space-y-6">
                    <div
                        {...getRootProps()}
                        className={`
                            group border border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer text-center
                            ${isProcessing ? 'bg-blue-50 border-blue-200 opacity-50' :
                                isDragActive ? 'bg-blue-50 border-blue-400' :
                                    'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 group-hover:text-gray-800">
                            <PlusIcon className="w-6 h-6" />
                            <span className="text-sm font-medium">Drop files here or click to add</span>
                        </div>
                    </div>

                    {files.length > 0 && (
                        <>
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

                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                    Select Format
                                </label>
                                <div className="flex gap-3 flex-wrap">
                                    {FORMATS.map(fmt => (
                                        <button
                                            key={fmt.id}
                                            onClick={() => setOutputFormat(fmt.id)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                                ${outputFormat === fmt.id
                                                    ? 'bg-black text-white border-transparent'
                                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-sm min-h-[20px]">
                            {status === 'success' && <span className="text-green-600 font-medium">✨ Archive created successfully!</span>}
                            {status === 'error' && <span className="text-red-600 font-medium">❌ Error creating archive.</span>}
                            {status !== 'idle' && status !== 'success' && status !== 'error' && <span className="text-gray-500">{status}</span>}
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={files.length === 0 || isProcessing}
                            className={`
                                px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                                ${files.length === 0 || isProcessing ? 'bg-gray-200 text-gray-400' : 'bg-black hover:bg-gray-800 shadow-sm'}
                            `}
                        >
                            {isProcessing ? 'Creating...' : (files.length > 1 ? `Create Archive (${files.length} files)` : 'Create Archive')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
