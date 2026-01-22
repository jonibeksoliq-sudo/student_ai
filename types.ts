
export type LayoutType = 'title' | 'bullet_points_left' | 'bullet_points_right' | 'centered' | 'image_split';

export type Language = 'uz' | 'en' | 'ru';

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
  };
  font: string;
}

export interface Slide {
  title: string;
  content: string[];
  imagePrompt?: string; 
  imageData?: string; 
  layout: LayoutType;
}

export interface UsageStats {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface PresentationData {
  topic: string;
  themeId: string;
  slides: Slide[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_PLAN = 'GENERATING_PLAN',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface GenerationProgress {
  current: number;
  total: number;
}
