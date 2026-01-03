import { supabase } from '../db/database.js';

export class Login {
    constructor(container, onLoginSuccess) {
        this.container = container;
        this.onLoginSuccess = onLoginSuccess;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="flex items-center justify-center min-h-[80vh]">
                <div class="card max-w-sm w-full p-8 border border-slate-700 bg-slate-800 rounded shadow-xl">
                    <h2 class="text-2xl font-bold mb-6 text-center text-blue-400">SmartRent Pro</h2>
                    <form id="login-form" class="flex flex-col gap-4">
                        <div>
                            <label class="text-sm text-gray-400">Email</label>
                            <input type="email" name="email" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white focus:border-blue-500 outline-none" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label class="text-sm text-gray-400">Password</label>
                            <input type="password" name="password" required class="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white focus:border-blue-500 outline-none" placeholder="••••••••" />
                        </div>
                        <button type="submit" class="btn btn-primary w-full mt-2 py-2 font-semibold">Log In</button>
                    </form>
                    <div class="mt-6 pt-4 border-t border-slate-700 text-center">
                        <p class="text-xs text-gray-500 mb-2">First time here?</p>
                        <button id="btn-signup" class="text-sm text-blue-400 hover:text-blue-300 hover:underline">Create an Account</button>
                    </div>
                </div>
            </div>
        `;

        const form = this.container.querySelector('#login-form');
        form.addEventListener('submit', (e) => this.handleLogin(e));

        this.container.querySelector('#btn-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSignup(form);
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const btn = e.target.querySelector('button[type="submit"]');

        try {
            btn.textContent = 'Logging in...';
            btn.disabled = true;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // Success handled by state change listener in main.js, 
            // but we can also trigger callback directly for faster feedback if needed.
            // Check if onLoginSuccess is passed
            if (this.onLoginSuccess) this.onLoginSuccess(data.user);

        } catch (err) {
            alert('Login Failed: ' + err.message);
            btn.textContent = 'Log In';
            btn.disabled = false;
        }
    }

    async handleSignup(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            alert('Please enter both email and password to sign up.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;

            alert('Account created! You can now log in.');
            // Some supabase instances require email confirmation.
            // If session is returned immediately:
            if (data.session && this.onLoginSuccess) {
                this.onLoginSuccess(data.user);
            }
        } catch (err) {
            alert('Sign Up Failed: ' + err.message);
        }
    }
}
