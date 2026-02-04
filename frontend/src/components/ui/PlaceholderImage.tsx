import React from 'react';
import { ImageOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PlaceholderImageProps {
    className?: string;
    text?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ className = "w-full h-full", text }) => {
    const { t } = useLanguage();

    return (
        <div className={`flex flex-col items-center justify-center bg-slate-800/50 border border-white/5 rounded-xl ${className}`}>
            <div className="p-3 rounded-full bg-slate-800/80 mb-2">
                <ImageOff className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
                {text || t('common.noImage', 'No Image')}
            </p>
        </div>
    );
};
