class Profile {
    constructor() {
        this.initializeEventListeners();
        this.loadProfileData();
    }

    initializeEventListeners() {
        // Personal Information Form Submission
        $('#profileForm').on('submit', (e) => this.handleProfileUpdate(e));
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