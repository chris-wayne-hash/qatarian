/**
 * Utility functions for PetroTrade Portal
 */

const Utils = {
    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    // Format percentage
    formatPercent: function(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: 'exceptZero'
        }).format(value / 100);
    },

    // Generate random number in range
    randomInRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Generate random integer in range
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Generate random stock data
    generateStockData: function(days = 30) {
        const data = [];
        let price = this.randomInRange(50, 200);
        
        for (let i = 0; i < days; i++) {
            const change = this.randomInRange(-3, 3);
            price += price * (change / 100);
            price = Math.max(price, 10); // Ensure price doesn't go too low
            
            data.push({
                day: i + 1,
                price: parseFloat(price.toFixed(2)),
                volume: this.randomInt(100000, 5000000)
            });
        }
        
        return data;
    },

    // Generate random transaction
    generateTransaction: function() {
        const types = ['Deposit', 'Withdrawal', 'Dividend', 'Fee'];
        const statuses = ['Completed', 'Pending', 'Failed'];
        const descriptions = [
            'Bank Transfer',
            'Wire Transfer',
            'Stock Dividend',
            'Account Maintenance Fee',
            'Interest Payment'
        ];
        
        const amount = this.randomInRange(-5000, 5000);
        const type = amount > 0 ? 'Credit' : 'Debit';
        const date = new Date(Date.now() - this.randomInt(0, 30) * 24 * 60 * 60 * 1000);
        
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            description: descriptions[this.randomInt(0, descriptions.length - 1)],
            type: type,
            amount: parseFloat(amount.toFixed(2)),
            status: statuses[this.randomInt(0, statuses.length - 1)],
            reference: 'REF-' + this.randomInt(100000, 999999)
        };
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Validate email
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate password strength
    validatePassword: function(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        };
    },

    // Generate CSV from data
    generateCSV: function(data, headers) {
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header.toLowerCase()] || row[header] || '';
                // Handle commas in values
                if (typeof value === 'string' && value.includes(',')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    },

    // Download file
    downloadFile: function(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Get query parameter
    getQueryParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // Set query parameter
    setQueryParam: function(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    },

    // Remove query parameter
    removeQueryParam: function(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    },

    // Copy to clipboard
    copyToClipboard: function(text) {
        return navigator.clipboard.writeText(text);
    },

    // Show notification
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 9999;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                }
                .notification-success { border-left: 4px solid #00c853; }
                .notification-error { border-left: 4px solid #ff3d00; }
                .notification-info { border-left: 4px solid #1a3a8f; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
};