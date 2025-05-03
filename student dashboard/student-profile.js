document.addEventListener('DOMContentLoaded', () => {
    loadFollowedMentors();
    loadJoinedCommunities();
});

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

