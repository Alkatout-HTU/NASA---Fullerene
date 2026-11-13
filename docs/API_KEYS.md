# Farm Studio: data sources and how to get each key

Farm Studio uses seven outside services. Three need something from you; the other four work with no key.

| # | Service | What Farm Studio uses it for | Key needed? | `.env` variable |
|---|---------|------------------------------|-------------|-----------------|
| 1 | **NASA Earthdata Login → AppEEARS** | SMAP root-zone soil moisture, MODIS NDVI (crop health), ECOSTRESS night surface temperature (cold spots) for every square of the field | **Yes** (free account) | `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD` |
| 2 | **OpenTopography** (NASA SRTM GL1, 30 m) | Elevation and slope of each square, low spots for frost and flooding | **Yes** (free key) | `OPENTOPOGRAPHY_API_KEY` |
| 3 | **OpenStreetMap Nominatim** | Turns coordinates into a village / district name | Contact e-mail only | `NOMINATIM_EMAIL` |
| 4 | NASA POWER | 25-year climate, monthly trends, recent daily weather | No | – |
| 5 | Open-Meteo | 10-day forecast, ET0 for the water balance, hourly wind for spraying | No (non-commercial) | `OPEN_METEO_API_KEY` only for commercial use |
| 6 | ISRIC SoilGrids | Soil texture when the farmer chooses “Not sure” | No | – |
| 7 | OpenStreetMap tiles | The map used to draw the field | No | – |

You also need to make one secret yourself: `SECRET_KEY` (step 0).

---

## Step 0: Create `backend/.env`

```bash
cd backend
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Paste the printed string after `SECRET_KEY=` in `backend/.env`.

---

## Step 1: NASA Earthdata Login (for AppEEARS)

1. Open https://urs.earthdata.nasa.gov/users/new and create a free account. Use a team e-mail you control. Confirm the e-mail NASA sends you.
2. Sign in at https://urs.earthdata.nasa.gov.
3. Sign in once at https://appeears.earthdatacloud.nasa.gov with the same username and password, and accept anything it asks you to authorize. This confirms the account works with AppEEARS.
4. Put the username and password in `backend/.env`:
   ```
   EARTHDATA_USERNAME=your_username
   EARTHDATA_PASSWORD=your_password
   ```

If **More → NASA satellite layers** later shows an authorization error, sign in at https://urs.earthdata.nasa.gov, open **Applications → Authorized Apps**, click **Approve More Applications**, and approve the LP DAAC and NSIDC applications listed there (MODIS, ECOSTRESS and SRTM come from LP DAAC; SMAP comes from NSIDC).

**What happens next:** when a plot is created, the server sends one AppEEARS request with the centre of each field square. NASA processes it in a few minutes to a few hours. The background worker collects the results, and **More → NASA satellite layers** shows the status. Requests are refreshed every 8 days.

---

## Step 2: OpenTopography API key (SRTM elevation)

1. Open https://portal.opentopography.org/newUser and create a free account (academic or non-commercial use is free).
2. Sign in, then go to **MyOpenTopo → Request API Key** (https://portal.opentopography.org/requestService?service=api).
3. Copy the key that appears.
4. Put it in `backend/.env`:
   ```
   OPENTOPOGRAPHY_API_KEY=your_key
   ```

Free keys allow a limited number of requests per day. Farm Studio calls OpenTopography only when a plot is created or analysed, so this is plenty for a pilot.

---

## Step 3: Nominatim contact e-mail

No account is needed. Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/) asks every app to identify itself with a contact address, and allows at most 1 request per second. Farm Studio caches every answer for 90 days.

```
NOMINATIM_EMAIL=team@your-domain.org
```

---

## Step 4 (only for commercial use): Open-Meteo

Open-Meteo's free API is for non-commercial use. If Farm Studio is sold or used commercially, buy an API subscription at https://open-meteo.com/en/pricing and set:

```
OPEN_METEO_API_KEY=your_key
```

---

## Step 5: Check everything

Start the server (see `backend/README.md`), then open http://localhost:8000/api/health. Each integration you configured shows `true`:

```json
{"ok": true, "integrations": {"nasa_power": true, "open_meteo": true, "soilgrids": true,
 "earthdata_appeears": true, "opentopography_srtm": true, "nominatim": true, "secret_key_set": true}}
```

In the app, **More → Data sources** lists every source with the time it was last fetched and any error.

## Keep the keys private

- Put keys only in `backend/.env` on the machine that runs the server. `.env` is already in `.gitignore`.
- Do not paste keys or passwords into chat, issues, pull requests or screenshots.
- If a key leaks, revoke it on the provider's site and make a new one. For Earthdata, change the password.
