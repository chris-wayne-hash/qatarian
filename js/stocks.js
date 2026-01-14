/**
 * Stock market simulation module
 */

const Stocks = {
    // Oil company stocks data
    oilStocks: [
        {
            symbol: 'XOM',
            name: 'Exxon Mobil Corporation',
            price: 105.34,
            change: 1.24,
            changePercent: 1.19,
            volume: 15200000,
            marketCap: '442.5B',
            sector: 'Integrated Oil & Gas'
        },
        {
            symbol: 'CVX',
            name: 'Chevron Corporation',
            price: 162.89,
            change: -0.82,
            changePercent: -0.50,
            volume: 9800000,
            marketCap: '307.8B',
            sector: 'Integrated Oil & Gas'
        },
        {
            symbol: 'COP',
            name: 'ConocoPhillips',
            price: 118.42,
            change: 2.15,
            changePercent: 1.85,
            volume: 6500000,
            marketCap: '142.3B',
            sector: 'Exploration & Production'
        },
        {
            symbol: 'SLB',
            name: 'Schlumberger Limited',
            price: 52.18,
            change: 0.45,
            changePercent: 0.87,
            volume: 8200000,
            marketCap: '74.2B',
            sector: 'Oilfield Services'
        },
        {
            symbol: 'BP',
            name: 'BP plc',
            price: 37.65,
            change: -0.32,
            changePercent: -0.84,
            volume: 12500000,
            marketCap: '108.9B',
            sector: 'Integrated Oil & Gas'
        },
        {
            symbol: 'TOT',
            name: 'TotalEnergies SE',
            price: 68.91,
            change: 0.78,
            changePercent: 1.15,
            volume: 3200000,
            marketCap: '165.4B',
            sector: 'Integrated Oil & Gas'
        },
        {
            symbol: 'EOG',
            name: 'EOG Resources',
            price: 126.73,
            change: 3.42,
            changePercent: 2.77,
            volume: 4100000,
            marketCap: '74.1B',
            sector: 'Exploration & Production'
        },
        {
            symbol: 'HAL',
            name: 'Halliburton Company',
            price: 38.25,
            change: 0.62,
            changePercent: 1.65,
            volume: 9500000,
            marketCap: '34.8B',
            sector: 'Oilfield Services'
        }
    ],

    // WTI and Brent crude prices
    crudePrices: {
        wti: 78.42,
        brent: 82.15,
        lastUpdate: new Date()
    },

    // Initialize stock module
    init: function() {
        this.updateStockPrices();
        this.renderStockTable();
        this.startTicker();
        this.startPriceUpdates();
    },

    // Update stock prices with random fluctuations
    updateStockPrices: function() {
        this.oilStocks.forEach(stock => {
            // Random price change between -2% and +2%
            const changePercent = (Math.random() * 4 - 2) / 100;
            const oldPrice = stock.price;
            stock.price = parseFloat((oldPrice * (1 + changePercent)).toFixed(2));
            stock.change = parseFloat((stock.price - oldPrice).toFixed(2));
            stock.changePercent = parseFloat((changePercent * 100).toFixed(2));
            
            // Update volume with random fluctuation
            stock.volume = Math.floor(stock.volume * (0.8 + Math.random() * 0.4));
        });

        // Update crude prices
        const wtiChange = (Math.random() * 2 - 1) / 100;
        const brentChange = (Math.random() * 2 - 1) / 100;
        
        this.crudePrices.wti = parseFloat((this.crudePrices.wti * (1 + wtiChange)).toFixed(2));
        this.crudePrices.brent = parseFloat((this.crudePrices.brent * (1 + brentChange)).toFixed(2));
        this.crudePrices.lastUpdate = new Date();

        // Update UI
        this.updatePriceDisplays();
        this.renderStockTable();
    },

    // Update price displays on dashboard
    updatePriceDisplays: function() {
        const wtiElement = document.getElementById('wtiPrice');
        const brentElement = document.getElementById('brentPrice');
        const topGainerElement = document.getElementById('topGainer');
        
        if (wtiElement) {
            wtiElement.textContent = Utils.formatCurrency(this.crudePrices.wti);
        }
        
        if (brentElement) {
            brentElement.textContent = Utils.formatCurrency(this.crudePrices.brent);
        }
        
        if (topGainerElement) {
            // Find top gainer
            const topGainer = [...this.oilStocks].sort((a, b) => b.changePercent - a.changePercent)[0];
            topGainerElement.textContent = topGainer.symbol;
            
            // Update change display
            const gainerChange = document.querySelector('.metric-change.positive');
            if (gainerChange) {
                gainerChange.innerHTML = `<i class="fas fa-arrow-up"></i><span>+${topGainer.changePercent.toFixed(2)}%</span>`;
            }
        }
    },

    // Render stock table
    renderStockTable: function() {
        const tableBody = document.getElementById('stocksTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.oilStocks.forEach(stock => {
            const row = document.createElement('tr');
            
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';
            const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            row.innerHTML = `
                <td><strong>${stock.symbol}</strong></td>
                <td>${stock.name}</td>
                <td>${Utils.formatCurrency(stock.price)}</td>
                <td class="${changeClass}">
                    <i class="fas ${changeIcon}"></i>
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
                </td>
                <td>${stock.volume.toLocaleString()}</td>
                <td>
                    <button class="btn-small" onclick="Stocks.buyStock('${stock.symbol}')">Buy</button>
                    <button class="btn-small btn-secondary" onclick="Stocks.sellStock('${stock.symbol}')">Sell</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    },

    // Start live ticker
    startTicker: function() {
        const tickerContent = document.getElementById('tickerContent');
        if (!tickerContent) return;

        // Create ticker items
        let tickerHTML = '';
        this.oilStocks.forEach(stock => {
            const changeClass = stock.change >= 0 ? 'positive' : 'negative';
            tickerHTML += `
                <div class="ticker-item">
                    <span class="ticker-symbol">${stock.symbol}</span>
                    <span class="ticker-price">${Utils.formatCurrency(stock.price)}</span>
                    <span class="ticker-change ${changeClass}">
                        ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                    </span>
                </div>
            `;
        });

        // Duplicate content for seamless loop
        tickerContent.innerHTML = tickerHTML + tickerHTML;

        // Handle pause/play
        const pauseBtn = document.getElementById('pauseTicker');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', function() {
                const isPaused = tickerContent.style.animationPlayState === 'paused';
                tickerContent.style.animationPlayState = isPaused ? 'running' : 'paused';
                this.innerHTML = isPaused ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            });
        }
    },

    // Start periodic price updates
    startPriceUpdates: function() {
        // Update prices every 10 seconds
        setInterval(() => {
            this.updateStockPrices();
        }, 10000);
    },

    // Simulate buying stock
    buyStock: function(symbol) {
        const stock = this.oilStocks.find(s => s.symbol === symbol);
        if (!stock) return;

        const quantity = prompt(`How many shares of ${symbol} would you like to buy?\nCurrent price: ${Utils.formatCurrency(stock.price)}`);
        
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            const cost = stock.price * parseInt(quantity);
            const confirmBuy = confirm(`Total cost: ${Utils.formatCurrency(cost)}\n\nConfirm purchase?`);
            
            if (confirmBuy) {
                Utils.showNotification(`Order placed to buy ${quantity} shares of ${symbol}`, 'success');
            }
        }
    },

    // Simulate selling stock
    sellStock: function(symbol) {
        const stock = this.oilStocks.find(s => s.symbol === symbol);
        if (!stock) return;

        const quantity = prompt(`How many shares of ${symbol} would you like to sell?\nCurrent price: ${Utils.formatCurrency(stock.price)}`);
        
        if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
            const value = stock.price * parseInt(quantity);
            const confirmSell = confirm(`Total value: ${Utils.formatCurrency(value)}\n\nConfirm sale?`);
            
            if (confirmSell) {
                Utils.showNotification(`Order placed to sell ${quantity} shares of ${symbol}`, 'success');
            }
        }
    },

    // Get stock by symbol
    getStock: function(symbol) {
        return this.oilStocks.find(s => s.symbol === symbol);
    },

    // Get all stocks
    getAllStocks: function() {
        return [...this.oilStocks];
    },

    // Get market summary
    getMarketSummary: function() {
        const totalVolume = this.oilStocks.reduce((sum, stock) => sum + stock.volume, 0);
        const gainers = this.oilStocks.filter(s => s.change > 0).length;
        const losers = this.oilStocks.filter(s => s.change < 0).length;
        
        return {
            totalStocks: this.oilStocks.length,
            gainers,
            losers,
            unchanged: this.oilStocks.length - gainers - losers,
            totalVolume: totalVolume.toLocaleString(),
            wtiPrice: this.crudePrices.wti,
            brentPrice: this.crudePrices.brent,
            lastUpdate: this.crudePrices.lastUpdate
        };
    }
};