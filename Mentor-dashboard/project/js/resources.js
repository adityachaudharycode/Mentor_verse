// Resources functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize resource filters
  initializeResourceFilters();
  
  // Toggle between resource types in form
  const resourceType = document.getElementById('resourceType');
  const uploadSection = document.getElementById('uploadSection');
  const linkSection = document.getElementById('linkSection');
  
  if (resourceType && uploadSection && linkSection) {
    resourceType.addEventListener('change', function() {
      if (this.value === 'upload') {
        uploadSection.classList.remove('hidden');
        linkSection.classList.add('hidden');
      } else {
        uploadSection.classList.add('hidden');
        linkSection.classList.remove('hidden');
      }
    });
  }
  
  // Resource creation form
  const createResourceBtn = document.getElementById('createResourceBtn');
  const createResourceModal = document.getElementById('createResourceModal');
  const resourceForm = document.getElementById('resourceForm');
  const closeModalBtn = createResourceModal ? createResourceModal.querySelector('.close-btn') : null;
  const cancelBtn = createResourceModal ? createResourceModal.querySelector('.cancel-btn') : null;
  
  if (createResourceBtn && createResourceModal) {
    createResourceBtn.addEventListener('click', () => {
      createResourceModal.classList.add('active');
    });
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      createResourceModal.classList.remove('active');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      createResourceModal.classList.remove('active');
    });
  }
  
  if (resourceForm) {
    resourceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const title = document.getElementById('resourceTitle').value;
      const description = document.getElementById('resourceDescription').value;
      const type = document.getElementById('resourceType').value;
      const category = document.getElementById('resourceCategory').value;
      const tags = document.getElementById('resourceTags').value;
      
      // Validate form
      if (!title) {
        alert('Please enter a resource title');
        return;
      }
      
      if (!description) {
        alert('Please enter a resource description');
        return;
      }
      
      if (type === 'upload') {
        const file = document.getElementById('resourceFile').files[0];
        if (!file) {
          alert('Please select a file to upload');
          return;
        }
      } else {
        const link = document.getElementById('resourceLink').value;
        if (!link) {
          alert('Please enter a resource URL');
          return;
        }
      }
      
      // In a real app, this would submit the form to create a new resource
      alert(`Resource "${title}" created successfully!`);
      
      // Close modal and reset form
      createResourceModal.classList.remove('active');
      resourceForm.reset();
    });
  }
  
  // Handle resource actions (preview, download, etc.)
  const resourceActions = document.querySelectorAll('.resource-card .resource-actions button');
  
  resourceActions.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.textContent.trim();
      const resourceCard = button.closest('.resource-card');
      const resourceTitle = resourceCard.querySelector('h3').textContent;
      
      // In a real app, these would perform the actual actions
      switch (action) {
        case 'Preview':
          alert(`Previewing "${resourceTitle}"`);
          break;
        case 'Download':
          alert(`Downloading "${resourceTitle}"`);
          break;
        case 'Visit Link':
          alert(`Opening link for "${resourceTitle}"`);
          break;
      }
    });
  });
  
  // Custom file input styling
  const fileInput = document.getElementById('resourceFile');
  const fileLabel = fileInput ? fileInput.nextElementSibling : null;
  
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileLabel.querySelector('span').textContent = fileInput.files[0].name;
      } else {
        fileLabel.querySelector('span').textContent = 'Choose a file';
      }
    });
  }
});

// Initialize resource filters
function initializeResourceFilters() {
  const categoryItems = document.querySelectorAll('.category-list li');
  const resourceSearch = document.getElementById('resourceSearch');
  const tagItems = document.querySelectorAll('.tag-cloud .tag');
  const resourceCards = document.querySelectorAll('.resource-card');
  
  // Filter by category
  if (categoryItems.length) {
    categoryItems.forEach(item => {
      item.addEventListener('click', () => {
        // Update active state
        categoryItems.forEach(cat => cat.classList.remove('active'));
        item.classList.add('active');
        
        const category = item.getAttribute('data-category');
        
        // Filter resources
        resourceCards.forEach(card => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
            card.classList.add('fade-in');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
  
  // Search resources
  if (resourceSearch) {
    resourceSearch.addEventListener('input', () => {
      const searchTerm = resourceSearch.value.toLowerCase();
      
      resourceCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
  
  // Filter by tag
  if (tagItems.length) {
    tagItems.forEach(tag => {
      tag.addEventListener('click', () => {
        const tagText = tag.textContent.toLowerCase();
        
        resourceCards.forEach(card => {
          const cardTags = Array.from(card.querySelectorAll('.tag-container .tag'))
            .map(t => t.textContent.toLowerCase());
          
          if (cardTags.includes(tagText)) {
            card.style.display = '';
            card.classList.add('fade-in');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
}