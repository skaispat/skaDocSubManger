import React from 'react';
import { X, AlertCircle, HelpCircle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'confirm' | 'alert' | 'success' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = 'confirm'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'confirm': return <HelpCircle className="text-red-600" size={24} />;
            case 'success': return <CheckCircle className="text-green-600" size={24} />;
            case 'warning': return <AlertCircle className="text-amber-600" size={24} />;
            case 'alert': return <Info className="text-red-600" size={24} />;
            default: return <HelpCircle className="text-red-600" size={24} />;
        }
    };

    const getHeaderBg = () => {
        switch (type) {
            case 'confirm': return 'bg-red-50';
            case 'success': return 'bg-green-50';
            case 'warning': return 'bg-amber-50';
            case 'alert': return 'bg-red-50';
            default: return 'bg-red-50';
        }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-fade-in-up">
                {/* Header/Icon Area */}
                <div className={`p-6 flex flex-col items-center text-center ${getHeaderBg()}`}>
                    <div className="mb-4 p-3 bg-white rounded-full shadow-sm">
                        {getIcon()}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 flex gap-3">
                    {type === 'confirm' && (
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all active:scale-95
                            ${type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}
                        `}
                    >
                        {type === 'confirm' || type === 'alert' || type === 'warning' ? confirmText : 'Got it'}
                        {type === 'success' && 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
