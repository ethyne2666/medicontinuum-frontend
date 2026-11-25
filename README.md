# MediContinuum Suite

Three services, two frontends, one new backend — all kept in sync.

| Folder | What it is | URL |
|---|---|---|
| `medicontinuum-web/` | Patient site (React + Vite). Its **Organisations** page now lists every registered organization/doctor, live. | http://localhost:5173 |
| `medicontinuum-organization/frontend/` | **Organization portal** (React + Vite): register, get 16-digit number, sign up, log in, share resources. | http://localhost:5174 |
| `medicontinuum-organization/backend/` | **Organization API** (Node + Express). Single source of truth for both frontends. | http://localhost:5001 |

## Quick start

Requires Node 20+.

```bash
./install-all.sh        # Windows: install-all.bat
./start-all.sh          # Windows: start-all.bat   (or run the 3 commands below in 3 terminals)
```

Manual:

```bash
cd medicontinuum-organization/backend  && npm install && npm run seed && npm start   # :5001
cd medicontinuum-organization/frontend && npm install && npm run dev                  # :5174
cd medicontinuum-web                   && npm install && npm run dev                  # :5173
```

`npm run seed` (optional) creates 7 demo members and 3 sample shares and prints their 16-digit numbers.
All demo accounts use the password `Demo@1234`.

## How registration works

1. **Register** (`/register` on the portal)
   * *Organization* — hospital, clinic, pharmacy, blood bank, lab: licence number + government ID (PAN / GSTIN / CIN / Aadhaar of the signatory), format-validated.
   * *Individual doctor* — doctor ID (registration number) + medical council + specialization.
2. The server issues a **unique 16-digit organization number** (15 random digits + a Luhn check digit, so typos are caught).
3. **Sign up** (`/signup`) — only possible with that number **and** the email used at registration; you choose a password.
4. **Log in** (`/login`) — 16-digit number + password. 5 wrong attempts lock that number/IP for 15 minutes.

Only members that have completed step 3 are listed on the patient site — a registration that is still pending is never shown.

## Resource sharing (organization portal → *Resource sharing*)

Any member can post a **Request** or an **Offer** for: doctors, blood, organs, equipment, medicines — to the whole network or to one chosen organization.

* Other members see it under **Incoming** and can *Accept* or *Decline* (optional message).
* Posts addressed to one organization are invisible to everyone else.
* After acceptance, both sides see each other's contact person, email and phone. Not before.
* The poster marks it **Fulfilled** or **Cancels** it.
* Organ posts are limited to registered **hospitals**; the form carries a legal-allocation notice (NOTTO/SOTTO in India).

## How the frontends stay in sync

There is one backend. Both frontends read it live:

* Patient site → `GET /api/public/organizations` (no login; no private data).
* Portal → authenticated `/api/shares`, `/api/network`, `/api/auth`.
* Both poll every 8–15 s while the tab is visible and refetch on tab focus, so a new registration shows up on the patient site within seconds, without a reload. Responses are never cached (`Cache-Control: no-store`) and stale/out-of-order responses are discarded.
* Option lists (organization types, blood groups, etc.) are mirrored in `backend/src/constants.js` and `frontend/src/constants.js`; change both together.

## What patients can and can't see

Public fields only: name, type, city/state, specialization (doctors), phone (organizations only), and a **masked** number hint (`•••• •••• •••• 1224`). The full 16-digit number, email, licence, government ID and password hash are never public.

## API reference (`:5001/api`)

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /auth/register` | – | Verify documents, issue 16-digit number |
| `POST /auth/signup` | – | Create login (number + registered email + password) |
| `POST /auth/login` | – | Log in with number + password → JWT (8 h) |
| `GET  /auth/me` | ✔ | Own profile |
| `GET  /public/organizations?q=&kind=&type=&city=` | – | Directory for the patient site |
| `GET  /public/stats` | – | Counts |
| `GET  /network/organizations` | ✔ | Directory of other members |
| `GET  /shares?scope=incoming\|mine\|responded&type=` | ✔ | List shares |
| `POST /shares` | ✔ | Create request/offer |
| `POST /shares/:id/respond` | ✔ | `{action: ACCEPT\|DECLINE, message}` |
| `POST /shares/:id/fulfil` · `/cancel` | ✔ owner | Close out |
| `GET  /shares/summary` | ✔ | Dashboard counts |

Tests: `cd medicontinuum-organization/backend && npm test` (12 end-to-end API tests).

## Configuration

Backend env vars (see `backend/.env.example`): `PORT`, `JWT_SECRET`, `ID_PEPPER`, `CORS_ORIGINS`, `DATA_FILE`.
Frontend env vars: `VITE_ORG_API_URL`, `VITE_ORG_PORTAL_URL` (patient site); `VITE_API_URL`, `VITE_PATIENT_URL` (portal).

## Known limits — read before going live

* **No real verification yet.** The system validates the *format* of licence / PAN / GSTIN / CIN / Aadhaar and blocks duplicates, but it does not check them against any government or medical-council registry (NMC, state councils, GSTN, MCA…). Treat "Verified" as "format-valid and unique" until you integrate those lookups or add an admin approval step.
* **Storage is a JSON file** (`backend/data/db.json`). Fine for development and demos; move to PostgreSQL/MongoDB before real use. All data access goes through `src/lib/store.js` and the two service files.
* **Set real secrets.** The built-in `JWT_SECRET` / `ID_PEPPER` defaults are for local development only. Changing `ID_PEPPER` later breaks duplicate detection for existing records.
* **A lost 16-digit number can't be recovered** before sign-up (the number is shown once, with copy/download). Add an identity-checked recovery flow if you need one.
* The login lockout counter is in memory and resets when the API restarts.
* Aadhaar numbers are never stored in readable form (masked tail + keyed hash only). Confirm your obligations under the Aadhaar Act and DPDP Act before collecting them.
