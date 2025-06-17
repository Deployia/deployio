"""
Wildcard routes for serving HTML on subdomains
"""

import logging
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# DeployIO professional HTML template
DEPLOYIO_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeployIO Platform - {title}</title>
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
            overflow-x: hidden;
        }}
        
        /* AI Network Background */
        .background {{
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom right, black, #0a0a0a, #1a1a1a);
        }}
        
        .bg-pattern {{
            position: absolute;
            inset: 0;
            opacity: 0.2;
            background: 
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 25%),
                radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 30%),
                radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.2) 0%, transparent 20%);
        }}
        
        /* Content */
        .container {{
            position: relative;
            z-index: 10;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
        }}
        
        .logo {{
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #22c55e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }}
        
        .tagline {{
            font-size: 1.5rem;
            margin-bottom: 3rem;
            opacity: 0.9;
            background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 500;
        }}
        
        .features {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin-bottom: 3rem;
        }}
        
        .feature {{
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }}
        
        .feature:hover {{
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }}
        
        .feature-icon {{
            font-size: 2.5rem;
            margin-bottom: 1rem;
            display: block;
        }}
        
        .feature-title {{
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #f1f5f9;
        }}
        
        .feature-desc {{
            color: #94a3b8;
            font-size: 0.95rem;
            line-height: 1.6;
        }}
        
        .cta {{
            margin-top: 2rem;
        }}
        
        .cta-button {{
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }}
        
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }}
        
        .footer {{
            margin-top: 4rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.7;
            font-size: 0.9rem;
        }}
        
        .footer a {{
            color: #60a5fa;
            text-decoration: none;
            transition: color 0.3s ease;
        }}
        
        .footer a:hover {{
            color: #93c5fd;
        }}
        
        @media (max-width: 768px) {{
            .logo {{
                font-size: 2.5rem;
            }}
            
            .tagline {{
                font-size: 1.2rem;
            }}
            
            .features {{
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }}
            
            .feature {{
                padding: 1.5rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="background"></div>
    <div class="bg-pattern"></div>
    
    <div class="container">
        <div class="logo">DeployIO</div>
        <div class="tagline">AI-Powered DevOps Automation Platform</div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🚀</div>
                <div class="feature-title">Instant Deployment</div>
                <div class="feature-desc">Deploy MERN stack applications from GitHub to production with zero configuration</div>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <div class="feature-title">AI-Powered Analysis</div>
                <div class="feature-desc">Intelligent stack detection and automatic containerization</div>
            </div>
            
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">Lightning Fast</div>
                <div class="feature-desc">Optimized infrastructure for rapid builds and deployments</div>
            </div>
        </div>
        
        <div class="cta">
            <a href="https://deployio.tech" class="cta-button">
                Get Started →
            </a>
        </div>
        
        <div class="footer">
            <p>Powered by <a href="https://deployio.tech">DeployIO Platform</a></p>
            <p>DevOps automation made simple</p>
        </div>
    </div>
</body>
</html>
"""


@router.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Root endpoint serving DeployIO Platform homepage"""
    
    return HTMLResponse(content=DEPLOYIO_HTML_TEMPLATE.format(
        title="AI-Powered DevOps Platform"
    ))


@router.get("/{path:path}", response_class=HTMLResponse)
async def wildcard_handler(request: Request, path: str):
    """Wildcard handler for subdomain requests"""
    host = request.headers.get("host", "localhost")
    
    # Log the request for monitoring
    logger.info(f"Wildcard request: {path} on host: {host}")
    
    # For any path, show the professional DeployIO platform page
    return HTMLResponse(content=DEPLOYIO_HTML_TEMPLATE.format(
        title="AI-Powered DevOps Platform"
    ))
