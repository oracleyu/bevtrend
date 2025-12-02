export enum TabView {
  TRENDS = 'TRENDS',
  SUPPLY = 'SUPPLY',
  ASSISTANT = 'ASSISTANT',
  PROFILE = 'PROFILE'
}

export type StrategyType = 'DEFAULT' | 'COST' | 'UNIQUE' | 'QUALITY' | 'CUSTOM';

export interface CustomStrategy {
  id: string;
  name: string;
  factors: string[];
}

export type SourceType = 'WEB' | 'DB' | 'AI';

export interface DataSource {
  type: SourceType;
  name: string;
  factors?: string[];
}

export interface TrendItem {
  id: string;
  title: string;
  description: string;
  growthRate: string;
  category: string;
  imageUrl: string;
  source: DataSource;
}

export interface TrendAnalysisResult {
  marketAnalysis: string;
  strategicConclusion: string;
  source: DataSource;
  items: TrendItem[];
}

export interface SupplyItem {
  id: string;
  companyName: string;
  product: string;
  price: string;
  location: string;
  type: 'SUPPLY' | 'DEMAND';
  verified: boolean;
  createdAt: number;
  expiresAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}