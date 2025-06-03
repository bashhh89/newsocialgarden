# WeasyPrint Service Notes

The WeasyPrint PDF generation service is now set up and configured properly on the server.

## Implementation Details

1. The service is installed with Python's Flask framework and WeasyPrint library
2. It accepts POST requests with HTML content and returns PDF documents
3. A systemd service has been configured to ensure the service runs persistently
4. The service automatically starts on server boot and restarts if it crashes

## Testing

The service was tested successfully with:
- Direct curl requests from the server
- External requests from the application

## Maintenance

To check the service status:
```
systemctl status weasyprint.service
```

If changes are needed, update the Python script and restart the service:
```
systemctl restart weasyprint.service
``` 