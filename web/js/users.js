const UsersPage = {
    async render() {
        const area = document.getElementById('contentArea');
        area.innerHTML = App.loading();
        try {
            const users = await API.getUsers();
            const activeCount = users.filter(u => u.is_active).length;
            const inactiveCount = users.filter(u => !u.is_active).length;
            area.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon blue"><span class="material-icons">people</span></div>
                        <div><div class="stat-value">${users.length}</div><div class="stat-label">Total Usuarios</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><span class="material-icons">check_circle</span></div>
                        <div><div class="stat-value">${activeCount}</div><div class="stat-label">Activos</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon red"><span class="material-icons">block</span></div>
                        <div><div class="stat-value">${inactiveCount}</div><div class="stat-label">Inactivos</div></div>
                    </div>
                </div>
                <div class="card">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <span class="record-count">${users.length} usuarios</span>
                        </div>
                        <button class="btn btn-primary" onclick="UsersPage.openCreate()">
                            <span class="material-icons">person_add</span> Nuevo Usuario
                        </button>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Nombre Completo</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Creado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(u => `
                                    <tr>
                                        <td><strong>${u.username}</strong></td>
                                        <td>${u.full_name}</td>
                                        <td><span class="badge badge-${u.role}">${u.role}</span></td>
                                        <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                        <td>${new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                                        <td>
                                            <button class="btn btn-sm btn-flat" onclick='UsersPage.openEdit(${JSON.stringify(u)})'>
                                                <span class="material-icons">edit</span>
                                            </button>
                                            <button class="btn btn-sm btn-flat" style="color:var(--danger)" onclick="UsersPage.confirmDelete(${u.id}, '${u.username}')">
                                                <span class="material-icons">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            area.innerHTML = `<div class="card"><p style="color:var(--danger)">Error: ${e.message}</p></div>`;
        }
    },

    openCreate() {
        const body = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Usuario</label>
                    <input id="fUsername" placeholder="nombre.usuario">
                </div>
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input id="fFullName" placeholder="Nombre Apellido">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input id="fPassword" type="password" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select id="fRole">
                        <option value="technician">Technician</option>
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="UsersPage.saveCreate()">Crear Usuario</button>
        `;
        App.openModal('Nuevo Usuario', body, footer);
    },

    async saveCreate() {
        try {
            await API.createUser({
                username: document.getElementById('fUsername').value.trim(),
                full_name: document.getElementById('fFullName').value.trim(),
                password: document.getElementById('fPassword').value,
                role: document.getElementById('fRole').value
            });
            App.closeModal();
            App.toast('Usuario creado');
            this.render();
        } catch (e) {
            App.toast(e.message, 'error');
        }
    },

    openEdit(user) {
        const body = `
            <div class="form-grid">
                <div class="form-group">
                    <label>Usuario</label>
                    <input value="${user.username}" disabled style="opacity:0.5">
                </div>
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input id="fFullName" value="${user.full_name}">
                </div>
                <div class="form-group">
                    <label>Nueva Contraseña (dejar vacío para no cambiar)</label>
                    <input id="fPassword" type="password" placeholder="••••••">
                </div>
                <div class="form-group">
                    <label>Rol</label>
                    <select id="fRole">
                        <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>Technician</option>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select id="fActive">
                        <option value="true" ${user.is_active ? 'selected' : ''}>Activo</option>
                        <option value="false" ${!user.is_active ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
        `;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="UsersPage.saveEdit(${user.id})">Guardar</button>
        `;
        App.openModal('Editar Usuario', body, footer);
    },

    async saveEdit(id) {
        const data = {
            full_name: document.getElementById('fFullName').value.trim(),
            role: document.getElementById('fRole').value,
            is_active: document.getElementById('fActive').value === 'true'
        };
        const pass = document.getElementById('fPassword').value;
        if (pass) data.password = pass;
        try {
            await API.updateUser(id, data);
            App.closeModal();
            App.toast('Usuario actualizado');
            this.render();
        } catch (e) {
            App.toast(e.message, 'error');
        }
    },

    confirmDelete(id, username) {
        const body = `<p>¿Eliminar al usuario <strong>${username}</strong>? Esta acción no se puede deshacer.</p>`;
        const footer = `
            <button class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
            <button class="btn btn-danger" onclick="UsersPage.doDelete(${id})">Eliminar</button>
        `;
        App.openModal('Confirmar Eliminación', body, footer);
    },

    async doDelete(id) {
        try {
            await API.deleteUser(id);
            App.closeModal();
            App.toast('Usuario eliminado');
            this.render();
        } catch (e) {
            App.toast(e.message, 'error');
        }
    }
};
