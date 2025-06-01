const DEBUG = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

const debugLog = (context, message, data = null) => {
  if (!DEBUG) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    context,
    message,
    ...(data && { data })
  };

  console.log('\n[DEBUG LOG]', JSON.stringify(logEntry, null, 2), '\n');
};

const createPDFLogger = (requestId) => {
  return {
    start: () => debugLog('PDF Generation', `Starting process for request ${requestId}`),
    htmlSetup: (hasStyles) => debugLog('PDF Generation', 'HTML template setup', { hasStyles }),
    fontLoading: (status) => debugLog('PDF Generation', 'Font loading status', { status }),
    puppeteerSetup: () => debugLog('PDF Generation', 'Puppeteer initialization'),
    contentRendering: () => debugLog('PDF Generation', 'Content rendering'),
    pdfCreation: () => debugLog('PDF Generation', 'PDF file creation'),
    complete: () => debugLog('PDF Generation', `Completed process for request ${requestId}`),
    error: (error) => debugLog('PDF Generation', 'Error encountered', { error: error.message, stack: error.stack })
  };
};

module.exports = {
  debugLog,
  createPDFLogger
};
