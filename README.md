# mabjaia-inn-motel(guesthouse)-frontend
React + Vite frontend for guest house management: bookings, rooms, clients, customizable stays and reports, with Admin, Manager and Client roles. Consumes a Spring Boot API secured with JWT and Google OAuth.

## Deploy on Render

Create a **Static Site** connected to this repository and configure:

- **Root Directory:** `frontend (2)/frontend/mabjaia-inn-motel(guesthouse)-frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`

The production build reads `.env.production` and uses
`https://guest-house-api-zq7q.onrender.com` for API requests and API-hosted
images. You can override this with the Render environment variable
`VITE_API_BASE_URL`.

After Render provides the frontend URL, add that exact origin to
`CORS_ALLOWED_ORIGINS` on the backend web service, then redeploy the backend.
For Google sign-in, set the backend's `GOOGLE_REDIRECT_URI` to
`https://guest-house-api-zq7q.onrender.com/auth/google/callback` and
`GOOGLE_FRONTEND_REDIRECT_URI` to the frontend URL; register the backend
callback URL in the Google OAuth client settings.
