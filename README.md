# Wellness Oasis Clinic frontend

Responsive, framework-free patient experience for clinic discovery,
authentication, appointment booking, profile management, and contact requests.

## Run locally

Start the Django API on port 8000, then serve this directory:

```powershell
python -m http.server 5500 --bind 127.0.0.1
```

Open `http://127.0.0.1:5500/index.html`.

`api.js` automatically uses the local API on localhost and the hosted API
elsewhere. A deployment can override this before `api.js` loads:

```html
<script>window.WELLNESS_API_URL = "https://api.example.com";</script>
```

## Main pages

- `index.html` — services and doctor discovery
- `services.html` — service catalogue
- `docdetails.html` — doctor profile and appointment booking
- `login.html` / `signup.html` — patient authentication
- `userDetail.html` — private patient portal
- `contactus.html` — care-desk request

All user-provided API content is escaped before being inserted into the page.
