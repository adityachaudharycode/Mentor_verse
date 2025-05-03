// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');
const closeMenu = document.getElementById('closeMenu');

// Function to toggle mobile menu
function toggleMobileMenu() {
    mobileNav.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

// Open mobile menu when hamburger is clicked
menuToggle.addEventListener('click', toggleMobileMenu);

// Close mobile menu when close button is clicked
closeMenu.addEventListener('click', toggleMobileMenu);

// Close mobile menu when a link is clicked
document.querySelectorAll('#mobileNav .nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        toggleMobileMenu();
    });
});

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    once: true
});

// Testimonial Slider
const testimonialSlider = new Swiper('.testimonial-slider', {
    slidesPerView: 'auto',
    spaceBetween: 30,
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Counter animation for stats
const stats = document.querySelectorAll('.stat-number');
stats.forEach(stat => {
    const target = parseInt(stat.textContent);
    let current = 0;
    const increment = target / 50;
    const updateCount = () => {
        if (current < target) {
            current += increment;
            stat.textContent = Math.ceil(current);
            setTimeout(updateCount, 20);
        } else {
            stat.textContent = target;
        }
    };
    updateCount();
});

// Demo video modal
const demoBtn = document.querySelector('.cta-btn.secondary');
demoBtn.addEventListener('click', () => {
    // Add your video modal implementation here
});

// Add hover effect for feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// Theme toggle functionality
const mainThemeToggle = document.querySelector('.theme-toggle');
const mobileThemeToggle = document.querySelector('.mobile-theme-toggle');
const themeIcons = document.querySelectorAll('.theme-toggle i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.classList.toggle('light-theme', savedTheme === 'light');
    themeIcons.forEach(icon => {
        icon.classList.toggle('fa-sun', savedTheme === 'light');
        icon.classList.toggle('fa-moon', savedTheme === 'dark');
    });
}

// Function to toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    
    // Update all icons
    themeIcons.forEach(icon => {
        icon.classList.toggle('fa-sun', isLight);
        icon.classList.toggle('fa-moon', !isLight);
    });
    
    // Save preference
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Add event listeners to both toggles
mainThemeToggle.addEventListener('click', toggleTheme);
mobileThemeToggle.addEventListener('click', toggleTheme);

// Update navbar background based on theme
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    const isLight = document.body.classList.contains('light-theme');

    if (window.scrollY > 50) {
        nav.style.background = isLight
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(18, 18, 18, 0.95)';
    } else {
        nav.style.background = isLight
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(18, 18, 18, 0.8)';
    }
});

// Form submission handling
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add your form submission logic here
    alert('Thank you for your message! We will get back to you soon.');
    contactForm.reset();
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .mentor-card').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 0.5s ease-out';
    observer.observe(element);
});

