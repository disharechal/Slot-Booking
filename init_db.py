import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

# Connect to MySQL server to create the database if it doesn't exist
try:
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', '')
    )
    cursor = conn.cursor()
    
    db_name = os.getenv('DB_NAME', 'slot_booking_db')
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    cursor.execute(f"USE {db_name}")
    
    # Read schema
    with open('schema.sql', 'r') as f:
        schema = f.read()
        
    # Execute schema statements
    for statement in schema.split(';'):
        if statement.strip():
            cursor.execute(statement)
            
    conn.commit()
    print(f'Database "{db_name}" created and initialized successfully!')

except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()