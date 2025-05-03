// Navigation functionality
function initializeNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav li');
  const sections = document.querySelectorAll('.content-section');
  const sectionLinks = document.querySelectorAll('.sidebar-nav a, [href^="#"]');

  // Function to show active section
  function showSection(sectionId) {
    console.log('Showing section:', sectionId);

    sections.forEach(section => {
      section.classList.remove('active');
    });

    navItems.forEach(item => {
      item.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    const targetNavItem = document.querySelector(`.sidebar-nav li[data-section="${sectionId}"]`);

    if (targetSection) {
      targetSection.classList.add('active');
      console.log('Section activated:', sectionId);
    } else {
      console.warn('Target section not found:', sectionId);
    }

    if (targetNavItem) {
      targetNavItem.classList.add('active');
    }

    // Update URL hash without triggering a scroll
    const currentScrollPosition = window.scrollY;
    window.location.hash = sectionId;
    window.scrollTo(0, currentScrollPosition);
  }

  // Handle navigation clicks
  sectionLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      // Only prevent default for internal links
      if (link.getAttribute('href').startsWith('#')) {
        event.preventDefault();

        const targetId = link.getAttribute('href').replace('#', '');
        console.log('Navigation link clicked:', targetId);
        showSection(targetId);

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
        }
      }
    });
  });

  // Handle direct URL navigation with hash
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
      console.log('Hash changed to:', hash);
      showSection(hash);
    }
  });

  // Handle initial load based on URL hash
  window.addEventListener('load', function() {
    const hash = window.location.hash.replace('#', '');

    if (hash && document.getElementById(hash)) {
      console.log('Initial load with hash:', hash);
      showSection(hash);
    } else {
      console.log('Initial load with default section: dashboard');
      showSection('dashboard');
    }
  });

  // Add animations to elements when they enter viewport
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.stat-card, .dashboard-card, .student-card, .resource-card');

    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (elementPosition.top < windowHeight && elementPosition.bottom >= 0 && !element.classList.contains('animated')) {
        element.classList.add('fade-in', 'animated');
      }
    });
  };

  // Listen for scroll events
  window.addEventListener('scroll', animateOnScroll);

  // Initial check for elements in viewport
  animateOnScroll();
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing navigation');
  initializeNavigation();
});