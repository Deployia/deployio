"""
Wildcard routes for serving HTML on subdomains
"""

import logging
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# DeployIO themed HTML template
DEPLOYIO_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeployIO Agent - {title}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }}
        
        .container {{
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }}
        
        .logo {{
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .subtitle {{
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }}
        
        .status {{
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }}
        
        .status-item {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }}
        
        .status-item:last-child {{
            margin-bottom: 0;
        }}
        
        .badge {{
            background: #4ade80;
            color: #065f46;
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
        }}
        
        .footer {{
            opacity: 0.7;
            font-size: 0.875rem;
        }}
        
        a {{
            color: #93c5fd;
            text-decoration: none;
        }}
        
        a:hover {{
            color: #dbeafe;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">DeployIO</div>
        <div class="subtitle">{subtitle}</div>
        
        <div class="status">
            <div class="status-item">
                <span>Agent Status</span>
                <span class="badge">Running</span>
            </div>
            <div class="status-item">
                <span>Host</span>
                <span>{host}</span>
            </div>
            <div class="status-item">
                <span>Service</span>
                <span>Container Management</span>
            </div>
        </div>
        
        <div class="footer">
            <p>Powered by <a href="https://deployio.dev">DeployIO Platform</a></p>
            <p>Container deployment made simple</p>
        </div>
    </div>
</body>
</html>
"""


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Root endpoint serving DeployIO Agent homepage"""
    host = request.headers.get("host", "localhost")

    return HTMLResponse(
        content=DEPLOYIO_HTML_TEMPLATE.format(
            title="Agent Homepage", subtitle="DeployIO Agent Service", host=host
        )
    )


@router.get("/{path:path}", response_class=HTMLResponse)
async def wildcard_handler(request: Request, path: str):
    """Wildcard handler for subdomain requests"""
    host = request.headers.get("host", "localhost")

    # This will handle requests to deployed applications on subdomains
    # For now, show a placeholder page
    logger.info(f"Wildcard request: {path} on host: {host}")

    return HTMLResponse(
        content=DEPLOYIO_HTML_TEMPLATE.format(
            title=f"App: {path or 'Home'}",
            subtitle=f"Application deployed on {host}",
            host=host,
        )
    )
