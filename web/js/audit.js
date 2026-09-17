const AuditPage = {
    async render() {
        const area = document.getElementById('contentArea');
        area.innerHTML = App.loading();

        try {
            const logs = await API.getAuditLog(100);

            if (!logs.length) {
                area.innerHTML = App.empty('history', 'No hay registros de auditoría');
                return;
            }

            const actionMap = {
                'LOGIN': { icon: 'login', color: 'var(--accent)' },
                'LOGOUT': { icon: 'logout', color: 'var(--text-secondary)' },
                'CREATE_USER': { icon: 'person_add', color: 'var(--success)' },
                'UPDATE_USER': { icon: 'edit', color: 'var(--warning)' },
                'DELETE_USER': { icon: 'person_remove', color: 'var(--danger)' }
            };

            area.innerHTML = `
                <div class="card">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <span class="record-count">${logs.length} registros</span>
                        </div>
                        <button class="btn btn-secondary" onclick="AuditPage.render()">
                            <span class="material-icons">refresh</span> Actualizar
                        </button>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha / Hora</th>
                                    <th>Usuario</th>
                                    <th>Acción</th>
                                    <th>Detalle</th>
                                    <th>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => {
                                    const info = actionMap[log.action] || { icon: 'info', color: 'var(--text-secondary)' };
                                    const dt = new Date(log.created_at);
                                    const fecha = dt.toLocaleDateString('es-MX');
                                    const hora = dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight:500">${fecha}</div>
                                                <div style="font-size:11px;color:var(--text-muted)">${hora}</div>
                                            </td>
                                            <td><strong>${log.username || '—'}</strong></td>
                                            <td>
                                                <span style="display:inline-flex;align-items:center;gap:6px;color:${info.color}">
                                                    <span class="material-icons" style="font-size:18px">${info.icon}</span>
                                                    ${log.action}
                                                </span>
                                            </td>
                                            <td>${log.detail || '—'}</td>
                                            <td style="color:var(--text-muted);font-family:monospace;font-size:12px">${log.ip_address || '—'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            area.innerHTML = `<div class="card"><p style="color:var(--danger)">Error: ${e.message}</p></div>`;
        }
    }
};
