<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wWDUh7hGxbByiUyR-oeK2xuvyGBtqTA1

## Project Structure

```
cloud-run/
├── backend/          # Backend API server
│   └── src/
│       ├── routes/   # API routes
│       ├── services/
│       │   └── gemini/  # Gemini AI service integration
│       └── config/   # Backend configuration
├── frontend/         # React frontend application
│   └── src/
│       ├── components/  # React components
│       ├── services/    # Frontend services
│       ├── utils/       # Utility functions
│       └── App.tsx      # Main app component
└── README.md
```

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
