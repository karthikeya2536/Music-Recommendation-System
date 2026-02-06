import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from './ui/resizable-navbar';

export const TopNavigation = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Discover", link: "/" },
    { name: "Search", link: "/search" },
    { name: "Library", link: "/library" },
  ];

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody className="relative">
        {/* Left: Logo */}
        <NavbarLogo />
        
        {/* Center: Navigation Links */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <NavItems items={navItems} />
        </div>
        
        {/* Right: Auth/Profile */}
        <div className="flex items-center gap-4 ml-auto">
          {!isAuthenticated ? (
            <NavbarButton onClick={() => navigate('/auth/login')} variant="primary">
              Login
            </NavbarButton>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                 <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-white group-hover:text-sonic-accent transition-colors">{user?.name}</p>
                 </div>
                 <img 
                   src={user?.avatar} 
                   alt="User" 
                   className="w-8 h-8 rounded-full border border-white/20 shadow-lg"
                 />
              </Link>
              <NavbarButton onClick={logout} variant="secondary" className="!px-4 !py-1.5 !text-xs">
                Log out
              </NavbarButton>
            </div>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item) => {
             const isActive = location.pathname === item.link;
             return (
              <Link
                key={item.name}
                to={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-sonic-accent/20 text-sonic-accent' : 'text-gray-300 hover:bg-white/5'}`}
              >
                <span className="text-lg font-medium">{item.name}</span>
              </Link>
            );
          })}
          <div className="h-px bg-white/10 my-2" />
          {!isAuthenticated ? (
            <NavbarButton
              onClick={() => {
                navigate('/auth/login');
                setIsMobileMenuOpen(false);
              }}
              variant="primary"
              className="w-full py-3"
            >
              Login
            </NavbarButton>
          ) : (
             <div className="space-y-3">
               <div className="flex items-center gap-3 px-2">
                 <img src={user?.avatar} className="w-8 h-8 rounded-full" alt="User" />
                 <span className="font-bold">{user?.name}</span>
               </div>
               <NavbarButton
                 onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                 }}
                 variant="secondary"
                 className="w-full"
                >
                  Log out
               </NavbarButton>
             </div>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};