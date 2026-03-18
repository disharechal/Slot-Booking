-- Slots table
CREATE TABLE IF NOT EXISTS slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    time VARCHAR(255) NOT NULL,
    available BOOLEAN DEFAULT 1
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);

-- Insert some sample slots
INSERT INTO slots (time, available) VALUES
('9:00 AM - 10:00 AM', 1),
('10:00 AM - 11:00 AM', 1),
('11:00 AM - 12:00 PM', 1),
('1:00 PM - 2:00 PM', 1),
('2:00 PM - 3:00 PM', 1);