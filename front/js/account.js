class Account {
    constructor() {
        console.log("create account page");
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
            // console.log(`Chargement des données pour le compte ${this.accountId}...`);

            // // Chargement du compte - Notez le changement d'URL ici
            // const account = await $.ajax({
            //     url: `/api/accounts/${this.accountId}`,  // URL pour les infos du compte
            //     method: 'GET',
            //     error: (xhr, status, error) => {
            //         console.error('Erreur lors du chargement du compte:', {
            //             status: xhr.status,
            //             statusText: xhr.statusText,
            //             error: error
            //         });
            //     }
            // });

            // console.log("account : " + account + "success : " + account.success);

            // if (!account || !account.success) {
            //     throw new Error(account.message || 'Erreur lors du chargement du compte');
            // }

            // console.log('Données du compte reçues:', account);
            // this.updateAccountInfo(account.account);

            // Chargement des transactions - Cette URL est correcte
            console.log('Chargement des transactions...');
            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions`,  // URL pour les transactions
                method: 'GET',
                error: (xhr, status, error) => {
                    console.error('Erreur lors du chargement des transactions:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error
                    });
                }
            });

            console.log("response : " + response + "success : " + response.success);

            if (!response) {
                throw new Error(response.message || 'Erreur lors du chargement des transactions');
            }

            console.log('Transactions reçues:', response.transactions);

            if (Array.isArray(response.transactions)) {
                this.transactions = response.transactions;
                console.log(`${this.transactions.length} transactions chargées`);
                this.filterTransactions();
            } else {
                console.error('Format de transactions invalide:', response.transactions);
                throw new Error('Format de données invalide pour les transactions');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            this.showAlert('danger',
                `Erreur lors du chargement des données: ${error.message || 'Erreur inconnue'}`
            );

            // Réinitialiser les données en cas d'erreur
            this.transactions = [];
            this.filterTransactions();
        } finally {
            $('#loadingIndicator')?.hide();
        }
    }

    // Méthode utilitaire pour l'affichage des alertes
    showAlert(type, message, duration = 3000) {
        const alertDiv = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('.container').prepend(alertDiv);

        setTimeout(() => {
            alertDiv.alert('close');
        }, duration);
    }

    // Méthode pour mettre à jour les informations du compte
    updateAccountInfo(account) {
        if (!account) {
            console.error('Tentative de mise à jour avec des données de compte nulles');
            return;
        }

        try {
            $('#accountName').text(account.name || 'Compte sans nom');
            $('#accountType').text(account.type === 'current' ? 'Compte Courant' : 'Compte Épargne');
            $('#accountBalance').text((account.balance || 0).toFixed(2));
            document.title = `${account.name || 'Compte'} - Banque en Ligne`;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des informations du compte:', error);
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
            console.log("No transaction");
            $('#transactionsList').hide();
            $('#noTransactions').show();
            return;
        }

        $('#transactionsList').show();
        $('#noTransactions').hide();
        console.log("show transactions");

        transactions.forEach(transaction => {
            console.log("transaction : " + transaction);
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
                    
                    <td>${transaction.balance} €</td>
                </tr>
            `;
            // <td>${transaction.balance.toFixed(2)} €</td>
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
        console.log("fetch account data");
        const response = await $.get(`/api/accounts/${this.accountId}`);
        console.log("account data response : " + response.account);
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