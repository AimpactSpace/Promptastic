# Promptastic Productivity Hub

Promptastic is a single-file React web application that manages prompts, notes and tasks. It also integrates an AI assistant powered by Google's Gemini API. The entire app lives in the `Code` file of this repository.

## Features

- **Prompts, Notes & Tasks** – add, edit and delete items.
- **AI Assistant** – chat with Gemini to create or find items and enhance prompt descriptions.
- **Theme Switcher** – toggle between light and dark modes.
- **Dashboard** – quick overview of your data.

## Running the App

This repository only contains the application source in one file. Embed it in a React project (for example using Vite and Tailwind).

1. Install [Node.js](https://nodejs.org/) and npm.
2. Create a new project:
   ```bash
   npm create vite@latest promptastic-app -- --template react
   cd promptastic-app
   npm install
   ```
3. Add Tailwind CSS:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
   Update `tailwind.config.js` so `content` includes `./src/**/*.{js,jsx}` and replace `src/index.css` with:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. Replace `src/App.jsx` with the contents of the `Code` file from this repository.
5. Set your Gemini API key by editing `GEMINI_API_KEY` near the top of `src/App.jsx`:
   ```javascript
   const GEMINI_API_KEY = "YOUR_API_KEY";
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```
   Then open `http://localhost:5173` in your browser.

For a production build run `npm run build`.

## Gemini API

The AI features use the Gemini API. The key constant appears near the top of the code:

```javascript
const GEMINI_API_KEY = ""; // Per instructions, leave empty.
```

Set it to your own key to enable the assistant.

## Repository Layout

```
.
├── Code        # Main React application (rename to App.jsx in your project)
└── README.md   # Project overview and setup
```

See [docs/INSTRUCTIONS.md](docs/INSTRUCTIONS.md) for an expanded setup guide.
