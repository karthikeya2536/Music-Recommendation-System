
import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Music2 } from 'lucide-react';

// --- Types ---
interface NavItem {
  name: string;
  link: string;
}

interface NavbarProps {
  children?: ReactNode;
  className?: string;
}

// --- Components ---

export const Navbar = ({ children, className = "" }: NavbarProps) => {
  return (
    <div className={`fixed top-0 inset-x-0 z-50 px-4 py-4 md:px-8 pointer-events-none ${className}`}>
      <div className="relative w-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
};

export const NavBody = ({ children, className = "" }: { children?: ReactNode; className?: string }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        width: scrolled ? "90%" : "100%",
        borderRadius: scrolled ? "2rem" : "0rem",
        backgroundColor: scrolled ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0)"
      }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`hidden md:flex items-center justify-between p-3 border border-white/10 backdrop-blur-2xl shadow-2xl mx-auto transition-all duration-500 ease-in-out ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const NavbarLogo = () => {
  return (
    <Link to="/" className="flex items-center gap-2 px-2 hover:opacity-80 transition-opacity">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sonic-accent to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
        <Music2 className="text-white" size={16} />
      </div>
      <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Sonicstream
      </span>
    </Link>
  );
};

export const NavItems = ({ items }: { items: NavItem[] }) => {
  const location = useLocation();
  
  return (
    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md">
      {items.map((item) => {
        const isActive = location.pathname === item.link;
        return (
          <Link
            key={item.name}
            to={item.link}
            className="relative px-6 py-2.5 text-sm font-medium transition-colors rounded-full"
          >
            {isActive && (
              <motion.div
                layoutId="navbar-active"
                className="absolute inset-0 bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)] rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-black font-bold' : 'text-gray-400 hover:text-white transition-colors'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export const NavbarButton = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "" 
}: { 
  children?: ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary"; 
  className?: string; 
}) => {
  const baseStyle = "px-6 py-2 rounded-full font-bold text-sm transition-all duration-200 transform flex items-center justify-center";
  const variants = {
    primary: "bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/5"
  };

  return (
    <motion.button 
      onClick={onClick} 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

// --- Mobile Components ---

export const MobileNav = ({ children }: { children?: ReactNode }) => {
  return <div className="md:hidden block">{children}</div>;
};

export const MobileNavHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
      {children}
    </div>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
};

export const MobileNavMenu = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children?: ReactNode 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-black/90 backdrop-blur-xl mt-2 rounded-2xl border border-white/10"
        >
          <div className="p-4 flex flex-col gap-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
