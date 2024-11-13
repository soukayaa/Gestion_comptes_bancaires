$(document).ready(function () {
    $('#loginForm').submit(function (e) {
        e.preventDefault();

        const loginData = {
            email: $('#email').val(),
            password: $('#password').val()
        };

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(loginData),
            success: function (response) {
                if (response.success) {
                    window.location.href = '/dashboard';
                }
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Une erreur est survenue';
                $('#errorAlert').text(errorMessage).show();
            }
        });
    });
});