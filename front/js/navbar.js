class Navbar {
    constructor() {
        this.initLogout();
        this.highlightCurrentPage();
    }

    // Initialize logout function
    initLogout() {
        $(document).on('click', '#logoutBtn', function () {
            $.ajax({
                url: '/api/auth/logout',
                method: 'POST',
                success: function () {
                    window.location.href = '/login';
                }
            });
        });
    }

    // Highlight the navigation item on the current page.
    highlightCurrentPage() {
        const currentPath = window.location.pathname.split('/')[1] || 'dashboard';
        $('.nav-link').removeClass('active');
        $(`[data-nav="${currentPath}"]`).addClass('active');
    }

    // Update user information (if you want to display the username in the navigation bar)
    updateUserInfo(userName) {
        $('#navbarUserName').text(userName);
    }
}

// Create a global navigation bar instance
window.navbar = new Navbar();