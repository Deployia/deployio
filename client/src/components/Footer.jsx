function Footer() {
  return (
    <footer className="w-full bg-[rgb(var(--bg-secondary))] border-t border-[rgb(var(--border-color))] py-6 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-[rgb(var(--text-secondary))] text-sm">
        <div className="mb-2 md:mb-0">
          © {new Date().getFullYear()} DeployIO. All rights reserved.
        </div>
        <div className="flex space-x-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(var(--accent-primary))] transition-colors"
          >
            GitHub
          </a>
          <a
            href="#"
            className="hover:text-[rgb(var(--accent-primary))] transition-colors"
          >
            Docs
          </a>
          <a
            href="#"
            className="hover:text-[rgb(var(--accent-primary))] transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
