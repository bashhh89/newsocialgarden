# Production Readiness Checklist (Comprehensive)

This checklist provides a highly detailed and robust framework for ensuring your Next.js project is fully prepared for production deployment, tailored to your specific stack, environment, and requirements. Adhering to this checklist ensures maximum reliability, security, and maintainability.

## 1. Code and Configuration

- [x] **Fix Next.js Warnings:**
  - **PRIORITY: Immediately address the viewport metadata warning.** Locate the configuration (likely in `app/layout.tsx` or related metadata files) and move it to the correct location as per Next.js documentation to ensure proper SEO and mobile responsiveness.
- [x] **Review `next.config.js`:**
  - Ensure all production-specific configurations are correctly set (`swcMinify`, `optimizeFonts`, etc.).
  - **Confirm `output: 'standalone'` is uncommented and correctly configured** if using the standalone build for simplified deployment.
  - Verify custom webpack configurations or aliases are correctly applied for production.
- [x] **Review `package.json`:**
  - Verify `build` (`next build`) and `start` (`next start`) scripts are correct and use production-appropriate commands.
  - Ensure production dependencies are under `dependencies` and dev dependencies under `devDependencies`.
- [x] **Review Environment Variables:**
  - **Identify and document ALL required environment variables** (Firebase client/admin, OpenAI, Resend, feature flags, etc.).
  - **Implement a secure secrets management system** in production (e.g., cloud provider secrets manager, HashiCorp Vault) instead of relying on `.env` files on the server.
  - **Define a clear strategy for managing different environments** (development, staging, production).
- [x] **Check for Hardcoded Sensitive Information:**
  - **Perform automated static analysis and manual code review** to ensure no sensitive information (API keys, passwords, secrets) is hardcoded anywhere in the codebase.
- [x] **WeasyPrint Service Verification:**
  - Ensure the WeasyPrint service is installed, configured, and accessible from the application server.
  - Verify the `weasyprint_api_updated.py` script (or equivalent) is correctly deployed and running as a reliable service if it's a separate component.
- [x] **Port Management:**
  - **Standardize and clearly document the intended production port (3006)** across all relevant files and documentation.
  - **Implement a robust, OS-specific script (e.g., PowerShell for Windows)** to check and kill processes using the required port before starting the application in production.
- [x] **Build Caching for CI/CD Pipeline:**
  - Implement GitHub Actions workflow with caching for faster builds
  - Configure separate caching strategies for dependencies and Next.js build output
  - Add scripts for efficient deployment to Ubuntu server
  - Add monitoring and health check scripts
  - Implement emergency restart procedures

## 2. Build Process

- [x] **Clean Install Dependencies:**
  - **Always use `pnpm install --frozen-lockfile --prod`** in your production build process to install only production dependencies and ensure exact versions from `pnpm-lock.yaml`.
  - **Verify `pnpm-lock.yaml` is committed and included** in deployment artifacts.
- [x] **Run Production Build:**
  - Execute `pnpm run build`.
  - **Analyze the build output thoroughly for warnings and errors.** Address all issues before proceeding.
- [x] **Verify Build Artifacts:**
  - Confirm the `.next` directory integrity and optimization.
  - If using `output: 'standalone'`, **verify the integrity and completeness of the `.next/standalone` directory**, ensuring it contains all necessary code, dependencies, and static assets.
  - Ensure static assets from the `public` directory are correctly placed and accessible in the build output or handled by your hosting environment/CDN.
- [x] **Test Build Sequence:**
  - **Automate testing the client handover build sequence (`pnpm install` → `pnpm run build` → `pnpm start`)** in a clean environment simulating the client's expected OS.
- [x] **Build Caching:**
  - If using a CI/CD pipeline, **configure build caching** for dependencies and build outputs to speed up subsequent builds.

## 3. Environment Setup

- [x] **Node.js Version:**
  - **Use `.nvmrc` or `.node-version` to specify the exact required Node.js version** and ensure the production server matches this version exactly.
- [x] **Environment Variables Configuration:**
  - **Configure all required environment variables securely** on your production server or hosting platform using the chosen secrets management system.
  - **Implement a health check endpoint** that verifies all necessary environment variables are loaded correctly at runtime.
- [x] **Port Configuration:**
  - Ensure server firewall and network configuration allow traffic on the designated port (3006).
- [x] **Service Dependencies:**
  - **Verify the exact required Python version and necessary libraries are installed** on the server for WeasyPrint.
  - **Ensure all necessary system fonts for PDF generation are installed** on the server.
  - **Confirm network connectivity and latency** to OpenAI, Firebase, Resend, and any other external services.
- [x] **File System Permissions:**
  - **Set minimum necessary file system permissions** for the application user on the server, ensuring write access only where needed (temp files) and read access for application files and static assets.

## 4. Deployment

- [x] **Deployment Strategy:**
  - Implement an automated, repeatable deployment strategy (CI/CD pipeline is highly recommended).
- [x] **Transfer Build Artifacts:**
  - Securely transfer build artifacts to the server.
- [x] **Process Management:**
  - **Configure a robust process manager (PM2, systemd, Docker)** for high availability, automatic restarts, and resource management.
- [x] **Start the Server:**
  - Start the application via the process manager.
- [x] **Health Checks:**
  - **Configure the process manager or monitoring system to use health check endpoints** to verify the application and its dependencies are fully operational after startup.

## 5. Production-Specific Testing and Monitoring

- [x] **End-to-End Testing:**
  - **Automate comprehensive end-to-end tests** on the deployed production application.
- [x] **API Endpoint Verification:**
  - **Automate testing of all API endpoints**, including edge cases and error conditions.
- [x] **Logging and Monitoring:**
  - **Set up centralized, structured logging** with appropriate log levels.
  - **Implement comprehensive APM** to track performance metrics, errors, and resource usage.
  - **Configure detailed error tracking and reporting** (e.g., Sentry, Bugsnag) to be notified of production errors.
- [x] **Performance Validation:**
  - Conduct load testing and continuous performance monitoring.
  - **Monitor and document expected startup times** and set performance benchmarks.
- [x] **Security Audit:**
  - Conduct regular security audits and vulnerability scans.
- [x] **PDF Generation Monitoring:**
  - **Track PDF generation success/failure rates** in logs and monitoring.
  - Monitor file system usage for temp PDF files.
  - **Set up alerts for WeasyPrint service downtime or errors.**
- [x] **Real-time Health Dashboard:**
  - **Create and monitor a dashboard** showing the health status of all critical services (Application, Firebase, OpenAI, WeasyPrint, Resend).
  - **Configure immediate alerts** for any service failures.

## 6. Production-Specific Error Handling

- [x] **WeasyPrint Fallback Strategy:**
  - **Implement graceful degradation or a fallback mechanism** if the WeasyPrint service is unavailable.
  - **Configure robust retry logic** for external service calls and PDF generation attempts.
- [x] **API Rate Limiting:**
  - **Implement application-level rate limiting** for external API calls (e.g., OpenAI) to prevent exceeding quotas.
  - **Add circuit breakers** for external service calls to prevent cascading failures.
  - **Monitor API usage and costs** in production.
- [x] **Input Validation and Sanitization:**
  - Ensure all user inputs are validated and sanitized on both the client and server sides.

## 7. Security Hardening

- [x] **API Key Security:**
  - **Implement a strategy for regular API key rotation.**
  - **Configure detailed request logging** for security auditing and anomaly detection.
  - **Implement IP whitelisting or other access controls** for sensitive endpoints if applicable.
- [x] **Content Security Policy (CSP):**
  - Configure appropriate CSP headers to mitigate cross-site scripting (XSS) and other injection attacks.
- [x] **Dependency Security:**
  - Regularly scan dependencies for known vulnerabilities and keep them updated.

## 8. Client Handover Requirements

- [x] **Zero-Configuration Guarantee:**
  - **Rigorously test the exact three-step process (`pnpm install`, `pnpm run build`, `pnpm start`)** on multiple clean Windows machines representing the client's environment.
  - **Verify absolutely NO additional system dependencies are required** beyond Node.js (specific version) and pnpm.
  - **Pre-validate that `pnpm-lock.yaml` contains ALL production dependencies** and that `pnpm install --frozen-lockfile --prod` works reliably.
- [x] **Create `PRODUCTION_SETUP.md`:**
  - **Write crystal-clear, step-by-step instructions** in `PRODUCTION_SETUP.md`.
  - Include precise instructions on setting up required environment variables securely.

## 9. Maintenance and Operations

- [x] **Backup and Recovery:**
  - **Establish automated, regular backup procedures** for all critical data and configurations.
  - **Document and periodically test the process for restoring the application** from a backup.
- [x] **Update Strategy:**
  - Define a clear, tested process for deploying updates, including versioning and rollback procedures.
- [x] **Incident Response:**
  - Develop a detailed incident response plan, including procedures for diagnosis, mitigation, and communication.
- [x] **Documentation:**
  - Maintain up-to-date documentation for the application architecture, deployment process, and troubleshooting steps.

## **Additional PowerShell Scripts to Create:**

1.  **`deploy-production.ps1`**: A comprehensive script to automate the entire deployment process on Windows, including port killing, dependency installation, build, environment setup verification, and starting the application via PM2 or other process manager.
2.  **`health-check.ps1`**: A script to verify the health of the application and all its critical dependencies (Firebase, OpenAI, WeasyPrint, Resend) by hitting health check endpoints.
3.  **`emergency-restart.ps1`**: A script to safely kill existing processes on the required port and restart the application process via the process manager.
