import sqlite3

db = sqlite3.connect('backend/sgpj_legal.db')
db.row_factory = sqlite3.Row
cursor = db.cursor()

# Get processes 8 and 9
cursor.execute('SELECT id, expediente, estado, estado_juridico FROM procesos WHERE id IN (8, 9)')
rows = cursor.fetchall()

print("=" * 80)
print("CHECKING PROCESSES 8 AND 9:")
print("=" * 80)

for row in rows:
    print(f"\nProceso ID {row['id']}:")
    print(f"  expediente: {row['expediente']}")
    print(f"  estado: {repr(row['estado'])}")
    print(f"  estado_juridico: {repr(row['estado_juridico'])}")

print("\n" + "=" * 80)
print("ALL PROCESSES WITH THEIR STATES:")
print("=" * 80)

cursor.execute('SELECT id, expediente, estado, estado_juridico FROM procesos ORDER BY id')
rows = cursor.fetchall()

for row in rows:
    print(f"ID {row['id']:2d}: {row['expediente']:30s} | estado={str(row['estado']):20s} | juridico={str(row['estado_juridico']):30s}")
