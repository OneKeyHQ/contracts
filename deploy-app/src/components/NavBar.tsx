import { NavLink } from 'react-router-dom';

export function NavBar() {
  return (
    <nav className="flex gap-6 mb-8">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `text-xl font-bold transition-colors ${
            isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        Deploy
      </NavLink>
      <NavLink
        to="/rescue"
        className={({ isActive }) =>
          `text-xl font-bold transition-colors ${
            isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
          }`
        }
      >
        Rescue Assets
      </NavLink>
    </nav>
  );
}
