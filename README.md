# 🛠️ Rozgar Saathi (रोजगार साथी)

**Rozgar Saathi** is an AI-powered, real-time gig worker platform designed to digitally transform the unorganized daily-wage labor market. We bridge the gap between local customers and skilled workers (painters, plumbers, electricians, drivers, etc.) seamlessly.

By digitizing traditional *labor nakas* into interactive live maps, providing real-time Socket.IO notifications, and offering a native AI Voice Assistant powered by Google Gemini (to parse natural language requests into structured job postings), Rozgar Saathi makes instant hiring accessible to everyone, regardless of their technology literacy or primary language.

---

## 🚀 Tech Stack

### Frontend App
* **Framework:** React Native & Expo (Expo Router)
* **Real-time Map:** Leaflet.js embedded in React Native WebViews
* **State & Networking:** Axios, WebSockets

### Backend & Analytics
* **Core API:** Node.js, Express.js
* **Real-Time Engine:** Socket.IO
* **Machine Learning & NLP:** FastAPI (Python), Google Gemini AI API

### Database & Cloud
* **Database:** Supabase (PostgreSQL)
* **Live Features:** Supabase Realtime Channels
* **Geospatial:** PostGIS (for distance calculations and local worker clustering)

---

## 🌟 Key Features

* **Digital Naka Map:** A high-performance clustered realtime map where customers can instantly visualize where nearby available workers are pinned, tracking their live status.
* **Rozgar Voice AI:** A voice-assistant module built natively into the app to help workers and customers verbally post jobs or update their skills without typing anything manually.
* **Instant Bidding & Hiring:** Direct job applications backed instantly by PostgreSQL trigger functions and Socket.io broadcasts. 
* **Trust & Transparency:** Bronze/Silver/Gold trust badges awarded automatically based on fulfilled job history, backed safely by the database records.

---
*Built by Team Kwarcs No.1*
