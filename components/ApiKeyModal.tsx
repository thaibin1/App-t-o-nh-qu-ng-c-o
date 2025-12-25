import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSelectStudioKey: () => void;
  onManualKeySubmit: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSelectStudioKey, onManualKeySubmit }) => {
  const [manualKey, setManualKey] = useState('');

  const handleManualSubmit = () => {
    if (manualKey.trim()) {
      onManualKeySubmit(manualKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 p-4">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-96 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214L13 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            BeautyGen AI Studio
          </h1>
          <p className="text-slate-400 text-center text-sm">
            Sử dụng Gemini 3 Pro để tạo hình ảnh chất lượng cao.
          </p>
        </div>

        {/* AI Studio Button */}
        <button
          onClick={onSelectStudioKey}
          className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 shadow-lg mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700 group-hover:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Chọn Key qua AI Studio</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-700 flex-1"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hoặc nhập thủ công</span>
          <div className="h-px bg-slate-700 flex-1"></div>
        </div>

        {/* Manual Input */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              placeholder="Dán Google API Key vào đây..."
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl py-3.5 pl-10 pr-4 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={!manualKey.trim()}
            className={`w-full font-bold py-3.5 px-4 rounded-xl text-white shadow-lg shadow-purple-900/20 transition-all ${
              manualKey.trim() 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transform hover:-translate-y-0.5' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Bắt đầu sử dụng
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 mb-1">
            Yêu cầu dự án Google Cloud có liên kết thanh toán.
          </p>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
          >
            Lấy API Key tại đây
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;