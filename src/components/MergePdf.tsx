import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    ArrowLeftIcon,
    DocumentIcon,
    XMarkIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function MergePdf() {
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

    const handleMerge = async () => {
        if (files.length < 2) return;
        setIsProcessing(true);
        try {
            const filePaths = files.map(f => (f as any).path);
            const outputDir = filePaths[0].substring(0, filePaths[0].lastIndexOf('/'));
            const outputPath = `${outputDir}/merged-${Date.now()}.pdf`;

            await window.electronAPI.mergePdfs(filePaths, outputPath);
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

                {/* Breadcrumb / Header */}
                <div className="mb-10">
                    <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-900 transition-colors text-sm mb-6">
                        <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                        Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Merge PDFs</h1>
                    <p className="text-gray-500">Combine multiple documents into a single PDF file.</p>
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">

                    {/* Dropzone - Minimalist */}
                    <div
                        {...getRootProps()}
                        className={`
              group border border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer text-center
              ${isProcessing ? 'bg-gray-50 border-gray-200 opacity-50' :
                                isDragActive ? 'bg-blue-50 border-blue-400' :
                                    'border-gray-300 hover:bg-gray-50 hover:border-gray-400'}
            `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 group-hover:text-gray-800">
                            <PlusIcon className="w-6 h-6" />
                            <span className="text-sm font-medium">Click to add files or drag and drop</span>
                        </div>
                    </div>

                    {/* File List - Notion Database Style */}
                    {files.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Name</span>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</span>
                            </div>
                            <ul className="divide-y divide-gray-100">
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

                    {/* Actions & Status */}
                    <div className="pt-4 flex items-center justify-between">
                        <div className="text-sm min-h-[20px]">
                            {status === 'success' && <span className="text-gray-600 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Merged successfully</span>}
                            {status === 'error' && <span className="text-red-600 flex items-center">Error merging files</span>}
                        </div>

                        {(files.length >= 2) && (
                            <button
                                onClick={handleMerge}
                                disabled={isProcessing}
                                className={`
                  px-4 py-2 rounded text-sm font-medium text-white transition-all
                  ${isProcessing ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}
                `}
                            >
                                {isProcessing ? 'Processing' : 'Merge Files'}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
