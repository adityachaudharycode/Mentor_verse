// Import Firebase services and chatService
import { chatService } from './chatService.js';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Get Firebase services from global variables
const db = window.firebaseDb;
const auth = window.firebaseAuth;

// DOM Elements
const chatSection = document.getElementById('chat');
const conversationList = document.getElementById('conversationList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const newChatBtn = document.getElementById('newChatBtn');
const chatSearch = document.getElementById('chatSearch');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const videoCallBtn = document.getElementById('videoCallBtn');
const voiceCallBtn = document.getElementById('voiceCallBtn');
const viewProfileBtn = document.getElementById('viewProfileBtn');
const attachFileBtn = document.getElementById('attachFileBtn');

// State variables
let currentConversation = null;
let currentMentor = null;
let unsubscribeFromMessages = null;
let unsubscribeFromConversations = null;

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is authenticated:', user.uid);
            // Log the current user's token for debugging
            user.getIdToken().then(token => {
                console.log('Auth token (first 20 chars):', token.substring(0, 20) + '...');
            });
            initializeChat();
        } else {
            console.error('User is not authenticated');
            // Redirect to login if not authenticated
            window.location.href = '../login.html';
        }
    });

    // Add event listeners
    setupEventListeners();
});

// Initialize chat functionality
function initializeChat() {
    // Subscribe to conversations
    subscribeToConversations();

    // Show empty state initially
    showEmptyState();
}

// Set up event listeners
function setupEventListeners() {
    // Send message on button click
    sendMessageBtn.addEventListener('click', sendMessage);

    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // New chat button
    newChatBtn.addEventListener('click', showMentorSelectionModal);

    // Search conversations
    chatSearch.addEventListener('input', filterConversations);

    // Scroll buttons
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', scrollToTop);
    }

    if (scrollBottomBtn) {
        scrollBottomBtn.addEventListener('click', scrollToBottom);
    }

    // Navigation between sections
    document.querySelectorAll('.menu-items a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Hide all sections
            document.querySelectorAll('main section').forEach(section => {
                section.classList.add('hidden');
            });

            // Show target section
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Add mobile sidebar toggle
    setupMobileUI();
}

// Setup mobile-specific UI elements
function setupMobileUI() {
    // Create mobile toggle button if it doesn't exist
    if (!document.querySelector('.mobile-toggle-sidebar')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-toggle-sidebar';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');

        // Add to chat main
        const chatMain = document.querySelector('.chat-main');
        if (chatMain) {
            chatMain.appendChild(toggleBtn);
        }

        // Add event listener
        toggleBtn.addEventListener('click', toggleMobileSidebar);
    }

    // Add overlay for closing sidebar
    if (!document.getElementById('mobile-sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'mobile-sidebar-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '999';
        overlay.style.display = 'none';

        document.body.appendChild(overlay);

        overlay.addEventListener('click', toggleMobileSidebar);
    }

    // Handle window resize
    window.addEventListener('resize', handleResize);
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.chat-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');

    if (sidebar) {
        sidebar.classList.toggle('active');

        if (sidebar.classList.contains('active')) {
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            overlay.style.display = 'none';
            document.body.style.overflow = ''; // Allow scrolling
        }
    }
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 992) {
        // Reset sidebar and overlay on larger screens
        const sidebar = document.querySelector('.chat-sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');

        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }

        if (overlay) {
            overlay.style.display = 'none';
        }

        document.body.style.overflow = '';
    }
}

// Subscribe to conversations
function subscribeToConversations() {
    if (unsubscribeFromConversations) {
        unsubscribeFromConversations();
    }

    unsubscribeFromConversations = chatService.subscribeToConversations(conversations => {
        renderConversations(conversations);
    });
}

// Render conversations in the sidebar
function renderConversations(conversations) {
    // Clear existing conversations
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
        // Show empty state
        conversationList.innerHTML = `
            <div class="empty-conversations-message">
                <i class="fas fa-comment-slash"></i>
                <p>No conversations yet</p>
                <p>Start a new chat with a mentor</p>
            </div>
        `;
        return;
    }

    // Sort conversations by last message timestamp (newest first)
    conversations.sort((a, b) => {
        const timeA = a.lastMessageTimestamp ?
            (typeof a.lastMessageTimestamp.toDate === 'function' ? a.lastMessageTimestamp.toDate() : a.lastMessageTimestamp)
            : new Date(0);
        const timeB = b.lastMessageTimestamp ?
            (typeof b.lastMessageTimestamp.toDate === 'function' ? b.lastMessageTimestamp.toDate() : b.lastMessageTimestamp)
            : new Date(0);
        return timeB - timeA;
    });

    // Create conversation items
    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        if (currentConversation && currentConversation.id === conversation.id) {
            conversationItem.classList.add('active');
        }

        // Format timestamp
        let timestamp = '';
        if (conversation.lastMessageTimestamp) {
            const date = typeof conversation.lastMessageTimestamp.toDate === 'function'
                ? conversation.lastMessageTimestamp.toDate()
                : new Date(conversation.lastMessageTimestamp);
            timestamp = formatTimestamp(date);
        }

        // Create HTML for conversation item
        conversationItem.innerHTML = `
            <img src="${conversation.otherUser.image || 'https://placehold.co/40'}" alt="${conversation.otherUser.name}" class="conversation-avatar">
            <div class="conversation-info">
                <div class="conversation-header">
                    <span class="conversation-name">${conversation.otherUser.name}</span>
                    <span class="conversation-time">${timestamp}</span>
                </div>
                <div class="conversation-preview">${conversation.lastMessage || 'Start a conversation'}</div>
            </div>
            ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount}</span>` : ''}
        `;

        // Add click event to load conversation
        conversationItem.addEventListener('click', () => {
            loadConversation(conversation);
        });

        conversationList.appendChild(conversationItem);
    });
}

// Load a conversation
function loadConversation(conversation) {
    // Update current conversation
    currentConversation = conversation;
    currentMentor = conversation.otherUser;

    // Update UI
    updateChatHeader(currentMentor);
    enableChatInput();

    // Mark conversation as active
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = Array.from(document.querySelectorAll('.conversation-item')).find(
        item => item.querySelector('.conversation-name').textContent === currentMentor.name
    );

    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Subscribe to messages
    subscribeToMessages(conversation.id);
}

// Subscribe to messages for a conversation
function subscribeToMessages(conversationId) {
    // Unsubscribe from previous messages
    if (unsubscribeFromMessages) {
        unsubscribeFromMessages();
    }

    // Clear messages container
    chatMessages.innerHTML = '';

    // Subscribe to new messages
    unsubscribeFromMessages = chatService.subscribeToChat(conversationId, messages => {
        renderMessages(messages);
    });
}

// Render messages in the chat
function renderMessages(messages) {
    // Clear messages container
    chatMessages.innerHTML = '';

    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="chat-welcome">
                <div class="chat-welcome-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>Start a conversation</h3>
                <p>Send a message to ${currentMentor.name}</p>
            </div>
        `;
        return;
    }

    // Group messages by date
    const messagesByDate = groupMessagesByDate(messages);

    // Render message groups
    Object.keys(messagesByDate).forEach(date => {
        // Add date separator
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'date-separator';
        dateSeparator.textContent = date;
        chatMessages.appendChild(dateSeparator);

        // Render messages for this date
        messagesByDate[date].forEach(message => {
            const messageElement = createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });
    });

    // Scroll to bottom immediately
    scrollToBottom();

    // Force multiple scroll attempts with increasing delays
    setTimeout(scrollToBottom, 300);
    setTimeout(scrollToBottom, 600);
}

// Create a message element
function createMessageElement(message) {
    console.log('Creating message element:', message);

    // DIRECT FIX: Force messages to be displayed correctly based on sender role
    // In the student dashboard:
    // - Messages from student (current user) should be displayed as "sent" (blue, right-aligned)
    // - Messages from mentor should be displayed as "received" (gray, left-aligned)

    // Get current user ID
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

    // IMPORTANT: For temporary messages, we need to handle them specially
    let isSentByCurrentUser;

    if (message.id && message.id.toString().startsWith('temp-')) {
        // For temporary messages, use the senderId to determine if it's sent by current user
        isSentByCurrentUser = message.senderId === currentUserId;
    } else {
        // For messages from Firebase, use the senderRole to determine alignment
        // This is the key fix - we're using senderRole instead of senderId
        isSentByCurrentUser = message.senderRole === 'student';
    }

    console.log('STUDENT DASHBOARD - Message display check:', {
        messageId: message.id,
        senderId: message.senderId,
        currentUserId: currentUserId,
        senderRole: message.senderRole,
        isSentByCurrentUser: isSentByCurrentUser,
        isTemporary: message.id && message.id.toString().startsWith('temp-'),
        content: message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '')
    });

    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSentByCurrentUser ? 'sent' : 'received'}`;

    // Add data attributes to help debug
    messageElement.setAttribute('data-sender-role', message.senderRole);
    messageElement.setAttribute('data-sender-id', message.senderId || 'unknown');
    messageElement.setAttribute('data-is-sent', isSentByCurrentUser.toString());
    messageElement.setAttribute('data-is-temp', (message.id && message.id.toString().startsWith('temp-')).toString());

    // Add ID for temporary messages
    if (message.id && message.id.toString().startsWith('temp-')) {
        messageElement.id = message.id;
        messageElement.classList.add('pending');
    }

    // Format timestamp
    let timestamp = '';
    if (message.timestamp) {
        // Handle both Firestore timestamps and regular Date objects
        if (typeof message.timestamp.toDate === 'function') {
            timestamp = formatMessageTime(message.timestamp.toDate());
        } else if (message.timestamp instanceof Date) {
            timestamp = formatMessageTime(message.timestamp);
        }
    }

    // Add pending indicator for temporary messages
    const pendingIndicator = message.pending ?
        '<span class="pending-indicator"><i class="fas fa-circle-notch fa-spin"></i></span>' : '';

    // Add a clear visual indicator of who sent the message
    const senderIndicator = isSentByCurrentUser ?
        '<div class="sender-indicator student">You (Student)</div>' :
        '<div class="sender-indicator mentor">Mentor</div>';

    messageElement.innerHTML = `
        ${senderIndicator}
        <div class="message-content">
            <p>${message.content}</p>
            ${pendingIndicator}
        </div>
        <div class="message-time">${timestamp}</div>
    `;

    console.log('STUDENT DASHBOARD - Created message element:', {
        className: messageElement.className,
        isSent: messageElement.classList.contains('sent'),
        isReceived: messageElement.classList.contains('received'),
        senderRole: message.senderRole,
        senderId: message.senderId
    });

    return messageElement;
}

// Send a message
function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || !currentConversation) return;

    // Clear input
    messageInput.value = '';

    // Disable the input and button temporarily to prevent double-sending
    if (messageInput && sendMessageBtn) {
        messageInput.disabled = true;
        sendMessageBtn.disabled = true;
    }

    // Create a temporary message element to show immediately
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    const tempMessage = {
        id: 'temp-' + Date.now(),
        content: message,
        senderRole: 'student',
        senderId: currentUserId, // This is the key property that determines message alignment
        timestamp: new Date(),
        pending: true
    };

    // Add the temporary message to the chat
    const messageElement = createMessageElement(tempMessage);
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    console.log('Student dashboard - Sending message from chat.js:', {
        studentId: currentConversation.studentId,
        mentorId: currentConversation.mentorId,
        message,
        currentConversation
    });

    // Send message
    chatService.sendMessage(
        currentConversation.studentId,
        currentConversation.mentorId,
        message
    ).then(messageId => {
        console.log('Student dashboard - Message sent, ID:', messageId);

        // Remove the temporary message element
        const tempElement = document.getElementById('temp-' + tempMessage.id);
        if (tempElement) {
            tempElement.classList.remove('pending');
        }

        // Re-enable the input and button
        if (messageInput && sendMessageBtn) {
            messageInput.disabled = false;
            sendMessageBtn.disabled = false;
            messageInput.focus();
        }
    }).catch(error => {
        console.error('Error sending message:', error);

        // Mark the temporary message as failed
        const tempElement = document.getElementById('temp-' + tempMessage.id);
        if (tempElement) {
            tempElement.classList.add('failed');
            tempElement.querySelector('.message-content').innerHTML += '<span class="error-badge"><i class="fas fa-exclamation-circle"></i> Failed to send</span>';
        }

        // Re-enable the input and button
        if (messageInput && sendMessageBtn) {
            messageInput.disabled = false;
            sendMessageBtn.disabled = false;
            messageInput.focus();
        }

        // Show error message
        showErrorMessage('Failed to send message. Please try again.');
    });
}

// Show mentor selection modal
function showMentorSelectionModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('mentorSelectionModal')) {
        createMentorSelectionModal();
    }

    // Show modal
    const modalOverlay = document.getElementById('mentorSelectionModal');
    modalOverlay.classList.add('active');

    // Load mentors
    loadMentors();
}

// Create mentor selection modal
function createMentorSelectionModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'mentorSelectionModal';

    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Select a Mentor to Chat With</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-search">
                <input type="text" placeholder="Search mentors..." id="mentorSearchInput">
                <i class="fas fa-search"></i>
            </div>
            <div class="mentor-list" id="mentorList">
                <div class="loading-mentors">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading mentors...</p>
                </div>
            </div>
        </div>
    `;

    // Add close event
    modalOverlay.querySelector('.modal-close').addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    // Close when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    // Add search functionality
    modalOverlay.querySelector('#mentorSearchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const mentorItems = modalOverlay.querySelectorAll('.mentor-item');

        mentorItems.forEach(item => {
            const mentorName = item.querySelector('.mentor-item-name').textContent.toLowerCase();
            const mentorExpertise = item.querySelector('.mentor-item-expertise').textContent.toLowerCase();

            if (mentorName.includes(searchTerm) || mentorExpertise.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    document.body.appendChild(modalOverlay);
}

// Load mentors for selection
async function loadMentors() {
    const mentorList = document.getElementById('mentorList');
    mentorList.innerHTML = `
        <div class="loading-mentors">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading mentors...</p>
        </div>
    `;

    try {
        // Get current user ID
        const currentUserId = auth.currentUser.uid;

        // Query users collection for mentors - simplified to avoid index requirements
        const mentorsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'mentor'),
            limit(20)
        );

        const mentorsSnapshot = await getDocs(mentorsQuery);

        if (mentorsSnapshot.empty) {
            mentorList.innerHTML = `
                <div class="empty-mentors">
                    <i class="fas fa-user-slash"></i>
                    <p>No mentors found</p>
                </div>
            `;
            return;
        }

        // Clear loading state
        mentorList.innerHTML = '';

        // Add mentors to list
        mentorsSnapshot.forEach(doc => {
            const mentor = { id: doc.id, ...doc.data() };
            const mentorItem = document.createElement('div');
            mentorItem.className = 'mentor-item';

            mentorItem.innerHTML = `
                <img src="${mentor.image || 'https://placehold.co/40'}" alt="${mentor.name}">
                <div class="mentor-item-info">
                    <div class="mentor-item-name">${mentor.name}</div>
                    <div class="mentor-item-expertise">${mentor.expertise || 'General Mentor'}</div>
                    <div class="mentor-item-rating">
                        <i class="fas fa-star"></i>
                        <span>${mentor.rating || '4.5'}</span>
                    </div>
                </div>
            `;

            // Add click event to start conversation
            mentorItem.addEventListener('click', () => {
                startConversation(currentUserId, mentor);
            });

            mentorList.appendChild(mentorItem);
        });
    } catch (error) {
        console.error('Error loading mentors:', error);
        mentorList.innerHTML = `
            <div class="error-loading">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading mentors</p>
                <button id="retryLoadMentors">Retry</button>
            </div>
        `;

        document.getElementById('retryLoadMentors').addEventListener('click', loadMentors);
    }
}

// Show error message
function showErrorMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button class="toast-close">&times;</button>
    `;

    // Add close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        document.body.removeChild(toast);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 5000);

    // Add to document
    document.body.appendChild(toast);
}

// Start a conversation with a mentor
async function startConversation(studentId, mentor) {
    try {
        // Close modal
        document.getElementById('mentorSelectionModal').classList.remove('active');

        console.log('Student dashboard - Starting conversation with mentor:', {
            studentId,
            mentorId: mentor.id,
            mentorName: mentor.name
        });

        // Create a temporary message to show immediately
        const tempMessage = {
            id: 'temp-' + Date.now(),
            content: `Hello ${mentor.name}, I'd like to connect with you for mentoring.`,
            senderRole: 'student',
            senderId: studentId, // This is the key property that determines message alignment
            timestamp: new Date(),
            pending: true
        };

        // Show chat section
        document.querySelectorAll('main section').forEach(section => {
            section.classList.add('hidden');
        });
        chatSection.classList.remove('hidden');

        // Show the conversation in the UI first
        const conversationId = chatService.getConversationId(studentId, mentor.id);
        currentConversation = {
            id: conversationId,
            studentId: studentId,
            mentorId: mentor.id,
            otherUser: mentor
        };
        currentMentor = mentor;

        // Update UI
        updateChatHeader(mentor);
        enableChatInput();

        // Clear messages container
        if (chatMessages) {
            chatMessages.innerHTML = '';

            // Add the temporary message
            const messageElement = createMessageElement(tempMessage);
            chatMessages.appendChild(messageElement);
            scrollToBottom();
        }

        // Send initial message to Firebase
        const messageId = await chatService.sendMessage(
            studentId,
            mentor.id,
            `Hello ${mentor.name}, I'd like to connect with you for mentoring.`
        );

        console.log('Student dashboard - Initial message sent, ID:', messageId);

        // Remove the temporary message element
        const tempElement = document.getElementById('temp-' + tempMessage.id);
        if (tempElement) {
            tempElement.classList.remove('pending');
        }

        // Subscribe to messages for this conversation
        subscribeToMessages(conversationId);

        // Also refresh conversations to show the new one
        subscribeToConversations();
    } catch (error) {
        console.error('Error starting conversation:', error);
        showErrorMessage('Failed to start conversation. Please try again.');
    }
}

// Filter conversations based on search input
function filterConversations() {
    const searchTerm = chatSearch.value.toLowerCase();
    const conversationItems = document.querySelectorAll('.conversation-item');

    conversationItems.forEach(item => {
        const mentorName = item.querySelector('.conversation-name').textContent.toLowerCase();
        const messagePreview = item.querySelector('.conversation-preview').textContent.toLowerCase();

        if (mentorName.includes(searchTerm) || messagePreview.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update chat header with mentor info
function updateChatHeader(mentor) {
    chatHeaderName.textContent = mentor.name;
    chatHeaderStatus.textContent = mentor.expertise || 'Mentor';
    chatHeaderAvatar.src = mentor.image || 'images/default-avatar.png';

    // Enable header action buttons
    videoCallBtn.disabled = false;
    voiceCallBtn.disabled = false;
    viewProfileBtn.disabled = false;
}

// Enable chat input
function enableChatInput() {
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    attachFileBtn.disabled = false;

    // Focus on input
    messageInput.focus();
}

// Show empty state
function showEmptyState() {
    chatHeaderName.textContent = 'Select a conversation';
    chatHeaderStatus.textContent = 'No active chat';
    chatHeaderAvatar.src = 'https://placehold.co/45';

    // Disable input
    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
    attachFileBtn.disabled = true;

    // Disable header action buttons
    videoCallBtn.disabled = true;
    voiceCallBtn.disabled = true;
    viewProfileBtn.disabled = true;

    // Show welcome message
    chatMessages.innerHTML = `
        <div class="chat-welcome">
            <div class="chat-welcome-icon">
                <i class="fas fa-comments"></i>
            </div>
            <h3>Welcome to MentorVerse Chat</h3>
            <p>Select a conversation or start a new chat with a mentor</p>
        </div>
    `;
}

// Group messages by date
function groupMessagesByDate(messages) {
    const groups = {};

    messages.forEach(message => {
        if (!message.timestamp) return;

        const date = formatDate(message.timestamp.toDate());

        if (!groups[date]) {
            groups[date] = [];
        }

        groups[date].push(message);
    });

    return groups;
}

// Format date for grouping
function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Format timestamp for conversation list
function formatTimestamp(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date >= yesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Format time for messages
function formatMessageTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Scroll chat to bottom
function scrollToBottom() {
    if (chatMessages) {
        // Add scrolling class
        chatMessages.classList.add('scrolling');

        // Immediate scroll attempt
        chatMessages.scrollTop = chatMessages.scrollHeight + 2000;

        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
            // Force scroll to the very bottom
            chatMessages.scrollTop = chatMessages.scrollHeight + 2000;
            console.log('Scrolling to bottom (100ms):', {
                scrollTop: chatMessages.scrollTop,
                scrollHeight: chatMessages.scrollHeight
            });
        }, 100);

        // Try again after a longer delay to handle any late-loading content
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight + 2000;
            console.log('Scrolling to bottom (500ms):', {
                scrollTop: chatMessages.scrollTop,
                scrollHeight: chatMessages.scrollHeight
            });

            // Remove scrolling class
            chatMessages.classList.remove('scrolling');
        }, 500);

        // Final attempt after all content should be loaded
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight + 2000;
        }, 1000);
    }
}

// Scroll chat to top
function scrollToTop() {
    if (chatMessages) {
        // Add scrolling class
        chatMessages.classList.add('scrolling');

        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
            // Scroll to the top
            chatMessages.scrollTop = 0;
            console.log('Scrolling to top:', {
                scrollTop: chatMessages.scrollTop,
                scrollHeight: chatMessages.scrollHeight
            });

            // Remove scrolling class after a short delay
            setTimeout(() => {
                chatMessages.classList.remove('scrolling');
            }, 300);
        }, 100);
    }
}

// Add modal for mentor selection to the page
document.addEventListener('DOMContentLoaded', () => {
    createMentorSelectionModal();
});
