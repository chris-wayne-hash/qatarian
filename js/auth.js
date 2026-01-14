
/**
 * Authentication module for PetroTrade Portal
 */

const Auth = {
    // Demo user database
    users: [
        {
            username: 'MaryJane',
            password: 'Godisgood',
            email: 'mj@petrotrade.com',
            fullName: 'Mary Jane',
            balance: 42300000.00,
            lastLogin: null
        }
    ],

    // IRS Tokens database (single-use tokens)
    irsTokens: [
        { token: 'IRSINH2026478192', used: false, issuedTo: null, usedAt: null },
        { token: 'IRSINH2026008967', used: false, issuedTo: null, usedAt: null },
        { token: 'IRSINH2026458756', used: false, issuedTo: null, usedAt: null },
        { token: 'IRSINH2026774321', used: false, issuedTo: null, usedAt: null },
        { token: 'IRSINH2026987342', used: false, issuedTo: null, usedAt: null }
    ],

    // Current session
    currentUser: null,
    sessionTimeout: 15 * 60 * 1000, // 15 minutes

    // Initialize auth module
    init: function() {
        this.loadTokenState();
        this.checkSession();
        this.setupAutoLogout();
    },

    // Load token state from localStorage
    loadTokenState: function() {
        const savedTokens = localStorage.getItem('irsTokensState');
        if (savedTokens) {
            this.irsTokens = JSON.parse(savedTokens);
        }
    },

    // Save token state to localStorage
    saveTokenState: function() {
        localStorage.setItem('irsTokensState', JSON.stringify(this.irsTokens));
    },

   

    // Login function - UPDATED to ensure proper JSON storage
login: function(username, password) {
    const user = this.users.find(u => 
        u.username === username && u.password === password
    );

    if (user) {
        // Create a fresh user object to avoid reference issues
        this.currentUser = {
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            balance: user.balance,
            lastLogin: new Date().toISOString()
        };
        
        // Always store as JSON string
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', new Date().getTime());
        
        console.log('User logged in and stored as JSON:', username);
        return true;
    }
    
    console.log('Login failed for user:', username);
    return false;
},
    // Logout function
    logout: function() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');
        
        // Clear session data but keep token state
        sessionStorage.clear();
    },

    // Check if user is authenticated
    isAuthenticated: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
        const currentTime = new Date().getTime();
        
        if (isLoggedIn && (currentTime - loginTime) < this.sessionTimeout) {
            return true;
        }
        
        // Auto logout if session expired
        if (isLoggedIn) {
            this.logout();
        }
        
        return false;
    },

    // Verify IRS token (single-use)
    // Verify IRS token (single-use)
verifyIRSToken: function(token) {
    // Trim and uppercase for consistency
    const cleanToken = token.trim().toUpperCase();
    
    // Find token in the list (case-insensitive check)
    const tokenEntry = this.irsTokens.find(t => 
        t.token.toUpperCase() === cleanToken
    );
    
    console.log('Verifying token:', cleanToken);
    console.log('Token entry found:', tokenEntry);
    console.log('Token used status:', tokenEntry ? tokenEntry.used : 'not found');
    
    if (tokenEntry && !tokenEntry.used) {
        // Mark token as used
        tokenEntry.used = true;
        tokenEntry.issuedTo = this.currentUser ? this.currentUser.username : 'unknown';
        tokenEntry.usedAt = new Date().toISOString();
        
        // Save token state
        this.saveTokenState();
        
        // Store current token usage
        localStorage.setItem('currentToken', tokenEntry.token); // Store the original token
        localStorage.setItem('tokenUsedTime', new Date().getTime());
        
        console.log('Token verified successfully for user:', tokenEntry.issuedTo);
        return true;
    }
    
    console.log('Token verification failed');
    return false;
},


    // Check if current session has valid token access
    // Check if current session has valid token access
hasValidTokenAccess: function() {
    const currentToken = localStorage.getItem('currentToken');
    if (!currentToken) {
        console.log('No current token found');
        return false;
    }
    
    const tokenEntry = this.irsTokens.find(t => t.token === currentToken);
    if (!tokenEntry || tokenEntry.used !== true) {
        console.log('Token not found or not used:', currentToken);
        return false;
    }
    
    // Get current user
    const currentUser = this.getCurrentUser();
    if (currentUser && tokenEntry.issuedTo !== currentUser.username) {
        console.log('Token was used by different user:', tokenEntry.issuedTo, 'current:', currentUser.username);
        return false;
    }
    
    // Token access is valid for current session only
    const tokenActive = sessionStorage.getItem('tokenActive') === 'true';
    console.log('Token active status:', tokenActive);
    
    return tokenActive;
},
    // Activate token for current session
    activateTokenSession: function() {
        sessionStorage.setItem('tokenActive', 'true');
    },

    // Deactivate token session
    deactivateTokenSession: function() {
        sessionStorage.removeItem('tokenActive');
    },

    // Get available tokens (for display)
    getAvailableTokens: function() {
        return this.irsTokens.filter(token => !token.used);
    },

    // Get used tokens
    getUsedTokens: function() {
        return this.irsTokens.filter(token => token.used);
    },

    // Reset all tokens (for testing/demo purposes)
    resetAllTokens: function() {
        this.irsTokens.forEach(token => {
            token.used = false;
            token.issuedTo = null;
            token.usedAt = null;
        });
        this.saveTokenState();
        localStorage.removeItem('currentToken');
        localStorage.removeItem('tokenUsedTime');
        this.deactivateTokenSession();
    },

    // Fix existing localStorage data
fixLocalStorageData: function() {
    console.log('Checking localStorage data...');
    
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
        console.log('No user data found in localStorage');
        return;
    }
    
    try {
        // Try to parse
        JSON.parse(storedUser);
        console.log('User data is valid JSON');
    } catch (error) {
        console.log('Fixing invalid user data:', storedUser);
        
        // If it's a string like "demo", convert to proper JSON
        if (typeof storedUser === 'string' && storedUser.length > 0) {
            const demoUser = this.users.find(u => u.username === storedUser) || this.users[0];
            localStorage.setItem('currentUser', JSON.stringify(demoUser));
            console.log('Fixed user data for:', storedUser);
        }
    }
},

// Call this in init
init: function() {
    this.fixLocalStorageData(); // Add this line
    this.loadTokenState();
    this.checkSession();
    this.setupAutoLogout();
},

    // Get current user
    // getCurrentUser: function() {
    //     if (this.currentUser) {
    //         return this.currentUser;
    //     }
        
    //     const storedUser = localStorage.getItem('currentUser');
    //     if (storedUser) {
    //         this.currentUser = JSON.parse(storedUser);
    //         return this.currentUser;
    //     }
        
    //     return null;
    // },
    
    // Get current user - FIXED VERSION
getCurrentUser: function() {
    // Return cached user if available
    if (this.currentUser) {
        return this.currentUser;
    }
    
    // Get stored user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    
    // If no stored user, return null
    if (!storedUser) {
        console.log('No stored user found');
        return null;
    }
    
    try {
        // Try to parse as JSON
        const userData = JSON.parse(storedUser);
        
        // Check if it's a valid user object
        if (userData && typeof userData === 'object' && userData.username) {
            this.currentUser = userData;
            console.log('User loaded from localStorage:', userData.username);
            return this.currentUser;
        } else {
            // If it's just a username string (like "demo"), create user object
            console.log('Found username string, creating user object');
            const demoUser = this.users.find(u => u.username === storedUser) || this.users[0];
            this.currentUser = { ...demoUser };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return this.currentUser;
        }
    } catch (error) {
        console.error('Error parsing user data:', error, 'Data:', storedUser);
        
        // If parsing fails, check if it's a username string
        if (typeof storedUser === 'string' && storedUser.length > 0) {
            console.log('Parsing as username string:', storedUser);
            const demoUser = this.users.find(u => u.username === storedUser) || this.users[0];
            this.currentUser = { ...demoUser };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return this.currentUser;
        }
        
        // If all else fails, return demo user
        console.log('Using default user');
        this.currentUser = { ...this.users[0] };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        return this.currentUser;
    }
},

    // Update user balance
    updateBalance: function(amount) {
        const user = this.getCurrentUser();
        if (user) {
            user.balance += amount;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user.balance;
        }
        return null;
    },

    // Get user balance
    getBalance: function() {
        const user = this.getCurrentUser();
        return user ? user.balance : 0;
    },

    // Check session validity
    checkSession: function() {
        if (!this.isAuthenticated()) {
            // Redirect to login if not authenticated
            if (!window.location.href.includes('index.html')) {
                window.location.href = 'index.html';
            }
        }
    },

    // Setup auto logout timer
    setupAutoLogout: function() {
        if (this.isAuthenticated()) {
            const loginTime = parseInt(localStorage.getItem('loginTime') || '0');
            const currentTime = new Date().getTime();
            const timeRemaining = this.sessionTimeout - (currentTime - loginTime);
            
            if (timeRemaining > 0) {
                setTimeout(() => {
                    if (this.isAuthenticated()) {
                        this.logout();
                        alert('Your session has expired. Please login again.');
                        window.location.href = 'index.html';
                    }
                }, timeRemaining);
            }
        }
    },

    // Reset session timer on user activity
    resetSessionTimer: function() {
        if (this.isAuthenticated()) {
            localStorage.setItem('loginTime', new Date().getTime());
            this.setupAutoLogout();
        }
    }
};

// Set up activity listeners for session reset
document.addEventListener('DOMContentLoaded', function() {
    if (Auth.isAuthenticated()) {
        // Reset session timer on user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                Auth.resetSessionTimer();
            });
        });
    }

});


