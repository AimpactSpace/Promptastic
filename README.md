# Productivity Hub

The Productivity Hub is a small React application that lets you manage prompts, notes, and tasks in one place. The file named `Code` in this repository contains the entire `App` component for the UI along with optional Gemini API integration for a chat assistant.

## Prerequisites

- **Node.js** (version 18 or later recommended)
- **npm** (comes with Node) or another package manager such as Yarn
- (Optional) A Gemini API key if you want to use the AI assistant features

## Setup

1. Clone this repository.
2. Create a new React project using your preferred tooling (for example Vite):
   ```bash
   npm create vite@latest productivity-hub -- --template react
   cd productivity-hub
   npm install
   ```
3. Replace the contents of `src/App.jsx` (or `src/App.js`) in your new project with the contents of the `Code` file from this repository.
4. Copy over any styles or assets you may need, then start the development server:
   ```bash
   npm run dev        # for Vite
   # or
   npm start          # for create-react-app
   ```

## Gemini API Usage (Optional)

The application includes functions to call the Gemini API for an AI assistant. To enable it, open the `Code` file and set `GEMINI_API_KEY` near the top of the file:

```javascript
const GEMINI_API_KEY = "YOUR_API_KEY";
```

Without a key, the Gemini features will be skipped, but you can still create and manage prompts, notes, and tasks locally.

## Repository Contents

- `Code` – The main React component implementing the Productivity Hub.
- `README.md` – Project overview and instructions.

This minimal repository lets you drop the `Code` file into any React setup and run the Productivity Hub application.
