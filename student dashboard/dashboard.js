// Toggle sliding menu
function toggleMenu() {
    const menu = document.getElementById('slidingMenu');
    const mainContent = document.getElementById('mainContent');
    menu.classList.toggle('active');
    
    if(menu.classList.contains('active')) {
        mainContent.style.marginLeft = '300px';
    } else {
        mainContent.style.marginLeft = '0';
    }
}

// Navigation handling
document.addEventListener('DOMContentLoaded', () => {
    // Show dashboard section by default and hide others
    const allSections = document.querySelectorAll('main section');
    allSections.forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById('dashboard').classList.remove('hidden');

    // Initialize communities immediately
    initializeCommunities();

    // Handle menu item clicks
    const menuLinks = document.querySelectorAll('.menu-items a');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the target section id
            const targetId = link.getAttribute('href').substring(1);
            
            // Hide all sections
            allSections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show the clicked section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                
                // If communities section is clicked, ensure communities are loaded
                if (targetId === 'communities') {
                    initializeCommunities();
                }
            }

            // Close menu on mobile
            if (window.innerWidth <= 768) {
                toggleMenu();
            }
        });
    });

    // Add click handler for profile link
    const profileLink = document.querySelector('.profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'student-profile.html';
        });
    }
});

function initializeCommunities() {
    const communityData = [
        {
            id: 'gate-cs',
            name: 'GATE CS Aspirants',
            members: '3.5K',
            image: 'gate-cs-community.jpg',
            description: 'A community for GATE CS aspirants to discuss topics, share resources, and help each other.'
        },
        {
            id: 'cat-prep',
            name: 'CAT Preparation Hub',
            members: '2.8K',
            image: 'cat-prep-community.jpg',
            description: 'Connect with fellow CAT aspirants, share mock test strategies and preparation tips.'
        },
        {
            id: 'ias-circle',
            name: 'IAS Achievers Circle',
            members: '4.2K',
            image: 'ias-community.jpg',
            description: 'A dedicated community for UPSC aspirants to discuss current affairs and preparation strategies.'
        },
        {
            id: 'gate-ee',
            name: 'GATE EE Network',
            members: '2.1K',
            image: 'gate-ee-community.jpg',
            description: 'Connect with GATE EE aspirants, share study materials and discuss electrical engineering topics.'
        }
    ];

    const communitySection = document.querySelector('.community-cards');
    if (communitySection) {
        communitySection.innerHTML = communityData.map(community => {
            const joinedCommunities = JSON.parse(localStorage.getItem('joinedCommunities')) || [];
            const isJoined = joinedCommunities.some(c => c.id === community.id);
            
            return `
                <div class="community-card">
                    <div class="community-header">
                        <img src="${community.image}" alt="${community.name}">
                        <div class="community-info">
                            <h3>${community.name}</h3>
                            <p>${community.members} members</p>
                        </div>
                    </div>
                    <p class="community-description">${community.description}</p>
                    <button class="join-btn ${isJoined ? 'joined' : ''}" data-community-id="${community.id}">
                        ${isJoined ? 'Joined' : 'Join Community'}
                    </button>
                </div>
            `;
        }).join('');

        // Add click handlers after creating the cards
        const joinButtons = communitySection.querySelectorAll('.join-btn');
        joinButtons.forEach(button => {
            button.addEventListener('click', function() {
                const communityId = this.dataset.communityId;
                const community = communityData.find(c => c.id === communityId);
                toggleJoinCommunity(this, communityId, community);
            });
        });
    }
}

function toggleJoinCommunity(button, communityId, community) {
    const joinedCommunities = JSON.parse(localStorage.getItem('joinedCommunities')) || [];
    const communityIndex = joinedCommunities.findIndex(c => c.id === communityId);
    
    if (communityIndex === -1) {
        // Join community
        joinedCommunities.push(community);
        button.classList.add('joined');
        button.textContent = 'Joined';
    } else {
        // Leave community
        joinedCommunities.splice(communityIndex, 1);
        button.classList.remove('joined');
        button.textContent = 'Join Community';
    }
    
    localStorage.setItem('joinedCommunities', JSON.stringify(joinedCommunities));
}

// Call initializeCommunities when the page loads and when communities tab is clicked
document.addEventListener('DOMContentLoaded', () => {
    initializeCommunities();
    
    const communitiesLink = document.querySelector('a[href="#communities"]');
    if (communitiesLink) {
        communitiesLink.addEventListener('click', initializeCommunities);
    }
});

// Define mentor data
const mentorData = [
    {
        name: "Dr. Abhishek Ranjan",
        expertise: "GATE CS",
        rating: 4.9,
        image: "images/image3.png",
        experience: "8 years",
        students: 500,
        about: "Expert in Computer Networks and Operating Systems",
        achievements: ["Best Mentor Award 2022", "PhD from IIT Delhi"],
        price: "₹100/hour"
    },
    {
        name: "Dr. Ankita Patra",
        expertise: "GATE EE",
        rating: 4.8,
        image: "images/image4.png",
        experience: "12 years",
        students: 800,
        about: "Specializes in Power Systems and Control Engineering",
        achievements: ["Published 25+ Research Papers", "IIT Bombay Alumni"],
        price: "₹150/hour"
    },
    {
        name: "Dr. Priya Sharma",
        expertise: "CAT",
        rating: 4.9,
        image: "images/image5.png",
        experience: "6 years",
        students: 1000,
        about: "Quantitative Aptitude and Data Interpretation Expert",
        achievements: ["99.9 percentile in CAT", "MBA from IIM Ahmedabad"],
        price: "₹180/hour"
    },
    {
        name: "Mr. Arun Verma",
        expertise: "IAS",
        rating: 4.7,
        image: "images/image6.png",
        experience: "10 years",
        students: 300,
        about: "Expert in Current Affairs and Indian Polity",
        achievements: ["AIR 50 in UPSC", "Former IAS Officer"],
        price: "₹200/hour"
    },
    {
        name: "Dr. Meera Patel",
        expertise: "GATE CS",
        rating: 4.8,
        image: "images/image7.png",
        experience: "7 years",
        students: 600,
        about: "Data Structures and Algorithms Specialist",
        achievements: ["Microsoft Certified Trainer", "Ex-Google Engineer"],
        price: "₹140/hour"
    }
];

// Function to create mentor card with horizontal line separator
function createMentorCard(mentor) {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'mentor-card-wrapper';
    
    const isFollowing = isFollowingMentor(mentor);
    
    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.innerHTML = `
        <img src="${mentor.image}" alt="${mentor.name}">
        <h4>${mentor.name}</h4>
        <p class="expertise">${mentor.expertise}</p>
        <p class="rating">⭐ ${mentor.rating}</p>
        <p class="experience">${mentor.experience} Experience</p>
        <p class="price">${mentor.price}</p>
        <button class="view-profile-btn" onclick="navigateToMentorProfile('${encodeURIComponent(JSON.stringify(mentor))}')">View Profile</button>
        <button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="toggleFollow(this, '${encodeURIComponent(JSON.stringify(mentor))}')">${isFollowing ? 'Following' : 'Follow'}</button>
        <button class="connect-btn">Connect</button>
    `;
    
    const separator = document.createElement('hr');
    separator.className = 'mentor-separator';
    
    cardWrapper.appendChild(card);
    cardWrapper.appendChild(separator);
    return cardWrapper;
}

function isFollowingMentor(mentor) {
    const followedMentors = JSON.parse(localStorage.getItem('followedMentors')) || [];
    return followedMentors.some(m => m.name === mentor.name);
}

function toggleFollow(button, mentorData) {
    const mentor = JSON.parse(decodeURIComponent(mentorData));
    const followedMentors = JSON.parse(localStorage.getItem('followedMentors')) || [];
    
    if (button.classList.contains('following')) {
        // Unfollow
        const index = followedMentors.findIndex(m => m.name === mentor.name);
        if (index > -1) {
            followedMentors.splice(index, 1);
        }
        button.classList.remove('following');
        button.textContent = 'Follow';
    } else {
        // Follow
        if (!followedMentors.some(m => m.name === mentor.name)) {
            followedMentors.push(mentor);
        }
        button.classList.add('following');
        button.textContent = 'Following';
    }
    
    localStorage.setItem('followedMentors', JSON.stringify(followedMentors));
}

// Function to navigate to mentor profile page
function navigateToMentorProfile(mentorData) {
    sessionStorage.setItem('selectedMentor', decodeURIComponent(mentorData));
    window.location.href = 'mentor-profile.html';
}

// Function to filter mentors based on search
function filterMentors(searchTerm, examType) {
    const mentorContainer = document.querySelector('.mentor-cards');
    mentorContainer.innerHTML = '';
    
    const filteredMentors = mentorData.filter(mentor => {
        const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            mentor.expertise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            mentor.about.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesExam = !examType || mentor.expertise === examType;
        
        return matchesSearch && matchesExam;
    });
    
    filteredMentors.forEach(mentor => {
        const card = createMentorCard(mentor);
        mentorContainer.appendChild(card);
    });
}

// Add event listeners for search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-container input');
    const examSelect = document.querySelector('.exam-select');
    
    searchInput.addEventListener('input', (e) => {
        filterMentors(e.target.value, examSelect.value);
    });
    
    examSelect.addEventListener('change', (e) => {
        filterMentors(searchInput.value, e.target.value);
    });
    
    // Initial load of all mentor cards
    filterMentors('', '');
});

// Add click handler for profile link
const profileLink = document.querySelector('.profile-link');
if (profileLink) {
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = './student-profile.html';
    });
}

// Add click handler for both profile picture and name
document.addEventListener('DOMContentLoaded', () => {
    const profileLink = document.querySelector('.user-info .profile-link');
    const profilePic = document.querySelector('.user-info .profile-pic');
    
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'student-profile.html';
        });
    }

    if (profilePic) {
        profilePic.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'student-profile.html';
        });
    }
});

// Add this to your existing JavaScript
// document.addEventListener('DOMContentLoaded', () => {
//   // Chatbot icon functionality
//   const chatbotIcon = document.getElementById('chatbotIcon');
//   
//   if (chatbotIcon) {
//     // Replace this URL with your actual chatbot URL
//     chatbotIcon.href = "https://your-chatbot-url.com";
//     
//     // Optional: Stop pulsing animation after first click
//     chatbotIcon.addEventListener('click', () => {
//       chatbotIcon.classList.remove('pulse');
//     });
//     
//     // Optional: Show a welcome message after 3 seconds
//     setTimeout(() => {
//       const welcomeMessage = document.createElement('div');
//       welcomeMessage.className = 'chatbot-welcome';
//       welcomeMessage.innerHTML = `
//         <div class="welcome-bubble">
//           Need help? Chat with our AI assistant!
//           <span class="close-welcome">&times;</span>
//         </div>
//       `;
//       document.body.appendChild(welcomeMessage);
//       
//       // Add styles for the welcome message
//       const style = document.createElement('style');
//       style.textContent = `
//         .chatbot-welcome {
//           position: fixed;
//           bottom: 100px;
//           right: 30px;
//           z-index: 999;
//         }
//         .welcome-bubble {
//           background: white;
//           padding: 10px 15px;
//           border-radius: 20px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           font-size: 14px;
//           position: relative;
//           max-width: 220px;
//         }
//         .welcome-bubble:after {
//           content: '';
//           position: absolute;
//           bottom: -10px;
//           right: 20px;
//           border-width: 10px 10px 0;
//           border-style: solid;
//           border-color: white transparent;
//         }
//         .close-welcome {
//           cursor: pointer;
//           margin-left: 5px;
//           font-weight: bold;
//         }
//       `;
//       document.head.appendChild(style);
//       
//       // Close button functionality
//       const closeBtn = document.querySelector('.close-welcome');
//       if (closeBtn) {
//         closeBtn.addEventListener('click', (e) => {
//           e.preventDefault();
//           e.stopPropagation();
//           welcomeMessage.remove();
//         });
//       }
//       
//       // Remove welcome message when clicking the chatbot icon
//       chatbotIcon.addEventListener('click', () => {
//         welcomeMessage.remove();
//       });
//       
//       // Auto-remove after 10 seconds
//       setTimeout(() => {
//         if (document.body.contains(welcomeMessage)) {
//           welcomeMessage.remove();
//         }
//       }, 10000);
//     }, 3000);
//   }

