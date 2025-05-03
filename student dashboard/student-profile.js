// Import Firebase modules
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    // Load student profile data
    loadStudentProfile();

    // Load other data
    loadFollowedMentors();
    loadJoinedCommunities();
});

// Function to load student profile data from Firebase
async function loadStudentProfile() {
    const auth = getAuth();
    const db = getFirestore();

    const profileNameElement = document.getElementById('profileStudentName');
    const profileEmailElement = document.getElementById('profileStudentEmail');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('Student authenticated on profile page:', user.uid);

            // Set email from auth object
            if (user.email && profileEmailElement) {
                profileEmailElement.textContent = user.email;
            }

            try {
                // First try to get the display name from the auth object
                if (user.displayName) {
                    updateProfileName(user.displayName);
                    console.log('Using display name from auth:', user.displayName);
                }

                // Try to get additional info from Firestore (both collections for compatibility)
                // First try 'students' collection
                let studentDoc = await getDoc(doc(db, 'students', user.uid));

                // If not found, try 'users' collection
                if (!studentDoc.exists()) {
                    studentDoc = await getDoc(doc(db, 'users', user.uid));
                }

                if (studentDoc.exists()) {
                    const studentData = studentDoc.data();
                    console.log('Student data retrieved for profile:', studentData);

                    // Update name if available and not already set
                    if (studentData.name && (!user.displayName || user.displayName === '')) {
                        updateProfileName(studentData.name);
                    }

                    // Update email if available and not already set from auth
                    if (studentData.email && (!user.email || user.email === '')) {
                        if (profileEmailElement) profileEmailElement.textContent = studentData.email;
                    }
                } else {
                    console.log('No student document found in Firestore for profile');

                    // As a fallback, try to query the users collection by email
                    if (user.email) {
                        const usersQuery = query(collection(db, 'users'), where('email', '==', user.email));
                        const querySnapshot = await getDocs(usersQuery);

                        if (!querySnapshot.empty) {
                            const userData = querySnapshot.docs[0].data();
                            if (userData.name) {
                                updateProfileName(userData.name);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading student data for profile:', error);
            }
        } else {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../login.html';
        }
    });
}

// Update student name in profile
function updateProfileName(name) {
    console.log('Updating profile student name to:', name);
    const profileNameElement = document.getElementById('profileStudentName');
    if (profileNameElement) {
        profileNameElement.textContent = name;
    }
}

function loadFollowedMentors() {
    // Get followed mentors from localStorage
    const followedMentors = JSON.parse(localStorage.getItem('followedMentors')) || [];
    const mentorGrid = document.getElementById('followedMentorsGrid');

    if (followedMentors.length === 0) {
        mentorGrid.innerHTML = '<p>No mentors followed yet</p>';
        return;
    }

    mentorGrid.innerHTML = followedMentors.map(mentor => `
        <div class="mentor-card">
            <img src="${mentor.image}" alt="${mentor.name}">
            <h4>${mentor.name}</h4>
            <p class="expertise">${mentor.expertise}</p>
            <p class="rating">⭐ ${mentor.rating}</p>
        </div>
    `).join('');
}

function loadJoinedCommunities() {
    // Get joined communities from localStorage
    const joinedCommunities = JSON.parse(localStorage.getItem('joinedCommunities')) || [];
    const communityGrid = document.getElementById('joinedCommunitiesGrid');

    if (joinedCommunities.length === 0) {
        communityGrid.innerHTML = '<p>No communities joined yet</p>';
        return;
    }

    communityGrid.innerHTML = joinedCommunities.map(community => `
        <div class="community-profile-card">
            <img src="${community.image}" alt="${community.name}">
            <div class="community-info">
                <h4>${community.name}</h4>
                <p class="members">${community.members} members</p>
            </div>
        </div>
    `).join('');
}

