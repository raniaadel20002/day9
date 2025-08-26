// Authentication and API helper functions
const API = {
    // Generic fetch wrapper with error handling
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            // Check if response is a redirect (login required)
            if (response.redirected && response.url.includes('/login')) {
                window.location.href = '/login';
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            showMessage('Network error. Please try again.', 'error');
            return null;
        }
    },
    
    // GET request
    async get(url) {
        return this.request(url, { method: 'GET' });
    },
    
    // POST request with form data
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data)
        });
    },
    
    // DELETE request
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// Show messages to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.dynamic-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `dynamic-message message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Style based on type
    if (type === 'error') {
        messageDiv.style.background = '#fef2f2';
        messageDiv.style.color = '#dc2626';
        messageDiv.style.border = '1px solid #fecaca';
    } else if (type === 'success') {
        messageDiv.style.background = '#f0fdf4';
        messageDiv.style.color = '#16a34a';
        messageDiv.style.border = '1px solid #bbf7d0';
    } else {
        messageDiv.style.background = '#eff6ff';
        messageDiv.style.color = '#2563eb';
        messageDiv.style.border = '1px solid #bfdbfe';
    }
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Navigation functionality (updated for authentication)
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to clicked nav button
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Load data when viewing students
    if (sectionId === 'view-students') {
        loadStudents();
    } else if (sectionId === 'dashboard') {
        updateDashboard();
    }
}

// Global configuration
const CONFIG = {
    API_BASE_URL: '', // Same origin
    DEBOUNCE_DELAY: 500,
    MESSAGE_TIMEOUT: 5000
};

// Authentication state management
const Auth = {
    currentUser: null,
    
    init() {
        // Get user data from page if available
        const userElement = document.querySelector('[data-user]');
        if (userElement) {
            try {
                this.currentUser = JSON.parse(userElement.dataset.user);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    },
    
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    },
    
    canPerform(action) {
        if (!this.currentUser) return false;
        
        const role = this.currentUser.role;
        
        switch (action) {
            case 'view_students':
                return ['admin', 'teacher', 'student'].includes(role);
            case 'add_student':
            case 'edit_student':
                return ['admin', 'teacher'].includes(role);
            case 'delete_student':
            case 'manage_users':
                return role === 'admin';
            default:
                return false;
        }
    }
};

// Initialize authentication on page load
Auth.init();

// Enhanced form submission with API calls
function initializeFormHandlers() {
    // Student form submission
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                // Show loading state
                submitBtn.textContent = 'Adding Student...';
                submitBtn.disabled = true;
                
                const formData = new FormData(this);
                const response = await API.post('/add-student', formData);
                
                if (response && response.ok) {
                    showMessage('Student added successfully!', 'success');
                    this.reset();
                    
                    // Update dashboard if visible
                    if (document.getElementById('dashboard').classList.contains('active')) {
                        updateDashboard();
                    }
                } else {
                    showMessage('Error adding student. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showMessage('Error adding student. Please try again.', 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Edit student form submission
    const editStudentForm = document.getElementById('editStudentForm');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.textContent = 'Updating...';
                submitBtn.disabled = true;
                
                const formData = new FormData(this);
                const studentId = document.getElementById('editStudentId').value;
                const response = await API.post(`/edit-student/${studentId}`, formData);
                
                if (response && response.ok) {
                    showMessage('Student updated successfully!', 'success');
                    closeEditModal();
                    loadStudents(); // Refresh the student list
                } else {
                    showMessage('Error updating student. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error updating student:', error);
                showMessage('Error updating student. Please try again.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Load students from server
async function loadStudents() {
    const tbody = document.getElementById('studentsTableBody');
    
    if (!tbody) return; // Not on students page
    
    try {
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Loading students...</td></tr>';
        
        const response = await API.get('/students');
        
        if (!response || !response.ok) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading students</td></tr>';
            return;
        }
        
        // Since we're using server-side rendering, we don't need to parse JSON here
        // The table content is already rendered by the server
        // This function is mainly for future AJAX implementations
        
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading students</td></tr>';
    }
}

// Load dashboard data from server
async function loadDashboardData() {
    try {
        const response = await API.get('/');
        
        if (!response || !response.ok) {
            showMessage('Error loading dashboard data', 'error');
            return null;
        }
        
        // Since we're using server-side rendering, dashboard data is already rendered
        // This function is for future AJAX implementations
        return true;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showMessage('Error loading dashboard data', 'error');
        return null;
    }
}

// Enhanced search functionality with server-side search
async function searchStudents() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    
    try {
        // Redirect to server-side search (since we're not using AJAX for the main functionality)
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('search', searchTerm);
        window.location.href = currentUrl.toString();
        
    } catch (error) {
        console.error('Error performing search:', error);
        showMessage('Error performing search', 'error');
    }
}

// Real-time search with debouncing
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (this.value.length >= 2 || this.value.length === 0) {
                searchStudents();
            }
        }, 500); // 500ms debounce
    });
}

// Edit student (for modal-based editing)
function editStudent(id) {
    // Redirect to edit page (server-side rendering approach)
    window.location.href = `/edit-student/${id}`;
}

// For future modal implementation
function openEditModal(studentData) {
    const modal = document.getElementById('editModal');
    if (!modal) return;
    
    // Fill edit form with student data
    document.getElementById('editStudentId').value = studentData.id;
    document.getElementById('editFirstName').value = studentData.firstName;
    document.getElementById('editLastName').value = studentData.lastName;
    document.getElementById('editEmail').value = studentData.email;
    document.getElementById('editAge').value = studentData.age;
    document.getElementById('editCourse').value = studentData.course;
    document.getElementById('editStatus').value = studentData.status;
    
    // Show modal
    modal.style.display = 'block';
}

// Delete student with API call
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }
    
    try {
        const response = await API.post(`/delete-student/${id}`, {});
        
        if (response && response.ok) {
            showMessage('Student deleted successfully!', 'success');
            
            // Refresh the page to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage('Error deleting student. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showMessage('Error deleting student. Please try again.', 'error');
    }
}

// Delete user (for admin functionality)
async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await API.post(`/delete-user/${id}`, {});
        
        if (response && response.ok) {
            showMessage('User deleted successfully!', 'success');
            
            // Refresh the page to show updated data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage('Error deleting user. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error deleting user. Please try again.', 'error');
    }
}


// Authentication helpers
function checkAuthStatus() {
    // Check if user is logged in by looking for user data in the page
    const userInfo = document.querySelector('[data-user]');
    return userInfo !== null;
}

function redirectToLogin() {
    window.location.href = '/login';
}

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
    }
}

// Role-based UI updates
function updateUIBasedOnRole() {
    const userInfo = document.querySelector('[data-user]');
    if (!userInfo) return;
    
    const userData = JSON.parse(userInfo.dataset.user);
    const userRole = userData.role;
    
    // Hide/show elements based on role
    const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
    const teacherOnlyElements = document.querySelectorAll('[data-teacher-only]');
    
    if (userRole !== 'admin') {
        adminOnlyElements.forEach(el => el.style.display = 'none');
    }
    
    if (userRole === 'student') {
        teacherOnlyElements.forEach(el => el.style.display = 'none');
    }
}

// Update dashboard (server-side rendered, but kept for compatibility)
function updateDashboard() {
    // Since we're using server-side rendering, dashboard data is already rendered
    // This function is kept for future AJAX implementations
    console.log('Dashboard updated (server-side rendered)');
}

// Initialize page functionality
function initializePage() {
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize search functionality
    initializeSearch();
    
    // Update UI based on user role
    updateUIBasedOnRole();
    
    // Add CSS animation for messages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .dynamic-message {
            animation: slideIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// Modal functionality
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
}

// Utility functions
const Utils = {
    // Format date for display
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },
    
    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page functionality
    initializePage();
    
    // Update dashboard if on dashboard page
    if (document.getElementById('dashboard')) {
        updateDashboard();
    }
    
    // Add search functionality if search input exists
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchStudents();
            }
        });
    }
    
    // Add click handlers for dynamic elements
    document.addEventListener('click', function(e) {
        // Handle edit buttons
        if (e.target.classList.contains('edit-btn')) {
            const studentId = e.target.dataset.studentId;
            if (studentId) {
                editStudent(studentId);
            }
        }
        
        // Handle delete buttons
        if (e.target.classList.contains('delete-btn')) {
            const studentId = e.target.dataset.studentId;
            const userId = e.target.dataset.userId;
            
            if (studentId) {
                deleteStudent(studentId);
            } else if (userId) {
                deleteUser(userId);
            }
        }
    });
});
