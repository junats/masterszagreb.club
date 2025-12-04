
export enum Category {
  NECESSITY = 'Necessity',
  FOOD = 'Food',
  DINING = 'Dining',
  ALCOHOL = 'Alcohol',
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
  category: string;
  quantity?: number;
  isRestricted?: boolean;
  isChildRelated?: boolean;
  goalType?: string; // e.g. 'junk_food', 'alcohol'
}

export interface CategoryDefinition {
  id: string;
  name: string;
  color: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string; // ISO Date
  autoAdd: boolean;
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
  categoryId?: string; // ID of the assigned category
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

export type ViewState = 'dashboard' | 'scanner' | 'history' | 'settings' | 'support' | 'auth' | 'provision' | 'settlement' | 'custody';

export type CustodyStatus = 'me' | 'partner' | 'split' | 'none';

export interface CustodyDay {
  date: string; // YYYY-MM-DD
  status: CustodyStatus;
  note?: string;
}

export enum GoalType {
  JUNK_FOOD = 'junk_food',
  ALCOHOL = 'alcohol',
  SMOKING = 'smoking',
  GAMING = 'gaming',
  SAVINGS = 'savings',
  CAFFEINE = 'caffeine',
  SUGAR = 'sugar',
  ONLINE_SHOPPING = 'online_shopping',
  GAMBLING = 'gambling',
  FAST_FASHION = 'fast_fashion',
  RIDE_SHARING = 'ride_sharing',
  STREAMING = 'streaming'
}

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  isEnabled: boolean;
  keywords: string[]; // Keywords to match in receipt items
  streak: number; // Days compliant
  lastComplianceDate?: string; // ISO Date
  emoji?: string;
}

export interface ChildEvent {
  id: string;
  title: string;
  date: string; // ISO Date (YYYY-MM-DD) or Day of Week (Mon, Tue...) for recurring
  time?: string; // HH:mm
  type: 'birthday' | 'activity' | 'appointment' | 'other';
  isRecurring: boolean;
  recurringDay?: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  color?: string;
}
