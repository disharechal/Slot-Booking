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

// --- Cookie Memory Fallback ---
function getCookieData(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
    return null;
}

function setCookieData(name, data) {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=86400`; // 1 day memory
}

// Initialize cookies with default demo data if empty
if (!getCookieData('slots')) {
    setCookieData('slots', [
        { id: 1, time: '10:00 AM - 11:00 AM', available: true },
        { id: 2, time: '2:00 PM - 3:00 PM', available: true }
    ]);
}
if (!getCookieData('bookings')) {
    setCookieData('bookings', []);
}

// --- API Calls & Renderers ---
async function loadAllSlots() {
    let slots = [];
    try {
        const response = await fetch(`${API_BASE}/all-slots`);
        if (!response.ok) throw new Error('Backend failed');
        slots = await response.json();
    } catch (error) {
        // Backend offline -> Fallback to cookies
        console.warn('Backend offline. Loaded slots directly from Cookie Memory.');
        slots = getCookieData('slots');
    }
    
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
}

async function loadSlots() {
    let slots = [];
    try {
        const response = await fetch(`${API_BASE}/slots`);
        if (!response.ok) throw new Error('Backend failed');
        slots = await response.json();
    } catch (error) {
        slots = getCookieData('slots').filter(s => s.available);
    }
    
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
        if (!response.ok) throw new Error('Backend failed');
    } catch (error) {
        // Fallback to cookies
        let localSlots = getCookieData('slots') || [];
        localSlots.push({ id: Date.now(), time: time, available: true });
        setCookieData('slots', localSlots);
    }
    
    showToast('Slot created successfully!', 'success');
    timeInput.value = '';
    loadAllSlots();
    loadSlots();
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
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/slots/${slotId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time: newTime })
        });
        if (!response.ok) throw new Error('Backend failed');
    } catch (error) {
        // Fallback to cookies
        let localSlots = getCookieData('slots');
        let slotIndex = localSlots.findIndex(s => s.id === slotId);
        if (slotIndex !== -1) localSlots[slotIndex].time = newTime;
        setCookieData('slots', localSlots);
    }
    
    showToast('Slot updated successfully!', 'success');
    loadAllSlots();
    loadSlots();
}

async function deleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this slot permanently?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/slots/${slotId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Backend failed');
    } catch (error) {
        let localSlots = getCookieData('slots');
        localSlots = localSlots.filter(s => s.id !== slotId);
        setCookieData('slots', localSlots);
    }
    
    showToast('Slot deleted permanently.', 'info');
    loadAllSlots();
    loadSlots();
    loadBookings();
}

async function bookSlot(slotId) {
    const userEl = document.getElementById(`user-${slotId}`);
    const userName = userEl.value.trim();
    
    if (!userName) {
        showToast('Please enter your name to book.', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot_id: slotId, user_name: userName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
    } catch (error) {
        // Fallback to cookies
        let localSlots = getCookieData('slots');
        let localBookings = getCookieData('bookings') || [];
        let slotIndex = localSlots.findIndex(s => s.id === slotId);
        
        if (slotIndex !== -1 && localSlots[slotIndex].available) {
            localSlots[slotIndex].available = false;
            localBookings.push({
                id: Date.now(),
                slot_id: slotId,
                time: localSlots[slotIndex].time,
                user_name: userName,
                booked_at: new Date().toISOString()
            });
            setCookieData('slots', localSlots);
            setCookieData('bookings', localBookings);
        } else {
            showToast('Slot not available!', 'error');
            return;
        }
    }
    
    showToast(`${userName} successfully booked the slot!`, 'success');
    loadAllSlots();
    loadSlots();
    loadBookings();
}

async function loadBookings() {
    let bookings = [];
    try {
        const response = await fetch(`${API_BASE}/bookings`);
        if (!response.ok) throw new Error('Backend failed');
        bookings = await response.json();
    } catch (error) {
        bookings = getCookieData('bookings') || [];
    }
    
    const bookingsList = document.getElementById('bookings-list');
    bookingsList.innerHTML = '';
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = '<div class="empty-state">No bookings yet.</div>';
        return;
    }
    
    bookings.forEach(booking => {
        const div = document.createElement('div');
        div.className = 'booking-card';
        
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
}

// Ensure init happens properly
window.addEventListener('DOMContentLoaded', () => {
    loadAllSlots();
    loadSlots();
    loadBookings();
});