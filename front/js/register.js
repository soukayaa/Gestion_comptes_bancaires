$(document).ready(function () {
    $('#registerForm').submit(function (e) {
        e.preventDefault();

        // Verify password length
        const password = $('#password').val();
        if (password.length < 8) {
            $('#errorAlert').text('Le mot de passe doit contenir au moins 8 caractères').show();
            return;
        }

        // Verify password match
        if (password !== $('#confirmPassword').val()) {
            $('#errorAlert').text('Les mots de passe ne correspondent pas').show();
            return;
        }

        // Verify email format
        const email = $('#email').val();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            $('#errorAlert').text('Veuillez entrer une adresse email valide').show();
            return;
        }

        const registerData = {
            name: $('#name').val(),
            email: email,
            password: password
        };

        $.ajax({
            url: '/api/signup',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(registerData),
            success: function (response) {
                $('#errorAlert').hide();
                $('#successAlert').text('Compte créé avec succès ! Redirection...').show();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Une erreur est survenue';
                $('#errorAlert').text(errorMessage).show();
                $('#successAlert').hide();
            }
        });
    });
});