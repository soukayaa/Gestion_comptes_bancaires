$(document).ready(function () {
    console.log('Login.js document ready');

    $('#loginForm').submit(function (e) {
        console.log('Form submitted');
        e.preventDefault();

        const loginData = {
            email: $('#email').val(),
            password: $('#password').val()
        };

        console.log('Login data:', loginData);

        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(loginData),
            beforeSend: function () {
                console.log('Sending login request...');
            },
            success: function (response) {
                window.location.href = '/dashboard';
            },
            error: function (xhr) {
                console.log('Login error:', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                const errorMessage = xhr.responseJSON?.message || 'Une erreur est survenue';
                $('#errorAlert').text(errorMessage).show();
            }
        });
    });
});

$('button[type="submit"]').click(function (e) {
    console.log('Submit button clicked');
});