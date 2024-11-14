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
                console.log("Login error:" + xhr.responseJSON.error);
                const errorMessage = xhr.responseJSON?.error || 'Une erreur est survenue';
                $('#errorAlert').text(errorMessage).show();
            }
        });
    });
});

$('button[type="submit"]').click(function (e) {
    console.log('Submit button clicked');
});