class Dashboard {
    constructor() {
        this.initializeEventListeners();
        this.loadDashboardData();
    }

    initializeEventListeners() {
        // Submit new account form
        $('#newAccountForm').on('submit', (e) => this.handleNewAccount(e));

        // Add account button click
        $('#addAccountBtn').on('click', () => {
            $('#addAccountModal').modal('show');
        });

        // Account card click event delegation
        $('#accountsList').on('click', '.account-card', (e) => {
            const accountId = $(e.currentTarget).data('account-id');
            window.location.href = `/account/${accountId}`;
        });
    }

    async loadDashboardData() {
        try {
            // Load user data
            const userData = await this.fetchUserData();
            this.updateUserInfo(userData);

            // Load account data
            const accountsData = await this.fetchAccountsData();
            this.renderAccounts(accountsData);

            // Calculate and display the total balance
            this.updateTotalBalance(accountsData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Display error message
        }
    }

    async fetchUserData() {
        const response = await $.get('/api/profile');
        return response.user;
    }

    async fetchAccountsData() {
        const response = await $.get('/api/accounts');
        return response.accounts;
    }

    updateUserInfo(userData) {
        $('#userName').text(userData.name);
    }

    updateTotalBalance(accounts) {
        const total = accounts.reduce((sum, account) => sum + account.balance, 0);
        $('#totalBalance').text(total.toFixed(2));
    }

    renderAccounts(accounts) {
        const accountsList = $('#accountsList');
        accountsList.empty();

        accounts.forEach(account => {
            const accountCard = this.createAccountCard(account);
            accountsList.append(accountCard);
        });
    }

    createAccountCard(account) {
        return `
            <div class="col-md-6 col-lg-6 mb-3">
                <div class="card h-100 account-card" data-account-id="${account.id}">
                    <div class="card-body">
                        <h5 class="card-title">${account.name}</h5>
                        <h6 class="card-subtitle mb-2">
                            Solde: <span class="text-primary">${account.balance.toFixed(2)} €</span>
                        </h6>
                    </div>
                </div>
            </div>
        `;
    }

    async handleNewAccount(e) {
        e.preventDefault();
        const form = $('#newAccountForm');
        const formData = {
            name: form.find('[name="accountName"]').val(),
            type: form.find('[name="accountType"]').val()
        };

        try {
            await $.ajax({
                url: '/api/accounts',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData)
            });

            $('#addAccountModal').modal('hide');
            form[0].reset();
            this.loadDashboardData(); // Reload data
        } catch (error) {
            console.error('Error creating account:', error);
            // Display error message
        }
    }
}

// initialize dashboard
$(document).ready(() => {
    new Dashboard();
});