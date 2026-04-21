<div align="center">
<img width="1200" height="475" alt="ReciBee Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🐝 ReciBee
### *Fork the Flavor*

[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-10.13-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-blue?logo=google-gemini)](https://ai.google.dev/)

</div>

---

## 📖 Overview

**ReciBee** is a Git-inspired recipe management platform designed for technical food enthusiasts. It brings the power of version control and collaboration to your kitchen, allowing you to "fork" your favorite recipes, tweak them to perfection, and share your versions with the world.

Whether you're importing a complex meal from a blog or documenting a family heirloom, ReciBee provides the tools to ensure your culinary data is clean, structured, and easy to evolve.

## ✨ Features

- 🍴 **Git-Inspired Workflow**: Fork recipes to create your own variations while maintaining a link to the original.
- 🤖 **AI-Powered Import**: Extract recipes from any URL or raw text using Google Gemini AI.
- ⭐ **Star System**: Save your favorite recipes to your personal collection.
- 👤 **User Profiles**: Showcase your culinary contributions and follow other chefs.
- 🛡️ **SSRF Protected Scraper**: Multi-layered security for safe recipe fetching from external sites.
- 📱 **Fully Responsive**: Crafted with Tailwind CSS v4 for a seamless experience on mobile, tablet, and desktop.
- 🔍 **SEO & OpenGraph**: Optimized for sharing with dynamic metadata and JSON-LD structured data.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Node.js Express 4 (Unified API on Vercel).
- **Database & Auth**: Firebase 10 (Firestore, Authentication).
- **AI Integration**: Google Gemini AI (@google/generative-ai).
- **Tooling**: TypeScript, tsx, Cheerio (Scraping), Axios.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A Firebase project
- A Gemini AI API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/recibee.git
   cd recibee
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   # Gemini AI
   GEMINI_API_KEY=your_gemini_api_key

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_ID=(default)

   # Deployment
   APP_URL=http://localhost:5173
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 🏗️ Architecture

- **`api/index.ts`**: The core backend logic, handling recipe scraping and SSRF protection. Designed to run as a single Vercel Serverless Function.
- **`src/services/`**: Frontend service layer for interacting with Firebase and the internal API.
- **`src/pages/`**: React components representing different routes (Explore, Recipe Details, Docs, etc.).
- **`firestore.rules`**: Granular security rules ensuring data integrity and user privacy.

## 🔒 Security

ReciBee implements robust security measures:
- **SSRF Protection**: Backend requests are filtered through protocol/port restrictions, hostname blocklisting, and custom DNS resolution to prevent access to private networks.
- **Firestore Rules**: Data invariants are enforced at the database level, preventing identity spoofing and unauthorized state changes.
- **Rate Limiting**: Express-rate-limit is used on the API to mitigate DOS attacks.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ for the culinary community.
</div>
