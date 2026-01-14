/**
 * IRS Portal module
 */

const IRS = {
    // User transactions
    transactions: [
        {
            date: 'Oct 15, 2025',
            description: 'Quarterly Dividend - XOM',
            type: 'Credit',
            amount: 425.50,
            reference: 'DIV-2025-XOM-015'
        },
        {
            date: 'Oct 10, 2025',
            description: 'Bank Transfer',
            type: 'Credit',
            amount: 5000.00,
            reference: 'BT-2025-8473'
        }
    ],

    // Withdrawal limits
    withdrawalLimits: {
        daily: 10000.00,
        weekly: 25000.00,
        monthly: 50000.00
    },

    // Today's withdrawals
    todaysWithdrawals: [],

    // Initialize IRS module
    init: function() {
        this.loadTransactions();
        this.renderBalanceChart();
        this.setupWithdrawalValidation();
        
        // Mark token as accessed
        sessionStorage.setItem('tokenAccessed', 'true');
    },

    // Load transactions from localStorage or use default
    loadTransactions: function() {
        const savedTransactions = localStorage.getItem('irsTransactions');
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
        
        const savedWithdrawals = localStorage.getItem('todaysWithdrawals');
        if (savedWithdrawals) {
            this.todaysWithdrawals = JSON.parse(savedWithdrawals);
        }
    },

    // Save transactions to localStorage
    saveTransactions: function() {
        localStorage.setItem('irsTransactions', JSON.stringify(this.transactions));
        localStorage.setItem('todaysWithdrawals', JSON.stringify(this.todaysWithdrawals));
    },

    // Process withdrawal
    processWithdrawal: function(amount) {
        const user = Auth.getCurrentUser();
        if (!user) return false;

        // Check if amount is valid
        if (amount <= 0 || amount > user.balance) {
            Utils.showNotification('Invalid withdrawal amount', 'error');
            return false;
        }

        // Check daily limit
        const today = new Date().toDateString();
        const todayWithdrawals = this.todaysWithdrawals
            .filter(w => new Date(w.date).toDateString() === today)
            .reduce((sum, w) => sum + w.amount, 0);

        if (todayWithdrawals + amount > this.withdrawalLimits.daily) {
            Utils.showNotification(`Daily withdrawal limit exceeded. Limit: ${Utils.formatCurrency(this.withdrawalLimits.daily)}`, 'error');
            return false;
        }

        // Update user balance
        const newBalance = Auth.updateBalance(-amount);
        if (newBalance === null) return false;

        // Add transaction
        const transaction = {
            date: new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            description: 'Withdrawal - ' + document.getElementById('withdrawalMethod').options[document.getElementById('withdrawalMethod').selectedIndex].text,
            type: 'Debit',
            amount: -amount,
            reference: 'WD-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        };

        this.transactions.unshift(transaction);
        this.todaysWithdrawals.push({
            date: new Date(),
            amount: amount
        });

        // Save transactions
        this.saveTransactions();

        // Update UI
        this.updateBalanceDisplay(newBalance);

        return true;
    },

    // Update balance display
    updateBalanceDisplay: function(balance) {
        const balanceElement = document.getElementById('currentBalance');
        if (balanceElement) {
            balanceElement.textContent = Utils.formatCurrency(balance);
        }
    },

    // Get all transactions
    getTransactions: function() {
        return this.transactions;
    },

    // Export transactions as CSV
    exportTransactions: function() {
        const headers = ['Date', 'Description', 'Type', 'Amount', 'Reference'];
        const csvData = this.transactions.map(t => ({
            date: t.date,
            description: t.description,
            type: t.type,
            amount: Utils.formatCurrency(t.amount),
            status: t.status,
            reference: t.reference
        }));

        const csv = Utils.generateCSV(csvData, headers);
        const filename = `irs-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        
        Utils.downloadFile(csv, filename, 'text/csv');
        Utils.showNotification('Transactions exported successfully', 'success');
    },

    // Render balance history chart
    renderBalanceChart: function() {
        const canvas = document.getElementById('balanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 200;

        // Generate balance history for last 6 months
        const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
        const balances = [38500, 39500, 41000, 40500, 42000, 42500, 42850.75];

        // Chart dimensions
        const padding = { top: 10, right: 10, bottom: 30, left: 50 };
        const width = canvas.width - padding.left - padding.right;
        const height = canvas.height - padding.top - padding.bottom;

        // Scales
        const xScale = width / (months.length - 1);
        const yMin = Math.min(...balances) * 0.95;
        const yMax = Math.max(...balances) * 1.05;
        const yScale = height / (yMax - yMin);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw area under line
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + height - (balances[0] - yMin) * yScale);

        for (let i = 1; i < balances.length; i++) {
            const x = padding.left + i * xScale;
            const y = padding.top + height - (balances[i] - yMin) * yScale;
            ctx.lineTo(x, y);
        }

        // Close the path for the area
        ctx.lineTo(padding.left + (balances.length - 1) * xScale, padding.top + height);
        ctx.lineTo(padding.left, padding.top + height);
        ctx.closePath();

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + height);
        gradient.addColorStop(0, 'rgba(26, 58, 143, 0.2)');
        gradient.addColorStop(1, 'rgba(26, 58, 143, 0.05)');

        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + height - (balances[0] - yMin) * yScale);

        for (let i = 1; i < balances.length; i++) {
            const x = padding.left + i * xScale;
            const y = padding.top + height - (balances[i] - yMin) * yScale;
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#1a3a8f';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw points
        balances.forEach((balance, i) => {
            const x = padding.left + i * xScale;
            const y = padding.top + height - (balance - yMin) * yScale;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#1a3a8f';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 4; i++) {
            const balance = yMin + (yMax - yMin) * i / 4;
            const y = padding.top + height - (height * i / 4);
            ctx.fillText(Utils.formatCurrency(balance), padding.left - 10, y + 4);
        }

        // X-axis labels
        ctx.textAlign = 'center';
        months.forEach((month, i) => {
            const x = padding.left + i * xScale;
            ctx.fillText(month, x, padding.top + height + 15);
        });
    },

    // Setup withdrawal form validation
    setupWithdrawalValidation: function() {
        const amountInput = document.getElementById('withdrawalAmount');
        const methodSelect = document.getElementById('withdrawalMethod');
        const accountSelect = document.getElementById('accountSelection');

        if (amountInput) {
            amountInput.addEventListener('input', function() {
                const value = parseFloat(this.value);
                const maxAmount = IRS.withdrawalLimits.daily;
                
                if (value > maxAmount) {
                    this.value = maxAmount;
                    Utils.showNotification(`Maximum withdrawal amount is ${Utils.formatCurrency(maxAmount)}`, 'warning');
                }
                
                // Format with 2 decimal places
                if (this.value.includes('.') && this.value.split('.')[1].length > 2) {
                    this.value = parseFloat(this.value).toFixed(2);
                }
            });
        }

        if (methodSelect) {
            methodSelect.addEventListener('change', function() {
                // In a real app, you might update fees or processing times here
                const selected = this.options[this.selectedIndex].text;
                console.log('Withdrawal method selected:', selected);
            });
        }

        if (accountSelect) {
            accountSelect.addEventListener('change', function() {
                // In a real app, you might validate account status here
                const selected = this.options[this.selectedIndex].text;
                console.log('Account selected:', selected);
            });
        }
    },

    // Delete a transaction by index
    deleteTransaction: function(index) {
        try {
            // Get current transactions from localStorage
            const transactions = this.getTransactions();
            
            // Remove the transaction at the specified index
            if (index >= 0 && index < transactions.length) {
                transactions.splice(index, 1);
                
                // Save updated transactions back to localStorage
                localStorage.setItem('irs_transactions', JSON.stringify(transactions));
                
                // Show success message
                alert('Transaction deleted successfully!');
                
                // Return true for success
                return true;
            } else {
                alert('Error: Transaction index is invalid.');
                return false;
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction. Please try again.');
            return false;
        }
    },

    // Get withdrawal limits
    getWithdrawalLimits: function() {
        return { ...this.withdrawalLimits };
    },

    // Get today's withdrawal total
    getTodayWithdrawalTotal: function() {
        const today = new Date().toDateString();
        return this.todaysWithdrawals
            .filter(w => new Date(w.date).toDateString() === today)
            .reduce((sum, w) => sum + w.amount, 0);
    },

    // Reset daily withdrawals (for testing)
    resetDailyWithdrawals: function() {
        this.todaysWithdrawals = [];
        this.saveTransactions();
        Utils.showNotification('Daily withdrawals reset', 'info');
    }
};