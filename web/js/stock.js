const StockPage = {
    supplies: [],
    alerts: [],

    async render() {
        const content = document.getElementById('contentArea');
        content.innerHTML = App.loading();

        try {
            const [supplies, alerts] = await Promise.all([
                API.getSupplies(),
                API.getStockAlerts()
            ]);
            this.supplies = supplies;
            this.alerts = alerts;

            const ok = supplies.filter(s => s.stock_status === 'OK').length;
            const low = supplies.filter(s => s.stock_status === 'Low').length;
            const over = supplies.filter(s => s.stock_status === 'Overstock').length;

            content.innerHTML = `
                <div class="stats-grid">
                    ${this.statCard('inventory_2', 'teal', supplies.length, 'Total Supplies')}
                    ${this.statCard('check_circle', 'green', ok, 'In Stock (OK)')}
                    ${this.statCard('warning', 'red', low, 'Low Stock')}
                    ${this.statCard('trending_up', 'orange', over, 'Overstock')}
                </div>

                <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">
                    <!-- Main table -->
                    <div style="flex:1;min-width:0;">
                        <div class="card" style="padding:0;">
                            <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid var(--border);">
                                <div class="toolbar-left">
                                    <div class="search-box">
                                        <span class="material-icons">search</span>
                                        <input type="text" id="stockSearch" placeholder="Search supplies..." oninput="StockPage.applyFilters()">
                                    </div>
                                    <select class="filter-select" id="stockFilterCat" onchange="StockPage.applyFilters()">
                                        <option value="">All Categories</option>
                                    </select>
                                    <select class="filter-select" id="stockFilterBrand" onchange="StockPage.applyFilters()">
                                        <option value="">All Brands</option>
                                    </select>
                                    <select class="filter-select" id="stockFilterStatus" onchange="StockPage.applyFilters()">
                                        <option value="">All Status</option>
                                        <option value="OK">OK</option>
                                        <option value="Low">Low</option>
                                        <option value="Overstock">Overstock</option>
                                    </select>
                                    <span class="record-count" id="stockCount"></span>
                                </div>
                                <button class="btn btn-primary" onclick="StockPage.openForm()">
                                    <span class="material-icons">add</span> New Supply
                                </button>
                            </div>
                            <div class="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Supply</th>
                                            <th>Category</th>
                                            <th>Brand</th>
                                            <th>Part #</th>
                                            <th>Stock Level</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="stockTableBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Side panel -->
                    <div style="width:280px;flex-shrink:0;">
                        <div class="card" style="margin-bottom:16px;">
                            <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                                <span class="material-icons" style="font-size:18px;color:var(--danger);">error</span>
                                Low Stock Alerts
                            </h3>
                            <div id="stockAlerts"></div>
                        </div>
                        <div class="card">
                            <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                                <span class="material-icons" style="font-size:18px;color:var(--text-secondary);">history</span>
                                Recent Movements
                            </h3>
                            <div id="stockMovements"></div>
                        </div>
                    </div>
                </div>
            `;

            this.populateFilters();
            this.applyFilters();
            this.renderAlerts();
            this.loadRecentMovements();
        } catch (e) {
            content.innerHTML = `<div class="card" style="color:var(--danger)">Failed to load stock: ${e.message}</div>`;
        }
    },

    statCard(icon, color, value, label) {
        return `
            <div class="stat-card">
                <div class="stat-icon ${color}"><span class="material-icons">${icon}</span></div>
                <div>
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>`;
    },

    populateFilters() {
        const cats = [...new Set(this.supplies.map(s => s.category).filter(Boolean))].sort();
        const brands = [...new Set(this.supplies.map(s => s.compatible_brand).filter(Boolean))].sort();
        const catSel = document.getElementById('stockFilterCat');
        const brandSel = document.getElementById('stockFilterBrand');
        catSel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option>${c}</option>`).join('');
        brandSel.innerHTML = '<option value="">All Brands</option>' + brands.map(b => `<option>${b}</option>`).join('');
    },

    applyFilters() {
        const search = (document.getElementById('stockSearch')?.value || '').toLowerCase();
        const cat = document.getElementById('stockFilterCat')?.value || '';
        const brand = document.getElementById('stockFilterBrand')?.value || '';
        const status = document.getElementById('stockFilterStatus')?.value || '';

        const filtered = this.supplies.filter(s => {
            if (search && !s.name.toLowerCase().includes(search) && !(s.part_number || '').toLowerCase().includes(search)) return false;
            if (cat && s.category !== cat) return false;
            if (brand && s.compatible_brand !== brand) return false;
            if (status && s.stock_status !== status) return false;
            return true;
        });

        document.getElementById('stockCount').textContent = `${filtered.length} of ${this.supplies.length}`;
        this.renderTable(filtered);
    },

    renderTable(supplies) {
        const tbody = document.getElementById('stockTableBody');
        if (!supplies.length) {
            tbody.innerHTML = `<tr><td colspan="7">${App.empty('inventory_2', 'No supplies found')}</td></tr>`;
            return;
        }

        tbody.innerHTML = supplies.map(s => {
            const pct = s.max_stock > 0 ? Math.min((s.current_stock / s.max_stock) * 100, 100) : 0;
            const barColor = s.stock_status === 'Low' ? 'var(--danger)' :
                             s.stock_status === 'Overstock' ? 'var(--warning)' : 'var(--success)';
            const badgeClass = s.stock_status === 'Low' ? 'badge-inactive' :
                               s.stock_status === 'Overstock' ? 'badge-repair' : 'badge-active';

            return `<tr>
                <td>
                    <strong>${this.esc(s.name)}</strong>
                    ${s.compatible_model ? `<br><span style="font-size:11px;color:var(--text-secondary)">${this.esc(s.compatible_model)}</span>` : ''}
                </td>
                <td>${this.esc(s.category)}</td>
                <td>${this.esc(s.compatible_brand || '—')}</td>
                <td><code style="font-size:12px;background:#F5F5F5;padding:2px 6px;border-radius:4px;">${this.esc(s.part_number || '—')}</code></td>
                <td style="min-width:150px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                        <span>${s.current_stock} ${this.esc(s.unit || 'units')}</span>
                        <span style="color:var(--text-secondary)">${s.min_stock}–${s.max_stock}</span>
                    </div>
                    <div style="width:100%;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;transition:width .3s;"></div>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}">${s.stock_status}</span></td>
                <td>
                    <button class="btn btn-flat btn-icon btn-sm" title="Stock Movement" onclick="StockPage.openMovement(${s.id})">
                        <span class="material-icons">swap_horiz</span>
                    </button>
                    <button class="btn btn-flat btn-icon btn-sm" title="Edit" onclick="StockPage.openForm(${s.id})">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn btn-flat btn-icon btn-sm" title="Delete" onclick="StockPage.confirmDelete(${s.id})" style="color:var(--danger)">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    renderAlerts() {
        const panel = document.getElementById('stockAlerts');
        if (!this.alerts.length) {
            panel.innerHTML = `<div style="text-align:center;padding:16px;color:var(--success);font-size:13px;">
                <span class="material-icons" style="font-size:32px;display:block;margin-bottom:4px;">check_circle</span>
                All stock levels OK
            </div>`;
            return;
        }
        panel.innerHTML = this.alerts.map(a => `
            <div style="padding:10px 12px;border-left:3px solid var(--danger);background:#FFF5F5;border-radius:0 6px 6px 0;margin-bottom:8px;">
                <div style="font-size:13px;font-weight:600;">${this.esc(a.name)}</div>
                <div style="font-size:11px;color:var(--text-secondary);">${this.esc(a.compatible_brand || '')} · ${this.esc(a.category)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                    <span class="badge badge-inactive">${a.current_stock} / ${a.min_stock} min</span>
                    <span style="color:var(--danger);font-size:12px;font-weight:700;">−${a.deficit}</span>
                </div>
            </div>
        `).join('');
    },

    async loadRecentMovements() {
        const panel = document.getElementById('stockMovements');
        try {
            const movements = await API.getAllMovements(10);
            if (!movements.length) {
                panel.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:13px;">
                    <span class="material-icons" style="font-size:32px;display:block;margin-bottom:4px;opacity:.3;">inbox</span>
                    No movements yet
                </div>`;
                return;
            }
            panel.innerHTML = movements.slice(0, 8).map(m => {
                const isIn = m.movement_type === 'IN';
                const icon = isIn ? 'arrow_downward' : 'arrow_upward';
                const color = isIn ? 'var(--success)' : 'var(--danger)';
                const sign = isIn ? '+' : '−';
                const date = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const supply = this.supplies.find(s => s.id === m.supply_id);
                const name = supply ? supply.name : `Supply #${m.supply_id}`;
                return `
                    <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
                        <span class="material-icons" style="font-size:18px;color:${color};margin-top:2px;">${icon}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.esc(name)}</div>
                            <div style="display:flex;justify-content:space-between;">
                                <span style="color:${color};font-size:12px;font-weight:600;">${sign}${m.quantity}</span>
                                <span style="font-size:11px;color:var(--text-secondary);">${date}</span>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        } catch (e) {
            panel.innerHTML = `<div style="color:var(--danger);font-size:12px;">Error loading movements</div>`;
        }
    },

    // ── Supply Form ──
    openForm(id = null) {
        const s = id ? this.supplies.find(x => x.id === id) : null;
        const title = s ? 'Edit Supply' : 'New Supply';

        const body = `
            <div class="form-grid">
                <div class="form-group full">
                    <label>Name *</label>
                    <input type="text" id="fName" value="${s ? this.esc(s.name) : ''}">
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="fCategory">
                        <option value="">Select...</option>
                        ${['Ribbon','Label','Printhead','Platen Roller','Cleaning Kit','Other'].map(c =>
                            `<option ${s && s.category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Unit</label>
                    <select id="fUnit">
                        ${['units','rolls','boxes','packs','kits'].map(u =>
                            `<option ${s && s.unit === u ? 'selected' : ''}>${u}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Compatible Brand</label>
                    <input type="text" id="fBrand" value="${s ? this.esc(s.compatible_brand || '') : ''}" placeholder="e.g. Zebra">
                </div>
                <div class="form-group">
                    <label>Compatible Model</label>
                    <input type="text" id="fModel" value="${s ? this.esc(s.compatible_model || '') : ''}" placeholder="e.g. ZT411">
                </div>
                <div class="form-group full">
                    <label>Part Number</label>
                    <input type="text" id="fPartNumber" value="${s ? this.esc(s.part_number || '') : ''}" placeholder="e.g. 800132-002">
                </div>
                <div class="form-group">
                    <label>Current Stock</label>
                    <input type="number" id="fCurrentStock" value="${s ? s.current_stock : 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Min Stock</label>
                    <input type="number" id="fMinStock" value="${s ? s.min_stock : 0}" min="0">
                </div>
                <div class="form-group">
                    <label>Max Stock</label>
                    <input type="number" id="fMaxStock" value="${s ? s.max_stock : 0}" min="0">
                </div>
                <div class="form-group full">
                    <label>Notes</label>
                    <textarea id="fNotes">${s ? this.esc(s.notes || '') : ''}</textarea>
                </div>
            </div>`;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="StockPage.saveSupply(${id || 'null'})">
                <span class="material-icons">save</span> Save
            </button>`;

        App.openModal(title, body, footer);
    },

    async saveSupply(id) {
        const data = {
            name: document.getElementById('fName').value.trim(),
            category: document.getElementById('fCategory').value,
            unit: document.getElementById('fUnit').value,
            compatible_brand: document.getElementById('fBrand').value.trim() || null,
            compatible_model: document.getElementById('fModel').value.trim() || null,
            part_number: document.getElementById('fPartNumber').value.trim() || null,
            current_stock: parseInt(document.getElementById('fCurrentStock').value) || 0,
            min_stock: parseInt(document.getElementById('fMinStock').value) || 0,
            max_stock: parseInt(document.getElementById('fMaxStock').value) || 0,
            notes: document.getElementById('fNotes').value.trim() || null,
        };

        if (!data.name || !data.category) {
            App.toast('Name and Category are required', 'error');
            return;
        }

        try {
            if (id) {
                await API.updateSupply(id, data);
                App.toast('Supply updated');
            } else {
                await API.createSupply(data);
                App.toast('Supply created');
            }
            App.closeModal();
            this.render();
        } catch (e) {
            App.toast('Error: ' + e.message, 'error');
        }
    },

    // ── Delete ──
    confirmDelete(id) {
        const s = this.supplies.find(x => x.id === id);
        if (!s) return;

        const body = `
            <div style="text-align:center;padding:12px 0;">
                <span class="material-icons" style="font-size:48px;color:var(--danger);margin-bottom:8px;">warning</span>
                <p>Delete <strong>${this.esc(s.name)}</strong>?</p>
                <p style="font-size:12px;color:var(--text-secondary);">This will also delete all movement history.</p>
            </div>`;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-danger" onclick="StockPage.doDelete(${id})">
                <span class="material-icons">delete</span> Delete
            </button>`;

        App.openModal('Delete Supply', body, footer);
    },

    async doDelete(id) {
        try {
            await API.deleteSupply(id);
            App.toast('Supply deleted');
            App.closeModal();
            this.render();
        } catch (e) {
            App.toast('Error: ' + e.message, 'error');
        }
    },

    // ── Movement ──
    openMovement(supplyId) {
        const s = this.supplies.find(x => x.id === supplyId);
        if (!s) return;

        const body = `
            <div style="margin-bottom:16px;">
                <div style="font-size:15px;font-weight:600;">${this.esc(s.name)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">Current: ${s.current_stock} ${this.esc(s.unit || 'units')}</div>
            </div>
            <div class="form-grid">
                <div class="form-group full">
                    <label>Movement Type</label>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-success mov-type-btn active" id="movBtnIn" onclick="StockPage.selectMovType('IN')" style="flex:1;">
                            <span class="material-icons">arrow_downward</span> Entry (IN)
                        </button>
                        <button class="btn btn-secondary mov-type-btn" id="movBtnOut" onclick="StockPage.selectMovType('OUT')" style="flex:1;">
                            <span class="material-icons">arrow_upward</span> Exit (OUT)
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Quantity *</label>
                    <input type="number" id="mQty" value="1" min="1">
                </div>
                <div class="form-group">
                    <label>Reference</label>
                    <input type="text" id="mRef" placeholder="PO, ticket, etc.">
                </div>
                <div class="form-group full">
                    <label>Notes</label>
                    <input type="text" id="mNotes" placeholder="Optional">
                </div>
            </div>`;

        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="StockPage.saveMovement(${supplyId})">
                <span class="material-icons">check</span> Confirm
            </button>`;

        App.openModal('Stock Movement', body, footer);
        this._movType = 'IN';
    },

    _movType: 'IN',

    selectMovType(type) {
        this._movType = type;
        const btnIn = document.getElementById('movBtnIn');
        const btnOut = document.getElementById('movBtnOut');
        if (type === 'IN') {
            btnIn.className = 'btn btn-success mov-type-btn active';
            btnOut.className = 'btn btn-secondary mov-type-btn';
        } else {
            btnIn.className = 'btn btn-secondary mov-type-btn';
            btnOut.className = 'btn btn-danger mov-type-btn active';
        }
    },

    async saveMovement(supplyId) {
        const qty = parseInt(document.getElementById('mQty').value);
        if (!qty || qty < 1) {
            App.toast('Quantity must be at least 1', 'error');
            return;
        }

        const data = {
            movement_type: this._movType,
            quantity: qty,
            reference: document.getElementById('mRef').value.trim() || null,
            notes: document.getElementById('mNotes').value.trim() || null,
        };

        try {
            await API.createMovement(supplyId, data);
            App.toast(`Stock ${this._movType === 'IN' ? 'entry' : 'exit'} recorded`);
            App.closeModal();
            this.render();
        } catch (e) {
            App.toast('Error: ' + e.message, 'error');
        }
    },

    esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
};
