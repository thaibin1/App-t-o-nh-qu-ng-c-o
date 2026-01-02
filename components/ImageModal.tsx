
import React, { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageId: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, imageId, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleShare = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `beautygen-${imageId}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'BeautyGen AI Artwork',
          text: 'Look at this amazing cosmetic ad I created with BeautyGen AI! ✨',
        });
      } else {
        alert("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Hãy tải ảnh về nhé!");
      }
    } catch (err) {
      console.error("Error sharing from modal:", err);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-white/20 rounded-full p-2 transition-all z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div 
        className="relative max-w-[95vw] max-h-[90vh] p-2 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Full size view" 
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        
        <div className="mt-8 flex gap-4">
          <button 
            onClick={handleShare}
            className="bg-rose-500 text-white hover:bg-rose-400 px-8 py-3 rounded-full font-bold shadow-xl transition-transform hover:-translate-y-1 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Chia Sẻ
          </button>
          <a 
            href={imageUrl} 
            download={`beautygen-${imageId}.png`}
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-full font-bold shadow-xl transition-transform hover:-translate-y-1 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải Ảnh Gốc
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
