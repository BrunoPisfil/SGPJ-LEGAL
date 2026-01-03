import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    result = conn.execute(text('DESCRIBE procesos'))
    print("Estructura tabla procesos:")
    for row in result:
        print(f"  {row.Field}: {row.Type}")