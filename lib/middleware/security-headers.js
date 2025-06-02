/**
 * Security Headers Middleware
 * 
 * This middleware adds security headers to all HTTP responses to enhance
 * the application's security posture and prevent various attacks.
 */

/**
 * The Content Security Policy (CSP) configuration for the application.
 * This restricts which resources can be loaded and executed, mitigating
 * various attacks including XSS.
 */
const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Needed for Next.js (consider removing in production if possible)
    "'unsafe-eval'", // Needed for Next.js (consider removing in production if possible)
    "https://apis.google.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Needed for Next.js styling
    "https://fonts.googleapis.com",
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https://*.googleusercontent.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  'connect-src': [
    "'self'",
    "https://api.openai.com",
    "https://firebaseinstallations.googleapis.com",
    "https://firebasestorage.googleapis.com",
    "https://*.cloudfunctions.net",
    "https://firebase.googleapis.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://www.googleapis.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://api.resend.com",
  ],
  'frame-src': [
    "'self'",
    "https://firebase.googleapis.com",
  ],
  'worker-src': [
    "'self'",
    "blob:",
  ],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Builds the Content-Security-Policy header value from the configuration.
 * 
 * @returns {string} The formatted CSP header value
 */
function buildCspHeader() {
  return Object.entries(contentSecurityPolicy)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * The security headers middleware function for Next.js.
 * 
 * @param {Object} req - The HTTP request object
 * @param {Object} res - The HTTP response object
 * @param {Function} next - The next middleware function
 */
function securityHeaders(req, res, next) {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', buildCspHeader());
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable strict HTTPS (only for production environments)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Control browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // Proceed to the next middleware
  next();
}

module.exports = securityHeaders; 