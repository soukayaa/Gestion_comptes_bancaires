class Account {
    constructor() {
        this.accountId = window.location.pathname.split('/').pop();
        this.transactions = []; // Store all transaction records
        this.initializeEventListeners();
        this.loadAccountData();
    }

    initializeEventListeners() {
        // Add transaction
        $('#newTransactionBtn').click(() => $('#newTransactionModal').modal('show'));
        $('#newTransactionForm').on('submit', (e) => this.handleNewTransaction(e));

        // interval filtering
        $('#typeFilter').on('change', () => this.filterTransactions());
        $('#periodFilter').on('change', () => this.handlePeriodChange());
        $('#startDate, #endDate').on('change', () => this.filterTransactions());

        // Download history
        $('#downloadHistoryBtn').click(() => this.downloadHistory());

        // Delete account
        $('#deleteAccountBtn').click(() => this.handleDeleteAccount());

        // set an alarm
        $('#setAlertBtn').click(() => this.handleSetAlert());
    }

    handlePeriodChange() {
        const period = $('#periodFilter').val();
        if (period === 'custom') {
            $('#customDateRange').show();
        } else {
            $('#customDateRange').hide();
        }
        this.filterTransactions();
    }

    async loadAccountData() {
        try {
            // Load account information
            const account = await this.fetchAccountData();
            this.updateAccountInfo(account);

            // Load all transaction records
            const response = await $.get(`/api/accounts/${this.accountId}/transactions`);
            this.transactions = response.transactions;
            this.filterTransactions(); // Apply initial filter
        } catch (error) {
            console.error('Error loading account data:', error);
            this.showAlert('danger', 'Erreur lors du chargement des données');
        }
    }

    filterTransactions() {
        let filteredTransactions = [...this.transactions];

        // Filter by type
        const typeFilter = $('#typeFilter').val();
        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        // Filter by date
        const periodFilter = $('#periodFilter').val();
        const today = new Date();
        let startDate, endDate;

        if (periodFilter === 'custom') {
            startDate = new Date($('#startDate').val());
            endDate = new Date($('#endDate').val());
            endDate.setHours(23, 59, 59); // Set to end day
        } else if (periodFilter !== 'all') {
            startDate = new Date();
            startDate.setDate(today.getDate() - parseInt(periodFilter));
            endDate = today;
        }

        if (startDate && endDate) {
            filteredTransactions = filteredTransactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= startDate && transactionDate <= endDate;
            });
        }

        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // update display
        this.renderTransactions(filteredTransactions);
    }

    renderTransactions(transactions) {
        const tbody = $('#transactionsList');
        tbody.empty();

        if (transactions.length === 0) {
            $('#transactionsList').hide();
            $('#noTransactions').show();
            return;
        }

        $('#transactionsList').show();
        $('#noTransactions').hide();

        transactions.forEach(transaction => {
            const row = `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>
                        <span class="badge ${transaction.type === 'deposit' ? 'bg-success' : 'bg-danger'}">
                            ${transaction.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                        </span>
                    </td>
                    <td class="text-${transaction.type === 'deposit' ? 'success' : 'danger'}">
                        ${transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)} €
                    </td>
                    <td>${transaction.balance.toFixed(2)} €</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    formatDate(dateString) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    async fetchAccountData() {
        const response = await $.get(`/api/accounts/${this.accountId}`);
        return response.account;
    }

    updateAccountInfo(account) {
        $('#accountName').text(account.name);
        $('#accountType').text(account.type === 'current' ? 'Compte Courant' : 'Compte Épargne');
        $('#accountBalance').text(account.balance.toFixed(2));
        document.title = `${account.name} - Banque en Ligne`;
    }

    async handleNewTransaction(e) {
        e.preventDefault();
        const form = $('#newTransactionForm');
        const type = form.find('[name="type"]').val();
        const amount = parseFloat(form.find('[name="amount"]').val());

        try {
            await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ type, amount })
            });

            $('#newTransactionModal').modal('hide');
            form[0].reset();
            // Reload account data and transaction history
            await this.loadAccountData();

            // A success message is displayed.
            this.showAlert('success', 'Transaction effectuée avec succès');
        } catch (error) {
            console.error('Error creating transaction:', error);
            this.showAlert('danger', error.responseJSON?.message || 'Erreur lors de la transaction');
        }
    }

    async downloadHistory() {
        try {
            const response = await $.get(`/api/accounts/${this.accountId}/transactions/download`, {
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${this.accountId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showAlert('success', 'Historique téléchargé avec succès');
        } catch (error) {
            console.error('Error downloading history:', error);
            this.showAlert('danger', 'Erreur lors du téléchargement');
        }
    }

    async handleDeleteAccount() {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.')) {
            return;
        }

        try {
            await $.ajax({
                url: `/api/accounts/${this.accountId}`,
                method: 'DELETE'
            });

            this.showAlert('success', 'Compte supprimé avec succès');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showAlert('danger', 'Erreur lors de la suppression du compte');
        }
    }

    async handleSetAlert() {
        const threshold = prompt('Définir le seuil d\'alerte pour ce compte (en €):');
        if (threshold === null) return;

        const amount = parseFloat(threshold);
        if (isNaN(amount) || amount < 0) {
            this.showAlert('danger', 'Veuillez entrer un montant valide');
            return;
        }

        try {
            await $.ajax({
                url: `/api/accounts/${this.accountId}/alert`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ threshold: amount })
            });

            this.showAlert('success', 'Seuil d\'alerte défini avec succès');
        } catch (error) {
            console.error('Error setting alert:', error);
            this.showAlert('danger', 'Erreur lors de la définition du seuil');
        }
    }

    showAlert(type, message) {
        const alertDiv = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        // Insert a reminder at the top of the page
        $('.container').prepend(alertDiv);

        // Disappears automatically after 3 seconds.
        setTimeout(() => {
            alertDiv.alert('close');
        }, 3000);
    }
}

// Initialize the account details page
$(document).ready(() => {
    new Account();
});