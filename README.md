# Promptastic - A Productivity Hub Application

This repository contains "Promptastic," a React-based single-page application designed as a personal productivity hub.

## Overview

The application allows users to manage three types of items:
*   **Prompts**: Store and manage text prompts, potentially for AI interaction or creative brainstorming.
*   **Notes**: Keep general notes and ideas.
*   **Tasks**: Manage to-do items, including due dates and completion status.

All the application code, including components, logic, and styling, is currently located in a single file named `Code`.

## Key Features

*   **Item Management**: Full CRUD (Create, Read, Update, Delete) functionality for Prompts, Notes, and Tasks.
*   **AI Integration (Gemini API)**:
    *   An AI assistant to help create new items (prompts, notes, tasks) or find existing ones through a chat interface.
    *   An "Enhance Prompt" feature that uses the Gemini API to improve the description of user-created prompts.
*   **Theme Switching**: Users can toggle between light and dark themes, with the preference saved in `localStorage`.
*   **Responsive UI**: Designed with components that adapt to different screen sizes, utilizing utility classes that suggest a Tailwind CSS approach.
*   **Rich Modals**: Interactive modals for adding items, viewing/editing details, confirming actions, and interacting with the AI.

## Technical Details

*   **Framework**: Built with React (using Hooks).
*   **Styling**: Primarily uses utility classes (indicative of Tailwind CSS) with some inline styles for animations.
*   **Data Management**: Utilizes React component state for managing data. Initial data is mocked within the application.
*   **Single File Structure**: The entire application is currently contained within the `Code` file.