import json
import math
import os
import threading
import time
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import copernicusmarine


DATASET_ID = "cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i"
DISPLAY_DEPTHS = (0, 10, 20, 30)
CACHE_SECONDS = 3 * 60 * 60
temperature_cache = {}
cache_lock = threading.Lock()


def number(value):
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


class handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "s-maxage=10800, stale-while-revalidate=86400")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        latitude = number(query.get("lat", [None])[0])
        longitude = number(query.get("lon", [None])[0])

        if latitude is None or longitude is None:
            return self.send_json(400, {"message": "lat과 lon 좌표가 필요합니다."})
        if not 32 <= latitude <= 39 or not 124 <= longitude <= 132:
            return self.send_json(400, {"message": "한국 주변 해역 좌표만 조회할 수 있습니다."})

        cache_key = (round(latitude, 3), round(longitude, 3))
        with cache_lock:
            cached = temperature_cache.get(cache_key)
        if cached and time.time() - cached["saved_at"] < CACHE_SECONDS:
            return self.send_json(200, {**cached["payload"], "cached": True})

        username = os.environ.get("COPERNICUSMARINE_SERVICE_USERNAME")
        password = os.environ.get("COPERNICUSMARINE_SERVICE_PASSWORD")
        if not username or not password:
            return self.send_json(503, {"message": "Copernicus 서버 인증정보가 설정되지 않았습니다."})

        now = datetime.now(timezone.utc)
        try:
            search_radius = 0.2
            dataset = copernicusmarine.open_dataset(
                dataset_id=DATASET_ID,
                username=username,
                password=password,
                variables=["thetao"],
                minimum_longitude=longitude - search_radius,
                maximum_longitude=longitude + search_radius,
                minimum_latitude=latitude - search_radius,
                maximum_latitude=latitude + search_radius,
                minimum_depth=0,
                maximum_depth=35,
                start_datetime=now,
                end_datetime=now + timedelta(hours=12),
                coordinates_selection_method="nearest",
            )

            profile = dataset["thetao"].isel(time=0).load()
            surface = profile.sel(depth=0, method="nearest").stack(point=("latitude", "longitude"))
            valid_surface = surface.dropna("point")
            if valid_surface.sizes.get("point", 0) == 0:
                raise ValueError("No valid ocean grid was found near this point")

            distance = (
                (valid_surface.coords["latitude"] - latitude) ** 2
                + ((valid_surface.coords["longitude"] - longitude) * math.cos(math.radians(latitude)))
                ** 2
            )
            nearest_index = int(distance.argmin(dim="point").values.item())
            model_latitude = number(valid_surface.coords["latitude"].isel(point=nearest_index).values.item())
            model_longitude = number(
                valid_surface.coords["longitude"].isel(point=nearest_index).values.item()
            )

            temperatures = []
            for requested_depth in DISPLAY_DEPTHS:
                value = profile.sel(
                    depth=requested_depth,
                    latitude=model_latitude,
                    longitude=model_longitude,
                    method="nearest",
                )
                temperature = number(value.squeeze().values.item())
                actual_depth = number(value.coords["depth"].values.item())
                temperatures.append(
                    {
                        "depth": requested_depth,
                        "modelDepth": round(actual_depth, 1) if actual_depth is not None else None,
                        "temp": round(temperature, 1) if temperature is not None else None,
                    }
                )

            forecast_time = dataset.coords["time"].values[0]
            payload = {
                "temperatures": temperatures,
                "forecastTime": str(forecast_time),
                "source": "Copernicus Marine Global Ocean Physics Forecast",
                "modelResolution": "약 8~9km",
                "modelCoordinate": {
                    "latitude": round(model_latitude, 3),
                    "longitude": round(model_longitude, 3),
                },
            }
            with cache_lock:
                temperature_cache[cache_key] = {"saved_at": time.time(), "payload": payload}
            return self.send_json(200, payload)
        except Exception as error:
            print(f"Copernicus temperature request failed: {type(error).__name__}: {error}")
            return self.send_json(
                502,
                {"message": f"Copernicus 요청 실패: {type(error).__name__}"},
            )
