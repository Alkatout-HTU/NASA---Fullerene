# Farm Studio — Project submission draft

Draft answers for the 2026 NASA Space Apps "Components of Project" form, challenge **Field Shift:
Adapting Farms with NASA Data**. Edit the parts marked **TODO** before submitting.

---

## High-level summary (50–200 words)

**Farm Studio**

Farm Studio is a mobile web app that turns NASA Earth data into daily, field-level decisions for
farmers in Jordan, presented as a simple farm game in Arabic and English. A farmer draws their
real field on a satellite map; the app splits it into squares that follow the field's edges and
reads 25 years of NASA POWER climate, SRTM terrain, and SMAP, MODIS and ECOSTRESS satellite layers
for that exact spot. It then judges the crops the farmer wants to grow, builds a planting
calendar from the local climate, and turns a single weekly water allowance into a watering plan:
which crops to water, on which days, how much, and whether the water is enough. It also marks
safe spraying windows and warns ahead of frost, heat and heavy rain, with steps to take. Jordan
is one of the most water-scarce countries in the world and its rainfall is falling; Farm Studio
helps farmers use every cubic metre where it matters and adapt crops and calendars to a changing
climate, using free, open NASA data.

## Link to project demo

**TODO:** one link only — a slide deck (7 slides maximum, title slide counts) **or** a 30-second
video with English subtitles. Upload it publicly (YouTube, Google Drive, GitHub…) and open it in a
private/incognito window to confirm it needs no sign-in. Do not show anyone under 18.

Link to project: https://github.com/Alkatout-HTU/NASA---Fullerene (make sure the repository is public).
The app itself needs no account or registration.

## Project details

**What it does**
- Field mapping: the farmer draws their field on satellite imagery (search any town or village in
  Jordan); the app splits it into squares of a size the farmer chooses, turned to follow the
  field's edges, and shows every edge length and square size.
- Crop check: the farmer types the crops they want, in Arabic or English; each is rated
  Useful / Can work / Not recommended with the reasons (temperature, frost, winter chilling,
  water, soil, crop rotation, climate trend).
- Weekly watering plan: the farmer enters the water they have per week; the app shares it between
  crops by need and says on which days to water each crop and how many mm / m³, and how much of
  the need the weekly water covers. The farmer logs real waterings by dragging the watering can
  over the squares (or holding a square), and the plan updates from what was actually done.
- Reminders: on the watering day, the day before and a weekly plan per crop, at times the farmer
  picks; shown in the app and sent to the phone as notifications (Web Push), each can be switched off.
- Demo farm: one tap opens a ready-made farm in the North Ghor with crops at different stages,
  computed from live data, for demonstrations.
- Planting calendar and harvest dates from local climate; a sickle harvests ripe squares.
- Safe-spray windows for the next 3 days (wind, rain, heat, humidity rules from pesticide labels).
- 7-day frost, heat, heavy-rain and wind warnings, stronger for low-lying squares, with field actions.

**How it works**
- Backend: Python, FastAPI, SQLAlchemy (SQLite), httpx, cryptography (Web Push). Frontend:
  HTML/CSS/JavaScript, Leaflet map, HTML canvas for the farm view, a service worker for
  notifications. No accounts: each device keeps a random farm key; farms move between servers as files.
- Crop water use follows FAO-56 (crop coefficient × reference evapotranspiration, root-zone
  water balance per square). Crop climate ranges follow FAO ECOCROP.
- Crop suitability and the planting calendar are computed from NASA POWER monthly climatology
  (2001–2025); the climate-trend advice from NASA POWER monthly series; harvest timing for vines
  from growing degree days on NASA POWER daily temperatures.
- Low, frost-prone squares come from SRTM 30 m elevation; cold spots from ECOSTRESS night land
  surface temperature; crop health from MODIS NDVI; satellite soil moisture from SMAP L4.

**Testing and validation**
- 26 automated tests cover geometry (field areas, rotated grids), the FAO-56 crop curve, reference
  evapotranspiration for the Jordan Valley (July ≈ 6–9 mm/day), the watering plan (rain postpones
  watering, dormant vines need none, rain-fed fields get no dates, logged waterings replace the
  assumed plan), crop matching in Arabic and English, harvest rules, data parsing, reminder text and
  timing, and Web Push encryption (a message is encrypted and then decrypted as a phone would).
- An API sweep exercises all 40 endpoint behaviours, including error cases; a push message was
  delivered to a test push service and decrypted correctly.
- End-to-end browser tests on a phone-size screen in English and Arabic.
- **TODO:** if possible, compare the plan with a local farmer's or extension officer's practice
  and report what you found.

**Assumptions and limitations**
- The watering plan assumes the farmer follows it; it does not measure soil moisture directly.
  SMAP satellite soil moisture (9 km) is shown for comparison.
- Crop parameters come from FAO references and need checking by an agricultural engineer for local
  varieties.
- Forecasts come from Open-Meteo (non-commercial free tier). If the forecast is unavailable, the
  watering plan falls back to NASA POWER observations and long-term averages and is marked as an
  estimate; weather warnings are not shown from averages.

**Benefits and what we hope to achieve**
- Less water wasted and fewer crop losses from frost, heat and badly timed spraying.
- Crop and calendar choices that fit a drying, warming climate.
- Next steps: field pilots with farmers and the Ministry of Agriculture extension service,
  offline use, SMS/WhatsApp reminders, and calibration against local irrigation data.

## Use of SI (AI tools)

**TODO:** select the tools you used in the form's drop-down. Suggested description:
"We used an AI coding assistant (Claude) to help write parts of the code, documentation and app
text. All outputs were reviewed and tested by the team (automated tests and manual testing). No
AI-generated content uses or modifies NASA logos, flags or mission identifiers." The same statement
appears in the app under More → About & data.

## NASA data

- NASA POWER (Prediction Of Worldwide Energy Resources) — climatology, monthly and daily point data:
  https://power.larc.nasa.gov/ · API: https://power.larc.nasa.gov/docs/services/api/
- NASA AppEEARS (Application for Extracting and Exploring Analysis Ready Samples):
  https://appeears.earthdatacloud.nasa.gov/
  - SMAP L4 Global 3-hourly 9 km Surface and Root Zone Soil Moisture (SPL4SMGP v008):
    https://nsidc.org/data/spl4smgp
  - MODIS/Terra Vegetation Indices 16-Day L3 Global 250 m (MOD13Q1 v061):
    https://lpdaac.usgs.gov/products/mod13q1v061/
  - ECOSTRESS Tiled Land Surface Temperature and Emissivity (ECO_L2T_LSTE v002):
    https://lpdaac.usgs.gov/products/eco_l2t_lstev002/
- NASA SRTM Global 1 arc second elevation (SRTMGL1 v003), served by OpenTopography:
  https://lpdaac.usgs.gov/products/srtmgl1v003/
- NASA Earthdata Login: https://urs.earthdata.nasa.gov/

## Space Agency Partner data and other resources

- Open-Meteo weather forecast and FAO-56 reference evapotranspiration: https://open-meteo.com/
- Copernicus DEM GLO-90 (fallback elevation, via Open-Meteo): https://open-meteo.com/en/docs/elevation-api
- ISRIC SoilGrids 2.0 soil texture: https://soilgrids.org/
- OpenStreetMap map tiles and Nominatim place search: https://www.openstreetmap.org/copyright
- Esri World Imagery satellite basemap: https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
- OpenTopography global DEM API: https://portal.opentopography.org/
- FAO Irrigation and Drainage Paper 56 (crop evapotranspiration): https://www.fao.org/3/x0490e/x0490e00.htm
- FAO ECOCROP crop database: https://gaez.fao.org/pages/ecocrop
- FAO, Frost protection: fundamentals, practice and economics (2005): https://www.fao.org/3/y7223e/y7223e00.htm
- Code libraries: FastAPI, SQLAlchemy, httpx, Pydantic, Leaflet, Google Fonts (Baloo Bhaijaan 2,
  IBM Plex Sans Arabic, IBM Plex Mono).
- Source code: https://github.com/Alkatout-HTU/NASA---Fullerene

---

## Checklist from the local judging guide (Amman & Aqaba, 13–14 Nov 2026)

Presentation is 7 minutes plus 3 minutes of questions. Judges score Creativity (20%), Validity &
Technical Feasibility (20%), Relevance (15%), Impact (15%), Sustainability (15%) and
Presentation & Teamwork (15%). Make sure the pitch shows:

- [ ] A clear problem statement tied to the Field Shift challenge (water scarcity and climate shift in Jordan).
- [ ] A live demo: open the demo farm → tutorial → drag the watering can / sickle → Plan (calendar and
      water plan) → Spray → Risks → reminders; then draw a new field and check crops.
- [ ] Where NASA data drives the results (calendar and crop ratings from NASA POWER, low spots from
      SRTM, satellite layers from SMAP/MODIS/ECOSTRESS) — the More → Data sources list shows it live.
- [ ] Testing and validation (the automated tests, browser tests) and the limitations above.
- [ ] Impact and a realistic roadmap (pilot farms, extension officers, offline use).
- [ ] Sustainability: free open data, low running cost (one small server, SQLite), modular code.
- [ ] The AI-use statement and citations.
- [ ] Development history: the GitHub commit history shows how the app evolved during the event.
- [ ] Every team member can answer questions on their part.
