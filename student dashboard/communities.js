// Community data
const communityData = [
    {
        id: 'gate-cs',
        name: 'GATE CS Aspirants',
        members: '3.5K',
        image: 'images/gate-cs-community.jpg',
        description: 'A community for GATE CS aspirants to discuss topics, share resources, and help each other.'
    },
    {
        id: 'cat-prep',
        name: 'CAT Preparation Hub',
        members: '2.8K',
        image: 'images/cat-prep-community.jpg',
        description: 'Connect with fellow CAT aspirants, share mock test strategies and preparation tips.'
    },
    {
        id: 'ias-circle',
        name: 'IAS Achievers Circle',
        members: '4.2K',
        image: 'images/ias-community.jpg',
        description: 'A dedicated community for UPSC aspirants to discuss current affairs and preparation strategies.'
    },
    {
        id: 'gate-ee',
        name: 'GATE EE Network',
        members: '2.1K',
        image: 'images/gate-ee-community.jpg',
        description: 'Connect with GATE EE aspirants, share study materials and discuss electrical engineering topics.'
    }
];

// Initialize join buttons
document.addEventListener('DOMContentLoaded', () => {
    const joinButtons = document.querySelectorAll('.join-btn');
    
    joinButtons.forEach(button => {
        const communityId = button.dataset.communityId;
        const joinedCommunities = getJoinedCommunities();
        
        if (joinedCommunities.some(c => c.id === communityId)) {
            button.classList.add('joined');
            button.textContent = 'Joined';
        }
        
        button.addEventListener('click', () => toggleJoinCommunity(button, communityId));
    });
});

function toggleJoinCommunity(button, communityId) {
    const joinedCommunities = getJoinedCommunities();
    const communityIndex = joinedCommunities.findIndex(c => c.id === communityId);
    const community = communityData.find(c => c.id === communityId);
    
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

function getJoinedCommunities() {
    return JSON.parse(localStorage.getItem('joinedCommunities')) || [];
}
