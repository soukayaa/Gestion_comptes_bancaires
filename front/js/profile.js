class Profile {
    constructor() {
        this.userId = null;
        this.initializeEventListeners();
        this.loadProfileData();
    }

    initializeEventListeners() {
        // Personal Information Form Submission
        $('#profileForm').on('submit', (e) => this.handleProfileUpdate(e));
        $('#connectionsPagination').on('click', '.page-link', (e) => this.handlePageChange(e));
    }

    // Personal Information Related Methods
    async loadProfileData() {
        try {
            const response = await $.get('/api/profile');
            this.userId = response.user.id;
            this.updateProfileUI(response.user);
            // Load login history after user ID is retrieved
            await this.loadLoginHistory();
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
            email: $('#userEmail').val(),
        };



        try {
            const response = await $.ajax({
                url: '/api/profile',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(formData)
            });


            // success
            this.showAlert('success', 'Profil mis à jour avec succès');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showAlert('danger', error.responseJSON?.error || 'Erreur lors de la mise à jour du profil');
        }
    }

    async loadLoginHistory(page = 1) {
        try {
            const response = await $.get(`/api/login-history?page=${page}`);
            this.updateLoginHistoryUI(response.loginHistory);
            this.updatePagination(page, response.totalPages);

            if (page === 1 && response.loginHistory.length > 0) {
                const latestLogin = response.loginHistory[0];
                await this.checkSuspiciousLogin(latestLogin);
            }
        } catch (error) {
            console.error('Error loading login history:', error);
            $('#connectionsList').html('<tr><td colspan="3" class="text-center">Erreur lors du chargement de l\'historique</td></tr>');
        }
    }

    async checkSuspiciousLogin(login) {
        if (!this.userId) {
            console.error('User ID not available');
            return;
        }

        const requestData = {
            userId: this.userId,
            ipAddress: login.ip || login.ipAddress,
            location: login.location
        };

        try {
            const response = await $.ajax({
                url: '/api/detect-suspicious-login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestData)
            });

            if (response.message === "Connexion suspecte détectée.") {
                this.showSuspiciousLoginAlert(login);
            }
        } catch (error) {
            console.error('Error checking suspicious login:', error);
            console.error('Error response:', error.responseJSON);
            if (error.status === 400) {
                console.error('Request data that caused 400:', requestData);
            }
        }
    }

    showSuspiciousLoginAlert(login) {
        const ipField = login.ip || login.ipAddress;
        const alertHtml = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <strong>Connexion suspecte détectée!</strong>
                <p>Une connexion inhabituelle a été détectée depuis:</p>
                <ul>
                    <li>Location: ${login.location}</li>
                    <li>IP: ${ipField}</li>
                    <li>Date: ${new Date(login.date).toLocaleString('fr-FR')}</li>
                </ul>
                <p>Si ce n'était pas vous, veuillez changer votre mot de passe immédiatement.</p>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        $('#security').prepend(alertHtml);
    }

    updateLoginHistoryUI(loginHistory) {
        const tbody = $('#connectionsList');
        tbody.empty();

        loginHistory.forEach(login => {
            const date = new Date(login.date).toLocaleString('fr-FR');
            tbody.append(`
                <tr>
                    <td>${date}</td>
                    <td>${login.location}</td>
                    <td>${login.ipAddress}</td>
                </tr>
            `);
        });
    }

    updatePagination(currentPage, totalPages) {
        const pagination = $('#connectionsPagination');
        pagination.empty();

        if (totalPages <= 1) return;

        const createPageItem = (pageNum, active = false) => `
            <li class="page-item ${active ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${pageNum}">${pageNum}</a>
            </li>
        `;

        const items = [];
        items.push('<li class="page-item"><a class="page-link" href="#" data-page="prev">&laquo;</a></li>');

        for (let i = 1; i <= totalPages; i++) {
            items.push(createPageItem(i, i === currentPage));
        }

        items.push('<li class="page-item"><a class="page-link" href="#" data-page="next">&raquo;</a></li>');
        pagination.html(items.join(''));
    }

    handlePageChange(e) {
        e.preventDefault();
        const pageAction = $(e.target).data('page');
        const currentPage = $('.page-item.active .page-link').data('page');

        let newPage;
        if (pageAction === 'prev') {
            newPage = Math.max(1, currentPage - 1);
        } else if (pageAction === 'next') {
            newPage = currentPage + 1;
        } else {
            newPage = pageAction;
        }

        this.loadLoginHistory(newPage);
    }

    // Tools and methodologies
    showAlert(type, message) {
        const alertId = type === 'success' ? 'alertSuccess' : 'alertError';
        const alert = $(`#${alertId}`);
        alert.text(message).show();
        setTimeout(() => alert.fadeOut(), 5000);
    }

}

// Initialization on page load
$(document).ready(() => {
    new Profile();
});