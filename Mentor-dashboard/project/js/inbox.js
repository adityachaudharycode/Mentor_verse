// Import chat service
import { chatService } from './chatService.js';

// State variables
let currentConversation = null;
let currentStudent = null;
let unsubscribeFromMessages = null;
let unsubscribeFromConversations = null;

// Inbox functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize inbox filtering
  initializeInboxFilters();

  // Initialize Firebase chat
  initializeChat();

  // Handle message sending
  const chatInput = document.querySelector('.chat-input input');
  const sendButton = document.querySelector('.send-btn');

  if (chatInput && sendButton) {
    sendButton.addEventListener('click', () => {
      sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        sendMessage(chatInput.value);
      }
    });
  }

  // Add "New Message" button to inbox header
  const inboxHeader = document.querySelector('.inbox-header');
  if (inboxHeader) {
    const newMessageBtn = document.createElement('button');
    newMessageBtn.className = 'btn-primary new-message-btn';
    newMessageBtn.innerHTML = '<i class="fas fa-plus"></i> New Message';
    newMessageBtn.addEventListener('click', showStudentSelectionModal);
    inboxHeader.appendChild(newMessageBtn);
  }
});

// Initialize chat functionality
function initializeChat() {
  // Check if user is authenticated
  if (!firebase.auth().currentUser) {
    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // User is signed in, subscribe to conversations
        subscribeToConversations();
      } else {
        // User is signed out, redirect to login
        window.location.href = '../../login.html';
      }
    });
  } else {
    // User is already authenticated, subscribe to conversations
    subscribeToConversations();
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
  const messageList = document.getElementById('messageList');
  if (!messageList) return;

  // Clear existing conversations
  messageList.innerHTML = '';

  if (conversations.length === 0) {
    messageList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No conversations yet</p>
        <p>Start a new conversation with a student</p>
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
    const messageItem = document.createElement('div');
    messageItem.className = 'message-item';
    messageItem.setAttribute('data-id', conversation.id);
    messageItem.setAttribute('data-subject', conversation.student.expertise || 'general');
    messageItem.setAttribute('data-priority', conversation.priority || 'medium');
    messageItem.setAttribute('data-status', conversation.unreadCount > 0 ? 'unanswered' : 'answered');
    messageItem.setAttribute('data-date', formatDateAttribute(conversation.lastMessageTimestamp));

    if (currentConversation && currentConversation.id === conversation.id) {
      messageItem.classList.add('active');
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
    messageItem.innerHTML = `
      <div class="message-avatar">
        <img src="${conversation.student.image || 'https://via.placeholder.com/40'}" alt="${conversation.student.name}">
        <span class="status-dot ${conversation.student.isOnline ? 'online' : 'offline'}"></span>
      </div>
      <div class="message-preview">
        <div class="message-info">
          <h4>${conversation.student.name}</h4>
          <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-snippet">${conversation.lastMessage || 'Start a conversation'}</div>
        <div class="message-meta">
          <span class="message-tag ${conversation.priority || 'medium'}">${(conversation.priority || 'Medium').charAt(0).toUpperCase() + (conversation.priority || 'medium').slice(1)}</span>
          ${conversation.unreadCount > 0 ? `<span class="unread-badge">${conversation.unreadCount}</span>` : ''}
        </div>
      </div>
    `;

    // Add click event to load conversation
    messageItem.addEventListener('click', () => {
      loadConversation(conversation);
    });

    messageList.appendChild(messageItem);
  });

  // Update inbox header count
  const inboxHeaderTitle = document.querySelector('.inbox-header h3');
  if (inboxHeaderTitle) {
    inboxHeaderTitle.textContent = `Messages (${conversations.length})`;
  }
}

// Load a conversation
function loadConversation(conversation) {
  // Update current conversation
  currentConversation = conversation;
  currentStudent = conversation.student;

  // Update UI
  updateChatHeader(currentStudent);

  // Mark conversation as active
  document.querySelectorAll('.message-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`.message-item[data-id="${conversation.id}"]`);
  if (activeItem) {
    activeItem.classList.add('active');

    // Remove unread badge
    const unreadBadge = activeItem.querySelector('.unread-badge');
    if (unreadBadge) {
      unreadBadge.remove();
    }

    // Update status attribute
    activeItem.setAttribute('data-status', 'answered');
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
  const chatMessages = document.querySelector('.chat-messages');
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
  const chatMessages = document.querySelector('.chat-messages');
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

  // Scroll to bottom
  scrollToBottom(chatMessages);
}

// Create a message element
function createMessageElement(message) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${message.senderRole === 'mentor' ? 'mentor' : 'student'}`;

  // Format timestamp
  const timestamp = message.timestamp
    ? formatTime(message.timestamp.toDate())
    : '';

  messageElement.innerHTML = `
    <div class="message-content">
      <p>${message.content}</p>
    </div>
    <div class="message-time">${timestamp}</div>
  `;

  return messageElement;
}

// Send a message
function sendMessage(text) {
  if (!text.trim() || !currentConversation) return;

  const chatInput = document.querySelector('.chat-input input');
  if (!chatInput) return;

  // Clear input
  chatInput.value = '';

  // Send message
  chatService.sendMessage(
    currentConversation.studentId,
    currentConversation.mentorId,
    text
  ).catch(error => {
    console.error('Error sending message:', error);
    showErrorMessage('Failed to send message. Please try again.');
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
  modalOverlay.style.display = 'flex';

  // Load students
  loadStudents();
}

// Create student selection modal
function createStudentSelectionModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.id = 'studentSelectionModal';
  modalOverlay.style.display = 'none';

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
    modalOverlay.style.display = 'none';
  });

  // Close when clicking outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.style.display = 'none';
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
        <img src="${student.image || 'https://via.placeholder.com/40'}" alt="${student.name}">
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
      modal.style.display = 'none';
    }

    // Get current user ID (mentor)
    const mentorId = chatService.getCurrentUserId();
    if (!mentorId) throw new Error('Not authenticated');

    // Send initial message
    await chatService.sendMessage(
      student.id,
      mentorId,
      `Hello ${student.name}, I'm your mentor. How can I help you today?`
    );

    // Conversations will be updated automatically through the subscription
  } catch (error) {
    console.error('Error starting conversation:', error);
    showErrorMessage('Failed to start conversation. Please try again.');
  }
}

// Update chat header with student info
function updateChatHeader(student) {
  const chatUser = document.querySelector('.chat-user');
  if (!chatUser) return;

  chatUser.innerHTML = `
    <img src="${student.image || 'https://via.placeholder.com/40'}" alt="${student.name}">
    <div>
      <h3>${student.name}</h3>
      <p>${student.program || 'Student'} • ${student.year || ''}</p>
    </div>
  `;
}

// Update unread count in the sidebar
function updateUnreadCount(conversations) {
  const totalUnread = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

  // Update badge in sidebar
  const sidebarBadge = document.querySelector('.sidebar-nav li[data-section="student-inbox"] .badge');
  if (sidebarBadge) {
    sidebarBadge.textContent = totalUnread > 0 ? totalUnread : '';
    sidebarBadge.style.display = totalUnread > 0 ? 'inline-flex' : 'none';
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

// Format date for data attribute
function formatDateAttribute(timestamp) {
  if (!timestamp) return 'unknown';

  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday';
  } else if (date > new Date(today.setDate(today.getDate() - 7))) {
    return 'week';
  } else {
    return 'older';
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

// Scroll chat to bottom
function scrollToBottom(container) {
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// Initialize inbox filters
function initializeInboxFilters() {
  const subjectFilter = document.getElementById('subject-filter');
  const priorityFilter = document.getElementById('priority-filter');
  const statusFilter = document.getElementById('status-filter');
  const dateFilter = document.getElementById('date-filter');
  const messageList = document.getElementById('messageList');
  const messageItems = messageList ? messageList.querySelectorAll('.message-item') : [];

  function applyFilters() {
    const subjectValue = subjectFilter ? subjectFilter.value : 'all';
    const priorityValue = priorityFilter ? priorityFilter.value : 'all';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    const dateValue = dateFilter ? dateFilter.value : 'all';

    messageItems.forEach(item => {
      const subject = item.getAttribute('data-subject');
      const priority = item.getAttribute('data-priority');
      const status = item.getAttribute('data-status');
      const date = item.getAttribute('data-date');

      const subjectMatch = subjectValue === 'all' || subject === subjectValue;
      const priorityMatch = priorityValue === 'all' || priority === priorityValue;
      const statusMatch = statusValue === 'all' || status === statusValue;
      const dateMatch = dateValue === 'all' || date === dateValue;

      if (subjectMatch && priorityMatch && statusMatch && dateMatch) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  if (subjectFilter) subjectFilter.addEventListener('change', applyFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);
}