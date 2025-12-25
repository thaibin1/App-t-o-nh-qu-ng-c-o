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

// Helper to check API Key
export const ensureApiKey = async (): Promise<boolean> => {
  // 1. Check if user manually entered a key
  if (manualApiKey) return true;

  // 2. Check if there is a shared/embedded key in environment variables
  if (process.env.API_KEY) return true;

  // 3. Check for AI Studio injected key
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    return hasKey;
  }
  
  return false;
};

export const promptSelectKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  } else {
    console.warn("Môi trường này không hỗ trợ chọn API Key của Google AI Studio trực tiếp.");
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

// Internal helper to get AI client
const getAiClient = () => {
  const apiKey = manualApiKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Helper to handle API errors globally
const handleApiError = (err: any) => {
  console.error("Gemini API Error:", err);
  const msg = err.message || JSON.stringify(err);
  
  // Check for common permission/auth errors
  if (
    msg.includes("403") || 
    msg.includes("permission denied") || 
    msg.includes("API key not valid") || 
    msg.includes("API_KEY_INVALID") ||
    msg.includes("PERMISSION_DENIED")
  ) {
    throw new Error("AUTH_ERROR"); // Specific code for UI to catch
  }
  
  throw err;
};

// Updated Style Prompts based on user requirements
const STYLE_PROMPTS: Record<string, string> = {
  // --- Original Styles ---
  'clean_minimalist': "Style: Clean Beauty – Minimalist. Background: White or pale pastel, clean lighting, soft shadows. Vibe: Pure, gentle, safe, breathable. Best for: Serums, moisturizers, cleansers.",
  'clinical_lab': "Style: Clinical Lab. Visuals: Test tubes, beakers, laboratory glassware, scientific instruments. Lighting: Cool/Blue clinical lighting, sterile environment. Vibe: Scientific, proven, dermatologically tested, technological.",
  'skincare_glow': "Style: Skincare Glow. Visuals: Strong highlights, water gloss, dewy texture, gel-like surfaces. Details: Water droplets, wet skin look. Vibe: Hydrating, glowing, refreshing, moisture surge.",
  'botanical_organic': "Style: Botanical / Organic. Visuals: Green leaves, raw wood textures, natural stones, linen fabric, earth tones. Lighting: Soft natural sunlight (dappled light). Vibe: Natural, organic, eco-friendly, sustainable.",
  'premium_luxury': "Style: Premium High-End. Background: Dark or deep tones (black, navy, deep red), spot lighting (chiaroscuro). Details: Gold/Silver accents, mirror surfaces, silk/velvet textures. Vibe: Luxurious, expensive, exclusive, night-time elegance.",
  'soft_pastel': "Style: Soft Pastel / Cute. Colors: Pastel pink, mint green, lilac purple, peach. Props: Cute mini props, flowers, marshmallows, clouds. Vibe: Youthful, sweet, soft, dreamy. Best for: Teen makeup, light toners.",
  'water_motion': "Style: Splash / Water Motion. Visuals: Dynamic high-speed water splashes, waves, flying droplets, ripples. Vibe: Energetic, deep hydration, refreshing, cooling sensation.",
  'texture_macro': "Style: Texture Shot (Macro). Focus: Extreme close-up macro shot of the product texture (cream swatches, gel smears, scrub particles, foam bubbles). Detail: High definition material quality, sensory experience.",
  'mirror_reflection': "Style: Mirror Reflection. Visuals: Sharp, crystal-clear reflections on glass or mirror surfaces. Composition: Symmetrical, geometric, clean, premium. Best for: Perfumes, high-end makeup bottles.",
  'lifestyle': "Style: Lifestyle Beauty. Setting: Vanity table, cozy bathroom, soft towels, fresh flowers, mirror, morning sunlight. Vibe: Real-life application, daily routine, cozy, relatable.",
  'clinical_blue': "Style: Clinical Blue Gradient. Colors: Light blue to dark blue gradient background. Lighting: Strong gloss, metallic reflections. Vibe: Medical grade efficacy, trustworthy, hygiene, pharmacy aesthetic.",
  'editorial': "Style: Aesthetic Editorial. Composition: Bold camera angles, artistic cropping, avant-garde fashion props, unusual lighting, shadows. Vibe: Vogue magazine cover, artistic, edgy, fashion-forward.",
  'noel_christmas': "Style: Christmas / Noel Holiday. Colors: Classic Red, Green, Gold, and snowy White. Visuals: Christmas trees, pine cones, ornaments, gift boxes, ribbons, snow, cozy warm fireplace lighting or magical fairy lights. Vibe: Festive, joyful, warm, magical, celebratory.",
  
  // --- Previous Additions ---
  'moody_dark': "Style: Moody Dark Aesthetic. Background: Deep dark tones (charcoal, dark moss, deep navy, black). Lighting: Chiaroscuro, dramatic side lighting, mysterious shadows. Vibe: Mysterious, intense, premium, deep depth. Best for: Night serums, perfumes, luxury skincare.",
  'glow_luxury': "Style: Glow Luxury (Luxury Shine). Visuals: High-gloss surfaces, metallic accents (gold/silver), glass reflections, lens flares. Lighting: Shimmering, golden hour or studio glamour lighting. Vibe: Expensive, radiant, premium, anti-aging, high-status.",
  'zen_wellness': "Style: Zen Spa Wellness. Props: Smooth river stones, light bamboo wood, white towels, still water, orchids, candles. Colors: Beige, soft sage green, earth tones. Vibe: Relaxing, healing, peaceful, detox, mindfulness.",
  'color_pop': "Style: Pop Color Block. Background: Solid, vibrant, high-saturation monochrome colors (bright orange, electric purple, bold red). Lighting: High contrast, hard shadows. Vibe: Gen Z, energetic, trendy, social media ready, striking.",
  'ice_fresh': "Style: Ice / Cool Fresh. Visuals: Ice cubes, frost texture, cold mist, water condensation, glaciers. Colors: Silver, icy blue, white. Vibe: Refreshing, cooling, hydrating, summer relief, fresh sensation.",
  'organic_raw': "Style: Organic Raw / Handmade. Textures: Raw linen, burlap, unpolished wood, clay, dried flowers, kraft paper. Lighting: Natural daylight, soft, unedited look. Vibe: 100% natural, eco-friendly, sustainable, handcrafted, rustic.",
  'glass_art': "Style: Glass Art Reflection. Visuals: Prisms, distorted glass refraction, water caustics, sharp mirror reflections, kaleidoscope effects. Composition: Abstract, artistic, geometric. Vibe: Modern, creative, conceptual, key visual art.",
  'time_concept': "Style: Time & Aging Concept. Props: Hourglasses, sand dunes, flowing silk, soft wrinkles or textures implying time passage. Lighting: Nostalgic, warm, tilted rays, golden hour. Vibe: Anti-aging, timeless beauty, collagen restoration, emotional depth.",
  'futuristic_tech': "Style: Futuristic Hi-Tech. Visuals: Neon LED lines, circuit board patterns, floating elements, metallic gradients, laser lights. Colors: Cyberpunk neon, ultraviolet, electric blue. Vibe: Advanced science, bio-tech, lab-grown ingredients, next-gen skincare.",
  'product_hero': "Style: Product Hero (E-commerce Focus). Composition: Product is the absolute center (80% frame). Background: Neutral, clean, non-distracting studio infinite white or light grey. Lighting: Perfect commercial lighting, soft box, no shadows on label. Vibe: Clear, trustworthy, commercial, 'Buy Now' appeal.",

  // --- New Additions (21-35) ---
  'surreal_dreamy': "Style: Surreal / Dreamy. Atmosphere: Dreamlike, illogical composition. Visuals: Clouds, smoke, floating fabrics, magical lighting. Vibe: Creative, artistic, subconscious, soft and ethereal.",
  'abstract_geometry': "Style: Abstract Geometry. Atmosphere: Modern design. Visuals: Strong geometric shapes (cubes, spheres, cylinders), hard lines, color blocking. Vibe: Structural, artistic, organized, high-end design.",
  'cosmic_galaxy': "Style: Cosmic / Galaxy. Atmosphere: Deep space mystery. Visuals: Stars, nebula clouds, deep purple and blue hues, bioluminescent lighting. Vibe: Infinite, scientific, night repair, deep hydration.",
  'stone_mineral': "Style: Stone / Mineral Concept. Atmosphere: Solid foundation. Visuals: Raw stones, granite, slate, natural mineral textures. Colors: Grey, brown, earth tones. Vibe: Scientific, grounded, mineral-rich, strength.",
  'airy_flow': "Style: Airy / Light Flow. Atmosphere: Light and breathable. Visuals: Sheer fabrics blowing in the wind, soft motion blur, bright high-key lighting, white curtains. Vibe: Gentle, sensitive, weightless, pure.",
  'contrast_light': "Style: Hard Light Art (High Contrast). Atmosphere: Edgy and dramatic. Lighting: Harsh direct sunlight or studio strobe, sharp distinct shadows. Vibe: Bold, impactful, fashion editorial, strong personality.",
  'monochrome_mood': "Style: Monochrome Mood. Atmosphere: Sophisticated. Visuals: Single color palette (e.g., all beige, all blue, or all black) with varying textures. Vibe: High-fashion, focused, minimalist, premium.",
  'wabi_sabi': "Style: Japanese Wabi-Sabi. Atmosphere: Imperfect beauty. Visuals: Cracked clay, dried branches, asymmetry, raw earth textures. Colors: Muted, natural. Vibe: Zen, authentic, aging gracefully, organic.",
  'crystal_prism': "Style: Crystal / Prism Light. Atmosphere: Radiant clarity. Visuals: Glass prisms, rainbow light refractions, caustic patterns, crystal shards. Vibe: Pure, glowing, light-bending, high-tech luxury.",
  'urban_concrete': "Style: Urban Concrete. Atmosphere: City life. Visuals: Concrete walls, asphalt textures, brutalist architecture, cold industrial lighting. Vibe: Strong, unisex, modern, urbanite.",
  'routine_flatlay': "Style: Routine Flatlay. Composition: Top-down bird's eye view. Props: Daily essentials, coffee, magazines, makeup tools arranged neatly. Vibe: Lifestyle, organized, daily routine, social media ready.",
  'science_diagram': "Style: Science Diagram. Atmosphere: Educational. Visuals: Floating bubbles, graphical overlays (arrows, chemical structures), clean layout. Vibe: Trustworthy, formula-focused, clinical efficacy.",
  'emotional_skin': "Style: Emotional Skin. Focus: Extreme close-up on real skin texture. Lighting: Warm, intimate, soft touch. Vibe: Human connection, real beauty, sensory experience, tenderness.",
  'minimal_silence': "Style: Silence / Negative Space. Composition: Tiny product in a vast empty space. Minimal details. Vibe: Luxury, isolation, intense focus, breathing room, high-end gallery.",
  'deconstructed': "Style: Deconstructed Product. Visuals: Exploded view, components floating apart, levitating ingredients, defying gravity. Vibe: Technical, complex, creative, analyzing the formula.",
};

// Internal helper to construct parts
const constructParts = (
  modelImage: UploadedFile | null, 
  productImages: UploadedFile[],
  referenceImage: UploadedFile | null,
  prompt: string, 
  posterText: string,
  style: OutputStyle,
  isPoster: boolean
) => {
  const parts: any[] = [];

  // 1. Model Image
  if (modelImage) {
    const base64Data = modelImage.base64.includes(',') ? modelImage.base64.split(',')[1] : modelImage.base64;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: modelImage.mimeType,
      },
    });
  }

  // 2. Product Images
  productImages.forEach((img) => {
    const base64Data = img.base64.includes(',') ? img.base64.split(',')[1] : img.base64;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: img.mimeType,
      },
    });
  });

  // 3. Reference Image (Style)
  if (referenceImage) {
    const base64Data = referenceImage.base64.includes(',') ? referenceImage.base64.split(',')[1] : referenceImage.base64;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: referenceImage.mimeType,
      },
    });
  }

  // Get the specific style instruction
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['clean_minimalist'];

  const formatInstruction = isPoster
    ? `
      **FORMAT: ADVERTISEMENT POSTER / GRAPHIC DESIGN**
      - This MUST be a finished marketing poster.
      - Use graphic design elements (borders, layout structures, overlay shapes) suitable for a magazine ad or billboard.
      - Look: Professional, Commercial, High-End Graphic Design.
    `
    : `
      **FORMAT: PROFESSIONAL PRODUCT/MODEL PHOTOGRAPHY**
      - Focus purely on the visual photography.
      - NO overlay text, NO graphic design borders.
      - High-end camera quality, depth of field, photorealistic lighting.
    `;

  let basePrompt = `
    Task: Create a stunning high-quality cosmetic image.
    ${formatInstruction}
    
    ${referenceImage 
      ? `**CRITICAL STYLE REFERENCE:** The LAST image provided is a REFERENCE IMAGE. 
         - Do NOT generate the content/object from the reference image.
         - COPY the lighting, color palette, mood, composition style, and aesthetic vibe of the reference image EXACTLY.
         - Apply this style to the Model and Products provided in the earlier images.` 
      : stylePrompt
    }
    
    ${modelImage ? 'Reference the provided model image for the subject.' : ''}
    ${productImages.length > 0 ? 'Feature the provided product image(s) naturally in the composition. If multiple product images are provided, arrange them aesthetically.' : ''}
    
    **VISUAL CONCEPT / SCENE DESCRIPTION:**
    ${prompt}
  `;

  if (isPoster && posterText.trim()) {
    basePrompt += `
    \n
    **MANDATORY TEXT INTEGRATION:**
    - You MUST include the following text content on the poster: "${posterText}"
    - The text should be legible, elegant, and integrated naturally into the design.
    - Ensure correct spelling of: "${posterText}".
    `;
  } else if (isPoster) {
    basePrompt += `
    \n
    **TEXT INSTRUCTION:**
    - Leave negative space suitable for adding text later.
    `;
  }

  parts.push({ text: basePrompt });
  return parts;
};

// Generate a single image (used for loop and regeneration)
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
  modelTier: ModelTier
): Promise<string | null> => {
  try {
    const ai = getAiClient();
    const parts = constructParts(modelImage, productImages, referenceImage, prompt, posterText, style, isPoster);

    // DETERMINE MODEL
    const modelName = modelTier === 'pro' 
      ? 'gemini-3-pro-image-preview' // Paid / High Quality
      : 'gemini-2.5-flash-image';    // Free Tier Friendly / Standard Quality

    // DETERMINE CONFIG
    const imageConfig: any = {
      aspectRatio: aspectRatio,
    };

    // NOTE: 'imageSize' is only supported by gemini-3-pro-image-preview. 
    // gemini-2.5-flash-image does NOT support it and will throw error if provided.
    if (modelTier === 'pro') {
      imageConfig.imageSize = resolution;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: imageConfig,
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

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
  imageCount: number = 4
): Promise<string[]> => {
  const count = Math.max(1, Math.min(4, imageCount));
  const promises = Array(count).fill(null).map(() => 
    generateSingleBeautyImage(modelImage, productImages, referenceImage, prompt, posterText, resolution, style, aspectRatio, isPoster, modelTier)
  );

  try {
    const results = await Promise.all(promises);
    return results.filter((res): res is string => res !== null);
  } catch (err) {
    handleApiError(err);
    return [];
  }
};