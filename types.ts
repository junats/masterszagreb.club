
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
  isChildRelated?: boolean;
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
  transactionId?: string; // Unique ID from the receipt (e.g. TRx number)
  imageUrl?: string; // Legacy Base64 string (Mock mode)
  imageHash?: string; // Deterministic hash of image for duplicate detection
  storagePath?: string; // Path in Cloud Storage (Production mode)
  fileHash?: string; // Hash of the file metadata
}

export interface AnalysisResult {
  storeName: string;
  date: string;
  total: number;
  items: ReceiptItem[];
  referenceCode?: string;
  transactionId?: string;
  type?: 'receipt' | 'bill';
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

export type ViewState = 'dashboard' | 'scan' | 'history' | 'support' | 'settings' | 'provision';
