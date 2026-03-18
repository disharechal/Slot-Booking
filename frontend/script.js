const API_BASE = 'http://localhost:5000'; // Change to your deployed backend URL

// --- UI Utilities ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // wait for exit animation
    }, 3000);
}

// --- API Calls & Renderers ---
async function loadAllSlots() {
    try {
        const response = await fetch(`${API_BASE}/all-slots`);
        const slots = await response.json();
        const allSlotsList = document.getElementById('all-slots-list');
        allSlotsList.innerHTML = '';
        
        if (slots.length === 0) {
            allSlotsList.innerHTML = '<div class="empty-state">No slots created yet. Add one above!</div>';
            return;
        }
        
        slots.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'slot-card';
            const statusClass = slot.available ? 'available' : 'booked';
            const statusText = slot.available ? 'Available' : 'Booked';
            
            div.innerHTML = `
                <div class="slot-header">
                    <span class="time-str">${slot.time}</span>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                <input type="text" id="edit-${slot.id}" placeholder="New time e.g. 4:00 PM" style="display:none;" autocomplete="off">
                <div class="action-row">
                    <button onclick="toggleEdit(${slot.id})" class="btn-outline" id="edit-btn-${slot.id}">✎ Edit</button>
                    <button onclick="saveEdit(${slot.id})" style="display:none;" class="btn-success" id="save-${slot.id}">💾 Save</button>
                    <button onclick="deleteSlot(${slot.id})" class="btn-danger">🗑️ Delete</button>
                </div>
            `;
            allSlotsList.appendChild(div);
        });
    } catch (error) {
        showToast('Error loading admin slots. Is the backend running?', 'error');
        console.error(error);
    }
}

async function loadSlots() {
    try {
        const response = await fetch(`${API_BASE}/slots`);
        const slots = await response.json();
        const slotsList = document.getElementById('slots-list');
        slotsList.innerHTML = '';
        
        if (slots.length === 0) {
            slotsList.innerHTML = '<div class="empty-state">No available slots at the moment. Please check back later.</div>';
            return;
        }
        
        slots.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'slot-card';
            div.innerHTML = `
                <div class="slot-header" style="margin-bottom: 0.5rem;">
                    <span class="time-str">⏰ ${slot.time}</span>
                </div>
                <input type="text" id="user-${slot.id}" placeholder="Enter your full name" autocomplete="off">
                <button onclick="bookSlot(${slot.id})" class="btn-primary" style="margin-top: 5px; width: 100%;">
                    📅 Book This Slot
                </button>
            `;
            slotsList.appendChild(div);
        });
    } catch (error) {
        showToast('Error loading available slots.', 'error');
        console.error(error);
    }
}

async function createSlot() {
    const timeInput = document.getElementById('new-slot-time');
    const time = timeInput.value.trim();
    
    if (!time) {
        showToast('Please enter a valid time range!', 'error');
        timeInput.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time: time })
        });
        
        if (response.ok) {
            showToast('Slot created successfully!', 'success');
            timeInput.value = '';
            loadAllSlots();
            loadSlots();
        } else {
            const data = await response.json();
            showToast(data.error || 'Error creating slot', 'error');
        }
    } catch (error) {
        showToast('Connection error.', 'error');
    }
}

function toggleEdit(slotId) {
    const input = document.getElementById(`edit-${slotId}`);
    const saveBtn = document.getElementById(`save-${slotId}`);
    const editBtn = document.getElementById(`edit-btn-${slotId}`);
    
    if (input.style.display === 'none') {
        input.style.display = 'block';
        input.style.marginBottom = '10px';
        saveBtn.style.display = 'inline-flex';
        editBtn.innerText = 'Cancel';
        input.focus();
    } else {
        input.style.display = 'none';
        saveBtn.style.display = 'none';
        editBtn.innerText = '✎ Edit';
    }
}

async function saveEdit(slotId) {
    const input = document.getElementById(`edit-${slotId}`);
    const newTime = input.value.trim();
    
    if (!newTime) {
        showToast('Please enter a time', 'warning');
        input.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/slots/${slotId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time: newTime })
        });
        
        if (response.ok) {
            showToast('Slot updated successfully!', 'success');
            loadAllSlots();
            loadSlots();
        } else {
            showToast('Error updating slot', 'error');
        }
    } catch (error) {
        showToast('Connection error.', 'error');
    }
}

async function deleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this slot permanently?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/slots/${slotId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Slot deleted permanently.', 'info');
            loadAllSlots();
            loadSlots();
            loadBookings();
        } else {
            showToast('Error deleting slot', 'error');
        }
    } catch (error) {
        showToast('Connection error.', 'error');
    }
}

async function bookSlot(slotId) {
    const userEl = document.getElementById(`user-${slotId}`);
    const userName = userEl.value.trim();
    
    if (!userName) {
        showToast('Please enter your name to book.', 'warning');
        userEl.focus();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot_id: slotId, user_name: userName })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`${userName} successfully booked the slot!`, 'success');
            loadAllSlots();
            loadSlots();
            loadBookings();
        } else {
            showToast(result.error || 'Booking failed', 'error');
        }
    } catch (error) {
        showToast('Connection error.', 'error');
    }
}

async function loadBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings`);
        const bookings = await response.json();
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = '';
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = '<div class="empty-state">No bookings yet.</div>';
            return;
        }
        
        bookings.forEach(booking => {
            const div = document.createElement('div');
            div.className = 'booking-card';
            
            // Format date nicely
            const dateObj = new Date(booking.booked_at);
            const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric'
            }) : booking.booked_at;

            div.innerHTML = `
                <div style="margin-bottom: 15px; display: inline-block;">
                    <span class="badge" style="background: var(--success); color: white; border: none;">Confirmed</span>
                </div>
                <div class="booking-detail">
                    <strong>⌚ Time</strong>
                    <span>${booking.time}</span>
                </div>
                <div class="booking-detail">
                    <strong>👤 Name</strong>
                    <span>${booking.user_name}</span>
                </div>
                <div class="booking-detail">
                    <strong>📅 Date</strong>
                    <span>${formattedDate}</span>
                </div>
            `;
            bookingsList.appendChild(div);
        });
    } catch (error) {
        showToast('Error loading bookings.', 'error');
        console.error(error);
    }
}

// Ensure init happens properly
window.addEventListener('DOMContentLoaded', () => {
    loadAllSlots();
    loadSlots();
    loadBookings();
});