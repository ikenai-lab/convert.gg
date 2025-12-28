import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
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

export default function ConvertArchive() {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<string>('zip');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('idle');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('idle');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled: isProcessing
    });

    const removeFile = () => {
        setFile(null);
        setStatus('idle');
    };

    const handleConvert = async () => {
        if (!file) return;
        setIsProcessing(true);
        setStatus('Choosing destination...');

        try {
            const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const defaultName = `${originalName}.${format}`;

            const filterMap: any = {
                'zip': { name: 'ZIP Archive', extensions: ['zip'] },
                'tar': { name: 'TAR Archive', extensions: ['tar'] },
                'tar.gz': { name: 'GZIP Archive', extensions: ['tar.gz', 'gz', 'tgz'] },
                '7z': { name: '7-Zip Archive', extensions: ['7z'] }
            };

            const savePath = await window.electronAPI.saveFile(defaultName, [filterMap[format]]);

            if (!savePath) {
                setIsProcessing(false);
                setStatus('idle');
                return;
            }

            setStatus(`Converting archive...`);
            // @ts-ignore
            await window.electronAPI.convertArchive(file.path, savePath);

            setStatus('success');
            setFile(null);
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
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Convert Archive</h1>
                    <p className="text-gray-500">Change format between Zip, Tar, 7z, etc.</p>
                </div>

                <div className="space-y-6">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`
                                group border border-dashed rounded-lg p-16 transition-all duration-200 cursor-pointer text-center
                                ${isDragActive ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center space-y-3 text-gray-500 group-hover:text-gray-800">
                                <ArrowPathIcon className="w-8 h-8 stroke-1" />
                                <span className="text-sm font-medium">Drop archive here or click to select</span>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center">
                                    <DocumentIcon className="w-5 h-5 text-gray-600" />
                                </div>
                                <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                            </div>
                            <button onClick={removeFile} className="text-gray-400 hover:text-red-500">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {file && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                Select Output Format
                            </label>
                            <div className="flex gap-3 flex-wrap">
                                {FORMATS.map(fmt => (
                                    <button
                                        key={fmt.id}
                                        onClick={() => setFormat(fmt.id)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                                            ${format === fmt.id
                                                ? 'bg-black text-white border-transparent'
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-sm min-h-[20px]">
                            {status === 'success' && <span className="text-green-600 font-medium">✨ Archive converted successfully!</span>}
                            {status === 'error' && <span className="text-red-600 font-medium">❌ Error converting archive.</span>}
                            {status !== 'idle' && status !== 'success' && status !== 'error' && <span className="text-gray-500">{status}</span>}
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={!file || isProcessing}
                            className={`
                                px-6 py-2 rounded-lg text-sm font-medium text-white transition-all
                                ${!file || isProcessing ? 'bg-gray-200 text-gray-400' : 'bg-black hover:bg-gray-800 shadow-sm'}
                            `}
                        >
                            {isProcessing ? 'Converting...' : 'Convert Archive'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
