import importlib.util
import os
from http.server import ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def load_local_environment():
    path = ROOT / ".env.local"
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def load_handler():
    path = ROOT / "api" / "water-temperature.py"
    spec = importlib.util.spec_from_file_location("water_temperature", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.handler


if __name__ == "__main__":
    load_local_environment()
    server = ThreadingHTTPServer(("127.0.0.1", 8787), load_handler())
    print("Copernicus local API: http://127.0.0.1:8787")
    server.serve_forever()
