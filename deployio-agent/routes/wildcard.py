"""
Wildcard routes for serving HTML on subdomains
"""

import logging
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# DeployIO themed HTML template with modern styling
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
            background: black;
            min-height: 100vh;
            color: white;
            position: relative;
            overflow: hidden;
        }}
        
        /* AI Network Background - Similar to Home */
        .background {{
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom right, black, #0a0a0a, #1a1a1a);
        }}
        
        .bg-pattern {{
            position: absolute;
            inset: 0;
            opacity: 0.3;
            background: 
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 25%),
                radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.25) 0%, transparent 30%),
                radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.15) 0%, transparent 20%);
            animation: pulse 4s ease-in-out infinite;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 0.3; }}
            50% {{ opacity: 0.6; }}
        }}
        
        @keyframes float {{
            0%, 100% {{ transform: translateY(0px); }}
            50% {{ transform: translateY(-10px); }}
        }}
        
        @keyframes glow {{
            0%, 100% {{ box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }}
            50% {{ box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }}
        }}
        
        .container {{
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
        }}
        
        .content {{
            text-align: center;
            max-width: 600px;
            animation: float 6s ease-in-out infinite;
        }}
        
        .logo {{
            font-size: 4rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06d6a0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: glow 3s ease-in-out infinite;
        }}
        
        .subtitle {{
            font-size: 1.5rem;
            margin-bottom: 3rem;
            opacity: 0.9;
            color: #e5e7eb;
        }}
        
        .status-card {{
            background: rgba(15, 15, 15, 0.8);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }}
        
        .status-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }}
        
        .status-item {{
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }}
        
        .status-label {{
            font-size: 0.875rem;
            color: #9ca3af;
            margin-bottom: 0.5rem;
        }}
        
        .status-value {{
            font-weight: 600;
            color: white;
        }}
        
        .badge {{
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }}
        
        .app-info {{
            background: rgba(147, 51, 234, 0.1);
            border: 1px solid rgba(147, 51, 234, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }}
        
        .app-title {{
            font-size: 1.25rem;
            font-weight: 600;
            color: #a855f7;
            margin-bottom: 0.5rem;
        }}
        
        .app-description {{
            color: #d1d5db;
            opacity: 0.8;
        }}
        
        .footer {{
            opacity: 0.7;
            font-size: 0.875rem;
            color: #9ca3af;
        }}
        
        .footer a {{
            color: #3b82f6;
            text-decoration: none;
            transition: color 0.2s;
        }}
        
        .footer a:hover {{
            color: #60a5fa;
        }}
        
        .tech-badge {{
            display: inline-block;
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            margin: 0.25rem;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }}
        
        @media (max-width: 768px) {{
            .logo {{ font-size: 3rem; }}
            .status-grid {{ grid-template-columns: 1fr; }}
            .container {{ padding: 1rem; }}
        }}
    </style>
</head>
<body>
    <div class="background"></div>
    <div class="bg-pattern"></div>
    
    <div class="container">
        <div class="content">
            <div class="logo">DeployIO</div>
            <div class="subtitle">{subtitle}</div>
            
            {app_section}
            
            <div class="status-card">
                <div class="status-grid">
                    <div class="status-item">
                        <div class="status-label">Agent Status</div>
                        <div class="badge">Running</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Host</div>
                        <div class="status-value">{host}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Service</div>
                        <div class="status-value">Container Management</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Runtime</div>
                        <div class="status-value">FastAPI + Docker</div>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <span class="tech-badge">FastAPI</span>
                    <span class="tech-badge">Docker</span>
                    <span class="tech-badge">Traefik</span>
                    <span class="tech-badge">MongoDB</span>
                </div>
            </div>
            
            <div class="footer">
                <p>Powered by <a href="https://deployio.tech">DeployIO Platform</a></p>
                <p>AI-powered DevOps automation</p>
            </div>
        </div>
    </div>
</body>
</html>
"""


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Root endpoint serving DeployIO Agent homepage"""
    host = request.headers.get("host", "localhost")

    app_section = """
    <div class="app-info">
        <div class="app-title">DeployIO Agent Dashboard</div>
        <div class="app-description">
            Welcome to the DeployIO Agent service. This instance manages container deployments, 
            routing, and infrastructure automation for the DeployIO platform.
        </div>
    </div>
    """

    return HTMLResponse(
        content=DEPLOYIO_HTML_TEMPLATE.format(
            title="Agent Dashboard",
            subtitle="DeployIO Agent Service",
            host=host,
            app_section=app_section,
        )
    )


@router.get("/{path:path}", response_class=HTMLResponse)
async def wildcard_handler(request: Request, path: str):
    """Wildcard handler for subdomain requests"""
    host = request.headers.get("host", "localhost")

    # Extract app name from path or host
    app_name = path.split("/")[0] if path else host.split(".")[0]

    # This will handle requests to deployed applications on subdomains
    logger.info(f"Wildcard request: {path} on host: {host}")

    app_section = f"""
    <div class="app-info">
        <div class="app-title">🚀 {app_name.title()}</div>
        <div class="app-description">
            Your application is successfully deployed and running on the DeployIO platform.
            This subdomain is managed by our container orchestration system.
        </div>
    </div>
    """

    return HTMLResponse(
        content=DEPLOYIO_HTML_TEMPLATE.format(
            title=f"App: {app_name}",
            subtitle=f"Application: {app_name} • Deployed on {host}",
            host=host,
            app_section=app_section,
        )
    )
