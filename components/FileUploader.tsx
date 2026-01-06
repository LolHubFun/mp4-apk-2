import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  accept: string;
  label: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  accept, 
  label, 
  file, 
  onFileSelect, 
  onClear, 
  icon,
  disabled 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full mb-4">
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      
      {!file ? (
        <div 
          onClick={handleClick}
          className={`border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer group hover:border-cyan-500 hover:bg-slate-800 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-cyan-500 mb-2 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200">
            {label}
          </span>
          <span className="text-xs text-slate-600 mt-1">Tap to select</span>
        </div>
      ) : (
        <div className="relative border border-slate-700 bg-slate-800/80 rounded-xl p-4 flex items-center shadow-lg">
          <div className="bg-cyan-900/30 p-2 rounded-lg text-cyan-400 mr-3">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          {!disabled && (
            <button 
              onClick={onClear}
              className="p-2 hover:bg-red-500/20 rounded-full text-slate-500 hover:text-red-400 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;