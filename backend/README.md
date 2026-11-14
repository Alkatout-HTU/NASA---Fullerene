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
| Field squares | The drawn boundary, farmer's square size | `geo.py`: grid turned to the field's smallest enclosing rectangle, so squares follow its edges; edge squares are cut at the boundary |
| Crop suitability and best planting month | NASA POWER 2001–2025 climatology, farmer's water and soil | `climate.py`: FAO ECOCROP temperature ranges, frost days, seasonal irrigation need from Hargreaves ET0 and FAO-56 Kc |
| Climate trend and “plant drought-tolerant crops” advice | NASA POWER monthly series | Linear trend of annual rain and temperature per decade |
| Late or early season advice | NASA POWER daily (last 30 days) vs climatology | Temperature anomaly |
| Weekly watering plan and the farmer's watering log | Open-Meteo ET0 and rain (92 past + 10 forecast days; NASA POWER observations and normals if the forecast is down), farmer's weekly water amount and logged waterings | `water.py` + `services.water_plan`: FAO-56 root-zone balance per square; logged waterings are applied as they happened, otherwise the plan is assumed followed; weekly water shared between crops in proportion to need |
| Harvest dates | Planting date; NASA POWER + forecast temperatures | `phenology.py`: FAO-56 season lengths, growing degree days for grapes, regional windows for olives, dates and citrus |
| Safe-spray window | Open-Meteo hourly wind, gusts, rain, temperature, humidity | `spray.py`: label guidance (wind 3–15 km/h, no rain 4 h after, < 30 °C, RH > 40 %) |
| Frost, heat, heavy rain, wind warnings | Open-Meteo 7-day forecast, SRTM low spots, ECOSTRESS cold spots | `alerts.py` |
| Low spots and slope | SRTM GL1 30 m (OpenTopography) | `sources/elevation.py` |
| Crop health and soil moisture layers | MODIS NDVI, SMAP L4, ECOSTRESS LST via AppEEARS | `sources/appeears.py`, `worker.py` |
| Soil texture when unknown | ISRIC SoilGrids 0–30 cm | `sources/soilgrids.py`, `agro/soil.py` |

Crop parameters live in `app/agro/crops.py` with their sources. An agronomist should review them
for local varieties before a wide rollout.

## API overview

There are no accounts. Routes that read or change a farmer's farms need an `X-Farm-Key` header:
a random string (24+ characters) that the app creates on first use and keeps on the device. The
server stores only its SHA-256 hash; the same key on another device opens the same farms.

| Method | Path | Purpose |
|---|---|---|
| GET, PATCH | `/api/me` | Profile, language |
| POST | `/api/analyze` | Land profile, square size, and a verdict for each crop the farmer typed |
| GET, POST | `/api/plots` | List / create plots |
| GET, PATCH, DELETE | `/api/plots/{id}` | Full live state of a plot (squares, water, harvest, weather, alerts) |
| POST | `/api/plots/{id}/plant` · `/harvest` · `/clear` | Farmer actions on squares (harvest only accepts ripe squares) |
| POST | `/api/grid/preview` | Squares for a drawn field and square size (map preview) |
| POST | `/api/plots/{id}/regrid` | Change the square size; crops move to the new squares |
| POST | `/api/plots/{id}/evaluate` | Judge crops the farmer types for an existing field |
| GET | `/api/crops/match?text=` | Turn typed crop names (English/Arabic) into crop ids |
| GET | `/api/geo/search?q=` | Find towns and villages in Jordan (OpenStreetMap Nominatim) |
| GET, POST | `/api/plots/{id}/spray-window` · `/spray` | 3-day spray windows, booking (red slots refused) |
| GET, POST | `/api/plots/{id}/alerts` · `/alerts/act` | 7-day weather risks and the steps taken |
| GET | `/api/plots/{id}/plan` | Calendar, weekly water, grade, trend, suggestions, NDVI/SMAP series |
| GET | `/api/plots/{id}/events` | Activity history |
| POST | `/api/plots/{id}/satellite/refresh` | Request fresh AppEEARS data |
| POST | `/api/plots/{id}/irrigate` | Log that squares were watered today (drag the watering can or hold a square) |
| POST | `/api/demo` | Create (once per device) the demo farm in the North Ghor |
| GET, POST | `/api/plots/{id}/export` · `/api/plots/import` | Move a farm between servers as a JSON file |
| GET, PUT, POST | `/api/notify` · `/notify/prefs` · `/notify/subscribe` · `/notify/unsubscribe` · `/notify/read` · `/notify/test` | Reminders: settings, phone notifications (Web Push), list |

## Watering reminders and phone notifications

A background loop checks every minute and creates, once each, in the farmer's own time zone:
a same-day reminder, a day-before reminder and a weekly plan per crop, at the times the farmer
chose (More → Reminders, or the bell). Reminders always appear in the app's list (the bell).

To also get them on a phone when the app is closed, tap **Turn on** in the reminder settings.
The server sends them with the Web Push standard (VAPID keys are created automatically and
stored in the database; no account or key is needed). Browsers only allow this on **HTTPS** or on
`localhost`, so for phones put the server behind HTTPS (for example Caddy, nginx with
Let's Encrypt, or a tunnel such as Cloudflare Tunnel during a demo). On iPhone, add the site to the
Home Screen first (iOS 16.4+).

## Farm keys, export and import

There are no accounts. Each phone or browser gets a random farm key; the same key on another
device opens the same farms **on the same server**. To move a farm to a different computer or
server, use More → Export this farm, then Import a farm file on the other one.
