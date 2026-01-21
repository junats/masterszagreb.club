CREATE TABLE IF NOT EXISTS custody_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('me', 'partner', 'split', 'none')),
  note TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS calendar_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  custody_day_id UUID REFERENCES custody_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
