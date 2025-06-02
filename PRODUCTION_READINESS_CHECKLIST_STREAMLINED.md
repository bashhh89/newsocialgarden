# Production Readiness Checklist (Streamlined)

This checklist provides a streamlined yet professional framework for deploying your Next.js project quickly while maintaining a clean project structure. It focuses on essential steps to get your application running correctly in production, with less emphasis on advanced monitoring, security hardening, and extensive automated testing (which can be implemented later).

## Goal: Simple 3-Step Client Handover

The primary goal of this streamlined checklist is to enable a simple and reliable deployment process for the client, ideally achievable with just three commands: `pnpm install`, `pnpm run build`, and `pnpm start`.

## 1. Code and Configuration Essentials

- [ ] **Fix Critical Warnings:**
  - **PRIORITY: Address the viewport metadata warning.** Ensure this is correctly configured in your Next.js application's metadata to avoid immediate SEO/mobile issues.
- [ ] **Review `next.config.js`:**
  - Ensure basic production configurations are set.
  - Consider enabling `output: 'standalone'` if it simplifies your deployment target.
- [ ] **Review `package.json`:**
  - Verify `build` (`next build`) and `start` (`next start`) scripts are correct.
  - Ensure all necessary production dependencies are listed.
- [ ] **Identify Required Environment Variables:**
  - **Identify and document the essential environment variables** needed for core functionality (Firebase client/admin, OpenAI, Resend).
- [ ] **Check for Hardcoded Sensitive Information:**
  - **Quickly review code for obvious hardcoded sensitive information.** Use environment variables for these.
- [ ] **WeasyPrint Service Access:**
  - Ensure the WeasyPrint service is installed and accessible from the application server.

## 2. Build Process Essentials

- [ ] **Install Dependencies:**
  - Use `pnpm install --frozen-lockfile --prod` to install production dependencies based on `pnpm-lock.yaml`.
- [ ] **Run Production Build:**
  - Execute `pnpm run build`.
  - **Check the build output for any errors.** Address critical build failures.
- [ ] **Verify Basic Build Output:**
  - Confirm the `.next` directory is created.
  - If using `output: 'standalone'`, verify the `.next/standalone` directory exists.
- [ ] **Test Basic Build Sequence:**
  - **Manually test the `pnpm install` → `pnpm run build` → `pnpm start` sequence** in a clean environment to ensure it works.

## 3. Environment Setup Essentials

- [ ] **Node.js Version:**
  - Ensure the production server has a compatible Node.js version installed.
- [ ] **Environment Variables Configuration:**
  - **Configure all identified required environment variables** on your production server or hosting platform.
- [ ] **Port Configuration:**
  - Ensure the production server is configured to run the application on the designated port (3006). Make sure this port is open.
- [ ] **Service Dependencies:**
  - Ensure necessary Python and system fonts are installed for WeasyPrint.
  - Confirm network connectivity to external services (Firebase, OpenAI, Resend).
- [ ] **File System Permissions:**
  - Ensure the application has necessary read/write permissions on the server.

## 4. Deployment

- [ ] **Transfer Build Artifacts:**
  - Copy the production build output to your production server.
- [ ] **Process Management (Basic):**
  - Use a simple process manager (like PM2) to keep the application running.
- [ ] **Start the Server:**
  - Start the application process.

## 5. Post-Deployment Verification (Core Functionality)

- [ ] **Access the Application:**
  - Verify the application is accessible at the production URL.
- [ ] **Test Core Features:**
  - **Manually test the most critical functionalities:**
    - Key page navigation.
    - Essential API routes.
    - Core PDF generation (e.g., Scorecard PDF).
    - Basic email notification sending.
- [ ] **Check Server Logs:**
  - Briefly check server logs for any obvious errors after startup.

## 6. Client Handover Requirements

- [ ] **Zero-Configuration Guarantee:**
  - **Test the exact three-step process (`pnpm install`, `pnpm run build`, `pnpm start`)** on a clean Windows machine.
  - **Verify NO additional system dependencies are required** beyond Node.js and pnpm for the basic setup.
- [ ] **Create `PRODUCTION_SETUP.md`:**
  - **Write clear, simple instructions** in `PRODUCTION_SETUP.md` covering the three steps and environment variable setup.

## Future Enhancements (For Increased Robustness)

- [ ] Implement automated testing (unit, integration, E2E).
- [ ] Set up comprehensive logging and monitoring (APM, error tracking).
- [ ] Implement advanced security hardening measures (CSP, detailed logging, vulnerability scanning).
- [ ] Configure automated backups and recovery procedures.
- [ ] Implement graceful degradation and retry logic for external services.
- [ ] Set up a real-time health dashboard.
- [ ] Automate deployment with a CI/CD pipeline.
- [ ] Conduct performance load testing.
