#!/bin/bash

# 1. Fix Achievement interface
echo "Fixing Achievement interface..."
cat >> ../common/types/index.ts << 'TYPES'

// Fixed types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: any;
  type?: 'streak' | 'saving' | 'budget';
  label: string;
  unlocked: boolean;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface CustodyDay {
  date: string;
  status: CustodyStatus;
  note?: string;
  activities?: CalendarActivity[];
  withYou: boolean;
}
TYPES

# 2. Fix Header.tsx comparison
sed -i '' "s/user?.tier === 'PRO'/user?.tier === SubscriptionTier.PRO/" src/components/Header.tsx

echo "✅ Basic fixes applied. Checking remaining errors..."
npx tsc --noEmit | head -10
