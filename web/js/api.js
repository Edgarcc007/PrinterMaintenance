const API = {
    base: 'http://10.138.96.13:8000/api',

    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(token) {
        localStorage.setItem('auth_token', token);
    },

    clearToken() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },

    getUser() {
        try { return JSON.parse(localStorage.getItem('auth_user')); }
        catch { return null; }
    },

    setUser(user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    async request(endpoint, options = {}) {
        const url = `${this.base}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = { headers, ...options };
        try {
            const res = await fetch(url, config);
            if (res.status === 401) {
                this.clearToken();
                Auth.showLogin();
                throw new Error('Session expired');
            }
            if (res.status === 204) return true;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Error ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            console.error(`API Error: ${endpoint}`, e);
            throw e;
        }
    },

    get(endpoint) { return this.request(endpoint); },
    post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); },
    put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

    // Auth
    login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    logout() { return this.post('/auth/logout', {}); },
    getMe() { return this.get('/auth/me'); },

    // Dashboard
    getStats() { return this.get('/dashboard/stats'); },
    getOverdueDashboard() { return this.get('/dashboard/overdue'); },

    // Printers
    getPrinters(params = '') { return this.get(`/printers/${params}`); },
    getPrinter(id) { return this.get(`/printers/${id}`); },
    createPrinter(data) { return this.post('/printers/', data); },
    updatePrinter(id, data) { return this.put(`/printers/${id}`, data); },
    deletePrinter(id) { return this.delete(`/printers/${id}`); },

    // Locations
    getLocations() { return this.get('/locations/'); },
    createLocation(data) { return this.post('/locations/', data); },
    updateLocation(id, data) { return this.put(`/locations/${id}`, data); },
    deleteLocation(id) { return this.delete(`/locations/${id}`); },

    // Categories
    getCategories(type = '') { return this.get(`/categories/${type ? '?type=' + type : ''}`); },
    createCategory(data) { return this.post('/categories/', data); },
    deleteCategory(id) { return this.delete(`/categories/${id}`); },

    // Maintenance
    getRecords(params = '') { return this.get(`/maintenance/${params}`); },
    getRecord(id) { return this.get(`/maintenance/${id}`); },
    createRecord(data) { return this.post('/maintenance/', data); },
    updateRecord(id, data) { return this.put(`/maintenance/${id}`, data); },

    // Schedules
    getSchedules() { return this.get('/schedules/'); },
    getOverdueSchedules() { return this.get('/schedules/overdue'); },
    createSchedule(data) { return this.post('/schedules/', data); },
    deleteSchedule(id) { return this.delete(`/schedules/${id}`); },

    // Stock
    getSupplies(params = '') { return this.get('/stock/supplies/' + params); },
    getSupply(id) { return this.get('/stock/supplies/' + id); },
    createSupply(data) { return this.post('/stock/supplies/', data); },
    updateSupply(id, data) { return this.put('/stock/supplies/' + id, data); },
    deleteSupply(id) { return this.delete('/stock/supplies/' + id); },
    getStockAlerts() { return this.get('/stock/alerts/'); },
    createMovement(supplyId, data) { return this.post('/stock/supplies/' + supplyId + '/movements/', data); },
    getMovements(supplyId) { return this.get('/stock/supplies/' + supplyId + '/movements/'); },
    getAllMovements(limit = 10) { return this.get('/stock/movements/recent/?limit=' + limit); },
};
