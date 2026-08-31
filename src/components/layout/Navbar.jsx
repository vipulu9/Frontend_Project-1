import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = async () => {
    closeMenu()
    await logout()
    navigate('/login', { replace: true })
  }

  // Avatar initial derived from name; falls back to '?' if name is empty
  const initial = user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="nb-bar">
      <div className="nb-inner">
        <Link to={user ? '/' : '/login'} className="nb-brand" onClick={closeMenu}>
          VoicePilot
        </Link>

        {/* Desktop navigation — hidden on mobile via CSS */}
        {!isLoading && (
          <nav className="nb-links" aria-label="Main navigation">
            {user ? (
              <>
                <Link to="/" className="nb-link">Dashboard</Link>
                <div className="nb-user">
                  <span className="nb-avatar" aria-hidden="true">{initial}</span>
                  <span className="nb-username">{user.name}</span>
                </div>
                <button className="nb-btn nb-btn--ghost" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nb-link">Sign in</Link>
                <Link to="/register" className="nb-btn">Get started</Link>
              </>
            )}
          </nav>
        )}

        {/* Hamburger — visible only on mobile */}
        <button
          className={`nb-hamburger${menuOpen ? ' nb-hamburger--open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="nb-mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && !isLoading && (
        <nav id="nb-mobile-menu" className="nb-mobile" aria-label="Mobile navigation">
          {user ? (
            <>
              <div className="nb-mobile-user">
                <span className="nb-avatar" aria-hidden="true">{initial}</span>
                <span className="nb-username">{user.name}</span>
              </div>
              <Link to="/" className="nb-mobile-link" onClick={closeMenu}>
                Dashboard
              </Link>
              <button className="nb-mobile-signout" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nb-mobile-link" onClick={closeMenu}>
                Sign in
              </Link>
              <Link to="/register" className="nb-mobile-link nb-mobile-link--accent" onClick={closeMenu}>
                Get started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
