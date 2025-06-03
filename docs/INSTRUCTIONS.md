# Setup Instructions

This project only includes the application code in `Code`. Follow these steps to run it inside a Vite + React + Tailwind setup.

## 1. Create a New Project

```bash
npm create vite@latest promptastic-app -- --template react
cd promptastic-app
npm install
```

## 2. Add Tailwind CSS

Install Tailwind and create the configuration files:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Edit `tailwind.config.js` so the `content` array points to your React source files:

```javascript
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Replace `src/index.css` with the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3. Add the Application Code

Copy the file `Code` from this repository and replace `src/App.jsx` in your project with it. The file exports the default `App` component.

## 4. Configure the Gemini API Key

In `src/App.jsx` locate the line:

```javascript
const GEMINI_API_KEY = ""; // Per instructions, leave empty.
```

Replace the empty string with your Gemini key. Without a valid key the AI assistant features will not work.

## 5. Run the Development Server

```bash
npm run dev
```

Open `http://localhost:5173` to view the application.

To create a production build use:

```bash
npm run build
```

The built files will appear in the `dist` directory.

