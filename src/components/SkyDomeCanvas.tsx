import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Compass, 
  Sliders, 
  Maximize2,
  Minimize2,
  Info,
  Activity
} from 'lucide-react';
import { Constellation, Star, DeepSkyObject } from '../types/astronomy';
import { ALL_SKY_STARS } from '../data/starsData';
import { CONSTELLATIONS } from '../data/constellationsData';
import { DEEP_SKY_OBJECTS } from '../data/deepSkyData';
import { 
  raDecToSphere, 
  project3DTo2D, 
  magToVisuals, 
  getSpectralColor, 
  getSpectralGlow 
} from '../utils/celestialMath';
import { celestialAudio } from '../utils/audioSynth';

interface SkyDomeCanvasProps {
  selectedConstellation: Constellation | null;
  onSelectConstellation: (c: Constellation | null) => void;
  onSelectStar: (star: Star | null) => void;
  selectedStar: Star | null;
  customConstellations?: Array<{
    id: string;
    name: string;
    stars: Array<{ x: number; y: number; name: string; mag: number }>;
    lines: Array<[number, number]>;
    colorTheme: string;
  }>;
}

export function SkyDomeCanvas({
  selectedConstellation,
  onSelectConstellation,
  onSelectStar,
  selectedStar,
  customConstellations = []
}: SkyDomeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Celestial camera orientation
  const [yaw, setYaw] = useState<number>(0.3); // Azimuth rotation
  const [pitch, setPitch] = useState<number>(0.2); // Altitude tilt
  const [zoom, setZoom] = useState<number>(1.1);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  
  // Layer Display Toggles
  const [showStarLabels, setShowStarLabels] = useState<boolean>(true);
  const [showConstellationLines, setShowConstellationLines] = useState<boolean>(true);
  const [showConstellationNames, setShowConstellationNames] = useState<boolean>(true);
  const [showCelestialGrid, setShowCelestialGrid] = useState<boolean>(true);
  const [showDeepSkyObjects, setShowDeepSkyObjects] = useState<boolean>(true);
  const [showMilkyWayDust, setShowMilkyWayDust] = useState<boolean>(true);
  const [bortleScale, setBortleScale] = useState<number>(2); // 1 = pristine dark sky, 9 = light polluted city
  const [showControlsPanel, setShowControlsPanel] = useState<boolean>(false);

  // Hover states
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [hoveredConstellation, setHoveredConstellation] = useState<Constellation | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag interaction tracking
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  // Precomputed spherical 3D coordinates for all stars
  const stars3DRef = useRef<Array<{ star: Star; sphere: { x: number; y: number; z: number } }>>([]);
  const dso3DRef = useRef<Array<{ dso: DeepSkyObject; sphere: { x: number; y: number; z: number } }>>([]);

  useEffect(() => {
    stars3DRef.current = ALL_SKY_STARS.map(star => ({
      star,
      sphere: raDecToSphere(star.ra, star.dec),
    }));

    dso3DRef.current = DEEP_SKY_OBJECTS.map(dso => ({
      dso,
      sphere: raDecToSphere(dso.ra, dso.dec),
    }));
  }, []);

  // When selectedConstellation changes externally, smoothly center camera on it
  useEffect(() => {
    if (selectedConstellation) {
      const targetYaw = -((selectedConstellation.raCenter / 24) * 2 * Math.PI) + Math.PI / 2;
      const targetPitch = -((selectedConstellation.decCenter * Math.PI) / 180);
      
      setYaw(targetYaw);
      setPitch(Math.max(-1.2, Math.min(1.2, targetPitch)));
      setZoom(1.4);
      setIsAutoRotating(false);
      celestialAudio.playConstellationChord(selectedConstellation.stars.length || 5);
    }
  }, [selectedConstellation]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.015;

      // Handle auto-rotation
      if (isAutoRotating && !isDraggingRef.current) {
        setYaw(prev => prev + 0.0008);
      }

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      // 1. Deep Space Velvet Background
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 50,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, '#0a0e27');
      bgGrad.addColorStop(0.5, '#050716');
      bgGrad.addColorStop(1, '#020308');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Milky Way Ambient Nebula Bands
      if (showMilkyWayDust) {
        ctx.save();
        // Project galactic equator points
        const numGalacticPoints = 60;
        const mwPoints: { x: number; y: number; visible: boolean }[] = [];
        
        for (let i = 0; i <= numGalacticPoints; i++) {
          const l = (i / numGalacticPoints) * 2 * Math.PI;
          // Approximate galactic plane orientation
          const ra = (l / (2 * Math.PI)) * 24;
          const dec = Math.sin(l + 1.1) * 62;
          const pt3d = raDecToSphere(ra, dec);
          const pt2d = project3DTo2D(pt3d, width, height, yaw, pitch, zoom);
          mwPoints.push(pt2d);
        }

        for (let i = 0; i < mwPoints.length - 1; i++) {
          const p1 = mwPoints[i];
          const p2 = mwPoints[i + 1];
          if (p1.visible && p2.visible) {
            const mwGrad = ctx.createRadialGradient(p1.x, p1.y, 10, p1.x, p1.y, 80 * zoom);
            mwGrad.addColorStop(0, 'rgba(99, 102, 241, 0.045)');
            mwGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.025)');
            mwGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = mwGrad;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 75 * zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 3. Render Celestial Grid Lines (Equatorial & Polar)
      if (showCelestialGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(70, 95, 150, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);

        // Declination circles (-60, -30, 0 Equator, 30, 60)
        [-60, -30, 0, 30, 60].forEach(decDeg => {
          ctx.beginPath();
          let started = false;
          const isEquator = decDeg === 0;
          if (isEquator) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.lineWidth = 1.2;
          } else {
            ctx.strokeStyle = 'rgba(70, 95, 150, 0.1)';
            ctx.lineWidth = 1;
          }

          for (let h = 0; h <= 24; h += 0.5) {
            const pt3d = raDecToSphere(h, decDeg);
            const pt2d = project3DTo2D(pt3d, width, height, yaw, pitch, zoom);
            if (pt2d.visible) {
              if (!started) {
                ctx.moveTo(pt2d.x, pt2d.y);
                started = true;
              } else {
                ctx.lineTo(pt2d.x, pt2d.y);
              }
            } else {
              started = false;
            }
          }
          ctx.stroke();
        });

        // Hour Meridian circles (0h, 6h, 12h, 18h)
        [0, 6, 12, 18].forEach(raH => {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(70, 95, 150, 0.1)';
          let started = false;
          for (let d = -85; d <= 85; d += 5) {
            const pt3d = raDecToSphere(raH, d);
            const pt2d = project3DTo2D(pt3d, width, height, yaw, pitch, zoom);
            if (pt2d.visible) {
              if (!started) {
                ctx.moveTo(pt2d.x, pt2d.y);
                started = true;
              } else {
                ctx.lineTo(pt2d.x, pt2d.y);
              }
            } else {
              started = false;
            }
          }
          ctx.stroke();
        });

        ctx.restore();
      }

      // 4. Project and map all stars to 2D
      const projectedStars: Array<{
        star: Star;
        screen: { x: number; y: number; visible: boolean; depth: number };
        visuals: { radius: number; opacity: number; glowRadius: number };
      }> = [];

      // Light pollution cutoff: Bortle 1 sees down to mag 6.5, Bortle 9 only sees mag < 3.0
      const maxVisibleMag = 7.0 - (bortleScale - 1) * 0.5;

      stars3DRef.current.forEach(({ star, sphere }) => {
        if (star.mag > maxVisibleMag && !star.bayer) return;

        const screen = project3DTo2D(sphere, width, height, yaw, pitch, zoom);
        if (screen.visible) {
          const visuals = magToVisuals(star.mag, zoom);
          projectedStars.push({ star, screen, visuals });
        }
      });

      const starScreenMap = new Map<string, { x: number; y: number; visible: boolean }>();
      projectedStars.forEach(p => {
        starScreenMap.set(p.star.id, p.screen);
      });

      // 5. Render Constellation Lines & Asterisms
      if (showConstellationLines) {
        ctx.save();
        CONSTELLATIONS.forEach(constell => {
          const isSelected = selectedConstellation?.id === constell.id;
          const isHovered = hoveredConstellation?.id === constell.id;

          ctx.beginPath();
          if (isSelected) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 2.2;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
          } else if (isHovered) {
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.75)';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#a78bfa';
            ctx.shadowBlur = 6;
          } else {
            ctx.strokeStyle = 'rgba(99, 135, 200, 0.22)';
            ctx.lineWidth = 1.1;
            ctx.shadowBlur = 0;
          }

          constell.lines.forEach(([id1, id2]) => {
            const p1 = starScreenMap.get(id1);
            const p2 = starScreenMap.get(id2);
            if (p1 && p2 && p1.visible && p2.visible) {
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
            }
          });
          ctx.stroke();
        });
        ctx.restore();
      }

      // 5b. Render Custom User Constellations
      if (customConstellations.length > 0 && showConstellationLines) {
        ctx.save();
        customConstellations.forEach(c => {
          ctx.strokeStyle = c.colorTheme === 'gold' ? 'rgba(251, 191, 36, 0.75)' : 'rgba(52, 211, 153, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 4]);

          c.lines.forEach(([idx1, idx2]) => {
            const s1 = c.stars[idx1];
            const s2 = c.stars[idx2];
            if (s1 && s2) {
              // Convert relative coordinate 0..1 to screen relative for custom canvas
              const x1 = (s1.x - 0.5) * (width * 0.8) + width / 2;
              const y1 = (s1.y - 0.5) * (height * 0.8) + height / 2;
              const x2 = (s2.x - 0.5) * (width * 0.8) + width / 2;
              const y2 = (s2.y - 0.5) * (height * 0.8) + height / 2;

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          });
        });
        ctx.restore();
      }

      // 6. Render Deep Sky Objects (M31, M42, M45, etc.)
      if (showDeepSkyObjects) {
        ctx.save();
        dso3DRef.current.forEach(({ dso, sphere }) => {
          const pt2d = project3DTo2D(sphere, width, height, yaw, pitch, zoom);
          if (pt2d.visible) {
            // Glowing target ring
            ctx.beginPath();
            ctx.strokeStyle = dso.type === 'Galaxy' ? 'rgba(244, 114, 182, 0.5)' : 'rgba(56, 189, 248, 0.5)';
            ctx.lineWidth = 1;
            ctx.arc(pt2d.x, pt2d.y, 6 * zoom, 0, Math.PI * 2);
            ctx.stroke();

            // Tiny center core
            ctx.beginPath();
            ctx.fillStyle = dso.type === 'Galaxy' ? '#f472b6' : '#38bdf8';
            ctx.arc(pt2d.x, pt2d.y, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Label
            if (zoom > 1.05) {
              ctx.font = '10px "Space Mono", monospace';
              ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
              ctx.fillText(dso.catalogNum, pt2d.x + 8, pt2d.y + 3);
            }
          }
        });
        ctx.restore();
      }

      // 7. Render Stars
      projectedStars.forEach(({ star, screen, visuals }) => {
        const isSelectedStar = selectedStar?.id === star.id;
        const isHoveredStar = hoveredStar?.id === star.id;
        const isInSelectedConstell = selectedConstellation?.stars.some(s => s.id === star.id);

        // Twinkle factor
        const twinkle = Math.sin(time * 3 + star.ra * 10) * 0.15;
        const effectiveOpacity = Math.min(1, Math.max(0.2, visuals.opacity + twinkle));
        const effectiveRadius = visuals.radius * (isSelectedStar || isHoveredStar ? 1.6 : 1);

        // Outer Stellar Corona / Glow
        if (star.mag < 3.5 || isSelectedStar || isHoveredStar || isInSelectedConstell) {
          ctx.beginPath();
          const glowRad = visuals.glowRadius * (isSelectedStar ? 2.2 : 1.2);
          const glowGrad = ctx.createRadialGradient(
            screen.x, screen.y, 0,
            screen.x, screen.y, glowRad
          );
          glowGrad.addColorStop(0, getSpectralGlow(star.spectralType));
          glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glowGrad;
          ctx.arc(screen.x, screen.y, glowRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star Solid Core
        ctx.beginPath();
        ctx.fillStyle = isSelectedStar ? '#ffffff' : star.color;
        ctx.globalAlpha = effectiveOpacity;
        ctx.arc(screen.x, screen.y, effectiveRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Selection / Hover rings
        if (isSelectedStar || isHoveredStar) {
          ctx.beginPath();
          ctx.strokeStyle = isSelectedStar ? '#38bdf8' : '#e2e8f0';
          ctx.lineWidth = 1.5;
          ctx.arc(screen.x, screen.y, effectiveRadius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Star Name Label (bright stars or zoomed in or hovered)
        if (showStarLabels && (star.mag < 2.2 || isHoveredStar || isSelectedStar || (zoom > 1.3 && star.mag < 3.8))) {
          ctx.font = isSelectedStar || isHoveredStar ? 'bold 11px "Space Mono", monospace' : '9px "Space Mono", monospace';
          ctx.fillStyle = isSelectedStar ? '#38bdf8' : isHoveredStar ? '#f8fafc' : 'rgba(203, 213, 225, 0.65)';
          ctx.fillText(star.name, screen.x + effectiveRadius + 4, screen.y + 3);
        }
      });

      // 8. Render Constellation Names at Centers
      if (showConstellationNames) {
        ctx.save();
        CONSTELLATIONS.forEach(constell => {
          const pt3d = raDecToSphere(constell.raCenter, constell.decCenter);
          const pt2d = project3DTo2D(pt3d, width, height, yaw, pitch, zoom);

          if (pt2d.visible) {
            const isSelected = selectedConstellation?.id === constell.id;
            ctx.font = isSelected ? 'bold 13px "Cinzel", serif' : '11px "Cinzel", serif';
            ctx.fillStyle = isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.55)';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '2px';
            ctx.fillText(constell.name.toUpperCase(), pt2d.x, pt2d.y - 10);
            
            if (isSelected) {
              ctx.font = '9px "Plus Jakarta Sans", sans-serif';
              ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
              ctx.fillText(`(${constell.englishName})`, pt2d.x, pt2d.y + 4);
            }
          }
        });
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    yaw, pitch, zoom, isAutoRotating,
    showStarLabels, showConstellationLines, showConstellationNames,
    showCelestialGrid, showDeepSkyObjects, showMilkyWayDust,
    bortleScale, selectedConstellation, selectedStar,
    hoveredStar, hoveredConstellation, customConstellations
  ]);

  // Handle Canvas Resize
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const observer = new ResizeObserver(updateCanvasDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [updateCanvasDimensions]);

  // Mouse / Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setMousePos({ x: mouseX, y: mouseY });

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.004 / Math.sqrt(zoom);
      setYaw(prev => prev - dx * sensitivity);
      setPitch(prev => Math.max(-1.4, Math.min(1.4, prev - dy * sensitivity)));
      return;
    }

    // Check star hover hit-detection
    const dpr = window.devicePixelRatio || 1;
    const canvasW = canvas.width / dpr;
    const canvasH = canvas.height / dpr;

    let foundStar: Star | null = null;
    let minDist = 18; // hover threshold in px

    stars3DRef.current.forEach(({ star, sphere }) => {
      const pt2d = project3DTo2D(sphere, canvasW, canvasH, yaw, pitch, zoom);
      if (pt2d.visible) {
        const dist = Math.hypot(pt2d.x - mouseX, pt2d.y - mouseY);
        if (dist < minDist) {
          minDist = dist;
          foundStar = star;
        }
      }
    });

    if (foundStar !== hoveredStar) {
      setHoveredStar(foundStar);
      if (foundStar) {
        celestialAudio.playStarTone((foundStar as Star).spectralType, (foundStar as Star).mag, 0.15);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = () => {
    if (hoveredStar) {
      onSelectStar(hoveredStar);
      // Find parent constellation if any
      const parentConstell = CONSTELLATIONS.find(c => c.id === hoveredStar.constellationId);
      if (parentConstell) {
        onSelectConstellation(parentConstell);
      }
    } else {
      // Check if clicking near any constellation center
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const canvasW = canvas.width / dpr;
      const canvasH = canvas.height / dpr;

      let foundConstell: Constellation | null = null;
      let minConstDist = 60;

      CONSTELLATIONS.forEach(c => {
        const pt3d = raDecToSphere(c.raCenter, c.decCenter);
        const pt2d = project3DTo2D(pt3d, canvasW, canvasH, yaw, pitch, zoom);
        if (pt2d.visible) {
          const dist = Math.hypot(pt2d.x - mousePos.x, pt2d.y - mousePos.y);
          if (dist < minConstDist) {
            minConstDist = dist;
            foundConstell = c;
          }
        }
      });

      if (foundConstell) {
        onSelectConstellation(foundConstell);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.6, Math.min(3.5, prev * zoomFactor)));
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsAutoRotating(false);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastMousePosRef.current.x;
      const dy = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const sensitivity = 0.005 / Math.sqrt(zoom);
      setYaw(prev => prev - dx * sensitivity);
      setPitch(prev => Math.max(-1.4, Math.min(1.4, prev - dy * sensitivity)));
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      setZoom(prev => Math.max(0.6, Math.min(3.5, prev * ratio)));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchStartDistRef.current = null;
  };

  const resetCamera = () => {
    setYaw(0.3);
    setPitch(0.2);
    setZoom(1.1);
    setIsAutoRotating(true);
    onSelectConstellation(null);
    onSelectStar(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-4rem)] bg-[#020308] overflow-hidden select-none">
      
      {/* Interactive WebGL/2D Canvas */}
      <canvas
        id="sky-dome-main-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Hover Star Popover */}
      {hoveredStar && (
        <div 
          className="absolute pointer-events-none z-30 bg-[#090e24]/90 backdrop-blur-md border border-cyan-500/40 p-2.5 rounded-xl shadow-2xl text-xs space-y-1 transition-all"
          style={{
            left: Math.min(window.innerWidth - 200, mousePos.x + 16),
            top: Math.min(window.innerHeight - 150, mousePos.y + 16),
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 pb-1">
            <span className="font-cinzel font-bold text-slate-100">{hoveredStar.name}</span>
            <span 
              className="text-[10px] font-mono-astronomy px-1.5 py-0.5 rounded font-semibold"
              style={{ backgroundColor: `${hoveredStar.color}22`, color: hoveredStar.color }}
            >
              Class {hoveredStar.spectralType}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300 font-mono-astronomy">
            <div>Mag: <span className="text-cyan-300">{hoveredStar.mag.toFixed(2)}</span></div>
            <div>Dist: <span className="text-cyan-300">{hoveredStar.distLy} ly</span></div>
            {hoveredStar.temperatureK && (
              <div className="col-span-2 text-[10px] text-slate-400">
                Temp: {hoveredStar.temperatureK.toLocaleString()} K
              </div>
            )}
          </div>
          {hoveredStar.notes && (
            <p className="text-[10px] text-slate-400 italic pt-0.5 max-w-[200px] line-clamp-2">
              {hoveredStar.notes}
            </p>
          )}
        </div>
      )}

      {/* Floating Bottom View Toolbar & Stargazer Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#090e24]/85 backdrop-blur-xl border border-cyan-900/40 px-3 py-2 rounded-2xl shadow-2xl">
        
        {/* Play/Pause Auto-drift */}
        <button
          id="btn-toggle-drift"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-2 rounded-xl transition-all ${
            isAutoRotating 
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
          title={isAutoRotating ? 'Pause Celestial Drift' : 'Start Celestial Drift'}
        >
          {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Zoom In / Out */}
        <div className="flex items-center bg-slate-900/60 rounded-xl border border-slate-800">
          <button
            id="btn-zoom-in"
            onClick={() => setZoom(prev => Math.min(3.5, prev * 1.25))}
            className="p-2 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono-astronomy text-slate-400 px-1 select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            id="btn-zoom-out"
            onClick={() => setZoom(prev => Math.max(0.6, prev * 0.8))}
            className="p-2 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Reset View */}
        <button
          id="btn-reset-view"
          onClick={resetCamera}
          className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          title="Reset Sky Dome View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-slate-800 my-auto" />

        {/* Layers & Settings Drawer Toggle */}
        <button
          id="btn-toggle-layers"
          onClick={() => setShowControlsPanel(!showControlsPanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            showControlsPanel
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900/60 text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sky Filters</span>
        </button>
      </div>

      {/* Layer Settings Modal / Panel */}
      {showControlsPanel && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 z-30 bg-[#090e24]/95 backdrop-blur-2xl border border-cyan-800/50 p-4 rounded-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-cinzel text-xs font-bold tracking-wider text-slate-100">Celestial Sky Settings</span>
            </div>
            <button
              onClick={() => setShowControlsPanel(false)}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Toggle switches grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Constellation Lines</span>
              <input
                type="checkbox"
                checked={showConstellationLines}
                onChange={e => setShowConstellationLines(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Constellation Names</span>
              <input
                type="checkbox"
                checked={showConstellationNames}
                onChange={e => setShowConstellationNames(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Star Labels</span>
              <input
                type="checkbox"
                checked={showStarLabels}
                onChange={e => setShowStarLabels(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Equatorial Grid</span>
              <input
                type="checkbox"
                checked={showCelestialGrid}
                onChange={e => setShowCelestialGrid(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Deep Sky (M31, M42)</span>
              <input
                type="checkbox"
                checked={showDeepSkyObjects}
                onChange={e => setShowDeepSkyObjects(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-slate-300">Milky Way Dust</span>
              <input
                type="checkbox"
                checked={showMilkyWayDust}
                onChange={e => setShowMilkyWayDust(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
            </label>
          </div>

          {/* Bortle Scale (Light Pollution) Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Bortle Light Pollution:</span>
              <span className="font-mono-astronomy text-amber-300 font-semibold">
                Class {bortleScale} {bortleScale === 1 ? '(Pristine Dark Sky)' : bortleScale >= 8 ? '(City Glow)' : '(Rural)'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={bortleScale}
              onChange={e => setBortleScale(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono-astronomy">
              <span>Class 1 (Deep Sky)</span>
              <span>Class 9 (Urban Center)</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Quick Celestial Jumps */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-1.5 bg-[#090e24]/75 backdrop-blur-md border border-slate-800/80 p-1.5 rounded-xl text-xs">
        <span className="text-[10px] uppercase font-mono-astronomy text-slate-500 px-1">Quick Jump:</span>
        {['Orion', 'Ursa Major', 'Cassiopeia', 'Cygnus', 'Crux', 'Scorpius', 'Taurus'].map((name) => {
          const c = CONSTELLATIONS.find(item => item.name === name);
          const isActive = selectedConstellation?.name === name;
          return (
            <button
              key={name}
              onClick={() => {
                if (c) onSelectConstellation(c);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

    </div>
  );
}
