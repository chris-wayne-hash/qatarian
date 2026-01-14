/**
 * Chart rendering module with responsive support and period controls
 */

const Charts = {
    chartInstances: {},
    currentPeriod: '1M',
    resizeObserver: null,
    resizeTimeout: null,

    // Initialize charts with responsive support
    init: function() {
        this.renderAllCharts();
        this.setupChartResize();
        this.setupResponsiveObservers();
        this.setupPeriodControls();
    },

    // Setup period control event listeners
    setupPeriodControls: function() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.updateChartPeriod(period);
                
                // Update active button state
                timeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // Update chart based on time period
    updateChartPeriod: function(period) {
        this.currentPeriod = period;
        
        // Show loading state
        this.showChartLoading();
        
        // Update data based on period
        const chartData = this.generatePeriodData(period);
        
        // Update and redraw charts with new data
        this.updateChartData(chartData);
        this.renderAllCharts();
        
        // Show notification
        Utils.showNotification(`Showing ${period} data`, 'info');
    },

    // Generate data based on selected period
    generatePeriodData: function(period) {
        let days;
        let dataPoints;
        
        switch(period) {
            case '1D':
                days = 1;
                dataPoints = 24; // Hourly data
                break;
            case '1W':
                days = 7;
                dataPoints = 7; // Daily data
                break;
            case '1M':
                days = 30;
                dataPoints = 30; // Daily data
                break;
            case '3M':
                days = 90;
                dataPoints = 90; // Daily data
                break;
            default:
                days = 30;
                dataPoints = 30;
        }
        
        return {
            days: days,
            dataPoints: dataPoints,
            period: period
        };
    },

    // Show loading state on charts
    showChartLoading: function() {
        const canvases = ['lineChart', 'barChart', 'pieChart'];
        
        canvases.forEach(canvasId => {
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const container = canvas.parentElement;
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw loading text
                ctx.fillStyle = '#1a3a8f';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
            }
        });
    },

    // Update chart data based on period
    updateChartData: function(periodData) {
        // This would typically fetch new data from an API
        // For demo, we'll simulate data updates
        
        if (this.chartInstances.line) {
            this.chartInstances.line.periodData = periodData;
        }
        
        if (this.chartInstances.bar) {
            this.chartInstances.bar.periodData = periodData;
        }
        
        if (this.chartInstances.pie) {
            this.chartInstances.pie.periodData = periodData;
        }
    },

    // Render all charts
    renderAllCharts: function() {
        this.renderLineChart();
        this.renderBarChart();
        this.renderPieChart();
    },

    // Render line chart (Oil Price Trend) - Updated with period support
    renderLineChart: function() {
        const canvas = document.getElementById('lineChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        // Set canvas size to match container (responsive)
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.scale(dpr, dpr);

        // Get period data
        const periodData = this.chartInstances.line?.periodData || this.generatePeriodData(this.currentPeriod);
        const isMobile = window.innerWidth <= 768;
        
        // Adjust data points for mobile and period
        let days = periodData.days;
        let dataPoints = periodData.dataPoints;
        
        if (isMobile && days > 30) {
            dataPoints = Math.min(dataPoints, 30); // Limit data points on mobile
        }

        // Generate sample data based on period
        const data = [];
        let price = 75;
        const volatility = this.getVolatilityForPeriod(periodData.period);

        for (let i = 0; i < dataPoints; i++) {
            // Different volatility based on period
            const change = (Math.random() - 0.5) * volatility;
            price += change;
            price = Math.max(price, 70);
            price = Math.min(price, 85);

            data.push({
                point: i + 1,
                price: parseFloat(price.toFixed(2)),
                // Add time labels based on period
                label: this.getLabelForPeriod(periodData.period, i, dataPoints)
            });
        }

        // Responsive padding
        const padding = {
            top: 20,
            right: isMobile ? 10 : 20,
            bottom: isMobile ? 25 : 30,
            left: isMobile ? 40 : 50
        };
        
        const width = rect.width - padding.left - padding.right;
        const height = rect.height - padding.top - padding.bottom;

        // Adjust font sizes for mobile
        const labelFontSize = isMobile ? 10 : 12;
        const titleFontSize = isMobile ? 11 : 14;
        const pointRadius = isMobile ? 3 : 4;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Draw grid - simplified for mobile
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;

        // Horizontal grid lines (fewer on mobile)
        const gridLines = isMobile ? 3 : 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (height * i / gridLines);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width + padding.left, y);
            ctx.stroke();
        }

        // Draw line with responsive width
        ctx.beginPath();
        const xScale = width / (dataPoints - 1);
        const yMin = Math.min(...data.map(d => d.price)) - 2;
        const yMax = Math.max(...data.map(d => d.price)) + 2;
        const yScale = height / (yMax - yMin);

        ctx.moveTo(padding.left, padding.top + height - (data[0].price - yMin) * yScale);

        for (let i = 1; i < data.length; i++) {
            const x = padding.left + i * xScale;
            const y = padding.top + height - (data[i].price - yMin) * yScale;
            ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#1a3a8f';
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw points (fewer on mobile for better performance)
        const pointInterval = isMobile ? Math.max(1, Math.floor(dataPoints / 15)) : 1;
        data.forEach((point, i) => {
            if (i % pointInterval === 0) {
                const x = padding.left + i * xScale;
                const y = padding.top + height - (point.price - yMin) * yScale;

                ctx.beginPath();
                ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#1a3a8f';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });

        // Y-axis labels (responsive font)
        ctx.fillStyle = '#666';
        ctx.font = `${labelFontSize}px Arial`;
        ctx.textAlign = 'right';

        for (let i = 0; i <= gridLines; i++) {
            const priceVal = yMin + (yMax - yMin) * (1 - i / gridLines);
            const y = padding.top + (height * i / gridLines);
            ctx.fillText('$' + priceVal.toFixed(0), padding.left - 8, y + 4);
        }

        // X-axis labels (show fewer on mobile)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#666';
        ctx.font = `${labelFontSize}px Arial`;
        
        const labelInterval = this.getLabelInterval(dataPoints, isMobile);
        for (let i = 0; i < dataPoints; i += labelInterval) {
            const x = padding.left + i * xScale;
            const label = data[i].label || `P${i + 1}`;
            ctx.fillText(label, x, padding.top + height + 15);
        }

        // Draw period title
        ctx.fillStyle = '#1a3a8f';
        ctx.font = `bold ${titleFontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`Oil Price - ${periodData.period}`, padding.left, padding.top - 5);

        // Store chart instance
        this.chartInstances.line = {
            canvas: canvas,
            ctx: ctx,
            data: data,
            container: container,
            isMobile: isMobile,
            periodData: periodData
        };
    },

    // Get label interval based on data points and device
    getLabelInterval: function(dataPoints, isMobile) {
        if (isMobile) {
            if (dataPoints <= 7) return 1;  // 1D, 1W
            if (dataPoints <= 30) return 5; // 1M
            return 15; // 3M
        } else {
            if (dataPoints <= 7) return 1;   // 1D, 1W
            if (dataPoints <= 30) return 3;  // 1M
            return 10; // 3M
        }
    },

    // Get volatility based on period
    getVolatilityForPeriod: function(period) {
        switch(period) {
            case '1D': return 2;  // Low volatility for day
            case '1W': return 3;  // Medium volatility for week
            case '1M': return 4;  // Higher volatility for month
            case '3M': return 5;  // Highest volatility for 3 months
            default: return 3;
        }
    },

    // Get appropriate labels for period
    getLabelForPeriod: function(period, index, totalPoints) {
        switch(period) {
            case '1D':
                // Hour labels for 1D
                const hour = Math.floor((index / totalPoints) * 24);
                return `${hour}:00`;
                
            case '1W':
                // Day names for 1W
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return days[index % 7];
                
            case '1M':
            case '3M':
                // Show week numbers for longer periods
                const week = Math.floor(index / 7) + 1;
                return `W${week}`;
                
            default:
                return `P${index + 1}`;
        }
    },

    // Render bar chart (Daily Volume) - Updated with period support
    renderBarChart: function() {
        const canvas = document.getElementById('barChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        // Set canvas size to match container
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.scale(dpr, dpr);

        // Get period data
        const periodData = this.chartInstances.bar?.periodData || this.generatePeriodData(this.currentPeriod);
        const isMobile = window.innerWidth <= 768;
        
        // Sample data - adjust based on period
        let companies, volumes;
        
        switch(periodData.period) {
            case '1D':
                // Show hourly volume for 1D
                companies = ['9AM', '12PM', '3PM', '6PM', '9PM'];
                break;
            case '1W':
                // Show daily volume for 1W
                companies = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                break;
            case '1M':
                // Show weekly volume for 1M
                companies = ['W1', 'W2', 'W3', 'W4'];
                break;
            case '3M':
                // Show monthly volume for 3M
                companies = ['Month1', 'Month2', 'Month3'];
                break;
            default:
                companies = isMobile ? ['XOM', 'CVX', 'COP', 'BP'] : ['XOM', 'CVX', 'COP', 'SLB', 'BP'];
        }
        
        // Generate volumes with period-based variation
        volumes = companies.map((_, i) => {
            const baseVolume = periodData.period === '1D' ? 5000000 : 10000000;
            const variation = 0.3 + (Math.sin(i) * 0.4); // Add some pattern
            return Math.floor(baseVolume * variation);
        });

        // Responsive dimensions
        const padding = {
            top: 25, // More space for title
            right: isMobile ? 5 : 10,
            bottom: isMobile ? 30 : 40,
            left: isMobile ? 40 : 60
        };
        
        const width = rect.width - padding.left - padding.right;
        const height = rect.height - padding.top - padding.bottom;
        const barWidth = width / companies.length * (isMobile ? 0.5 : 0.6);
        const gap = width / companies.length * (isMobile ? 0.5 : 0.4);

        const maxVolume = Math.max(...volumes);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Draw bars with period-based colors
        volumes.forEach((volume, i) => {
            const x = padding.left + i * (barWidth + gap);
            const barHeight = (volume / maxVolume) * height;
            const y = padding.top + height - barHeight;

            // Gradient fill with period-based color
            const hue = 210 + (i * 20); // Blue spectrum
            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
            gradient.addColorStop(1, `hsl(${hue}, 90%, 30%)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Add bar border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Volume label (show only on hover in mobile or use smaller font)
            ctx.fillStyle = '#333';
            ctx.font = isMobile ? '9px Arial' : '11px Arial';
            ctx.textAlign = 'center';
            
            let volumeText;
            if (volume > 1000000) {
                volumeText = (volume / 1000000).toFixed(isMobile ? 0 : 1) + 'M';
            } else if (volume > 1000) {
                volumeText = (volume / 1000).toFixed(0) + 'K';
            } else {
                volumeText = volume.toString();
            }
            
            // Only show label if there's enough space
            if (barHeight > 20) {
                ctx.fillStyle = 'white';
                ctx.fillText(volumeText, x + barWidth / 2, y - 5);
            }

            // Company/label
            ctx.fillStyle = '#666';
            ctx.fillText(companies[i], x + barWidth / 2, padding.top + height + (isMobile ? 12 : 20));
        });

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = isMobile ? '9px Arial' : '11px Arial';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 3; i++) {
            const volume = maxVolume * i / 3;
            const y = padding.top + height - (height * i / 3);
            
            let volumeText;
            if (volume > 1000000) {
                volumeText = (volume / 1000000).toFixed(isMobile ? 0 : 1) + 'M';
            } else if (volume > 1000) {
                volumeText = (volume / 1000).toFixed(0) + 'K';
            } else {
                volumeText = volume.toFixed(0);
            }
            
            ctx.fillText(volumeText, padding.left - 5, y + 3);
        }

        // Draw period title
        ctx.fillStyle = '#1a3a8f';
        ctx.font = `bold ${isMobile ? 11 : 14}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`Volume - ${periodData.period}`, padding.left, padding.top - 5);

        // Store chart instance
        this.chartInstances.bar = {
            canvas: canvas,
            ctx: ctx,
            data: { companies, volumes },
            container: container,
            isMobile: isMobile,
            periodData: periodData
        };
    },

    // Render pie chart (Portfolio Distribution) - Updated with period support
    renderPieChart: function() {
        const canvas = document.getElementById('pieChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.scale(dpr, dpr);

        // Get period data
        const periodData = this.chartInstances.pie?.periodData || this.generatePeriodData(this.currentPeriod);
        const isMobile = window.innerWidth <= 768;

        // Portfolio data - adjust based on period
        let portfolio;
        
        switch(periodData.period) {
            case '1D':
                // Intraday allocation
                portfolio = [
                    { name: 'Exxon Mobil', value: 40, color: '#1a3a8f' },
                    { name: 'Chevron', value: 30, color: '#2d55cc' },
                    { name: 'ConocoPhillips', value: 20, color: '#4a7dff' },
                    { name: 'Other', value: 10, color: '#b3cbff' }
                ];
                break;
                
            case '1W':
                // Weekly allocation
                portfolio = [
                    { name: 'Exxon Mobil', value: 35, color: '#1a3a8f' },
                    { name: 'Chevron', value: 28, color: '#2d55cc' },
                    { name: 'ConocoPhillips', value: 18, color: '#4a7dff' },
                    { name: 'Schlumberger', value: 12, color: '#7ba3ff' },
                    { name: 'Other', value: 7, color: '#b3cbff' }
                ];
                break;
                
            default: // 1M, 3M
                // Monthly/Quarterly allocation
                portfolio = [
                    { name: 'Exxon Mobil', value: 35, color: '#1a3a8f' },
                    { name: 'Chevron', value: 25, color: '#2d55cc' },
                    { name: 'ConocoPhillips', value: 15, color: '#4a7dff' },
                    { name: 'Schlumberger', value: 10, color: '#7ba3ff' },
                    { name: 'BP', value: 8, color: '#a8c4ff' },
                    { name: 'Other Oil', value: 7, color: '#b3cbff' }
                ];
        }

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(centerX, centerY) * (isMobile ? 0.5 : 0.6);

        let startAngle = 0;
        const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Draw pie slices
        portfolio.forEach((item, i) => {
            const sliceAngle = (item.value / totalValue) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = item.color;
            ctx.fill();

            // Draw outline
            ctx.strokeStyle = 'white';
            ctx.lineWidth = isMobile ? 1 : 2;
            ctx.stroke();

            // Draw percentage label (only if slice is big enough)
            if (sliceAngle > 0.3) {
                const midAngle = startAngle + sliceAngle / 2;
                const labelRadius = radius * (isMobile ? 0.4 : 0.6);
                const labelX = centerX + Math.cos(midAngle) * labelRadius;
                const labelY = centerY + Math.sin(midAngle) * labelRadius;

                ctx.fillStyle = 'white';
                ctx.font = isMobile ? 'bold 11px Arial' : 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.value + '%', labelX, labelY);
            }

            startAngle = endAngle;
        });

        // Draw center hole with period label
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Add period label in center
        ctx.fillStyle = '#1a3a8f';
        ctx.font = isMobile ? 'bold 10px Arial' : 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(periodData.period, centerX, centerY);

        // Update legend with responsive layout
        this.updatePieLegend(portfolio, periodData.period, isMobile);

        // Store chart instance
        this.chartInstances.pie = {
            canvas: canvas,
            ctx: ctx,
            data: portfolio,
            container: container,
            isMobile: isMobile,
            periodData: periodData
        };
    },

    // Update pie chart legend with responsive design
    updatePieLegend: function(portfolio, period, isMobile) {
        const legendElement = document.getElementById('pieLegend');
        if (!legendElement) return;

        let legendHTML = `<h4 style="margin-bottom: 10px;">Portfolio - ${period}</h4>`;
        
        // Use grid layout for mobile
        const gridClass = isMobile ? 'legend-grid' : 'legend-list';
        legendHTML += `<div class="${gridClass}">`;
        
        portfolio.forEach(item => {
            const displayName = isMobile ? 
                item.name.split(' ')[0] : // Show only first word on mobile
                item.name;
                
            legendHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${item.color}"></span>
                    <span class="legend-label" title="${item.name}">${displayName}</span>
                    <span class="legend-value">${item.value}%</span>
                </div>
            `;
        });
        
        legendHTML += '</div>';
        legendElement.innerHTML = legendHTML;
    },

    // Setup responsive chart observers
    setupResponsiveObservers: function() {
        // Check if ResizeObserver is supported
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    // Debounce redraw to prevent excessive rendering
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.renderAllCharts();
                    }, 250);
                });
            });

            // Observe all chart containers
            const chartContainers = document.querySelectorAll('.chart-wrapper');
            chartContainers.forEach(container => {
                this.resizeObserver.observe(container);
            });
        }
    },

    // Setup chart resize handler
    setupChartResize: function() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.renderAllCharts();
            }, 250);
        });
    },

    // Cleanup observers
    cleanup: function() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
};