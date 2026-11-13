# Farm Studio backend

FastAPI server that serves the Farm Studio web app (`../frontend`) and its JSON API (`/api`).
Every number in the app comes from live data for the farmer's own field; there is no demo data.

## Run it

Needs Python 3.11 or newer.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill it in: see ../docs/API_KEYS.md
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Open http://localhost:8000 on a phone or laptop. API docs are at http://localhost:8000/docs.

Run the tests:

```bash
python -m pytest -q
```

For production, run behind HTTPS (the browser only gives “My location” to HTTPS sites), e.g. with
Caddy or nginx in front of `uvicorn app.main:app --workers 1`. Keep one worker: the satellite
poller runs inside the process. Back up `farmstudio.db`, or set `DATABASE_URL` to PostgreSQL.

## How the numbers are made

| Feature | Data | Method (`app/agro/…`) |
|---|---|---|
| Field squares | The drawn boundary | `geo.py`: about 40 near-square squares over the field; each square's area is the part inside the boundary |
| Crop suitability and best planting month | NASA POWER 2001–2025 climatology, farmer's water and soil | `climate.py`: FAO ECOCROP temperature ranges, frost days, seasonal irrigation need from Hargreaves ET0 and FAO-56 Kc |
| Climate trend and “plant drought-tolerant crops” advice | NASA POWER monthly series | Linear trend of annual rain and temperature per decade |
| Late or early season advice | NASA POWER daily (last 30 days) vs climatology | Temperature anomaly |
| Watering: drops on squares, “Hold off, rain is coming” | Open-Meteo ET0, rain (92 past + 10 forecast days), deep soil moisture; farmer's logged watering | `water.py`: FAO-56 root-zone water balance per square |
| Harvest dates | Planting date; NASA POWER + forecast temperatures | `phenology.py`: FAO-56 season lengths, growing degree days for grapes, regional windows for olives, dates and citrus |
| Safe-spray window | Open-Meteo hourly wind, gusts, rain, temperature, humidity | `spray.py`: label guidance (wind 3–15 km/h, no rain 4 h after, < 30 °C, RH > 40 %) |
| Frost, heat, heavy rain, wind warnings | Open-Meteo 7-day forecast, SRTM low spots, ECOSTRESS cold spots | `alerts.py` |
| Low spots and slope | SRTM GL1 30 m (OpenTopography) | `sources/elevation.py` |
| Crop health and soil moisture layers | MODIS NDVI, SMAP L4, ECOSTRESS LST via AppEEARS | `sources/appeears.py`, `worker.py` |
| Soil texture when unknown | ISRIC SoilGrids 0–30 cm | `sources/soilgrids.py`, `agro/soil.py` |

Crop parameters live in `app/agro/crops.py` with their sources. An agronomist should review them
for local varieties before a wide rollout.

## API overview

All routes except `/api/health`, `/api/crops`, `/api/soils` and `/api/auth/*` need
`Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in → token |
| GET, PATCH | `/api/me` | Profile, language |
| POST | `/api/analyze` | Land profile, square size, and a verdict for each crop the farmer typed |
| GET, POST | `/api/plots` | List / create plots |
| GET, PATCH, DELETE | `/api/plots/{id}` | Full live state of a plot (squares, water, harvest, weather, alerts) |
| POST | `/api/plots/{id}/plant` · `/irrigate` · `/wait-rain` · `/harvest` · `/clear` | Farmer actions on squares (harvest only accepts ripe squares) |
| POST | `/api/plots/{id}/evaluate` | Judge crops the farmer types for an existing field |
| GET | `/api/crops/match?text=` | Turn typed crop names (English/Arabic) into crop ids |
| GET | `/api/geo/search?q=` | Find towns and villages in Jordan (OpenStreetMap Nominatim) |
| GET, POST | `/api/plots/{id}/spray-window` · `/spray` | 3-day spray windows, booking (red slots refused) |
| GET, POST | `/api/plots/{id}/alerts` · `/alerts/act` | 7-day weather risks and the steps taken |
| GET | `/api/plots/{id}/plan` | Calendar, weekly water, grade, trend, suggestions, NDVI/SMAP series |
| GET | `/api/plots/{id}/events` | Activity history |
| POST | `/api/plots/{id}/satellite/refresh` | Request fresh AppEEARS data |
