# MediContinuum — two pure frontends (no backend)

| Folder | App | URL |
|---|---|---|
| `medicontinuum-web/` | Patient site (React + Vite) | http://localhost:5173 |
| `medicontinuum-organization/` | Organization portal (React + Vite) | http://localhost:5174 |
| `shared/` | Option lists, seed data, helpers used by both | – |

```bash
./install-all.sh   # Windows: install-all.bat
./start-all.sh     # Windows: start-all.bat
```
Open **both** apps with `localhost` (not 127.0.0.1) so they share one registry.

## Organization portal
Register (organization: licence + government ID · doctor: doctor ID) → get a unique **16-digit number** → sign up with number + registered email → log in with number + password.
Organizations can list their doctors and share doctors / blood / organs / equipment / medicines with other organizations (request/offer, accept/decline, fulfil). Demo login: `5011000000000014` (AIIMS Kalyani) / `Demo@1234`.

## Patient site
Shows every registered organisation (seeded with Kalyani hospitals, clinic, lab, pharmacy, blood bank and doctors) live. Added: **chatbot** (text, voice, photo → logs a dose and reduces stock), **AI Summary** page and **PDF report download**. Optional: paste a Gemini API key in `mc.gemini.v1` (localStorage) to let the chatbot answer free questions; without it the bot is rule-based.

## How sync works without a backend
Different ports = different browser origins = separate localStorage. The patient site serves `public/hub.html`; the portal embeds it in a hidden iframe and reads/writes the registry via `postMessage` (compare-and-set on `rev`). If the patient site is off, the portal saves locally and re-syncs later.

## Limits (be aware)
* Frontend-only = no real security: passwords are SHA-256 hashed in the browser; data is in localStorage. Demo use only.
* Sync works on one machine/browser (same host, different ports).
* Seed data: Kalyani institution names are real places; licences, phones, emails and **all doctors are made up** — replace before public use.
* Photo logging asks you which medicine it is (no image recognition).
* `npm test` in `medicontinuum-organization` runs 14 tests of the portal logic.
