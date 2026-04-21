# 🐝 ReciBee: Your Digital Kitchen Notebook

**ReciBee** is a living notebook designed for cooks who value iteration. It treats recipes like a living document, allowing you to strip the noise from any food blog and tweak every dish to perfection. Whether you are importing a complex meal or documenting a family heirloom, ReciBee ensures your culinary data is clean, structured, and easy to evolve.

-----

## ✨ Features

- 🍴 **Git-Inspired Versions**: Save your own variations of any dish while maintaining a link to the original.
- 🤖 **AI-Powered Import**: Instantly scrape the noise and clutter from any food blog URL to extract just the recipe.
- ⭐ **Personal Recipe Box**: Save community favorites and manage your culinary notebook with ease.
- 👤 **Kitchen Precision**: A clear interface designed for tracking adjustments and version history.
- 🛡️ **Clutter-Free Experience**: Focus on the ingredients and steps without ads or long-winded stories.
- 📱 **Fully Responsive**: A seamless experience crafted for use in the kitchen on any device.

-----

## 🚀 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Motion.
- **Backend**: Node.js Express 4 (Unified API).
- **Database & Auth**: Firebase 10 (Firestore, Authentication).
- **AI Integration**: Google Gemini AI.
- **Tooling**: TypeScript, Cheerio (Scraping), Axios.

-----

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
   Create a `.env` file in the root directory and add your Gemini API Key and Firebase configuration details (refer to `.env.example`).

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

-----

## 🏗️ Architecture

- **`api/index.ts`**: The core backend logic handling recipe scraping and security.
- **`src/services/`**: Frontend layer for interacting with Firebase and internal APIs.
- **`src/pages/`**: React components for the Explore, Recipe Details, and User Notebook pages.
- **`firestore.rules`**: Granular security rules ensuring user privacy and data integrity.

-----

## 🔒 Security & Philosophy

ReciBee believes your recipe box should follow your rules. We implement robust measures to protect your data and provide a safe scraping experience:

- **SSRF Protection**: Backend requests are filtered to prevent unauthorized network access.
- **Firestore Rules**: Database-level enforcement to prevent identity spoofing and unauthorized changes.
- **Privacy First**: Your kitchen, your rules.

-----

<div align="center">
Built with ❤️ for the culinary community.
<br>
<b>2026 RECIBEE V1.0.6</b>
</div>
