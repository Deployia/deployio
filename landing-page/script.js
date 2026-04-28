// Neural Network Animation
class NeuralNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.nodes = [];
    this.connections = [];
    this.mouseX = 0;
    this.mouseY = 0;

    this.resize();
    this.createNodes();
    this.createConnections();
    this.animate();

    // Handle mouse movement
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    // Handle resize
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  createNodes() {
    const isMobile = window.innerWidth < 768;
    const nodeCount = Math.floor(
      (this.canvas.width * this.canvas.height) / (isMobile ? 80000 : 50000)
    );
    this.nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        radius: Math.random() * (isMobile ? 2 : 3) + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
  }
  createConnections() {
    const isMobile = window.innerWidth < 768;
    const maxDistance = isMobile ? 100 : 150;

    this.connections = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          this.connections.push({
            node1: i,
            node2: j,
            distance: distance,
            maxDistance: maxDistance,
          });
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update nodes
    this.nodes.forEach((node) => {
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

      // Mouse interaction
      const dx = this.mouseX - node.x;
      const dy = this.mouseY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        const force = (100 - distance) / 100;
        node.x -= dx * force * 0.01;
        node.y -= dy * force * 0.01;
      }
    }); // Draw connections
    this.connections.forEach((conn) => {
      const node1 = this.nodes[conn.node1];
      const node2 = this.nodes[conn.node2];

      const dx = node1.x - node2.x;
      const dy = node1.y - node2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = conn.maxDistance || 150;

      if (distance < maxDistance) {
        const opacity = ((maxDistance - distance) / maxDistance) * 0.2;
        this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`; // Blue color to match design
        this.ctx.lineWidth = window.innerWidth < 768 ? 0.5 : 1;
        this.ctx.beginPath();
        this.ctx.moveTo(node1.x, node1.y);
        this.ctx.lineTo(node2.x, node2.y);
        this.ctx.stroke();
      }
    });

    // Draw nodes
    this.nodes.forEach((node) => {
      this.ctx.fillStyle = `rgba(59, 130, 246, ${node.opacity})`; // Blue nodes
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Typing Animation
class TypingAnimation {
  constructor(element) {
    this.element = element;
    this.texts = [
      "This subdomain is ready for deployment...",
      "Deploy React apps in seconds...",
      "Host Vue.js applications instantly...",
      "Launch Node.js APIs effortlessly...",
      "Deploy Python apps with ease...",
      "Run Docker containers seamlessly...",
      "Your app belongs here...",
    ];
    this.currentIndex = 0;
    this.currentText = "";
    this.isDeleting = false;
    this.typeSpeed = 80;
    this.deleteSpeed = 40;
    this.pauseTime = 2000;

    this.type();
  }

  type() {
    const fullText = this.texts[this.currentIndex];

    if (this.isDeleting) {
      this.currentText = fullText.substring(0, this.currentText.length - 1);
    } else {
      this.currentText = fullText.substring(0, this.currentText.length + 1);
    }

    this.element.textContent = this.currentText;

    let speed = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

    if (!this.isDeleting && this.currentText === fullText) {
      speed = this.pauseTime;
      this.isDeleting = true;
    } else if (this.isDeleting && this.currentText === "") {
      this.isDeleting = false;
      this.currentIndex = (this.currentIndex + 1) % this.texts.length;
      speed = 500;
    }

    setTimeout(() => this.type(), speed);
  }
}

// Load configuration and check subdomain type
let config = null;

// Load config.json
async function loadConfig() {
  try {
    const response = await fetch("./config.json");
    config = await response.json();
  } catch (error) {
    console.error("Failed to load config:", error);
    // Fallback config
    config = {
      reserved_subdomains: [
        "landing",
        "admin",
        "dashboard",
        "api",
        "cdn",
        "static",
        "assets",
        "mail",
        "ftp",
        "www",
        "blog",
        "docs",
        "support",
        "status",
        "monitor",
      ],
      platform_url: "https://deployio.tech",
      contact_email: "support@deployio.tech",
    };
  }
}

// Check if current subdomain is reserved
function isReservedSubdomain() {
  const subdomain = getCurrentSubdomain();
  if (!subdomain || !config) return false;

  return config.reserved_subdomains.includes(subdomain.toLowerCase());
}

// Show appropriate content based on subdomain type
function showContent() {
  const regularContent = document.getElementById("regular-content");
  const reservedContent = document.getElementById("reserved-content");

  if (isReservedSubdomain()) {
    regularContent.classList.add("hidden");
    reservedContent.classList.remove("hidden");

    // Update page title for reserved subdomain
    document.title = "Reserved Subdomain - Deployio";

    // Log reserved subdomain access
    const subdomain = getCurrentSubdomain();
    console.log(`Reserved subdomain accessed: ${subdomain}.deployio.tech`);

    // Optional: Send analytics for reserved subdomain access
    // sendReservedSubdomainAnalytics(subdomain);
  } else {
    regularContent.classList.remove("hidden");
    reservedContent.classList.add("hidden");

    // Log regular subdomain access
    const subdomain = getCurrentSubdomain();
    if (subdomain) {
      console.log(`Available subdomain accessed: ${subdomain}.deployio.tech`);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Load configuration first
  await loadConfig();

  // Show appropriate content based on subdomain type
  showContent();

  // Initialize neural network
  const canvas = document.getElementById("neural-canvas");
  if (canvas) {
    new NeuralNetwork(canvas);
  }

  // Initialize typing animation (only for regular content)
  if (!isReservedSubdomain()) {
    const typedElement = document.getElementById("typed-text");
    if (typedElement) {
      new TypingAnimation(typedElement);
    }
  }

  // Add button hover effects
  document.querySelectorAll("a[href]").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      // Add visual feedback
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });
  });

  // Add loading animation
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s ease";
    document.body.style.opacity = "1";
  }, 100);
});

// Extract subdomain for analytics
function getCurrentSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
}

// Optional: Send analytics for reserved subdomain access
function sendReservedSubdomainAnalytics(subdomain) {
  // This could send data to your analytics service
  console.log(
    `Analytics: Reserved subdomain ${subdomain} accessed at ${new Date().toISOString()}`
  );
}
