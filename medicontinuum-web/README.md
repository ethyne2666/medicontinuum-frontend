# MediContinuum Web (patient site)

React + Vite + Tailwind v4 on **http://localhost:5173**.

```bash
npm install
npm run dev
```

Most screens still use mock data (`src/data/mock.js`). The **Organisations** page (`/organisations`) is live: it reads
registered organizations and doctors from the Organization API (`VITE_ORG_API_URL`, default `http://localhost:5001`)
and refreshes every 10 s. Start the API first — see `../README.md`.

Routes: `/`, `/login`, `/signup`, `/dashboard`, `/adherence`, `/prescriptions`, `/medicines`,
`/inventory`, `/family`, `/notifications`, `/organisations`, `/vendors`, `/profile`.
