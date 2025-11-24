export enum Category {
  NECESSITY = 'Necessity',
  FOOD = 'Food',
  LUXURY = 'Luxury',
  HOUSEHOLD = 'Household',
  HEALTH = 'Health',
  TRANSPORT = 'Transport',
  EDUCATION = 'Education',
  OTHER = 'Other'
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: Category;
  quantity?: number;
  isRestricted?: boolean;
}

export interface Receipt {
  id: string;
  storeName: string; // Or Provider Name
  date: string;
  total: number;
  items: ReceiptItem[];
  scannedAt: string; // ISO date string
  type?: 'receipt' | 'bill';
  referenceCode?: string;
  imageUrl?: string; // Base64 string of the receipt image
}

export interface AnalysisResult {
  storeName: string;
  date: string;
  total: number;
  items: ReceiptItem[];
  referenceCode?: string;
}

export enum SubscriptionTier {
  FREE = 'Free',
  PRO = 'Pro'
}

export interface User {
  id: string;
  name: string;
  email: string;
  tier: SubscriptionTier;
  avatarUrl?: string;
}

export type ViewState = 'dashboard' | 'scan' | 'history' | 'support' | 'settings';