class Layout {
    static async loadNavbar() {
        try {
            const response = await $.get('/components/navbar.html');
            $('#navbarContainer').html(response);
            window.navbar.highlightCurrentPage();
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }
}

// Initialize the layout when the document load is complete
$(document).ready(() => {
    Layout.loadNavbar();
});