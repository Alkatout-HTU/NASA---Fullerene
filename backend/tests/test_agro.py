import datetime as dt

from app.agro import climate, geo, phenology, soil, spray, water
from app.agro.crops import CROPS
from app.sources import appeears, elevation

CLIM = {  # NASA POWER climatology for 32.47N 35.60E (North Ghor), 2001–2025
    "T2M": dict(zip(climate.MONTHS + ["ANN"], [10.65, 11.91, 14.98, 18.71, 23.29, 26.68, 28.69, 28.8, 26.92, 23.7, 17.72, 12.8, 20.44])),
    "T2M_RANGE": dict(zip(climate.MONTHS + ["ANN"], [12.19, 13.02, 14.75, 16.63, 18.04, 18.63, 18.48, 17.65, 16.96, 15.37, 13.74, 12.71, 15.69])),
    "T2M_MIN": dict(zip(climate.MONTHS + ["ANN"], [-3.77, -1.85, -0.51, 4.22, 8.33, 13.04, 16.18, 17.78, 14.71, 9.24, 2.03, -2.98, -3.77])),
    "T2M_MAX": dict(zip(climate.MONTHS + ["ANN"], [25, 28, 33, 38, 43, 46, 48.9, 47, 44, 40, 33, 27, 48.9])),
    "PRECTOTCORR": dict(zip(climate.MONTHS + ["ANN"], [2.99, 2.8, 1.29, 0.68, 0.2, 0.02, 0, 0.03, 0.05, 0.38, 1.34, 2.54, 1.02])),
    "FROST_DAYS": dict(zip(climate.MONTHS + ["ANN"], [0.8, 0.5, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 1.7])),
}


def test_polygon_area_one_hectare():
    poly = geo.square_around(32.0, 35.9, 10_000)
    assert abs(geo.polygon_area_m2(poly) - 10_000) < 50


def test_grid_marks_cells_inside_triangle():
    tri = [[32.01, 35.90], [32.00, 35.91], [32.00, 35.90]]
    cells = geo.grid(tri, 6)
    assert 0 < sum(c["inside"] for c in cells) < 36


def test_texture_triangle():
    assert soil.classify(sand=11.5, clay=44.8, silt=43.7) == "silty_clay"
    assert soil.classify(sand=90, clay=3) == "sand"
    assert soil.classify(sand=40, clay=20, silt=40) == "loam"


def test_kc_curve_matches_fao_stages():
    tom = CROPS["tomato"]
    assert climate.kc_at(tom, 0) == tom.kc[0]
    assert climate.kc_at(tom, 80) == tom.kc[1]
    assert climate.kc_at(tom, 10_000) == tom.kc[2]


def test_et0_reasonable_for_july_in_jordan_valley():
    et0 = climate.monthly_et0(CLIM, 32.47)
    assert 6 < et0[6] < 9  # July, mm/day
    assert 1.5 < et0[0] < 3.5  # January


def test_barley_prefers_winter_and_sorghum_summer():
    barley = climate.score_crop(CROPS["barley"], CLIM, 32.47, {})
    sorghum = climate.score_crop(CROPS["sorghum"], CLIM, 32.47, {})
    assert barley["start_month"] in (10, 11, 12, 1)
    assert sorghum["start_month"] in (3, 4, 5, 6)


def test_rainfed_rejects_irrigation_only_crops():
    r = climate.score_crop(CROPS["tomato"], CLIM, 32.47, {"farm_type": "rain"})
    assert r["score"] <= 15


def test_water_balance_flags_dry_soil_and_rain_wait():
    tom = CROPS["tomato"]
    today = dt.date(2026, 11, 13)
    days = [{"date": (today - dt.timedelta(days=30 - i)).isoformat(), "et0": 5.0, "rain": 0.0} for i in range(31)]
    days += [{"date": (today + dt.timedelta(days=1)).isoformat(), "et0": 2.0, "rain": 100.0}]
    out = water.simulate(tom, today - dt.timedelta(days=60), "loam", days, today, {}, 0.12, True)
    assert out["needs_water"] and out["wait_for_rain"]
    irrigated = water.simulate(tom, today - dt.timedelta(days=60), "loam", days, today, {today.isoformat(): 200}, 0.12, True)
    assert not irrigated["needs_water"]


def test_dormant_vines_do_not_need_water():
    out = water.simulate(CROPS["grape"], dt.date(2020, 3, 1), "loam",
                         [{"date": "2026-12-01", "et0": 2.0, "rain": 0.0}], dt.date(2026, 12, 1), {}, 0.1, True)
    assert out["dormant"] and not out["needs_water"]


def test_annual_harvest_date():
    st = phenology.status(CROPS["tomato"], dt.date(2026, 1, 1), dt.date(2026, 5, 24), {}, None)
    assert st["ready"] and st["stage"] == 4


def test_perennial_harvest_rolls_to_next_season():
    st = phenology.status(CROPS["grape"], dt.date(2020, 3, 1), dt.date(2026, 11, 13), {}, CLIM)
    assert st["harvest_from"] > "2027-01-01"


def test_spray_rules():
    base = {"time": "2026-11-13T10:00", "temp": 22, "rh": 60, "rain": 0, "rain_prob": 0, "wind": 7, "gust": 12}
    assert spray.hour_zone(base, [])[0] == "g"
    assert spray.hour_zone({**base, "wind": 20}, [])[0] == "r"
    assert spray.hour_zone(base, [{**base, "rain": 2, "rain_prob": 80}])[0] == "r"
    assert spray.hour_zone({**base, "time": "2026-11-13T23:00", "wind": 2}, [])[0] == "y"


def test_appeears_csv_parsing():
    text = ("ID,Latitude,Longitude,Date,MODIS_Tile,MOD13Q1_061__250m_16_days_NDVI,MOD13Q1_061__250m_16_days_VI_Quality\n"
            "t1,32.4,35.6,2026-10-16,h21v05,0.4123,2116\n"
            "t1,32.4,35.6,2026-11-01,h21v05,-3000,2116\n")
    rows = appeears.parse_csv(text, "ndvi", "_250m_16_days_NDVI")
    assert rows == [{"id": "t1", "date": "2026-10-16", "value": 0.4123}]


def test_aaigrid_sampling():
    g = elevation.parse_aaigrid("ncols 3\nnrows 2\nxllcorner 35.0\nyllcorner 32.0\ncellsize 0.1\nNODATA_value -9999\n"
                                "1 2 3\n4 5 6\n")
    assert elevation.sample(g, 32.15, 35.05) == 1
    assert elevation.sample(g, 32.05, 35.25) == 6
