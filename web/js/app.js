const Auth = {
    showLogin() {
        document.querySelector('.app-layout').style.display = 'none';
        document.getElementById('modalOverlay').classList.remove('open');

        let loginScreen = document.getElementById('loginScreen');
        if (!loginScreen) {
            loginScreen = document.createElement('div');
            loginScreen.id = 'loginScreen';
            loginScreen.innerHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <div class="login-header">
                            <span class="material-icons" style="font-size:48px;color:var(--primary);">print</span>
                            <h1>PrinterMaint</h1>
                            <p>Control System</p>
                        </div>
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginUser">Username</label>
                                <input type="text" id="loginUser" class="form-control" placeholder="Enter username" required autofocus>
                            </div>
                            <div class="form-group">
                                <label for="loginPass">Password</label>
                                <input type="password" id="loginPass" class="form-control" placeholder="Enter password" required>
                            </div>
                            <div id="loginError" class="login-error" style="display:none;"></div>
                            <button type="submit" class="btn btn-primary login-btn" id="loginBtn">
                                Sign In
                            </button>
                        </form>
                        <div class="login-footer">
                            <span>TCL Moka Manufacturing</span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loginScreen);

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await Auth.handleLogin();
            });
        }
        loginScreen.style.display = 'flex';
        const userInput = document.getElementById('loginUser');
        if (userInput) userInput.focus();
    },

    async handleLogin() {
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;
        const errorDiv = document.getElementById('loginError');
        const btn = document.getElementById('loginBtn');

        if (!username || !password) {
            errorDiv.textContent = 'Please enter username and password';
            errorDiv.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Signing in...';
        errorDiv.style.display = 'none';

        try {
            const res = await API.login(username, password);
            API.setToken(res.token);
            API.setUser(res.user);
            Auth.enterApp();
        } catch (e) {
            errorDiv.textContent = e.message === 'Invalid credentials'
                ? 'Invalid username or password'
                : 'Connection error. Try again.';
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    },

    enterApp() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) loginScreen.style.display = 'none';
        document.querySelector('.app-layout').style.display = '';

        const user = API.getUser();
        if (user) {
            const userArea = document.querySelector('.topbar-right');
            userArea.innerHTML = `
                <span class="user-name">${user.full_name || user.username}</span>
                <span class="material-icons" style="cursor:pointer;" id="logoutBtn" title="Logout">logout</span>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => Auth.handleLogout());
        }

        App.init();
    },

    async handleLogout() {
        try { await API.logout(); } catch(e) { /* ignore */ }
        API.clearToken();
        location.reload();
    },

    async validateSession() {
        if (!API.isAuthenticated()) {
            Auth.showLogin();
            return;
        }
        try {
            const user = await API.getMe();
            API.setUser(user);
            Auth.enterApp();
        } catch (e) {
            API.clearToken();
            Auth.showLogin();
        }
    }
};

const App = {
    currentPage: null,

    pages: {
        dashboard: DashboardPage,
        printers: PrintersPage,
        maintenance: MaintenancePage,
        schedules: SchedulesPage,
        stock: StockPage,
        locations: LocationsPage,
        categories: CategoriesPage
    },

    init() {
        this.bindNav();
        this.bindModal();
        this.bindMenuToggle();
        window.addEventListener('hashchange', () => this.route());
        this.route();
    },

    route() {
        const hash = location.hash.slice(1) || 'dashboard';
        this.navigate(hash);
    },

    navigate(page) {
        const handler = this.pages[page];
        if (!handler) return;

        this.currentPage = page;

        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.page === page);
        });

        const titles = {
            dashboard: 'Dashboard',
            printers: 'Printers',
            maintenance: 'Maintenance History',
            schedules: 'Maintenance Schedules',
            stock: 'Supply Stock',
            locations: 'Locations',
            categories: 'Categories'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        handler.render();

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    },

    bindNav() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                location.hash = page;
            });
        });
    },

    bindModal() {
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    },

    bindMenuToggle() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    },

    openModal(title, bodyHtml, footerHtml = '') {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHtml;
        document.getElementById('modalFooter').innerHTML = footerHtml;
        const overlay = document.getElementById('modalOverlay');
        overlay.style.display = '';
        overlay.classList.add('open');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('open');
    },

    toast(message, type = 'success') {
        const t = document.createElement('div');
        t.className = 'toast toast-' + type;
        t.textContent = message;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    loading() {
        return '<div class="loading"><div class="spinner"></div><span>Loading...</span></div>';
    },

    empty(icon, text) {
        return '<div class="empty-state"><span class="material-icons">' + icon + '</span><p>' + text + '</p></div>';
    },

    statusBadge(status) {
        const map = {
            'Active': 'active', 'In Repair': 'repair', 'Inactive': 'inactive', 'Retired': 'retired',
            'Preventive': 'preventive', 'Corrective': 'corrective',
            'Completed': 'completed', 'Pending': 'pending', 'In Progress': 'pending'
        };
        return '<span class="badge badge-' + (map[status] || 'active') + '">' + status + '</span>';
    },

    daysClass(days) {
        if (days < 0) return 'days-overdue';
        if (days <= 7) return 'days-warn';
        return 'days-ok';
    }
};

// Entry point: validate session first, don't go straight to app
document.addEventListener('DOMContentLoaded', () => Auth.validateSession());

