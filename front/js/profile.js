class Profile {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.initializeEventListeners();
        this.loadProfileData();
        // Load security data if the secure page is accessed directly (via URL)
        if (window.location.hash === '#security') {
            this.loadSecurityData();
        }
    }

    initializeEventListeners() {
        // Personal Information Form Submission
        $('#profileForm').on('submit', (e) => this.handleProfileUpdate(e));

        // Security setting change events
        $('#emailAlerts').on('change', () => this.updateSecuritySettings());
        $('#locationCheck').on('change', () => this.updateSecuritySettings());

        // Logout All Sessions
        $('#revokeAllSessions').on('click', () => this.handleRevokeSessions());

        // Tab Switch Event
        $('#security-tab').on('shown.bs.tab', () => this.loadSecurityData());
    }

    // Personal Information Related Methods
    async loadProfileData() {
        try {
            const response = await $.get('/api/profile');
            if (response.success) {
                this.updateProfileUI(response.user);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showAlert('danger', 'Erreur lors du chargement du profil');
        }
    }

    updateProfileUI(user) {
        $('#userName').val(user.name);
        $('#userEmail').val(user.email);
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = {
            name: $('#userName').val(),
        };

        // Add password-related data if there is an entry in the password section
        if ($('#changePasswordSection').hasClass('show')) {
            const currentPassword = $('#currentPassword').val();
            const newPassword = $('#newPassword').val();
            const confirmPassword = $('#confirmPassword').val();

            if (currentPassword || newPassword || confirmPassword) {
                // Verify new password
                if (newPassword.length < 8) {
                    this.showAlert('danger', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    this.showAlert('danger', 'Les nouveaux mots de passe ne correspondent pas');
                    return;
                }

                formData.currentPassword = currentPassword;
                formData.newPassword = newPassword;
            }
        }

        try {
            const response = await $.ajax({
                url: '/api/profile/update',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData)
            });

            if (response.success) {
                this.showAlert('success', 'Profil mis à jour avec succès');
                $('#currentPassword, #newPassword, #confirmPassword').val('');
                $('#changePasswordSection').collapse('hide');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showAlert('danger', error.responseJSON?.message || 'Erreur lors de la mise à jour du profil');
        }
    }

    // Security-related methods
    async loadSecurityData() {
        try {
            // Loading Security Settings
            const settings = await this.fetchSecuritySettings();
            this.updateSecurityUI(settings);

            // Checking for suspicious activity
            const suspiciousActivity = await this.checkSuspiciousActivity();
            if (suspiciousActivity.length > 0) {
                this.showSuspiciousAlert(suspiciousActivity[0]);
            }

            // Load Connection History
            await this.loadConnectionHistory();
        } catch (error) {
            console.error('Error loading security data:', error);
            this.showAlert('danger', 'Erreur lors du chargement des données de sécurité');
        }
    }

    async fetchSecuritySettings() {
        const response = await $.get('/api/security/settings');
        return response.settings;
    }

    async checkSuspiciousActivity() {
        const response = await $.get('/api/security/suspicious-activity');
        return response.activities;
    }

    async loadConnectionHistory(page = 1) {
        try {
            const response = await $.get('/api/security/connections', {
                page: page,
                limit: this.itemsPerPage
            });

            this.renderConnections(response.connections);
            this.renderPagination(response.total, page);
        } catch (error) {
            console.error('Error loading connections:', error);
            this.showAlert('danger', 'Erreur lors du chargement de l\'historique des connexions');
        }
    }

    renderConnections(connections) {
        const tbody = $('#connectionsList');
        tbody.empty();

        connections.forEach(connection => {
            const row = `
                <tr class="${connection.suspicious ? 'table-warning' : ''}">
                    <td>${this.formatDateTime(connection.timestamp)}</td>
                    <td>${connection.ip}</td>
                    <td>${connection.location || 'Non disponible'}</td>
                    <td>
                        <i class="fas ${this.getDeviceIcon(connection.device)}"></i>
                        ${connection.device}
                    </td>
                    <td>
                        <span class="badge ${connection.successful ? 'bg-success' : 'bg-danger'}">
                            ${connection.successful ? 'Réussie' : 'Échouée'}
                        </span>
                        ${connection.suspicious ? '<span class="badge bg-warning ms-1">Suspecte</span>' : ''}
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    renderPagination(total, currentPage) {
        const totalPages = Math.ceil(total / this.itemsPerPage);
        const pagination = $('#connectionsPagination');
        pagination.empty();

        if (totalPages <= 1) return;

        // Creating Pagination Items
        let items = [];
        items.push(`
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">«</a>
            </li>
        `);

        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                items.push(`
                    <li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>
                `);
            } else {
                items.push(`
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `);
            }
        }

        items.push(`
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">»</a>
            </li>
        `);

        pagination.html(items.join(''));

        // Adding a click event
        pagination.find('a.page-link').on('click', (e) => {
            e.preventDefault();
            const page = $(e.currentTarget).data('page');
            if (page > 0 && page <= totalPages) {
                this.loadConnectionHistory(page);
            }
        });
    }

    async updateSecuritySettings() {
        const settings = {
            emailAlerts: $('#emailAlerts').is(':checked'),
            locationCheck: $('#locationCheck').is(':checked')
        };

        try {
            await $.ajax({
                url: '/api/security/settings',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(settings)
            });
            this.showAlert('success', 'Paramètres de sécurité mis à jour');
        } catch (error) {
            console.error('Error updating security settings:', error);
            this.showAlert('danger', 'Erreur lors de la mise à jour des paramètres');
        }
    }

    async handleRevokeSessions() {
        if (!confirm('Êtes-vous sûr de vouloir déconnecter toutes les autres sessions ?')) {
            return;
        }

        try {
            await $.post('/api/security/revoke-sessions');
            this.showAlert('success', 'Toutes les autres sessions ont été déconnectées');
            this.loadConnectionHistory();
        } catch (error) {
            console.error('Error revoking sessions:', error);
            this.showAlert('danger', 'Erreur lors de la déconnexion des sessions');
        }
    }

    // Tools and methodologies
    showAlert(type, message) {
        const alertId = type === 'success' ? 'alertSuccess' : 'alertError';
        const alert = $(`#${alertId}`);
        alert.text(message).show();
        setTimeout(() => alert.fadeOut(), 5000);
    }

    showSuspiciousAlert(activity) {
        $('#suspiciousMessage').text(
            `Connexion inhabituelle détectée depuis ${activity.location} (${activity.ip}) le ${this.formatDateTime(activity.timestamp)}`
        );
        $('#suspiciousAlert').show();
    }

    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getDeviceIcon(device) {
        const icons = {
            'Mobile': 'fa-mobile-alt',
            'Tablet': 'fa-tablet-alt',
            'Desktop': 'fa-desktop',
            'Unknown': 'fa-question-circle'
        };
        return icons[device] || icons['Unknown'];
    }

    updateSecurityUI(settings) {
        $('#emailAlerts').prop('checked', settings.emailAlerts);
        $('#locationCheck').prop('checked', settings.locationCheck);
    }
}

// Initialization on page load
$(document).ready(() => {
    new Profile();
});