import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleSignOut = () => {
    localStorage.removeItem('recruiterEmail');
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="h-24 border-b border-neutral-800 bg-black flex items-center justify-between px-8 shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        <span className="font-black text-3xl text-white tracking-widest uppercase">AcmeHire</span>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={toggleDropdown}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-black border border-neutral-800 rounded-md shadow-2xl py-1 z-50">
            <button 
              className="block w-full text-left px-4 py-3 text-base text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
              onClick={() => { setDropdownOpen(false); alert('Profile clicked'); }}
            >
              Profile
            </button>
            <button 
              className="block w-full text-left px-4 py-3 text-base text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
              onClick={handleSignOut}
            >
              Signout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
