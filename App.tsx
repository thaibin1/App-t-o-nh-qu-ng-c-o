
import React, { useState, useEffect } from 'react';
import { Resolution, UploadedFile, GeneratedImage, OutputStyle, AspectRatio, ModelTier, TypographyConfig, BrandConfig } from './types';
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

const FONT_VIBES = [
  { id: 'Pastel & Soft (Beauty/Baby)' },
  { id: 'Premium & Elegant (Serif)' },
  { id: 'Modern & Bold (Sans)' },
  { id: 'Minimalist & Thin' },
  { id: 'Luxury & Gold Calligraphy' }
];

const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<UploadedFile | null>(null);
  const [productImage1, setProductImage1] = useState<UploadedFile | null>(null);
  const [productImage2, setProductImage2] = useState<UploadedFile | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedFile | null>(null);
  
  const [prompt, setPrompt] = useState<string>("");
  const [modelTier, setModelTier] = useState<ModelTier>('pro');
  const [resolution, setResolution] = useState<Resolution>(Resolution.RES_4K);
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('clean_minimalist');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageCount, setImageCount] = useState<number>(1);
  const [isPosterMode, setIsPosterMode] = useState<boolean>(false);
  const [isGridMode, setIsGridMode] = useState<boolean>(false);
  
  const [productScale, setProductScale] = useState<number>(50);

  const [typography, setTypography] = useState<TypographyConfig>({ language: 'VN', vibe: 'Pastel & Soft (Beauty/Baby)', fontReference: null });
  const [brand, setBrand] = useState<BrandConfig>({ colors: '#4B0082, #D8BFD8', hook: '', core: '', proof: '', logo: null });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

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

  const handleShare = async (img: GeneratedImage, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const file = new File([blob], `beautygen-${img.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'BeautyGen AI Artwork',
          text: 'Check out this amazing cosmetic ad I created with BeautyGen AI! ✨',
        });
      } else {
        alert("Trình duyệt không hỗ trợ chia sẻ trực tiếp. Bạn hãy tải ảnh về và chia sẻ thủ công nhé! ✨");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleGenerate = async () => {
    if (!apiKeyReady) return;
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
        currentRes, 
        outputStyle, 
        currentRatio,
        isPosterMode,
        productScale,
        modelTier,
        typography,
        brand,
        currentCount
      );
      
      let finalImages: string[] = [];
      if (isGridMode && imagesBase64.length > 0) {
        finalImages = await sliceImageIntoFour(imagesBase64[0]);
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

      setGeneratedImages(newImages);
    } catch (error: any) {
      alert("Đã xảy ra lỗi: " + (error.message || "Lỗi không xác định"));
    } finally {
      setIsGenerating(false);
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

  const getScaleLabel = (val: number) => {
    if (val <= 30) return "Nhỏ (Tinh tế)";
    if (val >= 70) return "Lớn (Nổi bật)";
    return "Cân đối";
  };

  if (!apiKeyReady) return <ApiKeyModal onSelectStudioKey={handleSelectKey} onManualKeySubmit={handleManualKey} />;

  return (
    <div className="min-h-screen bg-rose-50 font-sans text-slate-900 pb-20">
      <header className="bg-white/80 border-b border-rose-100 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">✨</span>
            <div>
              <h1 className="text-2xl font-serif font-extrabold text-rose-900 tracking-tight leading-none">BeautyGen <span className="text-rose-500 italic">Studio</span></h1>
              <p className="text-[10px] text-rose-300 uppercase tracking-widest mt-1">Professional Cosmetic AI Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-rose-100/30 px-4 py-2 rounded-full border border-rose-100">
               <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
               <span className="text-[10px] font-bold text-rose-700 uppercase">AI System Ready</span>
            </div>
            <button onClick={handleChangeKey} className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-5 py-2.5 rounded-full transition-all uppercase">Đổi API Key</button>
          </div>
        </div>
      </header>

      <main className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-xl space-y-8 sticky top-28 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em]">1. Chế độ hoạt động</h2>
                <div className="grid grid-cols-3 bg-rose-50 p-1.5 rounded-2xl border border-rose-100">
                  <button onClick={() => { setIsPosterMode(false); setIsGridMode(false); }} className={`py-3 rounded-xl text-xs font-bold transition-all ${!isPosterMode && !isGridMode ? 'bg-rose-500 text-white shadow-lg' : 'text-rose-300 hover:text-rose-400'}`}>📸 Chụp Ảnh</button>
                  <button onClick={() => { setIsPosterMode(true); setIsGridMode(false); }} className={`py-3 rounded-xl text-xs font-bold transition-all ${isPosterMode ? 'bg-rose-600 text-white shadow-lg' : 'text-rose-300 hover:text-rose-400'}`}>🎨 Poster</button>
                  <button onClick={() => { setIsGridMode(true); setIsPosterMode(false); }} className={`py-3 rounded-xl text-xs font-bold transition-all ${isGridMode ? 'bg-indigo-500 text-white shadow-lg' : 'text-rose-300 hover:text-rose-400'}`}>🧩 Puzzle 2x2</button>
                </div>
              </div>

              {isPosterMode && (
                <div className="space-y-6 p-6 bg-rose-50 rounded-3xl border border-rose-100">
                   <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-3">
                     <span className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-[10px]">T</span> Typography & Font
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Ngôn ngữ</label>
                       <div className="flex bg-white border border-rose-100 p-1 rounded-xl">
                         <button onClick={() => setTypography({...typography, language: 'VN'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${typography.language === 'VN' ? 'bg-rose-500 text-white' : 'text-rose-300'}`}>VN</button>
                         <button onClick={() => setTypography({...typography, language: 'EN'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${typography.language === 'EN' ? 'bg-rose-500 text-white' : 'text-rose-300'}`}>EN</button>
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">Vibe chữ</label>
                       <select value={typography.vibe} onChange={(e) => setTypography({...typography, vibe: e.target.value})} className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-rose-300">
                         {FONT_VIBES.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                       </select>
                     </div>
                   </div>
                   <ImageUploader label="Ảnh mẫu font chữ" subLabel="AI sẽ bắt chước style này" fileData={typography.fontReference || null} onFileSelect={(f) => setTypography({...typography, fontReference: f})} />
                </div>
              )}

              {isPosterMode && (
                <div className="space-y-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                   <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-3">
                     <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">B</span> Brand Identity
                   </h3>
                   <div className="grid grid-cols-2 gap-4">
                      <ImageUploader label="Logo Brand" fileData={brand.logo || null} onFileSelect={(f) => setBrand({...brand, logo: f})} />
                      <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 uppercase font-bold block">Bảng màu (HEX)</label>
                         <textarea value={brand.colors} onChange={(e) => setBrand({...brand, colors: e.target.value})} className="w-full bg-white border border-rose-100 rounded-xl p-3 text-[10px] outline-none h-28 focus:border-rose-300" placeholder="#FF0000, #000000" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <input value={brand.hook} onChange={(e) => setBrand({...brand, hook: e.target.value})} placeholder="Hook (Headline)..." className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs outline-none focus:border-rose-300" />
                      <textarea value={brand.core} onChange={(e) => setBrand({...brand, core: e.target.value})} placeholder="Main Message..." className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs outline-none h-20 focus:border-rose-300" />
                      <input value={brand.proof} onChange={(e) => setBrand({...brand, proof: e.target.value})} placeholder="Proof/Badge (VD: Hiệu quả sau 4 tuần)..." className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs outline-none focus:border-rose-300" />
                   </div>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest">2. Tài nguyên hình ảnh</h3>
                <div className="space-y-4">
                   {/* Ô Người mẫu chiếm ưu thế ở trên */}
                   <ImageUploader 
                     label="Người mẫu" 
                     fileData={modelImage} 
                     onFileSelect={setModelImage} 
                     heightClass="h-56"
                   />
                   
                   {/* Hai ô sản phẩm nằm cạnh nhau ở dưới */}
                   <div className="grid grid-cols-2 gap-4">
                      <ImageUploader 
                        label="Sản phẩm chính" 
                        fileData={productImage1} 
                        onFileSelect={setProductImage1} 
                        heightClass="h-32"
                      />
                      <ImageUploader 
                        label="Sản phẩm phụ" 
                        fileData={productImage2} 
                        onFileSelect={setProductImage2} 
                        heightClass="h-32"
                      />
                   </div>
                </div>
                <ImageUploader label="Style Reference" subLabel="AI học bố cục/ánh sáng" fileData={referenceImage} onFileSelect={setReferenceImage} />
              </div>

              <div className="space-y-4 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest">3. Tỉ lệ sản phẩm</h3>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded">{getScaleLabel(productScale)}</span>
                 </div>
                 <div className="relative pt-2">
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      value={productScale} 
                      onChange={(e) => setProductScale(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <div className="flex justify-between mt-2 px-1">
                       <span className="text-[9px] text-rose-300 font-bold">NHỎ</span>
                       <span className="text-[9px] text-rose-300 font-bold">CÂN ĐỐI</span>
                       <span className="text-[9px] text-rose-300 font-bold">LỚN</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest">4. Phong cách & Bối cảnh</h3>
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                  {STYLES.map((style) => (
                    <button 
                      key={style.id} 
                      onClick={() => setOutputStyle(style.id)} 
                      className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${outputStyle === style.id ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-300 hover:border-rose-200'}`}
                    >
                      <span className="text-2xl mt-0.5">{style.icon}</span>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-[11px] font-black uppercase tracking-tight leading-none ${outputStyle === style.id ? 'text-white' : 'text-rose-900'}`}>{style.label}</span>
                        <span className={`text-[10px] leading-tight font-medium ${outputStyle === style.id ? 'text-rose-100' : 'text-slate-500'}`}>{style.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {!isGridMode && (
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số lượng ảnh muốn tạo</label>
                        <div className="flex bg-rose-50 p-1 rounded-xl border border-rose-100">
                          {[1, 2, 3, 4].map(num => (
                            <button 
                              key={num} 
                              onClick={() => setImageCount(num)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${imageCount === num ? 'bg-rose-500 text-white shadow-md' : 'text-rose-300 hover:text-rose-400'}`}
                            >
                              {num} ảnh
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tỉ lệ ảnh</label>
                          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs outline-none focus:border-rose-300">
                             {['1:1', '3:4', '9:16', '16:9'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Chất lượng</label>
                          <select value={resolution} onChange={(e) => setResolution(e.target.value as Resolution)} className="w-full bg-white border border-rose-100 rounded-xl p-3 text-xs outline-none focus:border-rose-300">
                             <option value={Resolution.RES_2K}>2K Standard</option>
                             <option value={Resolution.RES_4K}>4K Ultra</option>
                          </select>
                        </div>
                      </div>
                   </div>
                )}

                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mô tả bối cảnh mong muốn..." className="w-full bg-white border border-rose-100 rounded-2xl p-5 text-sm outline-none focus:ring-1 focus:ring-rose-200 min-h-[100px] resize-none" />
                
                <button onClick={handleGenerate} disabled={isGenerating} className={`group relative w-full py-5 rounded-2xl font-black text-white text-sm tracking-[0.2em] shadow-xl transition-all transform active:scale-95 overflow-hidden ${isGenerating ? 'bg-slate-300' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-200'}`}>
                   <span className="relative z-10 uppercase">{isGenerating ? 'Đang xử lý...' : 'Tạo Kiệt Tác'}</span>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white p-10 rounded-[2.5rem] border border-rose-100 min-h-[800px] relative overflow-hidden shadow-xl">
              <div className="flex justify-between items-end mb-12 border-b border-rose-50 pb-8">
                <div>
                   <h2 className="text-3xl font-serif font-black text-rose-900">Studio Visual</h2>
                   <p className="text-xs text-rose-300 mt-2 tracking-widest uppercase font-bold">Thư viện kết quả</p>
                </div>
                {generatedImages.length > 0 && <button onClick={() => setGeneratedImages([])} className="text-[10px] font-bold text-rose-300 hover:text-rose-600 transition-all uppercase tracking-[0.2em]">Xóa tất cả</button>}
              </div>

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[600px] space-y-10 animate-in fade-in zoom-in duration-700">
                  <div className="relative">
                    <div className="w-48 h-48 bg-rose-50 rounded-full flex items-center justify-center animate-pulse border border-rose-100">
                       <span className="text-8xl">🪄</span>
                    </div>
                    <div className="absolute -top-6 -right-4 text-rose-500 animate-bounce text-4xl">❤️</div>
                    <div className="absolute top-16 -left-12 text-rose-400 animate-pulse text-5xl">✨</div>
                    <div className="absolute -bottom-4 left-6 text-rose-200 animate-bounce delay-300 text-3xl">💕</div>
                  </div>
                  <div className="text-center space-y-4">
                    <p className="text-4xl font-serif font-black text-rose-900">Đang tạo ảnh rồi,</p>
                    <p className="text-2xl text-rose-400 italic font-serif">đợi một xíu nhé ^^</p>
                    <div className="flex justify-center gap-3 mt-10">
                      {[0, 100, 200].map(d => <div key={d} className={`w-3 h-3 bg-rose-400 rounded-full animate-bounce`} style={{ animationDelay: `${d}ms` }}></div>)}
                    </div>
                  </div>
                </div>
              ) : generatedImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[600px] text-rose-100">
                  <div className="w-40 h-40 bg-rose-50 rounded-full flex items-center justify-center mb-10 border border-rose-50"><span className="text-6xl opacity-30">🖼️</span></div>
                  <p className="text-2xl font-serif italic text-rose-200">Bắt đầu sáng tạo tại đây...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-bottom-12 duration-1000">
                  {generatedImages.map((img) => (
                    <div key={img.id} onClick={() => setSelectedImage(img)} className={`group relative bg-rose-50 rounded-[2rem] overflow-hidden shadow-xl cursor-zoom-in border border-rose-100 ${getAspectClass(img.aspectRatio)} hover:border-rose-400 transition-all duration-500`}>
                      <img src={img.url} alt="AI Result" className="w-full h-full object-cover transform transition-transform duration-[2000ms] group-hover:scale-110" />
                      {img.label && <div className="absolute top-6 left-6 bg-rose-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black shadow-lg z-10 tracking-widest uppercase">{img.label}</div>}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end z-20">
                        <div className="flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <div className="space-y-1">
                             <span className="text-white text-[10px] font-black uppercase tracking-widest block">{img.resolution} QUALITY</span>
                             <span className="text-rose-200 text-[9px] font-bold block">{img.aspectRatio} RATIO</span>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={(e) => handleShare(img, e)}
                              className="bg-rose-500 text-white p-4 rounded-2xl hover:bg-rose-400 shadow-xl transition-all hover:-translate-y-1"
                              title="Chia sẻ"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                            </button>
                            <a href={img.url} download={`beautygen-${img.id}.png`} onClick={(e) => e.stopPropagation()} className="bg-white text-rose-600 p-4 rounded-2xl hover:bg-rose-50 shadow-xl transition-all hover:-translate-y-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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
      <ImageModal isOpen={!!selectedImage} imageUrl={selectedImage?.url || null} imageId={selectedImage?.id || ''} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default App;
