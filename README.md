# FloodCast Frontend

Vue 3 single-page application for the FloodCast flood prediction system. Displays real-time and historical flood risk for Port Louis, Mauritius, using predictions served by the Flask backend.

---

## Live Application

The app is deployed on GitHub Pages and can be accessed directly at:

    https://khorisha.github.io/floodcast-frontend/

No installation is needed to use it. The instructions below are for running or modifying it locally.

---

## Requirements

- Node.js 18 or later
- npm

---

## Local Setup

1. Navigate to the frontend folder:

        cd frontend

2. Install dependencies:

        npm install

3. Start the development server:

        npm run dev

   The app will open at http://localhost:5173

   In development mode it points to http://localhost:5000 automatically, so the backend also needs to be running locally. See the backend README for setup instructions.

---

## Environment Variables

Create a file called `.env.local` in the frontend folder if you want to point the app at a remote backend instead of localhost:

    VITE_BACKEND_URL=https://your-backend-url.onrender.com

When running on GitHub Pages, this variable is set at build time through the repository's GitHub Actions secrets or workflow file.

---

## Project Structure

```
frontend/
    src/
        main.js                 Application entry point
        App.vue                 Root component and layout
        services/
            api.js              All fetch calls to the backend API
        components/
            Dashboard.vue       Main page layout, current risk gauge, zone grid
            HourlyCarousel.vue  Hourly flood risk tiles with popup detail
            Forecast7Day.vue    7-day daily forecast grid
            MapContainer.vue    Leaflet map with district flood risk pins
            DateSelector.vue    Date picker for historical and forecast browsing
            ShapPreview.vue     Top SHAP feature bar chart preview
            ShapModal.vue       Full SHAP feature importance modal
        composables/
            useApi.js           Reusable data-fetching composables
    public/                     Static assets
    vite.config.js              Vite config (base path set to /floodcast-frontend/)
    package.json                Dependencies and scripts
```

---

## Build for Production

    npm run build

This outputs a static site to the `dist` folder. The base path `/floodcast-frontend/` is already configured in vite.config.js to match the GitHub Pages subdirectory.

---

## Deploy to GitHub Pages

The project uses the `gh-pages` package. After building:

    npm run deploy

This pushes the contents of `dist` to the `gh-pages` branch of the repository, which GitHub Pages serves from.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| Vue 3 | UI framework |
| Vite | Build tool and dev server |
| Leaflet | Interactive map |
| Axios | HTTP client |
| vue-router | Client-side routing |
