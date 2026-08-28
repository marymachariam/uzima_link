Frontend README
markdown
# Uzima Link — Frontend

Next.js frontend for Uzima Link, serving three distinct user experiences from one app: hospital kiosk check-in, doctor dashboard, and patient self-service.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** CSS Modules, one per page
- **State:** React Context (`AuthContext`) for auth/session
- **QR codes:** `qrcode.react` (generation), `qr-scanner` (camera scanning)
- **Testing:** Cypress (end-to-end)

## Structure

├── app/
│ ├── page.js # Landing page
│ ├── (auth)/login, register, forgot-password, reset-password
│ ├── kiosk/ # Patient check-in + intake (text/voice)
│ ├── doctor/ # Search, queue, patient dashboard, notes, alerts
│ └── patient/ # Own dashboard, self-report, allergies, profile, ID card
├── lib/
│ ├── api.js # Central fetch wrapper (auth headers, error handling)
│ ├── auth.js # Token storage/decoding
│ └── endpoints.js # One function per backend endpoint
├── context/AuthContext.js # App-wide logged-in user state
├── components/ # Shared UI (AuthGuard, PatientIdCard, QrScanner)
└── cypress/e2e/ # End-to-end test suites


## Core Features

- **Role-based routing** — `AuthGuard` component restricts pages by role, redirects unauthenticated users
- **Kiosk flow** — patient lookup (phone/ID/QR scan), registration with allergies, text or voice intake
- **Doctor flow** — sidebar dashboard, patient queue, allergy alerts, transcript language toggle, clinical notes
- **Patient flow** — own dashboard, self-report from home, allergy self-management, digital ID card with QR code (download/print)
- **Mobile responsive** — sidebar collapses to a horizontal nav below 768px

## Setup

1. Install dependencies:
```bash
   npm install
```

2. Ensure the backend is running at `http://127.0.0.1:8000` (update `lib/api.js` if different).

3. Run the dev server:
```bash
   npm run dev
```

App runs at `http://localhost:3000`.

## Testing

```bash
npx cypress run
```

21 end-to-end tests across authentication, kiosk, doctor, and patient flows. Requires both the frontend (`npm run dev`) and backend (`uvicorn`) running simultaneously — tests hit the real app and real API, not mocks.

## Known Limitations

- Voice input relies on the browser's Web Speech API — not supported in Firefox; typing is always available as a fallback.
- Voice transcription accuracy is strong for English and Swahili; lower-resource languages (e.g. Kikuyu) are a known industry-wide gap.
- Admin facility management currently has no dedicated UI — done via the backend's Swagger docs.
