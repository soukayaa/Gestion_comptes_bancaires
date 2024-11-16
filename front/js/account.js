class Account {
    constructor() {
        this.accountId = window.location.pathname.split('/').pop();
        this.initializeDateInputs();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeDateInputs() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        $('#endDate').val(formattedDate);
        $('#startDate').attr('max', formattedDate);
        const startDate = $('#startDate').val();
        if (startDate) {
            $('#endDate').attr('min', startDate);
        }
    }

    initializeEventListeners() {
        // Add transaction
        $('#newTransactionBtn').click(() => $('#newTransactionModal').modal('show'));
        $('#newTransactionForm').on('submit', (e) => this.handleNewTransaction(e));

        // Filtering events
        $('#typeFilter').on('change', () => this.fetchFilteredTransactions());
        $('#periodFilter').on('change', () => this.handlePeriodChange());
        $('#startDate').on('change', (e) => this.handleStartDateChange(e));
        $('#endDate').on('change', (e) => this.handleEndDateChange(e));

        // Download history
        $('#downloadHistoryBtn').click(() => this.downloadHistory());

        // Delete account
        $('#deleteAccountBtn').click(() => this.handleDeleteAccount());

        // Set alert
        $('#setAlertBtn').click(() => this.handleSetAlert());
    }

    async loadInitialData() {
        try {
            console.log('Chargement des données initiales...');
            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions`,
                method: 'GET',
                error: (xhr) => this.handleApiError(xhr)
            });

            if (response) {
                this.balance = response.balance || 0;
                $('#accountBalance').text(this.balance.toFixed(2));

                if (Array.isArray(response.transactions)) {
                    this.renderTransactions(response.transactions);
                } else {
                    throw new Error('Format de données invalide pour les transactions');
                }
            }
        } catch (error) {
            this.handleError('Chargement des données', error);
        }
    }

    handleStartDateChange(e) {
        const startDate = e.target.value;
        const endDate = $('#endDate').val();
        $('#endDate').attr('min', startDate);
        if (endDate && endDate < startDate) {
            $('#endDate').val(startDate);
            this.showAlert('warning', 'La date de fin a été ajustée pour être égale à la date de début');
        }
        this.fetchFilteredTransactions();
    }

    handleEndDateChange(e) {
        const endDate = e.target.value;
        const startDate = $('#startDate').val();
        $('#startDate').attr('max', endDate);
        if (startDate && startDate > endDate) {
            $('#startDate').val(endDate);
            this.showAlert('warning', 'La date de début a été ajustée pour être égale à la date de fin');
        }
        this.fetchFilteredTransactions();
    }

    handlePeriodChange() {
        const period = $('#periodFilter').val();
        if (period === 'custom') {
            $('#customDateRange').show();
            if (!$('#startDate').val() && $('#endDate').val()) {
                const endDate = new Date($('#endDate').val());
                const startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 30);
                const formattedStartDate = startDate.toISOString().split('T')[0];
                $('#startDate').val(formattedStartDate);
                $('#endDate').attr('min', formattedStartDate);
            }
        } else {
            $('#customDateRange').hide();
        }
        this.fetchFilteredTransactions();
    }

    async updateAccountBalance() {
        try {
            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions`,
                method: 'GET',
                error: (xhr) => this.handleApiError(xhr)
            });

            if (response && response.balance !== undefined) {
                $('#accountBalance').text(response.balance.toFixed(2));
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du solde:', error);
        }
    }

    async handleNewTransaction(e) {
        e.preventDefault();
        const form = $('#newTransactionForm');
        const type = form.find('[name="type"]').val();
        const amount = parseFloat(form.find('[name="amount"]').val());

        try {
            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ type, amount })
            });

            $('#newTransactionModal').modal('hide');
            form[0].reset();

            await this.updateAccountBalance();

            await this.fetchFilteredTransactions();

            this.showAlert('success', 'Transaction effectuée avec succès');

            if (response.notification) {
                this.showAlert('warning', response.notification);
            }
        } catch (error) {
            this.handleError('Création de transaction', error);
        }
    }


    async downloadHistory() {
        try {
            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions/download`,
                method: 'GET',
                xhrFields: {
                    responseType: 'blob'
                }
            });

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
            this.handleError('Téléchargement de l\'historique', error);
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
            }, 500);
        } catch (error) {
            this.handleError('Suppression du compte', error);
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
                url: `/api/accounts/${this.accountId}/threshold`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ threshold: amount })
            });

            this.showAlert('success', 'Seuil d\'alerte défini avec succès');
        } catch (error) {
            this.handleError('Définition du seuil', error);
        }
    }

    async fetchFilteredTransactions() {
        try {
            const typeFilter = $('#typeFilter').val();
            const periodFilter = $('#periodFilter').val();

            if (typeFilter === 'all' && periodFilter === 'all') {
                return await this.loadInitialData();
            }

            const params = new URLSearchParams();

            if (typeFilter !== 'all') {
                params.append('type', typeFilter);
            }

            if (periodFilter === 'custom') {
                const startDate = $('#startDate').val();
                let endDate = $('#endDate').val() || new Date().toISOString().split('T')[0];

                if (startDate && endDate && startDate > endDate) {
                    this.showAlert('danger', 'La date de début ne peut pas être postérieure à la date de fin');
                    return;
                }

                if (endDate) {
                    const adjustedEndDate = new Date(endDate);
                    adjustedEndDate.setHours(23, 59, 59, 999);
                    endDate = adjustedEndDate.toISOString();
                }

                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            } else if (periodFilter !== 'all') {
                params.append('period', periodFilter);
            }

            const response = await $.ajax({
                url: `/api/accounts/${this.accountId}/transactions/history?${params.toString()}`,
                method: 'GET',
                error: (xhr) => this.handleApiError(xhr)
            });

            if (response && response.transactions) {
                this.renderTransactions(response.transactions);
            } else {
                $('#transactionsList').hide();
                $('#noTransactions').show();
            }
        } catch (error) {
            this.handleError('Récupération des transactions', error);
        }
    }

    renderTransactions(transactions) {
        const tbody = $('#transactionsList');
        tbody.empty();

        if (!transactions || transactions.length === 0) {
            $('#transactionsList').hide();
            $('#noTransactions').show();
            return;
        }

        $('#transactionsList').show();
        $('#noTransactions').hide();

        transactions.forEach(transaction => {
            const balanceDisplay = transaction.balanceAfterTransaction !== undefined
                && transaction.balanceAfterTransaction !== null
                ? `${transaction.balanceAfterTransaction.toFixed(2)} €`
                : '-';

            const row = `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>
                        <span class="badge ${transaction.type === 'dépôt' ? 'bg-success' : 'bg-danger'}">
                            ${transaction.type === 'dépôt' ? 'Dépôt' : 'Retrait'}
                        </span>
                    </td>
                    <td class="text-${transaction.type === 'dépôt' ? 'success' : 'danger'}">
                        ${transaction.type === 'dépôt' ? '+' : '-'}${transaction.amount.toFixed(2)} €
                    </td>
                    <td>${balanceDisplay}</td>
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

    handleApiError(xhr) {
        if (xhr.status === 401) {
            console.log('Session expirée ou non autorisé, redirection vers la page de connexion');
            window.location.href = '/login';
        }
    }

    handleError(operation, error) {
        console.error(`Erreur lors de ${operation}:`, error);
        this.showAlert('danger',
            error.responseJSON?.error ||
            error.message ||
            `Erreur lors de ${operation.toLowerCase()}`
        );
    }

    showAlert(type, message) {
        const alertDiv = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        $('#showAlert').prepend(alertDiv);

        setTimeout(() => {
            alertDiv.fadeOut('slow', function () {
                $(this).remove();
            });
        }, 5000);
    }
}

// Initialize the account details page
$(document).ready(() => {
    new Account();
});