import { initDB, seedDatabase, supabase } from './db/database.js';
import { MaintenanceForm } from './components/MaintenanceForm.js';
import { Dashboard } from './components/Dashboard.js';
import { PaymentForm } from './components/PaymentForm.js';
import { ManageData } from './components/ManageData.js';
import { Login } from './components/Login.js';

const app = document.querySelector('#app');

async function init() {
    try {
        await initDB();
        // seedDatabase can be run here if we want to ensure basic data exists,
        // but typically seed is dev-only or needs auth. 

        // Check Session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            renderApp(session.user);
        } else {
            renderLogin();
        }

        // Listen for auth changes (e.g. sign out, or token refresh)
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                renderApp(session.user);
            } else if (event === 'SIGNED_OUT') {
                renderLogin();
            }
        });

    } catch (err) {
        console.error('Initialization failed:', err);
        app.innerHTML = `<div class="card" style="color: var(--danger)">Error loading application: ${err.message}</div>`;
    }
}

function renderLogin() {
    app.innerHTML = ''; // basic clear
    new Login(app, (user) => {
        // Callback not strictly needed if we use onAuthStateChange, but nice for immediate feedback
    });
}

function renderApp(user) {
    // Basic Layout
    app.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-xl font-bold text-blue-400">SmartRent Pro</h1>
            <div class="flex gap-4 items-center">
                <span class="text-xs text-gray-500 hidden md:inline">Logged in as ${user.email}</span>
                <nav class="flex gap-2">
                     <button id="nav-dashboard" class="btn">Dashboard</button>
                    <button id="nav-data" class="btn">Manage Data</button>
                    <button id="nav-payment" class="btn">Payment Entry</button>
                    <button id="nav-maintenance" class="btn">Maintenance Entry</button>
                    <button id="nav-logout" class="btn bg-red-900/50 hover:bg-red-800 text-red-200 border-red-800">Sign Out</button>
                </nav>
            </div>
        </div>
        <div id="content"></div>
    `;

    const contentDiv = document.getElementById('content');

    // Logout Handler
    document.getElementById('nav-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
    });

    // Default to Dashboard
    new Dashboard(contentDiv);
    updateNavState('nav-dashboard');

    // Nav Handlers
    document.getElementById('nav-maintenance').addEventListener('click', () => {
        new MaintenanceForm(contentDiv);
        updateNavState('nav-maintenance');
    });

    document.getElementById('nav-payment').addEventListener('click', () => {
        new PaymentForm(contentDiv);
        updateNavState('nav-payment');
    });

    document.getElementById('nav-data').addEventListener('click', () => {
        new ManageData(contentDiv);
        updateNavState('nav-data');
    });

    document.getElementById('nav-dashboard').addEventListener('click', () => {
        new Dashboard(contentDiv);
        updateNavState('nav-dashboard');
    });
}

function updateNavState(activeId) {
    document.querySelectorAll('nav .btn').forEach(btn => {
        if (btn.id === 'nav-logout') return; // Skip logout button styling

        if (btn.id === activeId) {
            btn.classList.add('btn-primary');
            btn.classList.remove('bg-slate-700');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('bg-slate-700');
        }
    });
}

init();
