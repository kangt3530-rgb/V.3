import { Link } from "react-router-dom";

export function TopNav() {
  return (
    <header className="print-hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-16 bg-surface-container-low">
      {/* Left: Logo */}
      <div className="flex items-center gap-10">
        <Link to="/reports/oer-001" className="flex items-center gap-2.5">
          <span className="w-6 h-6 flex items-center justify-center bg-primary rounded-sm">
            <span className="material-symbols-outlined text-on-primary text-[14px]">verified</span>
          </span>
          <span className="font-headline font-semibold text-title-md text-primary tracking-tight">
            OER Certification Hub
          </span>
        </Link>
      </div>

      {/* Right: Avatar placeholder */}
      <div className="flex items-center gap-5">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
          <span className="text-label-sm font-label font-bold text-on-primary-container">AU</span>
        </div>
      </div>
    </header>
  );
}
