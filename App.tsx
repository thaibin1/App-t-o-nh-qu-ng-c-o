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
  clearApiKey
} from './services/geminiService';

const STYLES = [
  // --- Original ---
  { id: 'clean_minimalist', label: 'Minimalist', desc: 'Trắng tinh khiết, lành tính', icon: '☁️' },
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

  // --- Previous Updates ---
  { id: 'moody_dark', label: 'Moody Dark', desc: 'Trầm, bí ẩn, nền tối', icon: '🌑' },
  { id: 'glow_luxury', label: 'Glow Luxury', desc: 'Sang chảnh, lấp lánh', icon: '💫' },
  { id: 'zen_wellness', label: 'Zen Spa', desc: 'Thư giãn, đá, gỗ, thiền', icon: '🎋' },
  { id: 'color_pop', label: 'Color Pop', desc: 'Nổi bật, Gen Z, màu mạnh', icon: '🌈' },
  { id: 'ice_fresh', label: 'Ice Cool', desc: 'Mát lạnh, băng tuyết', icon: '🧊' },
  { id: 'organic_raw', label: 'Organic Raw', desc: 'Thô mộc, handmade', icon: '🪵' },
  { id: 'glass_art', label: 'Glass Art', desc: 'Khúc xạ, nghệ thuật kính', icon: '🔮' },
  { id: 'time_concept', label: 'Time / Aging', desc: 'Thời gian, chống lão hóa', icon: '⏳' },
  { id: 'futuristic_tech', label: 'Hi-Tech', desc: 'Công nghệ, tương lai, Neon', icon: '🧬' },
  { id: 'product_hero', label: 'Product Hero', desc: 'Ảnh sản phẩm nền trơn', icon: '📦' },

  // --- New Additions (21-35) ---
  { id: 'surreal_dreamy', label: 'Surreal Dreamy', desc: 'Mơ mộng, khói, vải bay', icon: '🧞' },
  { id: 'abstract_geometry', label: 'Geometry', desc: 'Hình khối, hiện đại, line mạnh', icon: '🟥' },
  { id: 'cosmic_galaxy', label: 'Cosmic Galaxy', desc: 'Vũ trụ, bí ẩn, ánh tím', icon: '🪐' },
  { id: 'stone_mineral', label: 'Stone Mineral', desc: 'Đá, khoáng chất, cứng cáp', icon: '🪨' },
  { id: 'airy_flow', label: 'Airy Flow', desc: 'Nhẹ, thoáng, vải bay', icon: '🌬️' },
  { id: 'contrast_light', label: 'Hard Light', desc: 'Bóng đổ gắt, cá tính', icon: '🌗' },
  { id: 'monochrome_mood', label: 'Monochrome', desc: 'Một màu chủ đạo, tinh tế', icon: '⚫' },
  { id: 'wabi_sabi', label: 'Wabi-Sabi', desc: 'Tĩnh, mộc mạc, không hoàn hảo', icon: '🍵' },
  { id: 'crystal_prism', label: 'Crystal Prism', desc: 'Lăng kính, cầu vồng', icon: '🌈' },
  { id: 'urban_concrete', label: 'Urban Concrete', desc: 'Bê tông, thành thị, mạnh mẽ', icon: '🏢' },
  { id: 'routine_flatlay', label: 'Flatlay', desc: 'Góc chụp từ trên xuống', icon: '📸' },
  { id: 'science_diagram', label: 'Science Diagram', desc: 'Mô hình, học thuật, mũi tên', icon: '🔬' },
  { id: 'emotional_skin', label: 'Emotional Skin', desc: 'Cận cảnh da, cảm xúc', icon: '😌' },
  { id: 'minimal_silence', label: 'Silence Space', desc: 'Khoảng trống, tĩnh lặng', icon: '🕊️' },
  { id: 'deconstructed', label: 'Deconstructed', desc: 'Tách lớp, bay lơ lửng', icon: '🧩' },
];

const App: React.FC = () => {
  // State
  const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
  const [productImage1, setProductImage1] = useState<UploadedFile | null>(null);
  const [productImage2, setProductImage2] = useState<UploadedFile | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedFile | null>(null);
  
  const [prompt, setPrompt] = useState<string>("");
  const [posterText, setPosterText] = useState<string>(""); 
  
  // Model Tier: Pro (Gemini 3) vs Standard (Gemini 2.5)
  const [modelTier, setModelTier] = useState<ModelTier>('pro');

  const [resolution, setResolution] = useState<Resolution>(Resolution.RES_2K);
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('clean_minimalist');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  // New state for image count
  const [imageCount, setImageCount] = useState<number>(4);

  const [isPosterMode, setIsPosterMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  
  // Image Viewer Modal State
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Track individual image loading states (by ID)
  const [updatingImages, setUpdatingImages] = useState<Set<string>>(new Set());

  // Check API Key on mount
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

  const handleGenerate = async () => {
    if (!apiKeyReady) return;

    const productImages = [productImage1, productImage2].filter(p => p !== null) as UploadedFile[];

    if (!prompt && !modelImage && productImages.length === 0 && !referenceImage && !posterText) {
      alert("Vui lòng nhập mô tả hoặc tải lên ít nhất một bức ảnh.");
      return;
    }

    setIsGenerating(true);
    try {
      const imagesBase64 = await generateBeautyImages(
        modelImage, 
        productImages, 
        referenceImage,
        prompt,
        posterText, 
        resolution, 
        outputStyle, 
        aspectRatio,
        isPosterMode,
        modelTier,
        imageCount // Pass the selected count
      );
      
      const newImages: GeneratedImage[] = imagesBase64.map((b64) => ({
        id: crypto.randomUUID(),
        url: b64,
        resolution: resolution,
        style: outputStyle,
        aspectRatio: aspectRatio,
        modelTier: modelTier,
        createdAt: Date.now(),
      }));

      setGeneratedImages(prev => [...newImages, ...prev]);

    } catch (error: any) {
      console.error(error);
      if (error.message === "AUTH_ERROR" || error.message?.includes("403") || error.message === "MISSING_API_KEY") {
        alert("API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng nhập key mới.");
        handleChangeKey(); 
      } else {
        alert("Đã xảy ra lỗi khi tạo ảnh: " + (error.message || "Lỗi không xác định"));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateOne = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); 
    setUpdatingImages(prev => new Set(prev).add(id));
    
    const productImages = [productImage1, productImage2].filter(p => p !== null) as UploadedFile[];

    try {
      // Regenerate using the CURRENT settings (including model tier)
      const newUrl = await generateSingleBeautyImage(
        modelImage, 
        productImages,
        referenceImage,
        prompt, 
        posterText, 
        resolution, 
        outputStyle, 
        aspectRatio,
        isPosterMode,
        modelTier
      );
      
      if (newUrl) {
        setGeneratedImages(prev => prev.map(img => 
          img.id === id ? { ...img, url: newUrl, resolution: resolution, style: outputStyle, aspectRatio: aspectRatio, modelTier: modelTier } : img
        ));
      } else {
        alert("Không thể tạo lại ảnh. Có thể do lỗi kết nối hoặc API Key.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === "AUTH_ERROR" || error.message === "MISSING_API_KEY") {
        alert("API Key hết hạn hoặc không có quyền. Vui lòng nhập lại.");
        handleChangeKey();
      }
    } finally {
      setUpdatingImages(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
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

  if (!apiKeyReady) {
    return (
      <ApiKeyModal 
        onSelectStudioKey={handleSelectKey}
        onManualKeySubmit={handleManualKey}
      />
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-2xl font-serif font-bold text-rose-900 tracking-tight">BeautyGen AI</h1>
          </div>
          <button 
            onClick={handleChangeKey}
            className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-full transition-colors flex items-center gap-2 border border-rose-100"
          >
            Đổi Key
          </button>
        </div>
      </header>

      <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls (Reorganized) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              
              {/* SECTION 1: CẤU HÌNH CƠ BẢN */}
              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50">
                <div className="flex justify-between items-center">
                   <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                     1. Cấu hình AI
                   </h2>
                </div>

                <div className="flex flex-col gap-3">
                   {/* Model Tier */}
                   <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setModelTier('standard')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        modelTier === 'standard'
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                          : 'text-gray-500 hover:text-indigo-600'
                      }`}
                    >
                      <span>⚡ G-2.5 (Free)</span>
                    </button>
                    <button
                      onClick={() => setModelTier('pro')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        modelTier === 'pro'
                          ? 'bg-white text-rose-600 shadow-sm ring-1 ring-rose-100'
                          : 'text-gray-500 hover:text-rose-600'
                      }`}
                    >
                      <span>👑 G-3.0 (Pro)</span>
                    </button>
                  </div>

                  {/* Mode Toggle */}
                  <div className="p-1 bg-rose-50 rounded-xl flex shadow-inner">
                    <button 
                      onClick={() => setIsPosterMode(false)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !isPosterMode 
                          ? 'bg-white text-rose-600 shadow-sm ring-1 ring-rose-100' 
                          : 'text-gray-500 hover:text-rose-600'
                      }`}
                    >
                      📸 Chụp Ảnh
                    </button>
                    <button 
                      onClick={() => setIsPosterMode(true)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isPosterMode 
                          ? 'bg-white text-rose-600 shadow-sm ring-1 ring-rose-100' 
                          : 'text-gray-500 hover:text-rose-600'
                      }`}
                    >
                      🎨 Poster
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INPUT DATA */}
              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50">
                 <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                   2. Tải lên hình ảnh
                 </h2>
                 <div className="space-y-4">
                  <ImageUploader 
                    label="Ảnh Người Mẫu" 
                    subLabel="Tải ảnh người mẫu nếu bạn muốn giữ gương mặt/dáng người (Tùy chọn)"
                    fileData={modelImage} 
                    onFileSelect={setModelImage}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <ImageUploader 
                      label="Sản Phẩm 1 (Chính)" 
                      subLabel="Ảnh sản phẩm rõ nét, nền sạch"
                      fileData={productImage1} 
                      onFileSelect={setProductImage1}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    />
                    <ImageUploader 
                      label="Sản Phẩm 2 (Phụ)" 
                      subLabel="Sản phẩm đi kèm (Tùy chọn)"
                      fileData={productImage2} 
                      onFileSelect={setProductImage2}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                  </div>
                  
                  {/* Styled Collapsible for Reference Image to save space if empty */}
                  <div>
                     <ImageUploader 
                      label="Ảnh Tham Khảo Style" 
                      subLabel="AI sẽ học ánh sáng và màu sắc từ ảnh này (Tùy chọn)"
                      fileData={referenceImage} 
                      onFileSelect={setReferenceImage}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PHONG CÁCH & FORMAT (Restored Grid) */}
              <div className="space-y-4 mb-6 pb-6 border-b border-rose-50 relative z-30">
                 <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                   3. Phong cách & Định dạng
                 </h2>

                 {/* Style Grid Container */}
                 <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {STYLES.map((style, index) => (
                    <button
                      key={style.id}
                      onClick={() => setOutputStyle(style.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 relative group ${
                        outputStyle === style.id 
                          ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500 shadow-sm' 
                          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{style.icon}</span>
                        <div className="flex flex-col items-start">
                           <span className="text-[10px] text-gray-400 font-mono font-bold leading-none mb-0.5">#{index + 1}</span>
                           <span className={`text-xs font-bold leading-tight ${outputStyle === style.id ? 'text-rose-700' : 'text-gray-800'}`}>
                             {style.label}
                           </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        {style.desc}
                      </p>
                      {outputStyle === style.id && (
                        <div className="absolute top-2 right-2 text-rose-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                 {/* Aspect Ratio & Resolution Grid */}
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    {/* Ratio */}
                    <div>
                      <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Tỉ lệ khung hình</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['1:1', '3:4', '9:16', '16:9'].map((r) => (
                          <button
                            key={r}
                            onClick={() => setAspectRatio(r as AspectRatio)}
                            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              aspectRatio === r
                                ? 'bg-rose-500 text-white border-rose-500'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Chất lượng</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setResolution(Resolution.RES_2K)}
                          disabled={modelTier === 'standard'}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            resolution === Resolution.RES_2K 
                              ? 'bg-rose-600 text-white border-rose-600' 
                              : 'bg-white text-gray-600 border-gray-200'
                          } ${modelTier === 'standard' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          2K
                        </button>
                        <button
                          onClick={() => setResolution(Resolution.RES_4K)}
                          disabled={modelTier === 'standard'}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            resolution === Resolution.RES_4K 
                              ? 'bg-rose-600 text-white border-rose-600' 
                              : 'bg-white text-gray-600 border-gray-200'
                          } ${modelTier === 'standard' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          4K
                        </button>
                      </div>
                      {modelTier === 'standard' && <div className="text-[9px] text-red-500 mt-1 text-center font-medium">*Cần bản Pro</div>}
                    </div>
                 </div>

                 {/* Image Count Selector */}
                 <div>
                    <label className="block text-xs font-semibold text-rose-800 mb-1.5 ml-1">Số lượng ảnh cần tạo</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => setImageCount(count)}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            imageCount === count
                              ? 'bg-rose-500 text-white border-rose-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* SECTION 4: TEXT & ACTION */}
              <div className="space-y-4">
                 <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
                   4. Mô tả & Tạo ảnh
                 </h2>
                 
                 <div>
                    <label className="block text-sm font-semibold text-rose-900 mb-1.5 ml-1">
                      Mô tả chi tiết ý tưởng (Prompt)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ví dụ: Một chai serum vàng kim lấp lánh đặt trên bệ đá cẩm thạch trắng, xung quanh là những lát chanh tươi và tia nước bắn tung tóe. Ánh sáng nắng sớm rực rỡ, tạo cảm giác tươi mới và sang trọng..."
                      className="w-full rounded-xl border-gray-200 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all text-sm p-3 min-h-[100px] placeholder-gray-400 leading-relaxed"
                    />
                  </div>

                  {isPosterMode && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-semibold text-rose-900 mb-1.5 ml-1">
                         Nội dung Text trên Poster <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={posterText}
                        onChange={(e) => setPosterText(e.target.value)}
                        placeholder="Ví dụ: SUMMER SALE 50%, NEW ARRIVAL, MERRY CHRISTMAS..."
                        className="w-full rounded-xl border-2 border-rose-100 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all text-sm px-3 py-3 font-medium text-rose-900 placeholder-rose-300"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 mt-2 ${
                      isGenerating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : modelTier === 'standard' 
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-200'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang Xử Lý...
                      </span>
                    ) : (
                      <span>
                        {isPosterMode ? '✨ Tạo Poster Ngay' : '✨ Tạo Ảnh Ngay'} 
                      </span>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-400">
                    Sử dụng {modelTier === 'standard' ? 'Gemini 2.5 (Tiết kiệm)' : 'Gemini 3 Pro (Chất lượng cao)'}
                  </p>
              </div>

            </div>
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 min-h-[600px]">
              <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-rose-900">
                  Thư Viện Kết Quả
                </h2>
                <span className="text-sm text-gray-500">
                  {generatedImages.length} tác phẩm
                </span>
              </div>

              {generatedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🎨</span>
                  </div>
                  <p className="text-lg font-medium text-gray-500">Chưa có hình ảnh nào được tạo</p>
                  <p className="text-sm">Hãy cấu hình ở menu bên trái và nhấn Tạo.</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
                  {generatedImages.map((img) => {
                    const isUpdating = updatingImages.has(img.id);
                    const styleLabel = STYLES.find(s => s.id === img.style)?.label || img.style;
                    
                    return (
                      <div 
                        key={img.id} 
                        onClick={() => setSelectedImage(img)}
                        className={`group relative bg-gray-100 rounded-xl overflow-hidden shadow-md cursor-zoom-in ${getAspectClass(img.aspectRatio)}`}
                      >
                        {/* Image */}
                        <img
                          src={img.url}
                          alt="AI Generated Cosmetic"
                          className={`w-full h-full object-cover transform transition-transform duration-700 ease-in-out origin-center ${isUpdating ? 'scale-105 blur-sm brightness-75' : 'group-hover:scale-125'}`}
                        />
                        
                        {/* Loading Overlay */}
                        {isUpdating && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <svg className="animate-spin h-10 w-10 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-white font-medium text-sm drop-shadow-md">Đang xử lý...</span>
                          </div>
                        )}

                        {/* Controls Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-30 ${isUpdating ? 'hidden' : ''}`}>
                          
                          {/* Top Controls */}
                          <div className="flex justify-between items-start">
                             <div className="flex gap-1 flex-wrap">
                                <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                  {img.resolution}
                                </span>
                                <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                  {img.aspectRatio}
                                </span>
                                <span className={`text-white text-xs font-mono px-2 py-1 rounded backdrop-blur-sm border border-white/10 uppercase ${img.modelTier === 'standard' ? 'bg-indigo-600/80' : 'bg-rose-600/80'}`}>
                                  {img.modelTier === 'standard' ? 'G2.5' : 'G3.0'}
                                </span>
                             </div>
                            
                            {/* Regenerate Button */}
                            <button
                              onClick={(e) => handleRegenerateOne(img.id, e)}
                              className="bg-white/20 hover:bg-white text-white hover:text-rose-600 p-2 rounded-full backdrop-blur-md transition-all shadow-lg ml-2 shrink-0"
                              title="Tạo lại ảnh này với cấu hình hiện tại"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>

                          {/* Bottom Controls (Just Download now) */}
                          <div className="flex items-center gap-2 justify-end relative">
                            <span className="text-white/80 text-xs mr-auto font-medium bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                              Nhấn để phóng to
                            </span>
                            <a 
                              href={img.url} 
                              download={`beauty-gen-${img.id}.png`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 shadow-lg"
                              title="Tải xuống"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Full Screen Image Modal */}
      <ImageModal 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage?.url || null} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
};

export default App;