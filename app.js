// Employee Work System Application
// Using Supabase for backend

// Supabase Configuration
// หมายเหตุ: แทนที่ด้วยคีย์ Supabase จริงของคุณ
const SUPABASE_URL = 'https://bibygpupfqmbbwecqgdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYnlncHVwZnFtYmJ3ZWNxZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ4NDQsImV4cCI6MjA4NTgzMDg0NH0.AL-c_UbvMzsy1DIZFuABStYNeXK2A-r_0uWg26-ET2A';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentUser = null;
let currentPage = 'dashboard';
let isAdmin = false;
let userPosition = null;
let todayRecords = [];
let allRecords = [];

// DOM Elements
const appLoader = document.getElementById('app-loader');
const loginPage = document.getElementById('login-page');
const appContainer = document.getElementById('app-container');
const desktopSidebar = document.getElementById('desktop-sidebar');
const mobileBottomNav = document.getElementById('mobile-bottom-nav');
const mainContent = document.getElementById('main-content');
const pagesContainer = document.getElementById('pages-container');
const pageTitle = document.getElementById('page-title');
const pageTitleDesktop = document.getElementById('page-title-desktop');
const logoutModal = document.getElementById('logout-modal');
const globalLoader = document.getElementById('global-loader');
const loaderMessage = document.getElementById('loader-message');
const mobileAdminPanel = document.getElementById('mobile-admin-panel');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initEventListeners();
    
    // Check if user is already logged in (from localStorage)
    checkExistingSession();
    
    // Update current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Initialize sample data if needed
    initSampleData();
});

// Check for existing session
function checkExistingSession() {
    const savedUser = localStorage.getItem('workSystemUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            loginUser(user);
        } catch (e) {
            console.error('Error parsing saved user:', e);
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

// Show login page
function showLoginPage() {
    appLoader.classList.add('hidden');
    loginPage.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

// Show app container
function showAppContainer() {
    loginPage.classList.add('hidden');
    appContainer.classList.remove('hidden');
}

// Initialize event listeners
function initEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout buttons
    document.getElementById('logout-btn-desktop')?.addEventListener('click', showLogoutModal);
    
    // Logout modal buttons
    document.getElementById('cancel-logout')?.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
    
    document.getElementById('confirm-logout')?.addEventListener('click', handleLogout);
    
    // Mobile admin panel
    document.getElementById('close-admin-panel')?.addEventListener('click', () => {
        mobileAdminPanel.classList.add('hidden');
    });
    
    // Check-in/out buttons
    document.getElementById('checkin-btn')?.addEventListener('click', handleCheckIn);
    document.getElementById('checkout-btn')?.addEventListener('click', handleCheckOut);
    
    // Filter history button
    document.getElementById('filter-history-btn')?.addEventListener('click', loadHistoryData);
    
    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
    
    // Window resize for responsive adjustments
    window.addEventListener('resize', handleResize);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('user-type').value;
    
    // Show loading state
    document.getElementById('login-text').classList.add('hidden');
    document.getElementById('login-loading').classList.remove('hidden');
    
    // Simulate API call (in a real app, this would be a Supabase auth call)
    setTimeout(() => {
        // For demo purposes, we'll use hardcoded credentials
        if ((email === 'employee@company.com' && password === 'password123') || 
            (email === 'admin@company.com' && password === 'password123')) {
            
            const user = {
                id: userType === 'admin' ? 'admin-001' : 'emp-001',
                email: email,
                firstName: userType === 'admin' ? 'สมชาย' : 'สมหมาย',
                lastName: userType === 'admin' ? 'ใจดี' : 'ทำงาน',
                role: userType === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน',
                position: userType === 'admin' ? 'ผู้จัดการ' : 'พนักงานขาย',
                department: userType === 'admin' ? 'บริหาร' : 'ขาย',
                avatarText: userType === 'admin' ? 'ผ' : 'พ'
            };
            
            loginUser(user);
        } else {
            alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
        
        // Reset loading state
        document.getElementById('login-text').classList.remove('hidden');
        document.getElementById('login-loading').classList.add('hidden');
    }, 1000);
}

// Login user
function loginUser(user) {
    currentUser = user;
    isAdmin = user.role === 'ผู้ดูแลระบบ';
    
    // Save to localStorage
    localStorage.setItem('workSystemUser', JSON.stringify(user));
    
    // Initialize the app for the user
    initAppForUser();
    
    // Show app container
    showAppContainer();
    
    // Load initial data
    loadInitialData();
}

// Initialize app for user
function initAppForUser() {
    // Update user info in UI
    document.getElementById('user-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('user-avatar').textContent = currentUser.avatarText;
    
    // Update profile page
    document.getElementById('profile-firstname').value = currentUser.firstName;
    document.getElementById('profile-lastname').value = currentUser.lastName;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-position').value = currentUser.position;
    document.getElementById('profile-department').value = currentUser.department;
    document.getElementById('profile-fullname').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profile-role').textContent = currentUser.role;
    document.getElementById('profile-avatar').textContent = currentUser.avatarText;
    
    // Build menus based on user role
    buildDesktopMenu();
    buildMobileMenu();
    
    // Navigate to dashboard by default
    navigateTo('dashboard');
}

// Build desktop menu
function buildDesktopMenu() {
    const desktopMenu = document.getElementById('desktop-menu');
    desktopMenu.innerHTML = '';
    
    const menuItems = [
        { id: 'dashboard', icon: 'fas fa-home', text: 'แดชบอร์ด' },
        { id: 'checkin', icon: 'fas fa-clock', text: 'บันทึกเวลา' },
        { id: 'history', icon: 'fas fa-history', text: 'ประวัติ' },
        { id: 'profile', icon: 'fas fa-user', text: 'โปรไฟล์' }
    ];
    
    // Add admin menu item if user is admin
    if (isAdmin) {
        menuItems.splice(3, 0, { id: 'admin', icon: 'fas fa-cog', text: 'จัดการระบบ' });
    }
    
    menuItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        
        const button = document.createElement('button');
        button.className = `w-full text-left py-3 px-4 rounded-lg flex items-center transition duration-300 ${item.id === currentPage ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`;
        button.innerHTML = `
            <i class="${item.icon} mr-3"></i>
            ${item.text}
        `;
        button.addEventListener('click', () => navigateTo(item.id));
        
        li.appendChild(button);
        desktopMenu.appendChild(li);
    });
}

// Build mobile menu
function buildMobileMenu() {
    const mobileNav = document.getElementById('mobile-bottom-nav');
    mobileNav.innerHTML = '';
    
    const navItems = [
        { id: 'dashboard', icon: 'fas fa-home', text: 'แดชบอร์ด' },
        { id: 'checkin', icon: 'fas fa-clock', text: 'เวลา' },
        { id: 'history', icon: 'fas fa-history', text: 'ประวัติ' }
    ];
    
    // For admin users, add a special admin button in the middle
    if (isAdmin) {
        // First two regular items
        navItems.forEach((item, index) => {
            if (index < 2) {
                addMobileNavButton(item, mobileNav);
            }
        });
        
        // Admin button in the middle
        const adminButtonContainer = document.createElement('div');
        adminButtonContainer.className = 'relative';
        
        const adminButton = document.createElement('button');
        adminButton.className = `w-16 h-16 rounded-full flex items-center justify-center -mt-6 ${currentPage === 'admin' ? 'bg-primary text-white' : 'bg-secondary text-white'}`;
        adminButton.innerHTML = '<i class="fas fa-cog text-xl"></i>';
        adminButton.addEventListener('click', () => {
            mobileAdminPanel.classList.remove('hidden');
        });
        
        adminButtonContainer.appendChild(adminButton);
        mobileNav.appendChild(adminButtonContainer);
        
        // Last regular item
        addMobileNavButton(navItems[2], mobileNav);
        
        // Add admin panel buttons
        buildAdminPanelButtons();
    } else {
        // For regular users, show all items evenly
        navItems.forEach(item => {
            addMobileNavButton(item, mobileNav);
        });
        
        // Add profile button for regular users
        addMobileNavButton({ id: 'profile', icon: 'fas fa-user', text: 'โปรไฟล์' }, mobileNav);
    }
    
    // Add logout button for mobile
    const logoutButton = document.createElement('button');
    logoutButton.className = 'nav-btn flex flex-col items-center justify-center py-2 text-gray-600';
    logoutButton.innerHTML = `
        <i class="fas fa-sign-out-alt text-xl mb-1"></i>
        <span class="text-xs">ออกจากระบบ</span>
    `;
    logoutButton.addEventListener('click', showLogoutModal);
    
    mobileNav.children[0].appendChild(logoutButton);
}

// Helper function to add mobile nav button
function addMobileNavButton(item, container) {
    const button = document.createElement('button');
    button.className = `nav-btn flex flex-col items-center justify-center py-2 ${item.id === currentPage ? 'active' : 'text-gray-600'}`;
    button.innerHTML = `
        <i class="${item.icon} text-xl mb-1"></i>
        <span class="text-xs">${item.text}</span>
    `;
    button.addEventListener('click', () => navigateTo(item.id));
    
    const div = document.createElement('div');
    div.className = 'flex-1 flex justify-center';
    div.appendChild(button);
    
    container.appendChild(div);
}

// Build admin panel buttons for mobile
function buildAdminPanelButtons() {
    const adminPanel = document.getElementById('admin-panel-buttons');
    adminPanel.innerHTML = '';
    
    const adminButtons = [
        { id: 'admin-dashboard', icon: 'fas fa-tachometer-alt', text: 'แดชบอร์ด', color: 'bg-blue-100 text-blue-600' },
        { id: 'admin-employees', icon: 'fas fa-users', text: 'พนักงาน', color: 'bg-green-100 text-green-600' },
        { id: 'admin-reports', icon: 'fas fa-chart-bar', text: 'รายงาน', color: 'bg-purple-100 text-purple-600' },
        { id: 'admin-settings', icon: 'fas fa-cogs', text: 'ตั้งค่า', color: 'bg-yellow-100 text-yellow-600' },
        { id: 'admin-logs', icon: 'fas fa-clipboard-list', text: 'บันทึก', color: 'bg-red-100 text-red-600' },
        { id: 'admin-help', icon: 'fas fa-question-circle', text: 'ช่วยเหลือ', color: 'bg-gray-100 text-gray-600' }
    ];
    
    adminButtons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `flex flex-col items-center justify-center p-4 rounded-xl ${button.color}`;
        btn.innerHTML = `
            <i class="${button.icon} text-2xl mb-2"></i>
            <span class="text-sm font-medium">${button.text}</span>
        `;
        btn.addEventListener('click', () => {
            mobileAdminPanel.classList.add('hidden');
            navigateTo('admin');
        });
        
        adminPanel.appendChild(btn);
    });
}

// Navigation function
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    
    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.remove('hidden');
        currentPage = page;
        
        // Update page titles
        const pageTitles = {
            'dashboard': 'แดชบอร์ด',
            'checkin': 'บันทึกเวลา',
            'history': 'ประวัติการทำงาน',
            'admin': 'จัดการระบบ',
            'profile': 'โปรไฟล์'
        };
        
        pageTitle.textContent = pageTitles[page] || 'ระบบปฏิบัติงาน';
        pageTitleDesktop.textContent = pageTitles[page] || 'ระบบปฏิบัติงาน';
        
        // Update active state in menus
        updateMenuActiveState();
        
        // Load page-specific data
        switch(page) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'checkin':
                loadCheckInPage();
                break;
            case 'history':
                loadHistoryData();
                break;
            case 'admin':
                loadAdminPage();
                break;
            case 'profile':
                loadProfilePage();
                break;
        }
    }
}

// Update menu active state
function updateMenuActiveState() {
    // Update desktop menu
    document.querySelectorAll('#desktop-menu button').forEach(button => {
        const isActive = button.textContent.includes(
            currentPage === 'dashboard' ? 'แดชบอร์ด' :
            currentPage === 'checkin' ? 'บันทึกเวลา' :
            currentPage === 'history' ? 'ประวัติ' :
            currentPage === 'admin' ? 'จัดการระบบ' :
            currentPage === 'profile' ? 'โปรไฟล์' : ''
        );
        
        if (isActive) {
            button.classList.add('bg-primary', 'text-white');
            button.classList.remove('text-gray-700', 'hover:bg-gray-100');
        } else {
            button.classList.remove('bg-primary', 'text-white');
            button.classList.add('text-gray-700', 'hover:bg-gray-100');
        }
    });
    
    // Update mobile menu
    document.querySelectorAll('#mobile-bottom-nav .nav-btn').forEach(button => {
        button.classList.remove('active');
    });
    
    // Set active state for current page in mobile menu
    const activePageMap = {
        'dashboard': 'แดชบอร์ด',
        'checkin': 'เวลา',
        'history': 'ประวัติ',
        'profile': 'โปรไฟล์'
    };
    
    if (activePageMap[currentPage]) {
        const activeButtons = document.querySelectorAll('#mobile-bottom-nav .nav-btn');
        activeButtons.forEach(button => {
            if (button.textContent.includes(activePageMap[currentPage])) {
                button.classList.add('active');
            }
        });
    }
}

// Show logout modal
function showLogoutModal() {
    logoutModal.classList.remove('hidden');
}

// Handle logout
function handleLogout() {
    // Clear user data
    localStorage.removeItem('workSystemUser');
    currentUser = null;
    isAdmin = false;
    
    // Hide modal
    logoutModal.classList.add('hidden');
    
    // Show login page
    showLoginPage();
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('current-time').textContent = `${dateString} ${timeString}`;
}

// Load initial data
function loadInitialData() {
    // In a real app, this would fetch from Supabase
    // For demo, we'll use sample data
    todayRecords = getSampleTodayRecords();
    allRecords = getSampleAllRecords();
}

// Load dashboard data
function loadDashboardData() {
    // Update summary cards
    document.getElementById('total-employees').textContent = '24';
    document.getElementById('active-employees').textContent = '18';
    document.getElementById('avg-hours').textContent = '8.2';
    document.getElementById('avg-distance').textContent = '5.3';
    
    // Load weekly chart
    loadWeeklyChart();
    
    // Load recent activities
    loadRecentActivities();
    
    // Load employee status table
    loadEmployeeStatusTable();
}

// Load weekly chart
function loadWeeklyChart() {
    const chartContainer = document.getElementById('weekly-chart');
    chartContainer.innerHTML = '';
    
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const data = [18, 22, 19, 24, 20, 10, 5]; // Number of check-ins per day
    
    const maxValue = Math.max(...data);
    
    days.forEach((day, index) => {
        const barHeight = (data[index] / maxValue) * 100;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'flex flex-col items-center flex-1';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar w-3/4 bg-gradient-to-t from-primary to-blue-400 rounded-t-lg';
        bar.style.height = `${barHeight}%`;
        
        const label = document.createElement('div');
        label.className = 'mt-2 text-sm text-gray-600';
        label.textContent = day;
        
        const value = document.createElement('div');
        value.className = 'text-xs font-medium mt-1';
        value.textContent = data[index];
        
        barContainer.appendChild(bar);
        barContainer.appendChild(value);
        barContainer.appendChild(label);
        chartContainer.appendChild(barContainer);
    });
}

// Load recent activities
function loadRecentActivities() {
    const container = document.getElementById('recent-activities');
    container.innerHTML = '';
    
    const activities = [
        { user: 'สมชาย ใจดี', action: 'เช็คอิน', time: '08:30 น.', status: 'success' },
        { user: 'สมหมาย ทำงาน', action: 'เช็คเอ้าท์', time: '17:15 น.', status: 'success' },
        { user: 'สมพร ขยัน', action: 'เช็คอิน', time: '09:05 น.', status: 'warning' },
        { user: 'สมหญิง ตั้งใจ', action: 'เช็คอิน', time: '08:45 น.', status: 'success' },
        { user: 'สมศักดิ์ เก่ง', action: 'เช็คเอ้าท์', time: '16:50 น.', status: 'success' }
    ];
    
    activities.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'flex items-center p-3 bg-gray-50 rounded-lg';
        
        const icon = document.createElement('div');
        icon.className = `w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
            activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
        }`;
        icon.innerHTML = `<i class="fas fa-${activity.action === 'เช็คอิน' ? 'sign-in-alt' : 'sign-out-alt'}"></i>`;
        
        const info = document.createElement('div');
        info.className = 'flex-1';
        
        const userAction = document.createElement('div');
        userAction.className = 'font-medium';
        userAction.textContent = `${activity.user} - ${activity.action}`;
        
        const time = document.createElement('div');
        time.className = 'text-sm text-gray-500';
        time.textContent = activity.time;
        
        info.appendChild(userAction);
        info.appendChild(time);
        
        div.appendChild(icon);
        div.appendChild(info);
        container.appendChild(div);
    });
}

// Load employee status table
function loadEmployeeStatusTable() {
    const tableBody = document.getElementById('employee-status-table');
    tableBody.innerHTML = '';
    
    const employees = [
        { name: 'สมชาย ใจดี', status: 'กำลังทำงาน', location: 'สำนักงานใหญ่', time: '08:30 น.', distance: '0.5 กม.' },
        { name: 'สมหมาย ทำงาน', status: 'ออกงานแล้ว', location: 'สาขาหลัก', time: '17:15 น.', distance: '2.1 กม.' },
        { name: 'สมพร ขยัน', status: 'กำลังทำงาน', location: 'สาขาที่ 2', time: '09:05 น.', distance: '3.5 กม.' },
        { name: 'สมหญิง ตั้งใจ', status: 'กำลังทำงาน', location: 'สำนักงานใหญ่', time: '08:45 น.', distance: '1.2 กม.' },
        { name: 'สมศักดิ์ เก่ง', status: 'ออกงานแล้ว', location: 'สาขาที่ 3', time: '16:50 น.', distance: '4.8 กม.' }
    ];
    
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        const statusClass = emp.status === 'กำลังทำงาน' ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td class="py-3 px-4">${emp.name}</td>
            <td class="py-3 px-4">
                <span class="status-indicator ${statusClass}"></span>
                ${emp.status}
            </td>
            <td class="py-3 px-4">${emp.location}</td>
            <td class="py-3 px-4">${emp.time}</td>
            <td class="py-3 px-4">${emp.distance}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load check-in page
function loadCheckInPage() {
    // Get user's current location
    getUserLocation();
    
    // Load today's timeline
    loadTodayTimeline();
    
    // Update current status
    updateCurrentStatus();
}

// Get user's current location
function getUserLocation() {
    const locationInfo = document.getElementById('location-info');
    const distanceInfo = document.getElementById('distance-info');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Office location (example: Bangkok)
                const officeLocation = { lat: 13.7563, lng: 100.5018 };
                const distance = calculateDistance(
                    userPosition.lat, userPosition.lng,
                    officeLocation.lat, officeLocation.lng
                );
                
                locationInfo.textContent = `ตำแหน่งปัจจุบัน: ${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}`;
                distanceInfo.textContent = `ระยะห่างจากที่ทำงาน: ${distance.toFixed(2)} กม.`;
            },
            (error) => {
                console.error('Error getting location:', error);
                locationInfo.textContent = 'ไม่สามารถดึงข้อมูลตำแหน่งได้';
                distanceInfo.textContent = 'ระยะห่างจากที่ทำงาน: ไม่สามารถคำนวณได้';
                
                // Use sample location for demo
                userPosition = { lat: 13.7500, lng: 100.5000 };
                const officeLocation = { lat: 13.7563, lng: 100.5018 };
                const distance = calculateDistance(
                    userPosition.lat, userPosition.lng,
                    officeLocation.lat, officeLocation.lng
                );
                
                locationInfo.textContent = `ตำแหน่งตัวอย่าง: ${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}`;
                distanceInfo.textContent = `ระยะห่างจากที่ทำงาน: ${distance.toFixed(2)} กม.`;
            }
        );
    } else {
        locationInfo.textContent = 'เบราว์เซอร์ไม่รองรับการดึงข้อมูลตำแหน่ง';
    }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Load today's timeline
function loadTodayTimeline() {
    const container = document.getElementById('today-timeline');
    container.innerHTML = '';
    
    if (todayRecords.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>ยังไม่มีประวัติการทำงานวันนี้</p>
            </div>
        `;
        return;
    }
    
    todayRecords.forEach(record => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const time = document.createElement('div');
        time.className = 'font-medium text-gray-800';
        time.textContent = record.time;
        
        const action = document.createElement('div');
        action.className = 'text-gray-600';
        action.textContent = record.type === 'checkin' ? 'เช็คอินเข้างาน' : 'เช็คเอ้าออกงาน';
        
        const location = document.createElement('div');
        location.className = 'text-sm text-gray-500 mt-1';
        location.textContent = `ตำแหน่ง: ${record.location}`;
        
        const distance = document.createElement('div');
        distance.className = 'text-sm text-gray-500';
        distance.textContent = `ระยะทาง: ${record.distance} กม.`;
        
        item.appendChild(time);
        item.appendChild(action);
        item.appendChild(location);
        item.appendChild(distance);
        
        container.appendChild(item);
    });
}

// Update current status
function updateCurrentStatus() {
    const statusText = document.getElementById('current-status-text');
    const statusTime = document.getElementById('current-status-time');
    
    // Check if user has checked in today
    const todayCheckins = todayRecords.filter(r => r.type === 'checkin');
    const todayCheckouts = todayRecords.filter(r => r.type === 'checkout');
    
    if (todayCheckins.length === 0) {
        statusText.textContent = 'ยังไม่ได้เช็คอิน';
        statusText.className = 'text-2xl font-bold mb-2 text-gray-500';
        statusTime.textContent = 'กรุณาเช็คอินเพื่อเริ่มงาน';
        
        // Enable checkin button, disable checkout
        document.getElementById('checkin-btn').disabled = false;
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkout-btn').classList.add('opacity-50', 'cursor-not-allowed');
    } else if (todayCheckouts.length === 0) {
        statusText.textContent = 'กำลังทำงาน';
        statusText.className = 'text-2xl font-bold mb-2 text-success';
        statusTime.textContent = `เช็คอินแล้วเวลา ${todayCheckins[todayCheckins.length - 1].time}`;
        
        // Disable checkin button, enable checkout
        document.getElementById('checkin-btn').disabled = true;
        document.getElementById('checkout-btn').disabled = false;
        document.getElementById('checkin-btn').classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('checkout-btn').classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        statusText.textContent = 'ออกงานแล้ว';
        statusText.className = 'text-2xl font-bold mb-2 text-danger';
        statusTime.textContent = `เช็คเอ้าท์แล้วเวลา ${todayCheckouts[todayCheckouts.length - 1].time}`;
        
        // Disable both buttons
        document.getElementById('checkin-btn').disabled = true;
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkin-btn').classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('checkout-btn').classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Handle check-in
function handleCheckIn() {
    showLoader('กำลังบันทึกการเช็คอิน...');
    
    // Simulate API call
    setTimeout(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        // Office location
        const officeLocation = { lat: 13.7563, lng: 100.5018 };
        const distance = userPosition ? 
            calculateDistance(userPosition.lat, userPosition.lng, officeLocation.lat, officeLocation.lng) : 
            (Math.random() * 5).toFixed(2);
        
        // Add to today's records
        todayRecords.push({
            id: `checkin-${Date.now()}`,
            type: 'checkin',
            time: timeString,
            location: userPosition ? `${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}` : '13.7500, 100.5000',
            distance: distance.toFixed(2)
        });
        
        // Update UI
        loadTodayTimeline();
        updateCurrentStatus();
        
        hideLoader();
        
        // Show success message
        alert('เช็คอินสำเร็จ!');
    }, 1500);
}

// Handle check-out
function handleCheckOut() {
    showLoader('กำลังบันทึกการเช็คเอ้าท์...');
    
    // Simulate API call
    setTimeout(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        // Office location
        const officeLocation = { lat: 13.7563, lng: 100.5018 };
        const distance = userPosition ? 
            calculateDistance(userPosition.lat, userPosition.lng, officeLocation.lat, officeLocation.lng) : 
            (Math.random() * 5).toFixed(2);
        
        // Add to today's records
        todayRecords.push({
            id: `checkout-${Date.now()}`,
            type: 'checkout',
            time: timeString,
            location: userPosition ? `${userPosition.lat.toFixed(4)}, ${userPosition.lng.toFixed(4)}` : '13.7500, 100.5000',
            distance: distance.toFixed(2)
        });
        
        // Update UI
        loadTodayTimeline();
        updateCurrentStatus();
        
        hideLoader();
        
        // Show success message
        alert('เช็คเอ้าท์สำเร็จ! ขอบคุณสำหรับการทำงานวันนี้');
    }, 1500);
}

// Load history data
function loadHistoryData() {
    showLoader('กำลังโหลดประวัติ...');
    
    const period = document.getElementById('history-filter-period').value;
    const type = document.getElementById('history-filter-type').value;
    
    // Simulate API call
    setTimeout(() => {
        // Filter records based on selection
        let filteredRecords = [...allRecords];
        
        // Filter by type
        if (type !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.type === type);
        }
        
        // Filter by period (in a real app, this would filter by date)
        // For demo, we'll just use all records
        
        // Update history table
        updateHistoryTable(filteredRecords);
        
        hideLoader();
    }, 1000);
}

// Update history table
function updateHistoryTable(records) {
    const tableBody = document.getElementById('history-table');
    tableBody.innerHTML = '';
    
    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-400">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>ไม่มีข้อมูลประวัติ</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Show only latest 20 records for performance
    const displayRecords = records.slice(0, 20);
    
    displayRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        const typeIcon = record.type === 'checkin' ? 
            '<i class="fas fa-sign-in-alt text-success mr-1"></i>' : 
            '<i class="fas fa-sign-out-alt text-danger mr-1"></i>';
        
        const typeText = record.type === 'checkin' ? 'เช็คอิน' : 'เช็คเอ้าท์';
        
        row.innerHTML = `
            <td class="py-3 px-4">${record.date}</td>
            <td class="py-3 px-4">${record.time}</td>
            <td class="py-3 px-4">
                ${typeIcon}
                ${typeText}
            </td>
            <td class="py-3 px-4">${record.location}</td>
            <td class="py-3 px-4">${record.distance} กม.</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load admin page
function loadAdminPage() {
    // Update admin employee table
    updateAdminEmployeeTable();
}

// Update admin employee table
function updateAdminEmployeeTable() {
    const tableBody = document.getElementById('admin-employee-table');
    tableBody.innerHTML = '';
    
    const employees = [
        { name: 'สมชาย ใจดี', email: 'somchai@company.com', position: 'ผู้จัดการ', status: 'กำลังทำงาน' },
        { name: 'สมหมาย ทำงาน', email: 'sommai@company.com', position: 'พนักงานขาย', status: 'ออกงานแล้ว' },
        { name: 'สมพร ขยัน', email: 'somporn@company.com', position: 'พนักงานขาย', status: 'กำลังทำงาน' },
        { name: 'สมหญิง ตั้งใจ', email: 'somying@company.com', position: 'พนักงานการเงิน', status: 'กำลังทำงาน' },
        { name: 'สมศักดิ์ เก่ง', email: 'somsak@company.com', position: 'พนักงานไอที', status: 'ออกงานแล้ว' },
        { name: 'สมรักษ์ ดี', email: 'somrak@company.com', position: 'พนักงานขาย', status: 'ลางาน' }
    ];
    
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-100 hover:bg-gray-50';
        
        const statusClass = 
            emp.status === 'กำลังทำงาน' ? 'bg-green-100 text-green-800' :
            emp.status === 'ออกงานแล้ว' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800';
        
        row.innerHTML = `
            <td class="py-3 px-4">${emp.name}</td>
            <td class="py-3 px-4">${emp.email}</td>
            <td class="py-3 px-4">${emp.position}</td>
            <td class="py-3 px-4">
                <span class="py-1 px-3 rounded-full text-xs font-medium ${statusClass}">
                    ${emp.status}
                </span>
            </td>
            <td class="py-3 px-4">
                <button class="py-1 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="py-1 px-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Load profile page
function loadProfilePage() {
    // Calculate and update profile stats
    const totalHours = 167.5;
    const totalDistance = 245.3;
    const totalDays = 21;
    const workingDays = 19;
    
    document.getElementById('personal-avg-hours').textContent = `${(totalHours / totalDays).toFixed(1)} ชม.`;
    document.getElementById('personal-avg-distance').textContent = `${(totalDistance / totalDays).toFixed(1)} กม.`;
    document.getElementById('attendance-rate').textContent = `${Math.round((workingDays / totalDays) * 100)}%`;
    
    // Set last checkin time
    if (todayRecords.length > 0) {
        const lastCheckin = todayRecords.find(r => r.type === 'checkin');
        if (lastCheckin) {
            document.getElementById('last-checkin').textContent = lastCheckin.time;
        }
    }
}

// Handle profile update
function handleProfileUpdate(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('profile-firstname').value;
    const lastName = document.getElementById('profile-lastname').value;
    const position = document.getElementById('profile-position').value;
    const department = document.getElementById('profile-department').value;
    
    // Show loading state
    document.getElementById('profile-save-text').classList.add('hidden');
    document.getElementById('profile-save-loading').classList.remove('hidden');
    
    // Simulate API call
    setTimeout(() => {
        // Update current user
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        currentUser.position = position;
        currentUser.department = department;
        currentUser.avatarText = firstName.charAt(0);
        
        // Update localStorage
        localStorage.setItem('workSystemUser', JSON.stringify(currentUser));
        
        // Update UI
        document.getElementById('user-name').textContent = `${firstName} ${lastName}`;
        document.getElementById('user-avatar').textContent = firstName.charAt(0);
        document.getElementById('profile-fullname').textContent = `${firstName} ${lastName}`;
        document.getElementById('profile-avatar').textContent = firstName.charAt(0);
        
        // Hide loading state
        document.getElementById('profile-save-text').classList.remove('hidden');
        document.getElementById('profile-save-loading').classList.add('hidden');
        
        // Show success message
        alert('บันทึกข้อมูลโปรไฟล์สำเร็จ!');
    }, 1500);
}

// Handle window resize
function handleResize() {
    // Update UI based on screen size if needed
    if (window.innerWidth >= 1024) {
        // Desktop view
        if (mobileAdminPanel) {
            mobileAdminPanel.classList.add('hidden');
        }
    }
}

// Show loader
function showLoader(message = 'กำลังประมวลผล...') {
    loaderMessage.textContent = message;
    globalLoader.classList.remove('hidden');
}

// Hide loader
function hideLoader() {
    globalLoader.classList.add('hidden');
}

// Initialize sample data
function initSampleData() {
    // This function would initialize Supabase tables in a real app
    console.log('Initializing sample data...');
}

// Get sample today records
function getSampleTodayRecords() {
    const now = new Date();
    const isAfternoon = now.getHours() >= 12;
    
    if (isAfternoon) {
        return [
            { id: '1', type: 'checkin', time: '08:30 น.', location: '13.7501, 100.5001', distance: '0.8' },
            { id: '2', type: 'checkout', time: '12:00 น.', location: '13.7502, 100.5002', distance: '0.9' },
            { id: '3', type: 'checkin', time: '13:00 น.', location: '13.7503, 100.5003', distance: '1.2' }
        ];
    } else {
        return [
            { id: '1', type: 'checkin', time: '08:45 น.', location: '13.7500, 100.5000', distance: '1.5' }
        ];
    }
}

// Get sample all records
function getSampleAllRecords() {
    const records = [];
    const types = ['checkin', 'checkout'];
    const locations = [
        '13.7500, 100.5000',
        '13.7510, 100.5010',
        '13.7520, 100.5020',
        '13.7490, 100.4990'
    ];
    
    // Generate records for the past 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dateString = date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Add 1-2 records per day
        const numRecords = Math.floor(Math.random() * 2) + 1;
        
        for (let j = 0; j < numRecords; j++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const time = `${Math.floor(Math.random() * 3) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} น.`;
            const location = locations[Math.floor(Math.random() * locations.length)];
            const distance = (Math.random() * 5).toFixed(2);
            
            records.push({
                id: `record-${i}-${j}`,
                date: dateString,
                time: time,
                type: type,
                location: location,
                distance: distance
            });
        }
    }
    
    return records;
}

// Handle image error
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        const template = document.getElementById('image-error-template');
        const clone = template.content.cloneNode(true);
        
        // Replace the broken image with the error template
        e.target.parentNode.replaceChild(clone, e.target);
    }
}, true);
