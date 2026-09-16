const API = {
    base: 'http://localhost:8000/api',

    async request(endpoint, options = {}) {
        const url = `${this.base}${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        try {
            const res = await fetch(url, config);
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
};
