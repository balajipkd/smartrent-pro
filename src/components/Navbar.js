export class Navbar {
    constructor(container, options = {}) {
        this.container = container;
        this.activeView = options.activeView || 'dashboard';
        this.onViewChange = options.onViewChange || (() => { });
        this.userEmail = options.userEmail || '';
        this.onSignOut = options.onSignOut || (() => { });
        this.mobileMenuOpen = false;

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <nav class="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-lg md:text-xl tracking-tight font-semibold text-gray-900">SmartRent Pro</h1>
                    
                    <!-- Mobile menu button -->
                    <button id="mobile-menu-btn" class="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>

                    <!-- Desktop navigation -->
                    <div class="hidden md:flex items-center gap-4 lg:gap-8">
                        <div class="flex items-center gap-2">
                            <button data-view="dashboard" class="nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm">
                                Dashboard
                            </button>
                            <button data-view="manage-data" class="nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm">
                                Manage Data
                            </button>
                            <button data-view="payment-entry" class="nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm">
                                Payment Entry
                            </button>
                            <button data-view="maintenance" class="nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm">
                                Maintenance
                            </button>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="hidden lg:flex items-center gap-2 text-gray-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <span class="text-sm">${this.userEmail}</span>
                            </div>
                            <button id="sign-out-btn" class="px-3 lg:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                </svg>
                                <span class="hidden lg:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mobile menu -->
                <div id="mobile-menu" class="md:hidden mt-4 space-y-2 pb-4 hidden">
                    <button data-view="dashboard" class="mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left">
                        Dashboard
                    </button>
                    <button data-view="manage-data" class="mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left">
                        Manage Data
                    </button>
                    <button data-view="payment-entry" class="mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left">
                        Payment Entry
                    </button>
                    <button data-view="maintenance" class="mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left">
                        Maintenance Entry
                    </button>
                    <div class="pt-4 border-t border-gray-200 space-y-2">
                        <div class="flex items-center gap-2 text-gray-600 px-4">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            <span class="text-sm">${this.userEmail}</span>
                        </div>
                        <button id="mobile-sign-out-btn" class="w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>
        `;

        this.attachEventListeners();
        this.updateActiveState();
    }

    attachEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = this.container.querySelector('#mobile-menu-btn');
        const mobileMenu = this.container.querySelector('#mobile-menu');

        mobileMenuBtn?.addEventListener('click', () => {
            this.mobileMenuOpen = !this.mobileMenuOpen;
            mobileMenu?.classList.toggle('hidden');
        });

        // Desktop navigation
        this.container.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.setActiveView(view);
                this.onViewChange(view);
            });
        });

        // Mobile navigation
        this.container.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.setActiveView(view);
                this.onViewChange(view);
                // Close mobile menu
                this.mobileMenuOpen = false;
                mobileMenu?.classList.add('hidden');
            });
        });

        // Sign out buttons
        this.container.querySelector('#sign-out-btn')?.addEventListener('click', () => {
            this.onSignOut();
        });

        this.container.querySelector('#mobile-sign-out-btn')?.addEventListener('click', () => {
            this.onSignOut();
        });
    }

    setActiveView(view) {
        this.activeView = view;
        this.updateActiveState();
    }

    updateActiveState() {
        // Update desktop buttons
        this.container.querySelectorAll('.nav-btn').forEach(btn => {
            const view = btn.getAttribute('data-view');
            if (view === this.activeView) {
                btn.className = 'nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm bg-blue-600 text-white';
            } else {
                btn.className = 'nav-btn px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm text-gray-700 hover:bg-gray-100';
            }
        });

        // Update mobile buttons
        this.container.querySelectorAll('.mobile-nav-btn').forEach(btn => {
            const view = btn.getAttribute('data-view');
            if (view === this.activeView) {
                btn.className = 'mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left bg-blue-600 text-white';
            } else {
                btn.className = 'mobile-nav-btn w-full px-4 py-2.5 rounded-lg transition-colors text-left text-gray-700 hover:bg-gray-100';
            }
        });
    }
}
