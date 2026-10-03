import React from 'react';

interface LogoProps {
  variant?: 'header' | 'compact' | 'footer' | 'mark-only';
  className?: string;
  onClick?: () => void;
  showTagline?: boolean;
}

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Background celestial halo */}
      <div 
        className="absolute inset-0 rounded-full bg-radial from-[#F2C572]/25 via-[#F2C572]/05 to-transparent blur-[2px] animate-pulse" 
        style={{ animationDuration: '4s' }}
      />
      
      {/* Outer SVG Celestial Star & Astrolabe Astrometry Motif */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(242,197,114,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="celestialGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D6" />
            <stop offset="50%" stopColor="#F2C572" />
            <stop offset="100%" stopColor="#D49B35" />
          </linearGradient>
          <radialGradient id="starCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF9E6" stopOpacity="1" />
            <stop offset="40%" stopColor="#F2C572" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F2C572" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Orbit ring / Astrolabe ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          stroke="#F2C572" 
          strokeOpacity="0.35" 
          strokeWidth="0.8" 
          strokeDasharray="2 3"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="30" 
          stroke="#F2C572" 
          strokeOpacity="0.25" 
          strokeWidth="0.6" 
        />

        {/* 4 Cardinal Tick Marks */}
        <line x1="50" y1="2" x2="50" y2="8" stroke="#F2C572" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="50" y1="92" x2="50" y2="98" stroke="#F2C572" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="2" y1="50" x2="8" y2="50" stroke="#F2C572" strokeWidth="1.2" strokeOpacity="0.8" />
        <line x1="92" y1="50" x2="98" y2="50" stroke="#F2C572" strokeWidth="1.2" strokeOpacity="0.8" />

        {/* Diagonal Secondary Micro Stars */}
        <circle cx="23" cy="23" r="1.2" fill="#F2C572" fillOpacity="0.7" />
        <circle cx="77" cy="23" r="1.2" fill="#F2C572" fillOpacity="0.7" />
        <circle cx="23" cy="77" r="1.2" fill="#F2C572" fillOpacity="0.7" />
        <circle cx="77" cy="77" r="1.2" fill="#F2C572" fillOpacity="0.7" />

        {/* Constellation line connectors */}
        <path 
          d="M23 23 L50 50 L77 23 M23 77 L50 50 L77 77" 
          stroke="#F2C572" 
          strokeWidth="0.5" 
          strokeOpacity="0.2" 
        />

        {/* 8-Point Octagram Celestial Star */}
        {/* Primary 4-point Diamond Rays */}
        <path
          d="M50 8 Q50 45 15 50 Q50 55 50 92 Q50 55 85 50 Q50 45 50 8 Z"
          fill="url(#celestialGold)"
          className="filter drop-shadow-[0_0_4px_rgba(242,197,114,0.6)]"
        />
        {/* Diagonal 4-point Diamond Rays */}
        <path
          d="M50 20 Q50 47 25 50 Q50 53 50 80 Q50 53 75 50 Q50 47 50 20 Z"
          fill="url(#celestialGold)"
          opacity="0.85"
          transform="rotate(45 50 50)"
        />

        {/* Center glowing star core */}
        <circle cx="50" cy="50" r="10" fill="url(#starCoreGlow)" />
        <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

export function Logo({
  variant = 'header',
  className = '',
  onClick,
  showTagline = true,
}: LogoProps) {
  if (variant === 'mark-only') {
    return (
      <button
        onClick={onClick}
        className={`bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C572] rounded ${className}`}
        title="Constellation — Celestial Life Journal"
        aria-label="Constellation Logo"
      >
        <LogoMark size={32} />
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        onClick={onClick}
        className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#080a1c]/85 hover:bg-[#080a1c]/95 backdrop-blur-md border border-white/10 hover:border-[#F2C572]/40 transition-all duration-300 shadow-xl cursor-pointer text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F2C572] ${className}`}
        title="Constellation — A sky for your life"
      >
        <LogoMark size={24} />
        <div className="flex flex-col leading-tight">
          <span className="font-serif-cormorant font-semibold tracking-[0.18em] text-[15px] sm:text-[16px] text-[#EDEFF7] group-hover:text-[#F2C572] transition-colors uppercase">
            Constellation
          </span>
          <span className="hidden md:inline font-mono-dm text-[9px] tracking-wider text-[#8890AE] group-hover:text-[#F2C572]/80 transition-colors uppercase">
            A sky for your life
          </span>
        </div>
      </button>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
        <button
          onClick={onClick}
          className="group flex flex-col items-center gap-2.5 bg-transparent border-none p-0 cursor-pointer focus:outline-none"
        >
          <div className="p-3 rounded-full bg-[#080a1c] border border-[#F2C572]/30 shadow-[0_0_20px_rgba(242,197,114,0.15)] group-hover:border-[#F2C572]/60 group-hover:shadow-[0_0_25px_rgba(242,197,114,0.25)] transition-all">
            <LogoMark size={36} />
          </div>
          <div className="text-center">
            <span className="font-serif-cormorant text-2xl font-bold tracking-[0.25em] text-[#EDEFF7] group-hover:text-[#F2C572] transition-colors uppercase block">
              Constellation
            </span>
            {showTagline && (
              <span className="font-mono-dm text-[11px] tracking-[0.18em] text-[#8890AE] uppercase block mt-0.5">
                Celestial Life Atlas & Journal
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  // Compact variant
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 bg-transparent border-none p-1 cursor-pointer text-left focus:outline-none ${className}`}
    >
      <LogoMark size={22} />
      <span className="font-serif-cormorant font-medium tracking-[0.15em] text-base text-[#EDEFF7] group-hover:text-[#F2C572] transition-colors uppercase">
        Constellation
      </span>
    </button>
  );
}
