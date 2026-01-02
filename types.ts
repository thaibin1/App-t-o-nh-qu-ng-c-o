
export enum Resolution {
  RES_2K = '2K',
  RES_4K = '4K',
}

export type OutputStyle = string;

export type AspectRatio = '1:1' | '3:4' | '9:16' | '16:9';

export type ModelTier = 'standard' | 'pro';

export interface TypographyConfig {
  language: 'VN' | 'EN';
  vibe: string;
  fontReference?: UploadedFile | null;
}

export interface BrandConfig {
  logo?: UploadedFile | null;
  colors: string;
  hook: string;
  core: string;
  proof: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  resolution: Resolution;
  style: OutputStyle;
  aspectRatio: AspectRatio;
  modelTier: ModelTier;
  createdAt: number;
  label?: string; 
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}
