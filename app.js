// Employee Work System - Supabase Real Connection
const SUPABASE_URL = 'https://bibygpupfqmbbwecqgdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYnlncHVwZnFtYmJ3ZWNxZ2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTQ4NDQsImV4cCI6MjA4NTgzMDg0NH0.AL-c_UbvMzsy1DIZFuABStYNeXK2A-r_0uWg26-ET2A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentUser = null;
let currentPage = 'dashboard';
let isAdmin = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initEventListeners();
    await checkExistingSession();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

async function checkExistingSession() {
    const savedUser = localStorage.getItem('workSystemUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            loginUser(currentUser);
        } catch (e) {
            showLoginPage();
        }
    } else {
        showLoginPage();
    }
}

// --- 1. ระบบ Login จริง ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; // ในระบบจริงควรใช้ Supabase Auth หรือตรวจสอบ Hash
    
    toggleLoginLoading(true);

    try {
        // ดึงข้อมูลจากตาราง users ที่คุณสร้างไว้
        const { data, error } = await supabaseClient
            .from('users')
            .select('*, departments(name)')
            .eq('email', email)
            .single();

        if (error || !data) throw new Error('ไม่พบชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');

        // หมายเหตุ: โค้ดนี้เป็นการเช็คแบบง่าย สำหรับระบบจริงควรใช้ supabase.auth.signInWithPassword
        loginUser(data);
    } catch (error) {
        alert(error.message);
    } finally {
        toggleLoginLoading(false);
    }
}

function loginUser(user) {
    currentUser = user;
    isAdmin = user.role === 'admin';
    localStorage.setItem('workSystemUser', JSON.stringify(user));
    
    document.getElementById('user-name').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('user-role').textContent = user.position;
    document.getElementById('user-avatar').textContent = user.avatar_text;

    showAppContainer();
    buildDesktopMenu();
    buildMobileMenu();
    navigateTo('dashboard');
}

// --- 2. ระบบบันทึกเวลาจริง (Check-in / Check-out) ---
async function handleCheckIn() {
    if (!userPosition) return alert('กรุณารอระบบดึงพิกัด GPS ก่อนครับ');
    
    showLoader('กำลังบันทึกเวลาเข้างาน...');

    try {
        // 1. บันทึกลงตาราง work_records
        const { data: record, error: recError } = await supabaseClient
            .from('work_records')
            .insert([{
                user_id: currentUser.id,
                record_type: 'checkin',
                location_lat: userPosition.lat,
                location_lng: userPosition.lng,
                distance: 0.0 // สามารถคำนวณเปรียบเทียบกับ office ใน SQL หรือ JS ได้
            }])
            .select()
            .single();

        if (recError) throw recError;

        // 2. อัปเดตสถานะในตาราง employee_status
        const { error: stsError } = await supabaseClient
            .from('employee_status')
            .upsert({
                user_id: currentUser.id,
                is_working: true,
                last_checkin_id: record.id,
                current_location_lat: userPosition.lat,
                current_location_lng: userPosition.lng
            });

        if (stsError) throw stsError;

        alert('เช็คอินเรียบร้อยแล้ว!');
        loadCheckInPage(); // รีโหลดข้อมูลในหน้า
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
        hideLoader();
    }
}

async function handleCheckOut() {
    showLoader('กำลังบันทึกเวลาออกงาน...');
    try {
        const { data: record, error: recError } = await supabaseClient
            .from('work_records')
            .insert([{
                user_id: currentUser.id,
                record_type: 'checkout',
                location_lat: userPosition?.lat,
                location_lng: userPosition?.lng
            }])
            .select()
            .single();

        await supabaseClient
            .from('employee_status')
            .update({ is_working: false, last_checkout_id: record.id })
            .eq('user_id', currentUser.id);

        alert('เช็คเอ้าท์เรียบร้อย! พักผ่อนให้เต็มที่ครับ');
        loadCheckInPage();
    } catch (err) {
        alert(err.message);
    } finally {
        hideLoader();
    }
}

// --- 3. ดึงข้อมูล Dashboard จาก View จริง ---
async function loadDashboardData() {
    // ดึงข้อมูลจาก View ที่คุณสร้างไว้: dashboard_stats
    const { data: stats, error } = await supabaseClient
        .from('dashboard_stats')
        .select('*')
        .single();

    if (!error && stats) {
        document.getElementById('total-employees').textContent = stats.total_employees;
        document.getElementById('active-employees').textContent = stats.active_employees;
        document.getElementById('avg-hours').textContent = stats.avg_work_hours_today?.toFixed(1) || 0;
    }

    // ดึงกิจกรรมล่าสุดจาก work_records
    const { data: activities } = await supabaseClient
        .from('work_records')
        .select('*, users(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    renderRecentActivities(activities);
}

// --- 4. ดึงประวัติย้อนหลังจริง ---
async function loadHistoryData() {
    showLoader('กำลังดึงข้อมูลประวัติ...');
    const { data, error } = await supabaseClient
        .from('work_records')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (!error) {
        renderHistoryTable(data);
    }
    hideLoader();
}

// (Helper Functions สำหรับจัดการ UI ต่างๆ...)
function showAppContainer() {
    document.getElementById('app-loader').classList.add('hidden');
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
}

function showLoginPage() {
    document.getElementById('app-loader').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
}
