/**
 * Simple Error Monitoring System
 * Tracks and logs errors for debugging and monitoring
 */

class ErrorMonitor {
    constructor() {
        this.errors = [];
        this.maxErrors = 100; // Keep last 100 errors
        this.isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
        this.init();
    }
    
    init() {
        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'unhandled_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack || event.error
            });
        });
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'unhandled_rejection',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });
        
        // Capture console.error calls
        this.wrapConsoleError();
    }
    
    logError(errorData) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...errorData
        };
        
        this.errors.push(errorEntry);
        
        // Keep only last N errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Log to console in development
        if (!this.isProduction) {
            console.error('🚨 Error logged:', errorEntry);
        }
        
        // Store in localStorage for debugging
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errors));
        } catch (e) {
            // Ignore localStorage errors
        }
        
        // In production, could send to external service
        if (this.isProduction) {
            this.sendToMonitoring(errorEntry);
        }
    }
    
    wrapConsoleError() {
        const originalError = console.error;
        console.error = (...args) => {
            // Call original
            originalError.apply(console, args);
            
            // Log to our system
            this.logError({
                type: 'console_error',
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ')
            });
        };
    }
    
    sendToMonitoring(errorEntry) {
        // Could send to Sentry, LogRocket, or custom endpoint
        // For now, just use GitHub Issues API (optional)
        
        // Example: Send critical errors to GitHub Issues
        if (this.isCriticalError(errorEntry)) {
            console.warn('Critical error detected:', errorEntry.message);
            // Could POST to /api/report-error endpoint
        }
    }
    
    isCriticalError(errorEntry) {
        const criticalPatterns = [
            'failed to fetch',
            'network error',
            'cannot read property',
            'undefined is not',
            'null is not',
            'script error'
        ];
        
        const message = errorEntry.message?.toLowerCase() || '';
        return criticalPatterns.some(pattern => message.includes(pattern));
    }
    
    getErrors() {
        return this.errors;
    }
    
    getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }
    
    clearErrors() {
        this.errors = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            // Ignore
        }
    }
    
    exportErrors() {
        const data = JSON.stringify(this.errors, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    getStats() {
        const stats = {
            total: this.errors.length,
            byType: {},
            recent: this.getRecentErrors(5),
            criticalCount: 0
        };
        
        this.errors.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            
            // Count critical
            if (this.isCriticalError(error)) {
                stats.criticalCount++;
            }
        });
        
        return stats;
    }
}

// Initialize error monitor
const errorMonitor = new ErrorMonitor();

// Expose to window for debugging
window.errorMonitor = errorMonitor;

// Add helper commands for console
console.log('🔍 Error Monitoring Active!');
console.log('Commands:');
console.log('  errorMonitor.getErrors() - View all errors');
console.log('  errorMonitor.getRecentErrors(10) - View recent errors');
console.log('  errorMonitor.getStats() - View error statistics');
console.log('  errorMonitor.clearErrors() - Clear error log');
console.log('  errorMonitor.exportErrors() - Export errors to file');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorMonitor;
}

