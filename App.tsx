
import React, { useState, useEffect } from 'react';
import { Resolution, UploadedFile, GeneratedImage, OutputStyle, AspectRatio, ModelTier } from './types';
import ImageUploader from './components/ImageUploader';
import ApiKeyModal from './components/ApiKeyModal';
import ImageModal from './components/ImageModal';
import { 
  generateBeautyImages, 
  generateSingleBeautyImage, 
  ensureApiKey, 
  promptSelectKey,
  setManualApiKey,
  clearApiKey,
  sliceImageIntoFour 
} from './services/geminiService';

const STYLES = [
  { id: 'clean_minimalist', label: 'Minimalist', desc: 'Trắng tinh khiết, lành tính', icon: '☁️' },
  { id: 'gold_glamour', label: 'Vàng Ánh Kim', desc: 'Sang trọng, quý tộc, ánh vàng', icon: '📀' },
  { id: 'noel_christmas', label: 'Noel / Xmas', desc: 'Giáng sinh, rực rỡ, ấm áp', icon: '🎄' },
  { id: 'clinical_lab', label: 'Clinical Lab', desc: 'Phòng Lab, khoa học', icon: '🧪' },
  { id: 'skincare_glow', label: 'Skincare Glow', desc: 'Bóng mướt, đọng nước', icon: '✨' },
  { id: 'botanical_organic', label: 'Botanical', desc: 'Thiên nhiên, gỗ, lá', icon: '🌿' },
  { id: 'premium_luxury', label: 'Premium', desc: 'Sang trọng, tối màu', icon: '💎' },
  { id: 'soft_pastel', label: 'Soft Pastel', desc: 'Dễ thương, trẻ trung', icon: '🌸' },
  { id: 'water_motion', label: 'Water Motion', desc: 'Nước bắn tung tóe', icon: '💧' },
  { id: 'texture_macro', label: 'Macro Texture', desc: 'Zoom cận chất kem', icon: '🔍' },
  { id: 'mirror_reflection', label: 'Mirror', desc: 'Gương phản chiếu', icon: '🪞' },
  { id: 'lifestyle', label: 'Lifestyle', desc: 'Góc bàn trang điểm', icon: '🪑' },
  { id: 'clinical_blue', label: 'Clinical Blue', desc: 'Xanh y tế uy tín', icon: '💙' },
  { id: 'editorial', label: 'Editorial', desc: 'Tạp chí nghệ thuật', icon: '📰' },
  { id: 'moody_dark', label: 'Moody Dark', desc: 'Trầm, bí ẩn, nền tối', icon: '🌑' },
  { id: 'glow_luxury', label: 'Glow Luxury', desc: 'Sang chảnh, lấp lánh', icon: '💫' },
  { id: 'zen_wellness', label: 'Zen Spa', desc: 'Thư giãn, đá, gỗ, thiền', icon: '🎋' },
  { id: 'color_pop', label: 'Color Pop', desc: 'Nổi bật, Gen Z, màu mạnh', icon: '🌈' },
  { id: 'ice_fresh', label: 'Ice Cool', desc: 'Mát lạnh, băng tuyết', icon: '🧊' },
  { id: 'organic_raw', label: 'Organic Raw', desc: 'Thô mộc, handmade', icon: '🪵' },
  { id: 'glass_art', label: 'Glass Art', desc: 'Khúc xạ, nghệ thuật kính', icon: '🔮' },
  { id: 'surreal_dreamy', label: 'Surreal Dreamy', desc: 'Mơ mộng, khói, vải bay', icon: '🧞' },
];

const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
  const [productImage1, setProductImage1] = useState<UploadedFile | null>(null);
  const [productImage2, setProductImage2] = useState<UploadedFile | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedFile | null>(null);
  
  const [prompt, setPrompt] = useState<string>("");
  const [posterText, setPosterText] = useState<string>(""); 
  const [modelTier, setModelTier] = useState<ModelTier>('pro');
  const [resolution, setResolution] = useState<Resolution>(Resolution.RES_4K);
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('clean_minimalist');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  const [isPosterMode, setIsPosterMode] = useState<boolean>(false);
  const [isGridMode, setIsGridMode] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [updatingImages, setUpdatingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkKey = async () => {
      const ready = await ensureApiKey();
      setApiKeyReady(ready);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await promptSelectKey();
    const ready = await ensureApiKey();
    setApiKeyReady(ready);
  };

  const handleManualKey = async (key: string) => {
    setManualApiKey(key);
    setApiKeyReady(true);
  };

  const handleChangeKey = () => {
    clearApiKey();
    setApiKeyReady(false);
  };

  const handleDeleteImage = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
      setGeneratedImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm("Xóa toàn bộ ảnh trong thư viện?")) {
      setGeneratedImages([]);
    }
  };

  const handleGenerate = async () => {
    if (!apiKeyReady) return;
    
    // TỰ ĐỘNG XÓA ẢNH CŨ KHI BẮT ĐẦU TẠO MỚI
    setGeneratedImages([]);
    
    const productImages = [productImage1, productImage2].filter(p => p !== null) as UploadedFile[];
    setIsGenerating(true);

    try {
      const currentRes = isGridMode ? Resolution.RES_4K : resolution;
      const currentRatio = isGridMode ? '1:1' : aspectRatio;
      const currentCount = isGridMode ? 1 : imageCount;

      const imagesBase64 = await generateBeautyImages(
        modelImage, 
        productImages, 
        referenceImage,
        prompt,
        posterText, 
        currentRes, 
        outputStyle, 
        currentRatio,
        isPosterMode,
        modelTier,
        currentCount
      );
      
      let finalImages: string[] = [];
      
      if (isGridMode && imagesBase64.length > 0) {
        const slices = await sliceImageIntoFour(imagesBase64[0]);
        finalImages = slices;
      } else {
        finalImages = imagesBase64;
      }

      const newImages: GeneratedImage[] = finalImages.map((b64, idx) => ({
        id: crypto.randomUUID(),
        url: b64,
        resolution: currentRes,
        style: outputStyle,
        aspectRatio: currentRatio,
        modelTier: modelTier,
        createdAt: Date.now(),
        label: isGridMode ? `Mảnh ${idx + 1}` : undefined 
      }));

      setGeneratedImages(newImages); // Thay thế hoàn toàn thay vì append

    } catch (error: any) {
      console.error(error);
      if (error.message === "SERVER_BUSY") {
        alert("Server AI đang quá tải (Lỗi 500). Vui lòng thử lại sau 1 phút hoặc thử mô tả ngắn gọn hơn.");
      } else {
        alert("Đã xảy ra lỗi: " + (error.message || "Lỗi không xác định"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateOne = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    setUpdatingImages(prev => new Set(prev).add(id));
    const productImages = [productImage1, productImage2].filter(p => p !== null) as UploadedFile[];
    try {
      const newUrl = await generateSingleBeautyImage(
        modelImage, productImages, referenceImage, prompt, posterText, resolution, outputStyle, aspectRatio, isPosterMode, modelTier
      );
      if (newUrl) {
        setGeneratedImages(prev => prev.map(img => img.id === id ? { ...img, url: newUrl } : img));
      }
    } catch (error: any) {
       console.error(error);
       alert("Không thể tạo lại ảnh lúc này.");
    } finally {
      setUpdatingImages(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '3:4': return 'aspect-[3/4]';
      default: return 'aspect-[3/4]';
    }
  };

  if (!apiKeyReady) return <ApiKeyModal onSelectStudioKey={handleSelectKey} onManualKeySubmit={handleManualKey} />;

  return (
    <div className="min-h-screen bg-rose-50 font-sans text-slate-800 pb-20">
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">✨</span>
            <h1 className="text-2xl font-serif font-bold text-rose-900 tracking-tight">BeautyGen AI</h1>
          </div>
          <button onClick={handleChangeKey} className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full transition-colors border border-rose-100">Đổi Key</button>
        </div>
      </header>

      <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              
              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50">
                <h2 className="text-base font-bold text-rose-900">1. Cấu hình AI & Chế độ</h2>
                <div className="flex flex-col gap-3">
                   <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setModelTier('standard')} className={`py-2 rounded-lg text-xs font-bold transition-all ${modelTier === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>⚡ G-2.5 (Free)</button>
                    <button onClick={() => setModelTier('pro')} className={`py-2 rounded-lg text-xs font-bold transition-all ${modelTier === 'pro' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>👑 G-3.0 (Pro)</button>
                  </div>

                  <div className="grid grid-cols-3 bg-rose-50 p-1 rounded-xl shadow-inner">
                    <button onClick={() => { setIsPosterMode(false); setIsGridMode(false); }} className={`py-2 rounded-lg text-[11px] font-bold transition-all ${!isPosterMode && !isGridMode ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>📸 Chụp Ảnh</button>
                    <button onClick={() => { setIsPosterMode(true); setIsGridMode(false); }} className={`py-2 rounded-lg text-[11px] font-bold transition-all ${isPosterMode ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>🎨 Poster</button>
                    <button onClick={() => { setIsGridMode(true); setIsPosterMode(false); }} className={`py-2 rounded-lg text-[11px] font-bold transition-all ${isGridMode ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}>🧩 Album 2x2</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50">
                 <h2 className="text-base font-bold text-rose-900">2. Tải lên hình ảnh</h2>
                 <ImageUploader label="Ảnh Người Mẫu" subLabel="Giữ gương mặt/dáng người (Tùy chọn)" fileData={modelImage} onFileSelect={setModelImage} />
                 <div className="grid grid-cols-2 gap-3">
                    <ImageUploader label="Sản Phẩm 1" subLabel="Ảnh chính" fileData={productImage1} onFileSelect={setProductImage1} />
                    <ImageUploader label="Sản Phẩm 2" subLabel="Tùy chọn" fileData={productImage2} onFileSelect={setProductImage2} />
                 </div>
                 <ImageUploader label="Ảnh Tham Khảo Style" subLabel="Học ánh sáng/màu sắc (Tùy chọn)" fileData={referenceImage} onFileSelect={setReferenceImage} />
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50 relative z-30">
                 <h2 className="text-base font-bold text-rose-900">3. Phong cách & Định dạng</h2>
                 <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {STYLES.map((style) => (
                    <button key={style.id} onClick={() => setOutputStyle(style.id)} className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${outputStyle === style.id ? 'bg-rose-50 border-rose-500 ring-1' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{style.icon}</span>
                        <span className={`text-xs font-bold ${outputStyle === style.id ? 'text-rose-700' : 'text-gray-800'}`}>{style.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{style.desc}</p>
                    </button>
                  ))}
                </div>

                 {!isGridMode && (
                   <>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Tỉ lệ</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['1:1', '3:4', '9:16', '16:9'].map((r) => (
                            <button key={r} onClick={() => setAspectRatio(r as AspectRatio)} className={`py-1.5 rounded-lg text-xs font-bold border ${aspectRatio === r ? 'bg-rose-500 text-white' : 'bg-white text-gray-500'}`}>{r}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Chất lượng</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => setResolution(Resolution.RES_2K)} disabled={modelTier === 'standard'} className={`py-1.5 rounded-lg text-xs font-bold border ${resolution === Resolution.RES_2K ? 'bg-rose-600 text-white' : 'bg-white'}`}>2K</button>
                          <button onClick={() => setResolution(Resolution.RES_4K)} disabled={modelTier === 'standard'} className={`py-1.5 rounded-lg text-xs font-bold border ${resolution === Resolution.RES_4K ? 'bg-rose-600 text-white' : 'bg-white'}`}>4K</button>
                        </div>
                      </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Số lượng ảnh (Xử lý tuần tự)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((count) => (
                            <button key={count} onClick={() => setImageCount(count)} className={`py-1.5 rounded-lg text-xs font-bold border ${imageCount === count ? 'bg-rose-500 text-white' : 'bg-white text-gray-500'}`}>{count}</button>
                          ))}
                        </div>
                    </div>
                   </>
                 )}
                 {isGridMode && (
                   <div className="bg-rose-100/50 p-3 rounded-xl border border-rose-200">
                     <p className="text-[11px] text-rose-700 font-medium">
                       ✨ <b>Chế độ Puzzle:</b> Hệ thống sẽ tạo 1 ảnh vuông 4K và tự động cắt thành 4 mảnh ghép hoàn hảo để đăng Facebook Album.
                     </p>
                   </div>
                 )}
              </div>

              <div className="space-y-4">
                 <h2 className="text-base font-bold text-rose-900">4. Mô tả & Tạo ảnh</h2>
                 <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mô tả ý tưởng..." className="w-full rounded-xl border-gray-200 focus:border-rose-500 focus:ring focus:ring-rose-200 text-sm p-3 min-h-[100px]" />
                 {(isPosterMode) && (
                    <input type="text" value={posterText} onChange={(e) => setPosterText(e.target.value)} placeholder="Nội dung chữ trên ảnh..." className="w-full rounded-xl border-2 border-rose-100 focus:border-rose-500 text-sm px-3 py-3" />
                 )}
                 <button onClick={handleGenerate} disabled={isGenerating} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 shadow-rose-200 hover:shadow-rose-300'}`}>
                    {isGenerating ? '🪄 Phép màu đang đến...' : isGridMode ? '✨ Tạo Album Puzzle 2x2' : '✨ Tạo Ảnh Ngay'}
                 </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 min-h-[600px] relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-rose-900">Thư Viện Kết Quả</h2>
                <div className="flex items-center gap-4">
                   <span className="text-sm text-gray-500">{generatedImages.length} ảnh</span>
                   {generatedImages.length > 0 && (
                     <button onClick={handleClearAll} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Xoá tất cả</button>
                   )}
                </div>
              </div>

              {/* GIAO DIỆN LOADING CUTE */}
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[500px] space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                    <div className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                       <span className="text-6xl">🎨</span>
                    </div>
                    {/* Floating hearts */}
                    <div className="absolute -top-4 -right-2 text-rose-400 animate-bounce delay-75">❤️</div>
                    <div className="absolute top-8 -left-6 text-rose-300 animate-bounce delay-150 text-xl">✨</div>
                    <div className="absolute -bottom-2 -left-2 text-rose-500 animate-pulse text-sm">💕</div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-serif font-bold text-rose-700">Đang tạo ảnh rồi,</p>
                    <p className="text-lg font-medium text-rose-500 italic">đợi một xíu nhé ^^</p>
                    <div className="flex justify-center gap-1 mt-4">
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              ) : generatedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-4 opacity-50"><span className="text-4xl">📸</span></div>
                  <p className="text-lg font-medium">Bắt đầu sáng tạo thôi nào!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                  {generatedImages.map((img) => (
                    <div key={img.id} onClick={() => setSelectedImage(img)} className={`group relative bg-gray-100 rounded-xl overflow-hidden shadow-md cursor-zoom-in ${getAspectClass(img.aspectRatio)} hover:shadow-xl transition-all`}>
                      <img src={img.url} alt="AI Result" className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
                      {img.label && <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">{img.label}</div>}
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between z-20">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => handleDeleteImage(img.id, e)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg pointer-events-auto"
                            title="Xóa ảnh này"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-white text-[10px] font-bold bg-black/40 px-2 py-1 rounded">{img.resolution} | {img.aspectRatio}</span>
                          <div className="flex gap-2">
                             <button
                                onClick={(e) => handleRegenerateOne(img.id, e)}
                                className="bg-white/20 hover:bg-white text-white hover:text-rose-600 p-2 rounded-full backdrop-blur-md transition-all shadow-lg pointer-events-auto"
                                title="Tạo lại ảnh"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <a href={img.url} download={`beauty-gen-${img.id}.png`} onClick={(e) => e.stopPropagation()} className="bg-white text-rose-600 p-2 rounded-full hover:bg-rose-50 shadow-lg pointer-events-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <ImageModal isOpen={!!selectedImage} imageUrl={selectedImage?.url || null} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default App;
