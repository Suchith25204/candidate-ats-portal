import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/recruiter-dashboard/home', label: 'home' },
  { path: '/recruiter-dashboard/candidates', label: 'candidates' },
  { path: '/recruiter-dashboard/organization', label: 'organization' },
  { path: '/recruiter-dashboard/roles', label: 'roles' }
];

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-neutral-800 bg-black flex flex-col shrink-0">
      <nav className="flex-1 py-8 px-6 flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `px-5 py-4 rounded-md text-base font-semibold transition-colors border border-transparent ${
                isActive 
                  ? 'bg-neutral-900 text-white border-neutral-800' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
