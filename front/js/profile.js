class Profile {
    constructor() {
        this.initializeEventListeners();
        this.loadProfileData();
        this.loadLoginHistory();
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
            this.updateProfileUI(response.user);
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
        } catch (error) {
            console.error('Error loading login history:', error);
            $('#connectionsList').html('<tr><td colspan="3" class="text-center">Erreur lors du chargement de l\'historique</td></tr>');
        }
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