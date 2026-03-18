import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_db_connection():
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'slot_booking_db')
    )
    return conn

@app.route('/slots', methods=['GET'])
def get_slots():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, time, available FROM slots WHERE available = 1")
    slots = cursor.fetchall()
    cursor.close()
    conn.close()
    # Convert TINYINT(1) to bool for JSON representation
    for s in slots:
        s['available'] = bool(s['available'])
    return jsonify(slots)

@app.route('/book', methods=['POST'])
def book_slot():
    data = request.get_json()
    slot_id = data.get('slot_id')
    user_name = data.get('user_name')
    if not slot_id or not user_name:
        return jsonify({'error': 'Missing slot_id or user_name'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check if available
    cursor.execute("SELECT available FROM slots WHERE id = %s", (slot_id,))
    slot = cursor.fetchone()
    
    if not slot or not slot['available']:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Slot not available'}), 400
        
    # Update slot to not available
    cursor.execute("UPDATE slots SET available = 0 WHERE id = %s", (slot_id,))
    # Insert booking
    cursor.execute("INSERT INTO bookings (slot_id, user_name) VALUES (%s, %s)", (slot_id, user_name))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Slot booked successfully'})

@app.route('/bookings', methods=['GET'])
def get_bookings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT b.id, s.time, b.user_name, b.booked_at FROM bookings b JOIN slots s ON b.slot_id = s.id")
    bookings = cursor.fetchall()
    cursor.close()
    conn.close()
    for b in bookings:
        b['booked_at'] = str(b['booked_at'])
    return jsonify(bookings)

@app.route('/all-slots', methods=['GET'])
def get_all_slots():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, time, available FROM slots")
    slots = cursor.fetchall()
    cursor.close()
    conn.close()
    for s in slots:
        s['available'] = bool(s['available'])
    return jsonify(slots)

@app.route('/slots', methods=['POST'])
def create_slot():
    data = request.get_json()
    time = data.get('time')
    if not time:
        return jsonify({'error': 'Missing time'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO slots (time, available) VALUES (%s, 1)", (time,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Slot created successfully'}), 201

@app.route('/slots/<int:slot_id>', methods=['PUT'])
def update_slot(slot_id):
    data = request.get_json()
    time = data.get('time')
    if not time:
        return jsonify({'error': 'Missing time'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE slots SET time = %s WHERE id = %s", (time, slot_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Slot updated successfully'})

@app.route('/slots/<int:slot_id>', methods=['DELETE'])
def delete_slot(slot_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ensure bookings for this slot are deleted (cascade handles this if defined in schema, but good to be explicit or let DB handle it)
    cursor.execute("DELETE FROM slots WHERE id = %s", (slot_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Slot deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True)