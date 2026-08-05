import json
import sys
from pathlib import Path

from app.main import app

if __name__ == "__main__":
    Path(sys.argv[1]).write_text(json.dumps(app.openapi(), indent=2) + "\n")
