# Farm Studio (NASA Space Apps · Field Shift)

A mobile-first farm game that turns NASA Earth observation data into daily decisions for real
fields in Jordan: when and how much to water, when it is safe to spray, how to prepare for frost,
heat and heavy rain, what to plant and when to harvest. English and Arabic.

| Folder | What it is |
|---|---|
| `backend/` | FastAPI server: data sources, agronomy models, accounts, API. Also serves the web app. See [backend/README.md](backend/README.md). |
| `frontend/` | The web app (HTML/CSS/JS, Leaflet map, canvas farm). |
| `docs/API_KEYS.md` | Step-by-step guide to every API key the server needs. |
| `prototype/` | The first clickable design prototype (sample data only). |

Quick start:

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --port 8000
```

Then open http://localhost:8000 and tap **Open the demo farm** to see a ready-made farm in the
North Ghor, or **Add my field** to map your own. See `docs/API_KEYS.md` for the optional keys and
`docs/SUBMISSION.md` for the project submission draft.
