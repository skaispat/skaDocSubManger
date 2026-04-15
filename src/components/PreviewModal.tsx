import React, { useState } from 'react';
import { X, ExternalLink, Download, FileText, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: string[]; // List of URLs
    documentName: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, files, documentName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen || files.length === 0) return null;

    const currentUrl = files[currentIndex];
    const isPdf = currentUrl?.toLowerCase().endsWith('.pdf') || currentUrl?.includes('#pdf') || currentUrl?.startsWith('data:application/pdf');
    const isImage = currentUrl?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i) || currentUrl?.startsWith('data:image/');
    const isLocal = currentUrl?.startsWith('blob:') || currentUrl?.startsWith('data:');
    const fileName = currentUrl?.split('/').pop()?.split('#')[0] || 'document';
    
    // Use Google Docs viewer proxy for external PDFs (better compatibility)
    // Direct link for local blobs/data as Google can't access them
    const pdfViewerUrl = (isPdf && !isLocal)
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(currentUrl)}&embedded=true` 
        : currentUrl;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(currentUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if blob fetch fails (e.g. CORS)
            window.open(currentUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 md:p-8 animate-in fade-in duration-200 font-sans">
            <div className="relative w-full h-full max-w-7xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0 hidden sm:block">
                            {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[11px] sm:text-xs font-black text-gray-950 uppercase tracking-tight break-words whitespace-normal leading-tight">
                                {documentName}
                            </h2>
                            <p className="text-[9px] text-gray-900 font-black uppercase tracking-widest mt-0.5 opacity-70">
                                {currentIndex + 1} / {files.length} • {isPdf ? 'PDF' : 'IMG'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="p-2.5 bg-gray-950 hover:bg-black text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
                            title="Download File"
                        >
                            <Download size={18} strokeWidth={3} className={isDownloading ? 'animate-bounce' : ''} />
                        </button>
                        <button
                            onClick={() => window.open(currentUrl, '_blank')}
                            className="p-2 text-gray-950 hover:text-blue-700 transition-colors bg-white border border-gray-200 rounded-xl"
                            title="Open in new tab"
                        >
                            <ExternalLink size={18} strokeWidth={3} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-950 hover:text-red-700 transition-colors bg-white border border-gray-200 rounded-xl"
                        >
                            <X size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden relative group">
                    
                    {/* Navigation Buttons (Floating) */}
                    {files.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : files.length - 1))}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 hover:bg-white text-gray-900 rounded-2xl shadow-xl transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setCurrentIndex(prev => (prev < files.length - 1 ? prev + 1 : 0))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/80 hover:bg-white text-gray-900 rounded-2xl shadow-xl transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Preview Area */}
                    <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                        {isPdf ? (
                            <iframe
                                src={pdfViewerUrl}
                                className="w-full h-full rounded-xl shadow-inner bg-white border-0"
                                title="PDF Preview"
                            />
                        ) : (
                            <img
                                src={currentUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-lg shadow-black/10 transition-transform duration-300"
                            />
                        )}
                    </div>

                    {/* Thumbnails Sidebar (Optional but helpful for multi-file) */}
                    {files.length > 1 && (
                        <div className="hidden lg:flex w-64 border-l border-gray-100 flex-col bg-white">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Pages ({files.length})</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                                {files.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-full group relative rounded-2xl overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-red-600 ring-2 ring-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {url.toLowerCase().endsWith('.pdf') ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <FileText size={24} className="text-red-500" />
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">PDF</span>
                                                </div>
                                            ) : (
                                                <img src={url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                            )}
                                        </div>
                                        <div className={`p-2 text-left bg-white transition-colors ${currentIndex === idx ? 'bg-red-50/50' : ''}`}>
                                            <p className={`text-[10px] font-black truncate ${currentIndex === idx ? 'text-red-700' : 'text-gray-950'}`}>
                                                File {idx + 1}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer for Mobile Thumbnails */}
                {files.length > 1 && (
                    <div className="lg:hidden flex gap-3 p-4 overflow-x-auto border-t border-gray-100 bg-white no-scrollbar">
                        {files.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all ${currentIndex === idx ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400 bg-gray-50'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreviewModal;
