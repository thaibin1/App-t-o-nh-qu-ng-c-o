import React, { useRef } from 'react';
import { UploadedFile } from '../types';
import { fileToBase64 } from '../services/geminiService';

interface ImageUploaderProps {
  label: string;
  subLabel?: string;
  fileData: UploadedFile | null;
  onFileSelect: (data: UploadedFile | null) => void;
  icon?: React.ReactNode;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ label, subLabel, fileData, onFileSelect, icon }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        
        onFileSelect({
          file,
          previewUrl,
          base64,
          mimeType: file.type,
        });
      } catch (err) {
        console.error("Error processing file", err);
      }
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <label className="block text-sm font-semibold text-rose-900 font-sans tracking-wide">
          {label}
        </label>
        {subLabel && (
          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{subLabel}</p>
        )}
      </div>
      
      {!fileData ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-rose-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 transition-colors h-36 bg-white group"
        >
          <div className="text-rose-300 group-hover:text-rose-500 transition-colors mb-2">
            {icon || (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <span className="text-xs text-rose-400 font-medium group-hover:text-rose-600 text-center">
            Nhấn để tải ảnh<br/><span className="text-[10px] opacity-70">(JPG, PNG)</span>
          </span>
        </div>
      ) : (
        <div className="relative group rounded-xl overflow-hidden shadow-md h-36 bg-white">
          <img 
            src={fileData.previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={handleRemove}
              className="bg-white text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-rose-50 transform hover:scale-105 transition-transform"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        ref={inputRef}
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;