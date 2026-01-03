import sqlite3

db = sqlite3.connect('backend/sgpj_legal.db')
cursor = db.cursor()

# Check table structure
print("TABLE STRUCTURE:")
cursor.execute("PRAGMA table_info(procesos)")
cols = cursor.fetchall()
for col in cols:
    print(f"  {col}")

# Check if procesos table has data
print("\nCHECKING DATA IN TABLE:")
cursor.execute("SELECT COUNT(*) FROM procesos")
count = cursor.fetchone()[0]
print(f"Total procesos: {count}")

# List columns
cursor.execute("SELECT * FROM procesos LIMIT 1")
columns = [desc[0] for desc in cursor.description]
print(f"\nColumns: {columns}")

# Check specific processes
try:
    cursor.execute("SELECT id, expediente FROM procesos WHERE id IN (8, 9)")
    rows = cursor.fetchall()
    print(f"\nProcesses 8 and 9:")
    for row in rows:
        print(f"  ID {row[0]}: {row[1]}")
except Exception as e:
    print(f"Error: {e}")
