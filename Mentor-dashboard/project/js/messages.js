// Import Firebase services from chatService.js
import { chatService } from './chatService.js';

// DOM Elements
const conversationList = document.getElementById('conversationList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const newMessageBtn = document.getElementById('newMessageBtn');
const startNewChatBtn = document.getElementById('startNewChatBtn');
const messagesWelcome = document.getElementById('messagesWelcome');
const messagesChat = document.getElementById('messagesChat');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const messageSearch = document.getElementById('messageSearch');
const messageBadge = document.querySelector('.message-badge');

// State variables
let currentConversation = null;
let currentStudent = null;
let unsubscribeFromMessages = null;
let unsubscribeFromConversations = null;

// Initialize messages
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is authenticated:', user.uid);
            initializeMessages();
        } else {
            console.error('User is not authenticated');
            // Redirect to login if not authenticated
            window.location.href = '../../login.html';
        }
    });

    // Add event listeners
    setupEventListeners();
});

// Initialize messages functionality
function initializeMessages() {
    // Subscribe to conversations
    subscribeToConversations();

    // Show empty state initially
    showEmptyState();
}

// Set up event listeners
function setupEventListeners() {
    // Send message on button click
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }

    // Send message on Enter key
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // New message button
    if (newMessageBtn) {
        newMessageBtn.addEventListener('click', showStudentSelectionModal);
    }

    // Start new chat button
    if (startNewChatBtn) {
        startNewChatBtn.addEventListener('click', showStudentSelectionModal);
    }

    // Search conversations
    if (messageSearch) {
        messageSearch.addEventListener('input', filterConversations);
    }

    // Scroll buttons
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollBottomBtn = document.getElementById('scrollBottomBtn');
    const forceScrollBtn = document.getElementById('forceScrollBtn');

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', scrollToTop);
    }

    if (scrollBottomBtn) {
        scrollBottomBtn.addEventListener('click', scrollToBottom);
    }

    if (forceScrollBtn) {
        forceScrollBtn.addEventListener('click', forceScrollToBottom);
    }

    // We'll use the navigation.js file for section navigation
    // This code was causing conflicts with the main navigation

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

        // Add to messages main
        const messagesMain = document.querySelector('.messages-main');
        if (messagesMain) {
            messagesMain.appendChild(toggleBtn);
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
    const sidebar = document.querySelector('.messages-sidebar');
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
        const sidebar = document.querySelector('.messages-sidebar');
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

    try {
        unsubscribeFromConversations = chatService.subscribeToConversations(conversations => {
            renderConversations(conversations);
            updateUnreadCount(conversations);
        });
    } catch (error) {
        console.error('Error subscribing to conversations:', error);
        showErrorMessage('Failed to load conversations. Please refresh the page.');
    }
}

// Render conversations in the sidebar
function renderConversations(conversations) {
    if (!conversationList) return;

    // Clear existing conversations
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
        conversationList.innerHTML = `
            <div class="empty-conversations-message">
                <i class="fas fa-comment-slash"></i>
                <p>No conversations yet</p>
                <p>Start a new chat with a student</p>
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
            <img src="${conversation.student.image || 'https://placehold.co/40'}" alt="${conversation.student.name}" class="conversation-avatar">
            <div class="conversation-info">
                <div class="conversation-header">
                    <span class="conversation-name">${conversation.student.name}</span>
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
    currentStudent = conversation.student;

    // Update UI
    updateChatHeader(currentStudent);

    // Force the chat interface to show with a small delay to ensure DOM is ready
    setTimeout(() => {
        showChatInterface();

        console.log('Forced chat interface to show after delay');

        // Double-check that chat is visible
        if (messagesChat.classList.contains('hidden') || messagesChat.style.display === 'none') {
            console.log('Chat was still hidden, forcing display again');
            messagesChat.classList.remove('hidden');
            messagesChat.style.display = 'flex';
        }
    }, 100);

    // Mark conversation as active
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = Array.from(document.querySelectorAll('.conversation-item')).find(
        item => item.querySelector('.conversation-name').textContent === currentStudent.name
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
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }

    try {
        // Subscribe to new messages
        unsubscribeFromMessages = chatService.subscribeToChat(conversationId, messages => {
            renderMessages(messages);
        });
    } catch (error) {
        console.error('Error subscribing to messages:', error);
        showErrorMessage('Failed to load messages. Please try again.');
    }
}

// Render messages in the chat
function renderMessages(messages) {
    if (!chatMessages) return;

    // Clear messages container
    chatMessages.innerHTML = '';

    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No messages yet</p>
                <p>Start the conversation with ${currentStudent.name}</p>
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
        dateSeparator.innerHTML = `<span>${date}</span>`;
        chatMessages.appendChild(dateSeparator);

        // Render messages for this date
        messagesByDate[date].forEach(message => {
            const messageElement = createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });
    });

    // Add a class to enable smooth scrolling
    chatMessages.classList.add('scrolling');

    // Scroll to bottom immediately
    scrollToBottom();

    // Remove the scrolling class after scrolling is complete
    setTimeout(() => {
        chatMessages.classList.remove('scrolling');
    }, 1000);
}

// Create a message element
function createMessageElement(message) {
    // DIRECT FIX: Force messages to be displayed correctly based on sender role
    // In the mentor dashboard:
    // - Messages from mentor (current user) should be displayed as "sent" (blue, right-aligned)
    // - Messages from student should be displayed as "received" (gray, left-aligned)

    // Get current user ID
    const currentUserId = chatService.getCurrentUserId();

    // IMPORTANT: For temporary messages, we need to handle them specially
    let isSentByCurrentUser;

    if (message.id && message.id.toString().startsWith('temp-')) {
        // For temporary messages, use the senderId to determine if it's sent by current user
        isSentByCurrentUser = message.senderId === currentUserId;
    } else {
        // For messages from Firebase, use the senderRole to determine alignment
        // This is the key fix - we're using senderRole instead of senderId
        isSentByCurrentUser = message.senderRole === 'mentor';
    }

    console.log('MENTOR DASHBOARD - Message display check:', {
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
            timestamp = formatTime(message.timestamp.toDate());
        } else if (message.timestamp instanceof Date) {
            timestamp = formatTime(message.timestamp);
        }
    }

    // Add pending indicator for temporary messages
    const pendingIndicator = message.pending ?
        '<span class="pending-indicator"><i class="fas fa-circle-notch fa-spin"></i></span>' : '';

    // Add a clear visual indicator of who sent the message
    const senderIndicator = isSentByCurrentUser ?
        '<div class="sender-indicator mentor">You (Mentor)</div>' :
        '<div class="sender-indicator student">Student</div>';

    messageElement.innerHTML = `
        ${senderIndicator}
        <div class="message-content">
            <p>${message.content}</p>
            ${pendingIndicator}
        </div>
        <div class="message-time">${timestamp}</div>
    `;

    console.log('MENTOR DASHBOARD - Created message element:', {
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
    if (!messageInput) return;

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
    const currentUserId = chatService.getCurrentUserId();
    const tempMessage = {
        id: 'temp-' + Date.now(),
        content: message,
        senderRole: 'mentor',
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

    // Send message to Firebase
    console.log('Mentor dashboard - Sending message:', {
        studentId: currentConversation.studentId,
        mentorId: currentConversation.mentorId,
        message
    });

    chatService.sendMessage(
        currentConversation.studentId,
        currentConversation.mentorId,
        message
    ).then(messageId => {
        console.log('Mentor dashboard - Message sent successfully, ID:', messageId);

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
        showErrorMessage('Failed to send message. Please try again.');

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
    });
}

// Show student selection modal
function showStudentSelectionModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('studentSelectionModal')) {
        createStudentSelectionModal();
    }

    // Show modal
    const modalOverlay = document.getElementById('studentSelectionModal');
    modalOverlay.classList.add('active');

    // Load students
    loadStudents();
}

// Create student selection modal
function createStudentSelectionModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'studentSelectionModal';

    modalOverlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Select a Student to Message</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-search">
                <input type="text" placeholder="Search students..." id="studentSearchInput">
                <i class="fas fa-search"></i>
            </div>
            <div class="student-list" id="studentList">
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading students...</p>
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
    modalOverlay.querySelector('#studentSearchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const studentItems = modalOverlay.querySelectorAll('.student-item');

        studentItems.forEach(item => {
            const studentName = item.querySelector('.student-name').textContent.toLowerCase();
            const studentProgram = item.querySelector('.student-program').textContent.toLowerCase();

            if (studentName.includes(searchTerm) || studentProgram.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    document.body.appendChild(modalOverlay);
}

// Load students for selection
async function loadStudents() {
    const studentList = document.getElementById('studentList');
    if (!studentList) return;

    studentList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading students...</p>
        </div>
    `;

    try {
        // Get students
        const students = await chatService.getStudents();

        if (students.length === 0) {
            studentList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <p>No students found</p>
                </div>
            `;
            return;
        }

        // Clear loading state
        studentList.innerHTML = '';

        // Add students to list
        students.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-item';

            studentItem.innerHTML = `
                <img src="${student.image || 'https://placehold.co/40'}" alt="${student.name}">
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-program">${student.program || 'Student'}</div>
                </div>
            `;

            // Add click event to start conversation
            studentItem.addEventListener('click', () => {
                startConversation(student);
            });

            studentList.appendChild(studentItem);
        });
    } catch (error) {
        console.error('Error loading students:', error);
        studentList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading students</p>
                <button id="retryLoadStudents">Retry</button>
            </div>
        `;

        document.getElementById('retryLoadStudents').addEventListener('click', loadStudents);
    }
}

// Start a conversation with a student
async function startConversation(student) {
    try {
        // Close modal
        const modal = document.getElementById('studentSelectionModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Get current user ID (mentor)
        const mentorId = chatService.getCurrentUserId();
        if (!mentorId) throw new Error('Not authenticated');

        console.log('Starting conversation with student:', {
            studentId: student.id,
            studentName: student.name,
            mentorId
        });

        // Create a temporary message to show immediately
        const tempMessage = {
            id: 'temp-' + Date.now(),
            content: `Hello ${student.name}, I'm your mentor. How can I help you today?`,
            senderRole: 'mentor',
            senderId: mentorId, // This is the key property that determines message alignment
            timestamp: new Date(),
            pending: true
        };

        // Show the conversation in the UI first
        const conversationId = chatService.getConversationId(student.id, mentorId);
        currentConversation = {
            id: conversationId,
            studentId: student.id,
            mentorId: mentorId,
            student: student
        };
        currentStudent = student;

        // Update UI
        updateChatHeader(student);
        showChatInterface();

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
            student.id,
            mentorId,
            `Hello ${student.name}, I'm your mentor. How can I help you today?`
        );

        console.log('Initial message sent, message ID:', messageId);

        // Remove the temporary message element
        const tempElement = document.getElementById('temp-' + tempMessage.id);
        if (tempElement) {
            tempElement.classList.remove('pending');
        }

        // Subscribe to messages for this conversation
        subscribeToMessages(conversationId);
    } catch (error) {
        console.error('Error starting conversation:', error);
        showErrorMessage('Failed to start conversation. Please try again.');
    }
}

// Update chat header with student info
function updateChatHeader(student) {
    if (!chatHeaderName || !chatHeaderStatus || !chatHeaderAvatar) return;

    chatHeaderName.textContent = student.name;
    chatHeaderStatus.textContent = `${student.program || 'Student'} • ${student.year || ''}`;
    chatHeaderAvatar.src = student.image || 'https://placehold.co/45';
}

// Show chat interface
function showChatInterface() {
    console.log('Showing chat interface');

    if (!messagesWelcome || !messagesChat) {
        console.error('Chat elements not found:', { messagesWelcome, messagesChat });
        return;
    }

    // Force display with inline style to override any CSS issues
    messagesWelcome.classList.add('hidden');
    messagesWelcome.style.display = 'none';

    messagesChat.classList.remove('hidden');
    messagesChat.style.display = 'flex';

    console.log('Chat visibility updated:', {
        welcomeHidden: messagesWelcome.classList.contains('hidden'),
        chatHidden: messagesChat.classList.contains('hidden'),
        welcomeDisplay: messagesWelcome.style.display,
        chatDisplay: messagesChat.style.display
    });

    // Enable input
    if (messageInput && sendMessageBtn) {
        messageInput.disabled = false;
        sendMessageBtn.disabled = false;
    }

    // Force another check after a short delay to ensure the chat stays visible
    setTimeout(() => {
        if (messagesChat.classList.contains('hidden') || messagesChat.style.display === 'none') {
            console.log('Chat was hidden again, forcing display');
            messagesChat.classList.remove('hidden');
            messagesChat.style.display = 'flex';
        }
    }, 500);
}

// Show empty state
function showEmptyState() {
    console.log('Showing empty state');

    if (!messagesWelcome || !messagesChat) {
        console.error('Chat elements not found:', { messagesWelcome, messagesChat });
        return;
    }

    // Force display with inline style to override any CSS issues
    messagesWelcome.classList.remove('hidden');
    messagesWelcome.style.display = 'flex';

    messagesChat.classList.add('hidden');
    messagesChat.style.display = 'none';

    console.log('Empty state visibility updated:', {
        welcomeHidden: messagesWelcome.classList.contains('hidden'),
        chatHidden: messagesChat.classList.contains('hidden'),
        welcomeDisplay: messagesWelcome.style.display,
        chatDisplay: messagesChat.style.display
    });

    // Disable input
    if (messageInput && sendMessageBtn) {
        messageInput.disabled = true;
        sendMessageBtn.disabled = true;
    }
}

// Update unread count in the sidebar
function updateUnreadCount(conversations) {
    const totalUnread = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

    // Update badge in sidebar
    if (messageBadge) {
        messageBadge.textContent = totalUnread > 0 ? totalUnread : '0';
    }
}

// Filter conversations based on search input
function filterConversations() {
    if (!messageSearch) return;

    const searchTerm = messageSearch.value.toLowerCase();
    const conversationItems = document.querySelectorAll('.conversation-item');

    conversationItems.forEach(item => {
        const studentName = item.querySelector('.conversation-name').textContent.toLowerCase();
        const messagePreview = item.querySelector('.conversation-preview').textContent.toLowerCase();

        if (studentName.includes(searchTerm) || messagePreview.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
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
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;
}

// Scroll chat to bottom - Windows-optimized version
function scrollToBottom() {
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }

    // First, make sure the container is visible
    if (chatMessages.closest('.messages-chat').classList.contains('hidden')) {
        console.log('Chat is hidden, showing it first');
        showChatInterface();
    }

    // Windows-specific direct approach - most reliable for Windows
    try {
        // Direct scrollTop approach - works best on Windows
        chatMessages.scrollTop = 999999; // Large value to ensure we reach the bottom
        console.log('Windows direct scroll approach');

        // Double-check with a small delay
        setTimeout(() => {
            chatMessages.scrollTop = 999999;
        }, 50);
    } catch (error) {
        console.error('Direct scrollTop failed:', error);
    }

    // Create a marker element at the bottom
    const bottomMarker = document.createElement('div');
    bottomMarker.id = 'bottom-marker';
    bottomMarker.style.height = '20px'; // Increased height for better visibility
    bottomMarker.style.width = '100%';
    bottomMarker.style.backgroundColor = 'rgba(0,0,0,0.05)'; // Subtle background
    bottomMarker.style.position = 'relative';

    // Add the marker to the bottom of the chat
    chatMessages.appendChild(bottomMarker);

    // Try multiple scroll methods for cross-browser compatibility

    // Method 1: Direct scrollTop (best for Windows)
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Method 2: scrollIntoView with auto behavior (more reliable on Windows)
    try {
        bottomMarker.scrollIntoView({ behavior: 'auto', block: 'end' });
        console.log('Used scrollIntoView with auto behavior');
    } catch (error) {
        console.error('scrollIntoView failed:', error);
    }

    // Method 3: Scroll parent container if needed
    try {
        const parentContainer = chatMessages.parentElement;
        if (parentContainer) {
            parentContainer.scrollTop = parentContainer.scrollHeight;
        }
    } catch (error) {
        console.error('Parent scroll failed:', error);
    }

    // Schedule multiple attempts with increasing delays
    [50, 100, 200, 500, 1000].forEach(delay => {
        setTimeout(() => {
            try {
                // Direct approach first (best for Windows)
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Then try scrollIntoView if marker exists
                const marker = document.getElementById('bottom-marker');
                if (marker) {
                    marker.scrollIntoView({ behavior: 'auto', block: 'end' });
                }
            } catch (e) {
                console.error(`Scroll attempt at ${delay}ms failed:`, e);
            }
        }, delay);
    });

    // Clean up the marker after all attempts
    setTimeout(() => {
        const marker = document.getElementById('bottom-marker');
        if (marker && marker.parentNode) {
            marker.parentNode.removeChild(marker);
        }
    }, 1500);
}

// Force scroll to bottom - Windows-optimized emergency method
function forceScrollToBottom() {
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }

    console.log('FORCE SCROLLING TO BOTTOM - Windows-optimized emergency method');

    // First, make sure the container is visible
    if (chatMessages.closest('.messages-chat').classList.contains('hidden')) {
        console.log('Chat is hidden, showing it first');
        showChatInterface();
    }

    // Windows-specific approach - create a large spacer at the bottom
    try {
        // Create a temporary spacer div at the bottom
        const spacerDiv = document.createElement('div');
        spacerDiv.id = 'windows-scroll-spacer';
        spacerDiv.style.height = '50px'; // Taller spacer for Windows
        spacerDiv.style.width = '100%';
        spacerDiv.style.backgroundColor = '#ffcccc'; // Light red background
        spacerDiv.style.position = 'relative';
        spacerDiv.style.zIndex = '1000';
        spacerDiv.style.textAlign = 'center';
        spacerDiv.style.padding = '15px 0';
        spacerDiv.style.fontWeight = 'bold';
        spacerDiv.style.color = '#ff0000';
        spacerDiv.textContent = '↓ BOTTOM OF CHAT ↓';

        // Add the spacer to the bottom of the chat
        chatMessages.appendChild(spacerDiv);

        // Direct scrollTop approach - most reliable on Windows
        chatMessages.scrollTop = 999999;

        // Also try scrollIntoView with auto behavior
        spacerDiv.scrollIntoView({ behavior: 'auto', block: 'end' });

        // Flash the spacer to draw attention
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            spacerDiv.style.backgroundColor = flashCount % 2 === 0 ? '#ffeeee' : '#ffcccc';
            flashCount++;

            if (flashCount > 6) {
                clearInterval(flashInterval);

                // Remove the spacer after flashing
                setTimeout(() => {
                    if (spacerDiv.parentNode) {
                        spacerDiv.parentNode.removeChild(spacerDiv);
                    }
                }, 500);
            }
        }, 200);
    } catch (error) {
        console.error('Windows scroll approach failed:', error);
    }

    // Method 2: Brute force approach for Windows
    try {
        // Temporarily modify the container to ensure scrolling works
        const originalHeight = chatMessages.style.height;
        const originalMaxHeight = chatMessages.style.maxHeight;
        const originalOverflow = chatMessages.style.overflow;

        // Set explicit dimensions
        chatMessages.style.height = '400px';
        chatMessages.style.maxHeight = '400px';
        chatMessages.style.overflow = 'auto';
        chatMessages.style.display = 'block'; // Force block display

        // Force scroll
        chatMessages.scrollTop = 999999;

        // Restore original styles after a delay
        setTimeout(() => {
            chatMessages.style.height = originalHeight;
            chatMessages.style.maxHeight = originalMaxHeight;
            chatMessages.style.overflow = originalOverflow;
            chatMessages.style.display = 'flex'; // Restore flex display

            // One more scroll attempt
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 300);
    } catch (error) {
        console.error('Brute force approach failed:', error);
    }

    // Method 3: Try scrolling the parent containers
    try {
        // Scroll all parent containers
        let parent = chatMessages.parentElement;
        while (parent) {
            parent.scrollTop = parent.scrollHeight;
            parent = parent.parentElement;
        }
    } catch (error) {
        console.error('Parent scrolling failed:', error);
    }

    // Final attempts with multiple delays
    [100, 300, 600, 1000].forEach(delay => {
        setTimeout(() => {
            try {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (e) {
                console.error(`Delayed scroll attempt at ${delay}ms failed:`, e);
            }
        }, delay);
    });
}

// Scroll chat to top - Windows-optimized version
function scrollToTop() {
    if (!chatMessages) {
        console.error('Chat messages container not found');
        return;
    }

    // First, make sure the container is visible
    if (chatMessages.closest('.messages-chat').classList.contains('hidden')) {
        console.log('Chat is hidden, showing it first');
        showChatInterface();
    }

    // Windows-specific direct approach - most reliable for Windows
    try {
        // Direct scrollTop approach - works best on Windows
        chatMessages.scrollTop = 0;
        console.log('Windows direct scroll to top approach');

        // Double-check with a small delay
        setTimeout(() => {
            chatMessages.scrollTop = 0;
        }, 50);
    } catch (error) {
        console.error('Direct scrollTop failed:', error);
    }

    // Create a marker element at the top
    const topMarker = document.createElement('div');
    topMarker.id = 'top-marker';
    topMarker.style.height = '20px'; // Increased height for better visibility
    topMarker.style.width = '100%';
    topMarker.style.backgroundColor = 'rgba(0,0,0,0.05)'; // Subtle background
    topMarker.style.position = 'relative';

    // Add the marker to the top of the chat
    if (chatMessages.firstChild) {
        chatMessages.insertBefore(topMarker, chatMessages.firstChild);
    } else {
        chatMessages.appendChild(topMarker);
    }

    // Try multiple scroll methods for cross-browser compatibility

    // Method 1: Direct scrollTop (best for Windows)
    chatMessages.scrollTop = 0;

    // Method 2: scrollIntoView with auto behavior (more reliable on Windows)
    try {
        topMarker.scrollIntoView({ behavior: 'auto', block: 'start' });
        console.log('Used scrollIntoView with auto behavior');
    } catch (error) {
        console.error('scrollIntoView failed:', error);
    }

    // Method 3: Scroll parent container if needed
    try {
        const parentContainer = chatMessages.parentElement;
        if (parentContainer) {
            parentContainer.scrollTop = 0;
        }
    } catch (error) {
        console.error('Parent scroll failed:', error);
    }

    // Schedule multiple attempts with increasing delays
    [50, 100, 200, 500].forEach(delay => {
        setTimeout(() => {
            try {
                // Direct approach first (best for Windows)
                chatMessages.scrollTop = 0;

                // Then try scrollIntoView if marker exists
                const marker = document.getElementById('top-marker');
                if (marker) {
                    marker.scrollIntoView({ behavior: 'auto', block: 'start' });
                }
            } catch (e) {
                console.error(`Scroll attempt at ${delay}ms failed:`, e);
            }
        }, delay);
    });

    // Clean up the marker after all attempts
    setTimeout(() => {
        const marker = document.getElementById('top-marker');
        if (marker && marker.parentNode) {
            marker.parentNode.removeChild(marker);
        }
    }, 1000);
}
