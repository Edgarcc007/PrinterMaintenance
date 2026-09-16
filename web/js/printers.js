const PrintersPage = {
    locations: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const [printers, locations] = await Promise.all([
                API.getPrinters(),
                API.getLocations()
            ]);
            this.locations = locations;

            content.innerHTML = `
                <div class="toolbar">
                    <div class="toolbar-left">
                        <div class="search-box">
                            <span class="material-icons">search</span>
                            <input type="text" id="printerSearch" placeholder="Search serial, model, asset tag...">
                        </div>
                        <select class="filter-select" id="filterBrand">
                            <option value="">All Brands</option>
                            ${[...new Set(printers.map(p => p.brand))].map(b => `<option value="${b}">${b}</option>`).join('')}
                        </select>
                        <select class="filter-select" id="filterStatus">
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="In Repair">In Repair</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Retired">Retired</option>
                        </select>
                        <span class="record-count" id="printerCount">${printers.length} printer(s)</span>
                    </div>
                    <button class="btn btn-primary" onclick="PrintersPage.openAdd()">
                        <span class="material-icons">add</span> New Printer
                    </button>
                </div>
                <div class="card">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr>
                                <th>Brand</th><th>Model</th><th>Serial Number</th><th>Asset Tag</th>
                                <th>IP Address</th><th>Location</th><th>Line</th><th>Status</th><th></th>
                            </tr></thead>
                            <tbody id="printersBody">
                                ${this.renderRows(printers)}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.allPrinters = printers;
            document.getElementById('printerSearch').addEventListener('input', () => this.filter());
            document.getElementById('filterBrand').addEventListener('change', () => this.filter());
            document.getElementById('filterStatus').addEventListener('change', () => this.filter());
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load printers: ${e.message}</div>`;
        }
    },

    renderRows(printers) {
        if (!printers.length) return '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">No printers found</td></tr>';
        return printers.map(p => `<tr>
            <td><strong>${p.brand}</strong></td>
            <td>${p.model}</td>
            <td style="font-family:monospace">${p.serial_number}</td>
            <td>${p.asset_tag || '—'}</td>
            <td style="font-family:monospace">${p.ip_address || '—'}</td>
            <td>${p.location?.name || '—'}</td>
            <td>${p.production_line || '—'}</td>
            <td>${App.statusBadge(p.status || 'Active')}</td>
            <td>
                <button class="btn btn-flat btn-sm" onclick="PrintersPage.openEdit(${p.id})" title="Edit">
                    <span class="material-icons" style="font-size:16px">edit</span>
                </button>
                <button class="btn btn-flat btn-sm" onclick="PrintersPage.remove(${p.id})" title="Delete" style="color:var(--danger)">
                    <span class="material-icons" style="font-size:16px">delete</span>
                </button>
            </td>
        </tr>`).join('');
    },

    filter() {
        const search = document.getElementById('printerSearch').value.toLowerCase();
        const brand = document.getElementById('filterBrand').value;
        const status = document.getElementById('filterStatus').value;

        let filtered = this.allPrinters;
        if (search) filtered = filtered.filter(p =>
            (p.serial_number || '').toLowerCase().includes(search) ||
            (p.model || '').toLowerCase().includes(search) ||
            (p.asset_tag || '').toLowerCase().includes(search)
        );
        if (brand) filtered = filtered.filter(p => p.brand === brand);
        if (status) filtered = filtered.filter(p => p.status === status);

        document.getElementById('printersBody').innerHTML = this.renderRows(filtered);
        document.getElementById('printerCount').textContent = `${filtered.length} printer(s)`;
    },

    formHtml(p = {}) {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label>Brand *</label>
                    <select id="fBrand">
                        <option value="">Select...</option>
                        ${['Zebra', 'Honeywell', 'HP', 'Canon', 'Epson', 'Brother', 'Other'].map(b =>
                            `<option value="${b}" ${p.brand === b ? 'selected' : ''}>${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Model *</label>
                    <input id="fModel" value="${p.model || ''}">
                </div>
                <div class="form-group">
                    <label>Serial Number *</label>
                    <input id="fSerial" value="${p.serial_number || ''}">
                </div>
                <div class="form-group">
                    <label>Asset Tag</label>
                    <input id="fAsset" value="${p.asset_tag || ''}">
                </div>
                <div class="form-group">
                    <label>IP Address</label>
                    <input id="fIp" value="${p.ip_address || ''}">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <select id="fLocation">
                        <option value="">None</option>
                        ${this.locations.map(l => `<option value="${l.id}" ${p.location_id === l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Production Line</label>
                    <input id="fLine" value="${p.production_line || ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="fStatus">
                        ${['Active', 'In Repair', 'Inactive', 'Retired'].map(s =>
                            `<option value="${s}" ${(p.status || 'Active') === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Installation Date</label>
                    <input type="date" id="fDate" value="${p.installation_date || ''}">
                </div>
                <div class="form-group full">
                    <label>Notes</label>
                    <textarea id="fNotes">${p.notes || ''}</textarea>
                </div>
            </div>`;
    },

    getData() {
        const data = {
            brand: document.getElementById('fBrand').value,
            model: document.getElementById('fModel').value,
            serial_number: document.getElementById('fSerial').value,
            asset_tag: document.getElementById('fAsset').value || null,
            ip_address: document.getElementById('fIp').value || null,
            location_id: document.getElementById('fLocation').value ? parseInt(document.getElementById('fLocation').value) : null,
            production_line: document.getElementById('fLine').value || null,
            status: document.getElementById('fStatus').value,
            installation_date: document.getElementById('fDate').value || null,
            notes: document.getElementById('fNotes').value || null
        };
        if (!data.brand || !data.model || !data.serial_number) {
            App.toast('Brand, Model and Serial Number are required', 'error');
            return null;
        }
        return data;
    },

    openAdd() {
        App.openModal('New Printer', this.formHtml(),
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="PrintersPage.save()">Save Printer</button>`);
    },

    async openEdit(id) {
        try {
            const p = await API.getPrinter(id);
            this._editId = id;
            App.openModal(`Edit Printer #${id}`, this.formHtml(p),
                `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                 <button class="btn btn-primary" onclick="PrintersPage.save(${id})">Save Changes</button>`);
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async save(id = null) {
        const data = this.getData();
        if (!data) return;
        try {
            if (id) await API.updatePrinter(id, data);
            else await API.createPrinter(data);
            App.closeModal();
            App.toast(id ? 'Printer updated' : 'Printer created');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async remove(id) {
        if (!confirm('Delete this printer? This cannot be undone.')) return;
        try {
            await API.deletePrinter(id);
            App.toast('Printer deleted');
            this.render();
        } catch (e) { App.toast(e.message, 'error'); }
    }
};
