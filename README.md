# Promptastic

Promptastic is a React-based interface for managing prompts, notes, and tasks. It includes an AI assistant that communicates with the Gemini API (formerly Google Gemini). The repository provides a minimal Vite setup for running the project locally.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A Gemini API key (optional, for enabling AI chat features)

## Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example and add your Gemini API key if you plan to use the AI features:

   ```bash
   cp .env.example .env
   # Edit .env and set GEMINI_API_KEY
   ```

## Usage

Start the development server with Vite:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

To create a production build:

```bash
npm run build
```

A preview of the production build can be served with:

```bash
npm run preview
```

## Project Structure

- `src/App.jsx` – main React component (previously the `Code` file)
- `src/main.jsx` – entry point that mounts the React app
- `index.html` – HTML template used by Vite

## License

This project is provided as-is with no warranty. You may modify and use the code for your own purposes.
