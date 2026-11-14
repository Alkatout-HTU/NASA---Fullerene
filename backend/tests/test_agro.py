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
    cells = geo.grid(tri)["cells"]
    assert 0 < sum(c["inside"] for c in cells) < len(cells)


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


def _days(today, n_past, et0, rain_future=None):
    out = [{"date": (today - dt.timedelta(days=n_past - i)).isoformat(), "et0": et0, "rain": 0.0} for i in range(n_past)]
    for k in range(7):
        out.append({"date": (today + dt.timedelta(days=k)).isoformat(), "et0": et0, "rain": (rain_future or {}).get(k, 0.0)})
    return out


def test_weekly_schedule_gives_dates_and_amounts():
    tom = CROPS["tomato"]
    today = dt.date(2026, 7, 1)
    plan = water.schedule(tom, today - dt.timedelta(days=80), "loam", _days(today, 30, 7.0), today, 0.12, True)
    assert plan["events"], "a fruiting tomato in July must need water this week"
    assert all(0 < e["mm"] <= water.MAX_APPLICATION_MM for e in plan["events"])
    # weekly need roughly equals crop water use (Kc x ET0 x 7 days)
    assert 0.6 * plan["etc_week_mm"] <= plan["need_mm_week"] <= 1.4 * plan["etc_week_mm"] + water.MAX_APPLICATION_MM


def test_rain_postpones_watering():
    tom = CROPS["tomato"]
    today = dt.date(2026, 11, 13)
    dry = water.schedule(tom, today - dt.timedelta(days=80), "loam", _days(today, 30, 4.0), today, 0.12, True)
    wet = water.schedule(tom, today - dt.timedelta(days=80), "loam", _days(today, 30, 4.0, {1: 60.0, 2: 40.0}), today, 0.12, True)
    assert wet["need_mm_week"] < dry["need_mm_week"]


def test_dormant_vines_do_not_need_water():
    today = dt.date(2026, 12, 1)
    out = water.schedule(CROPS["grape"], dt.date(2020, 3, 1), "loam", _days(today, 10, 2.0), today, 0.1, True)
    assert out["dormant"] and not out["events"]


def test_rainfed_farm_gets_no_watering_dates():
    today = dt.date(2026, 7, 1)
    out = water.schedule(CROPS["wheat"], today - dt.timedelta(days=60), "loam", _days(today, 30, 7.0), today, 0.1, False)
    assert out["events"] == []


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


def test_grid_follows_rotated_field_exactly():
    import math
    k, j, th = 1 / geo.M_PER_DEG_LAT, 1 / geo.m_per_deg_lon(32.0), math.radians(30)
    pts = []
    for x, y in [(0, 0), (300, 0), (300, 100), (0, 100)]:
        pts.append([32 + (x * math.sin(th) + y * math.cos(th)) * k, 35.9 + (x * math.cos(th) - y * math.sin(th)) * j])
    g = geo.grid(pts, 25, 25)
    assert abs(g["angle_deg"] - 30) < 0.5
    assert (g["cols"], g["rows"], g["squares"]) == (12, 4, 48)
    assert abs(sum(c["area_m2"] for c in g["cells"]) - 30_000) < 100


def test_custom_square_size_and_limits():
    poly = geo.square_around(32.0, 35.9, 100 * 100)
    g = geo.grid(poly, 20, 10)
    assert (g["cols"], g["rows"]) in ((5, 10), (10, 5))
    import pytest
    with pytest.raises(geo.GridError):
        geo.grid(geo.square_around(32.0, 35.9, 1_000_000), 3, 3)


def test_grid_l_shape_leaves_corner_out():
    k = 1 / geo.M_PER_DEG_LAT
    j = 1 / geo.m_per_deg_lon(32.0)
    # 200 m x 200 m L-shape: the north-east 100 x 100 m is missing
    poly = [[32.0, 35.9], [32.0, 35.9 + 100 * j], [32.0 - 100 * k, 35.9 + 100 * j], [32.0 - 100 * k, 35.9 + 200 * j],
            [32.0 - 200 * k, 35.9 + 200 * j], [32.0 - 200 * k, 35.9]]
    g = geo.grid(poly, 25, 25)
    assert g["angle_deg"] == 0
    ne = [c for c in g["cells"] if c["r"] == 0 and c["c"] == g["cols"] - 1][0]
    assert not ne["inside"]
    assert abs(sum(c["area_m2"] for c in g["cells"]) - 30_000) < 300


def test_match_typed_crops():
    from app.agro import matching
    got = [x["crop"] for x in matching.parse("بندورة، عنب وزيتون, zuchini, avocado")]
    assert got == ["tomato", "grape", "olive", "squash", None]


def test_typed_crop_gets_verdict():
    r = climate.score_crop(CROPS["apple"], CLIM, 32.47, {})
    assert r["verdict"] == "poor" and "Not recommended" in r["summary"]["en"]
    r = climate.score_crop(CROPS["barley"], CLIM, 32.47, {})
    assert r["verdict"] == "good"


def test_perennial_not_ready_after_harvest_this_season():
    st = phenology.status(CROPS["olive"], dt.date(2015, 1, 1), dt.date(2026, 11, 1), {}, None)
    assert st["ready"]
    st = phenology.status(CROPS["olive"], dt.date(2015, 1, 1), dt.date(2026, 11, 1), {}, None, dt.date(2026, 10, 20))
    assert not st["ready"] and st["harvested_this_season"]


def test_farm_key_identity():
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as cl:
        assert cl.get("/api/plots").status_code == 400  # no key
        h = {"X-Farm-Key": "test-key-" + "x" * 30}
        assert cl.get("/api/plots", headers=h).json() == []
        assert cl.get("/api/me", headers=h).status_code == 200
        r = cl.post("/api/grid/preview", json={"polygon": geo.square_around(32.0, 35.9, 10_000), "square_w_m": 20, "square_h_m": 20})
        assert r.status_code == 200 and r.json()["squares"] == 25
