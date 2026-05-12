export default function Footer() {
  return (
    <footer className="bg-surface-container-highest text-on-surface-variant flex flex-col md:flex-row justify-between items-center w-full px-8 py-8 gap-4 border-t border-outline-variant">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">CAPITALSTREAM</span>
        <p className="text-[13px]">© 2024 CapitalStream Institutional Markets. All rights reserved. SEC Registered.</p>
      </div>
      <div className="flex gap-6">
        {['Terms of Funding', 'Data Attribution', 'Privacy Policy', 'Regulatory Disclosures'].map((link) => (
          <a key={link} href="#" className="text-[13px] text-on-surface-variant hover:text-primary transition-colors">
            {link}
          </a>
        ))}
      </div>
    </footer>
  )
}
