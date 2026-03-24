
## Stack
- Frontend: Expo React Native (expo-router, file-based routing)
- Backend: FastAPI (Python)
- Database + Auth + Realtime: Supabase
- ML: scikit-learn via FastAPI endpoint

## Supabase Setup (Already Done)
- Project URL: `YOUR_SUPABASE_URL`
- Anon Key: `YOUR_SUPABASE_ANON_KEY`
- Google OAuth: enabled in Supabase Auth dashboard

## Database Tables (Create these in Supabase)

### profiles
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user',  -- 'admin' or 'user'
  created_at timestamp default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

### user_data
```sql
create table user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text,
  ml_result jsonb,
  created_at timestamp default now()
);

-- RLS: users see only their own data
alter table user_data enable row level security;

create policy "Users see own data"
on user_data for select
using (auth.uid() = user_id);

create policy "Users insert own data"
on user_data for insert
with check (auth.uid() = user_id);

-- Admin sees all data
create policy "Admin sees all"
on user_data for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

### messages (realtime)
```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  room text default 'general',
  content text,
  created_at timestamp default now()
);

alter table messages enable row level security;

create policy "Anyone authenticated can read"
on messages for select
using (auth.role() = 'authenticated');

create policy "Users insert own messages"
on messages for insert
with check (auth.uid() = user_id);

-- Enable realtime on messages table
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table user_data;
```

## What to Build

### Frontend Tasks
1. `frontend/lib/supabase.js` — Supabase client with Google OAuth
2. `frontend/hooks/useAuth.js` — returns { user, role, loading, signOut }
3. `frontend/app/_layout.jsx` — checks auth, redirects to (admin) or (user) based on role
4. `frontend/app/(auth)/login.jsx` — Google Sign-In button using expo-auth-session
5. `frontend/app/(admin)/dashboard.jsx` — shows ALL users' data in a list, live updates via Supabase realtime
6. `frontend/app/(user)/home.jsx` — shows ONLY current user's data, can submit new entry

### Backend Tasks (FastAPI)
1. `backend/main.py` — FastAPI app with CORS, one POST endpoint `/ml/predict`
2. `backend/ml_handler.py` — accepts text input, returns { label, confidence }
3. `backend/.env` — PORT=8000, SUPABASE_URL, SUPABASE_KEY

### ML Tasks
1. `ml/model.py` — simple scikit-learn pipeline (TF-IDF + LogisticRegression)
2. `ml/train.py` — trains on dummy data, saves model.pkl
3. On startup, backend loads model.pkl and serves predictions

## Role Logic
- After Google login, check `profiles` table for role field
- If role === 'admin' → navigate to /(admin)/dashboard
- If role === 'user' → navigate to /(user)/home
- To make someone admin: manually update role in Supabase dashboard

## Packages to Install

### Frontend
```bash
cd frontend
npx create-expo-app . --template blank
npx expo install expo-router @supabase/supabase-js expo-auth-session expo-web-browser expo-constants @react-native-async-storage/async-storage
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-dotenv supabase scikit-learn joblib
```

## Running Locally
```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — ngrok tunnel
ngrok http 8000

# Terminal 3 — Frontend
cd frontend && npx expo start
```

## Environment Variables

### frontend/.env
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok.io
```

### backend/.env
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
PORT=8000
```





## UI Design System & Skills

### Design Direction
Build a PRODUCTION-GRADE mobile UI that looks like it was designed by a senior product designer at a top startup. It must NOT look AI-generated. Follow these rules strictly.

---

### Visual Identity

**Aesthetic:** Refined dark-mode utility app — think Linear, Vercel Dashboard, Raycast. Sharp edges, dense information, surgical precision. NOT playful. NOT colorful gradients. NOT rounded bubbly cards.

**Color Palette (use CSS variables / StyleSheet constants):**
```javascript
const colors = {
  bg:         '#0a0a0a',   // near black background
  surface:    '#111111',   // card/panel background
  border:     '#1f1f1f',   // subtle borders
  accent:     '#e8ff47',   // sharp yellow-green accent (ONE dominant accent only)
  accentDim:  '#e8ff4720', // accent at 12% opacity for backgrounds
  text:        '#f0f0f0',  // primary text
  textMuted:  '#666666',   // secondary text
  danger:     '#ff4444',   // errors only
  success:    '#44ff88',   // success states only
}
```

**Typography:**
```javascript
// Use expo-google-fonts
// Display/Headings: "Syne_700Bold" — geometric, editorial
// Body: "DM_Sans_400Regular" and "DM_Sans_500Medium"
// Mono/Data: "JetBrains_Mono_400Regular" — for IDs, timestamps, ML scores
```

**Spacing System (8pt grid):**
```javascript
const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
```

---

### Component Rules

**Cards:**
```javascript
// NO rounded corners > 8px
// border: 1px solid colors.border
// NO box shadows — use borders only
// padding: 16px
// backgroundColor: colors.surface
```

**Buttons:**
```javascript
// Primary: backgroundColor accent, color black, fontWeight bold, borderRadius 6
// Secondary: backgroundColor transparent, border 1px accent, color accent
// Destructive: border 1px danger, color danger
// NO gradients on buttons ever
// Height: exactly 48px
// Letter spacing: 0.5px, text UPPERCASE for primary actions
```

**Input Fields:**
```javascript
// backgroundColor: '#0a0a0a'
// border: 1px solid colors.border
// focus border: colors.accent
// borderRadius: 6
// padding: 12px 16px
// color: colors.text
// NO placeholder animations — keep it dead simple
```

**Lists & Data Rows:**
```javascript
// Separator: 1px solid colors.border (NOT full width — indent 16px from left)
// Row height: 56px minimum
// Show timestamp in JetBrains Mono, right-aligned, textMuted color
// Swipe actions allowed but keep minimal (1-2 actions max)
```

**Navigation:**
```javascript
// Bottom tab bar: backgroundColor surface, borderTop 1px border
// Active tab: accent color icon + label
// Inactive: textMuted, no fill icons (outline only)
// NO labels on inactive tabs — icon only
```

---

### Screen-by-Screen Instructions

**Login Screen (`(auth)/login.jsx`)**
- Full dark background
- Top 40% — Large display text: app name in Syne Bold, huge (48px), left-aligned
- Tagline below in DM Sans, textMuted, small (13px)
- Bottom 60% — Google Sign In button: full width, white background, black text, Google logo left-aligned, height 52px
- Below button: tiny legal text in textMuted (10px)
- NO hero image, NO illustration, NO logo icon — typography only
- Subtle horizontal rule (1px, border color) separating top and bottom half

**Admin Dashboard (`(admin)/dashboard.jsx`)**
- Header: "DASHBOARD" in Syne 13px uppercase, letterSpacing 3px — like a military label
- Live indicator: small pulsing dot (accent color) + "LIVE" text in mono next to header
- Stats row: 3 metric cards side by side — total users, active now, ML calls today — numbers in Syne Bold 32px, label in mono 10px below
- User list below: FlatList, each row shows email (truncated), role badge, last active in mono
- Role badge: admin = accent background black text, user = transparent border accent text
- Pull to refresh supported
- Realtime badge flashes accent color on new data

**User Home (`(user)/home.jsx`)**
- Top: greeting "Hey, {name}" in Syne 28px
- Below: input card — full width, multiline TextInput, 120px height, mono font
- Submit button below input — full width primary button "ANALYZE →"
- Results section: FlatList of past submissions
- Each result card: content preview (2 lines), ML label badge, confidence score in mono, timestamp
- ML badge colors: positive=success, negative=danger, neutral=textMuted border

---

### Animation Rules
```javascript
// Use React Native Animated or Reanimated 2
// Page transitions: fade in only — duration 200ms — NO slides
// List items: staggered fade in — each item 50ms delay after previous
// Button press: scale to 0.97 — duration 80ms
// Live data flash: background flashes accentDim for 300ms on new row
// Pulsing live dot: opacity 1→0.3→1, duration 1500ms, loop infinite
// RULE: max 2 animations running simultaneously
```

---

### File to Create Tonight
```
frontend/constants/theme.js   ← all colors, spacing, typography exports
frontend/components/
  ├── Button.jsx              ← primary, secondary, destructive variants
  ├── Card.jsx                ← base card component
  ├── Badge.jsx               ← role + ML label badges
  ├── LiveDot.jsx             ← pulsing animated indicator
  └── DataRow.jsx             ← reusable list row
```

---

### What NOT to Do (Hard Rules for Agent)
- NO purple, pink, or blue gradients anywhere
- NO rounded corners > 8px on any element
- NO drop shadows — borders only for depth
- NO emoji in UI (except user-generated content)
- NO skeleton loaders — use simple opacity 0.3 placeholder
- NO bottom sheets — use full screen modals only
- NO lottie animations — CSS/RN Animated only
- NO card carousels or horizontal scrolls
- NO more than 2 font families total
