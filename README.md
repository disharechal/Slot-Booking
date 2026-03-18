# Slot Booking Web Application

A complete slot booking system with Python Flask backend and HTML/CSS/JS frontend.

## Features

- Fetch available slots
- Book slots
- View current bookings
- CORS enabled for cross-origin requests

## Local Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Initialize the database:
   ```
   python init_db.py
   ```

3. Run the Flask app:
   ```
   python app.py
   ```

4. Open `frontend/index.html` in a browser.

## Deployment

### Backend (Python/SQLite or MySQL)

For local development, SQLite is used. For production, switch to MySQL.

To use MySQL in production:
- Change `app.py` to use PyMySQL (uncomment the MySQL code, comment SQLite).
- Add PyMySQL back to requirements.txt.
- Update .env with MySQL credentials.
- Run schema.sql on MySQL server.

### Frontend (Netlify)

1. Upload `frontend/` folder to Netlify.
   - In `script.js`, change `API_BASE` to your deployed backend URL.
   - Deploy to Netlify.

### CORS

- Flask-CORS is already configured to allow all origins.
- For production, specify allowed origins if needed.

## Security

- Use environment variables for database credentials.
- Never commit `.env` to GitHub (add to .gitignore).