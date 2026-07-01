# Arché

Arché is a highly responsive personal and professional domain organizer powered by Gemini and Supabase. It captures structured details directly from raw images, microphone recordings, or text commentary.

---

## Technical Stack & Configuration

### Prerequisites
- Node.js (v18+)
- Supabase Database Project
- Google Gemini API Key

### Installation
1. Clone the repository.
2. Initialize dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env.local` and inserting your API keys:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

### Running Locally
To launch the Vite development server:
```bash
npm run dev
```

To sync/build with Capacitor Android:
```bash
npm run cap:build
```
