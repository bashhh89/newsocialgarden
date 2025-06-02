# 🚀 Production Start Commands

## Quick Reference

### Development
```bash
pnpm dev
```
Starts development server on http://localhost:3000

### Development (Windows, specific port)
```bash
pnpm start
```
Starts development server on http://localhost:3006

### Production Build
```bash
pnpm build
```
Creates optimized production build with standalone output

### Production Start (Standalone)
```bash
pnpm start:production
```
Starts production server using standalone build on port 3006

### Alternative Production Start (Manual)
```bash
$env:PORT=3006; node .next/standalone/server.js
```
Direct command to start standalone server with custom port

## Important Notes

1. **Standalone Configuration**: The application is configured with `output: 'standalone'` in `next.config.js` for production deployment.

2. **Build Process**: The `postbuild` script automatically copies public assets to the standalone build directory.

3. **Port Configuration**: 
   - Development: Port 3000 (default) or 3006 (via `pnpm start`)
   - Production: Port 3006 (configurable via PORT environment variable)

4. **Production Deployment**: Use `pnpm start:production` for clean standalone deployment without Next.js development dependencies.

## Troubleshooting

### If "next start" shows standalone warning:
This is expected behavior. Use `pnpm start:production` instead for production deployment.

### If server.js is missing:
Run `pnpm build` to regenerate the standalone build with server.js file.

### Port conflicts:
Check for existing processes: `netstat -ano | findstr :3006`
Kill process if needed: `taskkill /F /PID [PID_NUMBER]` 