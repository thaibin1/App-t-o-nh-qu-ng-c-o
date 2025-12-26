import { GoogleGenAI } from "@google/genai";
import { Resolution, UploadedFile, OutputStyle, AspectRatio, ModelTier } from "../types";

const LOCAL_STORAGE_KEY = 'beauty_gen_api_key';
let manualApiKey: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;

export const setManualApiKey = (key: string) => {
  manualApiKey = key;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, key);
  }
};

export const clearApiKey = () => {
  manualApiKey = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};

export const ensureApiKey = async (): Promise<boolean> => {
  if (manualApiKey) return true;
  if (process.env.API_KEY) return true;
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptSelectKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const getAiClient = () => {
  const apiKey = manualApiKey || process.env.API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");
  return new GoogleGenAI({ apiKey });
};

const handleApiError = (err: any) => {
  console.error("Gemini API Error Detail:", err);
  const msg = err.message || "";
  if (msg.includes("403") || msg.includes("permission")) throw new Error("AUTH_ERROR");
  if (msg.includes("500") || msg.includes("INTERNAL")) throw new Error("SERVER_BUSY");
  throw err;
};

export const sliceImageIntoFour = (base64Data: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = Math.min(img.width, img.height);
        const halfSize = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = halfSize;
        canvas.height = halfSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context error");

        const slices: string[] = [];
        const coords = [
          { x: 0, y: 0 },
          { x: halfSize, y: 0 },
          { x: 0, y: halfSize },
          { x: halfSize, y: halfSize }
        ];

        coords.forEach(pos => {
          ctx.clearRect(0, 0, halfSize, halfSize);
          ctx.drawImage(img, pos.x, pos.y, halfSize, halfSize, 0, 0, halfSize, halfSize);
          slices.push(canvas.toDataURL('image/png'));
        });

        resolve(slices);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = base64Data;
  });
};

const STYLE_PROMPTS: Record<string, string> = {
  'clean_minimalist': "Style: Clean Beauty – Minimalist. Background: White or pale pastel, clean lighting, soft shadows.",
  'gold_glamour': "Style: Gold Luxury Aesthetic. Visuals: High-end metallic gold accents, golden reflective surfaces, warm luxurious lighting, premium expensive feel, soft gold bokeh in background.",
  'clinical_lab': "Style: Clinical Lab. Visuals: Test tubes, beakers, laboratory glassware.",
  'skincare_glow': "Style: Skincare Glow. Visuals: Strong highlights, water gloss, dewy texture.",
  'botanical_organic': "Style: Botanical / Organic. Visuals: Green leaves, raw wood textures.",
  'premium_luxury': "Style: Premium High-End. Background: Dark tones, Gold/Silver accents.",
  'soft_pastel': "Style: Soft Pastel / Cute. Colors: Pastel pink, lilac purple.",
  'water_motion': "Style: Splash / Water Motion. Visuals: Dynamic water splashes.",
  'texture_macro': "Style: Texture Shot (Macro). Focus: Close-up of cream swatches or gel smears.",
  'mirror_reflection': "Style: Mirror Reflection. Visuals: Sharp reflections on glass.",
  'lifestyle': "Style: Lifestyle Beauty. Setting: Vanity table, cozy bathroom.",
  'clinical_blue': "Style: Clinical Blue Gradient. Trustworthy pharmacy aesthetic.",
  'editorial': "Style: Aesthetic Editorial. Artistic cropping, avant-garde.",
  'noel_christmas': "Style: Christmas. Pine cones, ribbons, warm magical lights.",
  'moody_dark': "Style: Moody Dark Aesthetic. Chiaroscuro lighting.",
  'glow_luxury': "Style: Glow Luxury. High-gloss surfaces.",
  'zen_wellness': "Style: Zen Spa. Smooth river stones, bamboo.",
  'color_pop': "Style: Pop Color Block. Vibrant, high-saturation.",
  'ice_fresh': "Style: Ice / Cool Fresh. Ice cubes, frost texture.",
  'organic_raw': "Style: Organic Raw. Raw linen, handcrafted look.",
  'glass_art': "Style: Glass Art Reflection. Prisms, distorted refraction.",
  'surreal_dreamy': "Style: Surreal / Dreamy. Floating fabrics, magical smoke.",
};

const constructParts = (modelImage: UploadedFile | null, productImages: UploadedFile[], referenceImage: UploadedFile | null, prompt: string, posterText: string, style: OutputStyle, isPoster: boolean) => {
  const parts: any[] = [];
  
  // Tối ưu prompt: Đưa Text lên đầu để AI chú ý hơn
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['clean_minimalist'];
  let basePrompt = `Task: Create a stunning high-quality professional cosmetic advertisement image.
    Style: ${stylePrompt}
    ${referenceImage ? 'Instruction: Strictly follow the LIGHTING, COLOR PALETTE, and OVERALL MOOD of the provided style reference image.' : ''}
    Description: ${prompt}
    ${isPoster && posterText.trim() ? `Overlay Text: Add the text "${posterText}" aesthetically on the image.` : ''}
    Note: Ensure products look sharp and realistic. Background must be professional and cohesive.`;
    
  parts.push({ text: basePrompt });

  // Thêm ảnh dữ liệu
  if (modelImage) parts.push({ inlineData: { data: modelImage.base64.includes(',') ? modelImage.base64.split(',')[1] : modelImage.base64, mimeType: modelImage.mimeType } });
  productImages.forEach((img) => parts.push({ inlineData: { data: img.base64.includes(',') ? img.base64.split(',')[1] : img.base64, mimeType: img.mimeType } }));
  if (referenceImage) parts.push({ inlineData: { data: referenceImage.base64.includes(',') ? referenceImage.base64.split(',')[1] : referenceImage.base64, mimeType: referenceImage.mimeType } });

  return parts;
};

// Hàm tạo ảnh đơn có cơ chế Retry
export const generateSingleBeautyImage = async (
  modelImage: UploadedFile | null, 
  productImages: UploadedFile[], 
  referenceImage: UploadedFile | null, 
  prompt: string, 
  posterText: string, 
  resolution: Resolution, 
  style: OutputStyle, 
  aspectRatio: AspectRatio, 
  isPoster: boolean, 
  modelTier: ModelTier,
  retries = 1
): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const parts = constructParts(modelImage, productImages, referenceImage, prompt, posterText, style, isPoster);
    const modelName = modelTier === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const config: any = { imageConfig: { aspectRatio } };
    if (modelTier === 'pro') config.imageConfig.imageSize = resolution;

    const response = await ai.models.generateContent({ model: modelName, contents: { parts }, config });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err: any) {
    if (retries > 0 && (err.message?.includes("500") || err.message?.includes("INTERNAL") || err.message?.includes("SERVER_BUSY"))) {
      console.warn("Retrying due to server error...");
      await new Promise(r => setTimeout(r, 2000)); // Đợi 2s rồi thử lại
      return generateSingleBeautyImage(modelImage, productImages, referenceImage, prompt, posterText, resolution, style, aspectRatio, isPoster, modelTier, retries - 1);
    }
    handleApiError(err);
    return null;
  }
};

// Hàm tạo nhiều ảnh XỬ LÝ TUẦN TỰ để tránh lỗi 500
export const generateBeautyImages = async (
  modelImage: UploadedFile | null, 
  productImages: UploadedFile[], 
  referenceImage: UploadedFile | null, 
  prompt: string, 
  posterText: string, 
  resolution: Resolution, 
  style: OutputStyle, 
  aspectRatio: AspectRatio, 
  isPoster: boolean, 
  modelTier: ModelTier, 
  imageCount: number = 1
): Promise<string[]> => {
  const count = Math.max(1, Math.min(4, imageCount));
  const results: string[] = [];
  
  // Chạy tuần tự thay vì Promise.all để giảm tải cho API
  for (let i = 0; i < count; i++) {
    try {
      const res = await generateSingleBeautyImage(
        modelImage, 
        productImages, 
        referenceImage, 
        prompt, 
        posterText, 
        resolution, 
        style, 
        aspectRatio, 
        isPoster, 
        modelTier
      );
      if (res) results.push(res);
    } catch (err) {
      console.error(`Error generating image ${i + 1}:`, err);
      // Nếu lỗi nặng thì dừng luôn để tránh phí quota
      if (i === 0) throw err;
    }
  }
  
  return results;
};