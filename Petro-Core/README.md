# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Petro-Core

A web application for managing geological samples and educational resources.

## How to Update Rocks and Add Images

When updating a rock record, you can now add images to that specific rock. The system ensures that images are properly associated with the rock they belong to.

### Steps to Update a Rock and Add Images:

1. Navigate to the "Rocks" section in the admin dashboard
2. Find the rock you want to edit and click the "Edit" button
3. You'll see a modal with two tabs: "Rock Details" and "Rock Images"
4. In the "Rock Details" tab, update any information about the rock
5. Click on the "Rock Images" tab to manage images for this rock
6. In the "Rock Images" tab, you can:
   - View existing images for this rock
   - Upload new images using the file uploader
   - Manage (view/delete) all images associated with this rock

### Technical Details:

- All rock images are stored in the 'rocks-minerals' Supabase storage bucket
- Images are linked to rocks via the 'rock_images' table in the database
- Each image record contains:
  - `rock_id`: Reference to the specific rock
  - `image_url`: URL to the image in the 'rocks-minerals' bucket
  - `caption`: Optional caption for the image
  - `display_order`: Position in the gallery

This implementation ensures that when you update a rock and add images, they will be properly associated with that specific rock in both the storage bucket and the database.

## Installation

[Installation instructions here]
