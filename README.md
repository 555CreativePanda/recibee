<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ReciBee | Fork the Flavor

ReciBee is a modern, developer-friendly recipe management platform inspired by the principles of version control. It allows you to import, tweak (fork), and version your favorite recipes with technical precision and ease.

## 🚀 Features

- **AI-Powered Imports**: Effortlessly extract recipes from any URL or raw text using Google Gemini AI.
- **Forking & Versioning**: Love a recipe but want to change one thing? "Fork" it to create your own version while maintaining a link to the original.
- **Starring System**: Build your personal library by starring recipes that inspire you.
- **Secure by Design**: Multi-layered SSRF protection for outgoing requests and robust Firestore security rules.
- **Modern Tech Stack**: Experience a blazing-fast UI built with React 19, Vite 6, and Tailwind CSS v4.
- **Responsive & Accessible**: Designed to work beautifully on your desktop or in the kitchen on your phone.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 6](https://vitejs.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Backend**: [Express](https://expressjs.com/) (Node.js), [Cheerio](https://cheerio.js.org/) (Scraping), [Axios](https://axios-http.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **AI**: [Google Gemini 1.5 Flash](https://ai.google.dev/)

## 📦 Project Structure

```text
├── api/                # Backend API (Express + SSRF Protection)
├── public/             # Static assets (Favicon, Robots.txt)
├── src/
│   ├── components/     # Reusable React components
│   ├── lib/            # Firebase config and shared utilities
│   ├── pages/          # Page-level components (Landing, Home, Recipe, etc.)
│   ├── services/       # Firestore and user business logic
│   ├── App.tsx         # Main application routing and state
│   └── types.ts        # TypeScript interfaces
├── server.ts           # Local development server entry point
└── vercel.json         # Vercel deployment configuration
```

## ⚙️ Local Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **Firebase Project** (Firestore and Auth enabled)
- **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd react-example
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   Required variables include:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `VITE_FIREBASE_*`: Your Firebase project configuration.

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🌐 Deployment

ReciBee is optimized for [Vercel](https://vercel.com).

1. Connect your GitHub repository to Vercel.
2. Configure the environment variables in the Vercel dashboard (same as `.env.local`).
3. Deploy! Vercel will automatically use `api/index.ts` for serverless functions and build the Vite frontend.

## 🔒 Security

ReciBee implements a custom, multi-layered SSRF protection in `api/index.ts` to ensure that recipe imports are handled safely. This includes:
- Protocol and port restriction.
- DNS pre-resolution and IP blocklisting (private/internal ranges).
- Custom Axios agents to prevent DNS rebinding.

---

<p align="center">
  Made with ❤️ for cooks and developers alike.
</p>
