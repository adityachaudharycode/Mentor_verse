// Student Profiles functionality
document.addEventListener('DOMContentLoaded', function() {
  initializeProfileFilters();
  
  // Handle student profile actions
  const viewProfileButtons = document.querySelectorAll('.student-card .btn-outline');
  const messageButtons = document.querySelectorAll('.student-card .btn-primary');
  
  viewProfileButtons.forEach(button => {
    button.addEventListener('click', () => {
      const studentId = button.closest('.student-card').getAttribute('data-id');
      // In a real app, this would open a detailed profile view
      alert(`View detailed profile for student ID: ${studentId}`);
    });
  });
  
  messageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const studentId = button.closest('.student-card').getAttribute('data-id');
      const studentName = button.closest('.student-card').querySelector('h3').textContent;
      
      // Navigate to inbox and select the student's message thread
      window.location.hash = 'student-inbox';
      
      // In a real app, we would select the correct message thread
      // For demo purposes, we'll just show an alert
      setTimeout(() => {
        alert(`Navigate to message thread with ${studentName} (ID: ${studentId})`);
      }, 500);
    });
  });
});

// Initialize profile filters
function initializeProfileFilters() {
  const studentSearch = document.getElementById('studentSearch');
  const programFilter = document.getElementById('program-filter');
  const yearFilter = document.getElementById('year-filter');
  const interestFilter = document.getElementById('interest-filter');
  const studentGrid = document.getElementById('studentGrid');
  const studentCards = studentGrid ? studentGrid.querySelectorAll('.student-card') : [];
  
  // Function to filter students
  function filterStudents() {
    const searchTerm = studentSearch ? studentSearch.value.toLowerCase() : '';
    const programValue = programFilter ? programFilter.value : 'all';
    const yearValue = yearFilter ? yearFilter.value : 'all';
    const interestValue = interestFilter ? interestFilter.value : 'all';
    
    studentCards.forEach(card => {
      const studentName = card.querySelector('h3').textContent.toLowerCase();
      const studentProgram = card.getAttribute('data-program');
      const studentYear = card.getAttribute('data-year');
      const studentInterest = card.getAttribute('data-interest');
      
      const nameMatch = studentName.includes(searchTerm);
      const programMatch = programValue === 'all' || studentProgram === programValue;
      const yearMatch = yearValue === 'all' || studentYear === yearValue;
      const interestMatch = interestValue === 'all' || studentInterest === interestValue;
      
      if (nameMatch && programMatch && yearMatch && interestMatch) {
        card.style.display = '';
        card.classList.add('fade-in');
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  // Add event listeners
  if (studentSearch) {
    studentSearch.addEventListener('input', filterStudents);
  }
  
  if (programFilter) {
    programFilter.addEventListener('change', filterStudents);
  }
  
  if (yearFilter) {
    yearFilter.addEventListener('change', filterStudents);
  }
  
  if (interestFilter) {
    interestFilter.addEventListener('change', filterStudents);
  }
}