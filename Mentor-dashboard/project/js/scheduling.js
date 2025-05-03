// Scheduling functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize calendar
  initializeCalendar();
  
  // Handle calendar navigation
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');
  const todayBtn = document.getElementById('todayBtn');
  const currentMonthEl = document.getElementById('currentMonth');
  
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
    });
  }
  
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const today = new Date();
      currentMonth = today.getMonth();
      currentYear = today.getFullYear();
      renderCalendar(currentMonth, currentYear);
    });
  }
  
  // Handle availability toggle
  const availabilityToggle = document.querySelector('.toggle input');
  const timeSlots = document.querySelectorAll('.time-slot input');
  const updateAvailabilityBtn = document.getElementById('updateAvailability');
  
  if (availabilityToggle) {
    availabilityToggle.addEventListener('change', () => {
      const isAvailable = availabilityToggle.checked;
      
      timeSlots.forEach(slot => {
        slot.disabled = !isAvailable;
      });
      
      if (updateAvailabilityBtn) {
        updateAvailabilityBtn.classList.toggle('btn-primary', isAvailable);
        updateAvailabilityBtn.classList.toggle('btn-outline', !isAvailable);
      }
    });
  }
  
  if (updateAvailabilityBtn) {
    updateAvailabilityBtn.addEventListener('click', () => {
      const isAvailable = availabilityToggle.checked;
      const selectedSlots = [];
      
      timeSlots.forEach(slot => {
        if (slot.checked) {
          selectedSlots.push(slot.id);
        }
      });
      
      if (isAvailable && selectedSlots.length === 0) {
        alert('Please select at least one time slot');
        return;
      }
      
      // In a real app, this would update availability in the backend
      alert(`Availability updated: ${isAvailable ? 'Available' : 'Not available'} ${isAvailable ? 'during ' + selectedSlots.join(', ') : ''}`);
      
      // Refresh calendar to show updated availability
      renderCalendar(currentMonth, currentYear);
    });
  }
  
  // Initialize session modal
  const calendarDays = document.querySelectorAll('.calendar-day');
  const sessionModal = document.getElementById('sessionModal');
  const closeModalBtn = sessionModal ? sessionModal.querySelector('.close-btn') : null;
  const acceptSessionBtn = document.getElementById('acceptSession');
  const rejectSessionBtn = document.getElementById('rejectSession');
  const proposeNewTimeBtn = document.getElementById('proposeNewTime');
  
  if (calendarDays.length) {
    calendarDays.forEach(day => {
      day.addEventListener('click', () => {
        if (day.classList.contains('has-events') && sessionModal) {
          sessionModal.classList.add('active');
        }
      });
    });
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      sessionModal.classList.remove('active');
    });
  }
  
  if (acceptSessionBtn) {
    acceptSessionBtn.addEventListener('click', () => {
      alert('Session accepted! A confirmation has been sent to the student.');
      sessionModal.classList.remove('active');
    });
  }
  
  if (rejectSessionBtn) {
    rejectSessionBtn.addEventListener('click', () => {
      alert('Session rejected. Please provide a reason in the next screen.');
      sessionModal.classList.remove('active');
    });
  }
  
  if (proposeNewTimeBtn) {
    proposeNewTimeBtn.addEventListener('click', () => {
      alert('Please select a new time for this session.');
      sessionModal.classList.remove('active');
    });
  }
});

// Initialize and render calendar
function initializeCalendar() {
  const today = new Date();
  renderCalendar(today.getMonth(), today.getFullYear());
}

// Render calendar for a specific month and year
function renderCalendar(month, year) {
  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthEl = document.getElementById('currentMonth');
  
  if (!calendarGrid || !currentMonthEl) return;
  
  // Clear previous calendar
  calendarGrid.innerHTML = '';
  
  // Set current month text
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  currentMonthEl.textContent = `${monthNames[month]} ${year}`;
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get previous month's last days
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  // Current date for highlighting today
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Events data - in a real app this would come from an API
  const events = [
    { date: new Date(year, month, 15), title: 'Career Guidance', type: 1 },
    { date: new Date(year, month, 15), title: 'Project Review', type: 2 },
    { date: new Date(year, month, 16), title: 'Interview Prep', type: 3 },
    { date: new Date(year, month, 18), title: 'Resume Review', type: 2 },
    { date: new Date(year, month, 20), title: 'Project Guidance', type: 1 },
    { date: new Date(year, month, 22), title: 'Career Planning', type: 3 },
    { date: new Date(year, month, 25), title: 'Technical Help', type: 2 }
  ];
  
  // Create calendar days
  let dayCount = 1;
  let nextMonthDay = 1;
  
  // Previous month days
  for (let i = 0; i < firstDay; i++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day other-month';
    dayEl.innerHTML = `<div class="day-number">${prevMonthDays - firstDay + i + 1}</div>`;
    calendarGrid.appendChild(dayEl);
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    // Check if it's today
    if (i === currentDay && month === currentMonth && year === currentYear) {
      dayEl.classList.add('today');
    }
    
    // Check for events on this day
    const dayEvents = events.filter(event => {
      return event.date.getDate() === i && 
             event.date.getMonth() === month && 
             event.date.getFullYear() === year;
    });
    
    if (dayEvents.length > 0) {
      dayEl.classList.add('has-events');
      
      let eventsHtml = '<div class="day-events">';
      dayEvents.forEach(event => {
        eventsHtml += `<div class="day-event type-${event.type}">${event.title}</div>`;
      });
      eventsHtml += '</div>';
      
      dayEl.innerHTML = `
        <div class="day-number">${i}</div>
        ${eventsHtml}
      `;
    } else {
      dayEl.innerHTML = `<div class="day-number">${i}</div>`;
    }
    
    calendarGrid.appendChild(dayEl);
    dayCount++;
  }
  
  // Next month days to fill the grid
  const totalCells = 42; // 6 rows of 7 days
  const remainingCells = totalCells - (firstDay + daysInMonth);
  
  for (let i = 0; i < remainingCells; i++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day other-month';
    dayEl.innerHTML = `<div class="day-number">${nextMonthDay}</div>`;
    calendarGrid.appendChild(dayEl);
    nextMonthDay++;
  }
  
  // Add click event to days with events
  const daysWithEvents = document.querySelectorAll('.calendar-day.has-events');
  const sessionModal = document.getElementById('sessionModal');
  
  daysWithEvents.forEach(day => {
    day.addEventListener('click', () => {
      if (sessionModal) {
        sessionModal.classList.add('active');
      }
    });
  });
}