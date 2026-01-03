import sqlite3

db = sqlite3.connect('backend/sgpj_legal.db')
cursor = db.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("AVAILABLE TABLES:")
for table in tables:
    print(f"  - {table[0]}")
    
    # Get structure of each table
    cursor.execute(f"PRAGMA table_info({table[0]})")
    cols = cursor.fetchall()
    print(f"    Columns: {[col[1] for col in cols]}")
