hackathon/
├── README.md                  ← Agent ko yahi prompt dena hai
├── frontend/                  ← Expo React Native app
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login.jsx      ← Google OAuth screen
│   │   ├── (admin)/
│   │   │   ├── dashboard.jsx  ← Admin view
│   │   │   └── users.jsx      ← See all users data
│   │   ├── (user)/
│   │   │   ├── home.jsx       ← Normal user view
│   │   │   └── profile.jsx
│   │   └── _layout.jsx        ← Auth gate + role redirect
│   ├── lib/
│   │   └── supabase.js        ← Supabase client
│   ├── hooks/
│   │   └── useAuth.js         ← Session + role hook
│   └── package.json
├── backend/                   ← FastAPI
│   ├── main.py
│   ├── ml_handler.py
│   ├── requirements.txt
│   └── .env
└── ml/                        ← Standalone ML module
    ├── model.py
    ├── train.py
    └── requirements.txt

# Full-Stack Data & ML Analytics App

A production-grade, full-stack application designed rapidly for a hackathon. The platform features an **Expo React Native frontend** paired with a **FastAPI backend** that interfaces with a robust **scikit-learn ML pipeline**. Identity, state, and real-time streams are powered by **Supabase**.
