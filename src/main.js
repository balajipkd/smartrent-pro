import { initDB, seedDatabase, supabase } from './db/database.js';
import { MaintenanceForm } from './components/MaintenanceForm.js';
import { Dashboard } from './components/Dashboard.js';
import { PaymentForm } from './components/PaymentForm.js';
import { ManageData } from './components/ManageData.js';
import { Login } from './components/Login.js';
import { Navbar } from './components/Navbar.js';

const app = document.querySelector('#app');

async function init() {
    try {
        await initDB();

        // Check Session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            renderApp(session.user);
        } else {
            renderLogin();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                renderApp(session.user);
            } else if (event === 'SIGNED_OUT') {
                renderLogin();
            }
        });

    } catch (err) {
        console.error('Initialization failed:', err);
        app.innerHTML = `<div class="card" style="color: #ef4444; margin: 2rem;">Error loading application: ${err.message}</div>`;
    }
}

function renderLogin() {
    app.innerHTML = '';
    new Login(app, (user) => { });
}

let isAppRendered = false;
let currentActiveView = null;

function renderApp(user) {
    if (isAppRendered) return;
    isAppRendered = true;

    // Create layout structure
    app.innerHTML = `
        <div id="navbar-container"></div>
        <div id="content" class="max-w-7xl mx-auto px-4 py-6"></div>
    `;

    const navbarContainer = document.getElementById('navbar-container');
    const contentDiv = document.getElementById('content');

    // Initialize Navbar
    const lastView = localStorage.getItem('smartRent_activeView') || 'dashboard';

    const navbar = new Navbar(navbarContainer, {
        activeView: lastView,
        userEmail: user.email,
        onViewChange: (view) => {
            handleViewChange(view, contentDiv, navbar);
        },
        onSignOut: async () => {
            await supabase.auth.signOut();
        }
    });

    // Render initial view
    handleViewChange(lastView, contentDiv, navbar);
}

function handleViewChange(view, contentDiv, navbar) {
    if (view === currentActiveView) return;
    currentActiveView = view;

    localStorage.setItem('smartRent_activeView', view);
    switch (view) {
        case 'dashboard':
            new Dashboard(contentDiv);
            break;
        case 'manage-data':
            new ManageData(contentDiv);
            break;
        case 'payment-entry':
            new PaymentForm(contentDiv);
            break;
        case 'maintenance':
            new MaintenanceForm(contentDiv);
            break;
    }
}

init();
