export enum Resolution {
  RES_2K = '2K',
  RES_4K = '4K',
}

export type OutputStyle = string;

export type AspectRatio = '1:1' | '3:4' | '9:16' | '16:9';

export type ModelTier = 'standard' | 'pro';

export interface GeneratedImage {
  id: string;
  url: string;
  resolution: Resolution;
  style: OutputStyle;
  aspectRatio: AspectRatio;
  modelTier: ModelTier;
  createdAt: number;
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}