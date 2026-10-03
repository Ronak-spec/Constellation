import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UnderstoryNode, UnderstoryThread, UnlitTask } from '../types/constellation';
import { audio } from '../utils/audio';

interface UnderstoryTabProps {
  usOwn: { id: string; text: string; ts: number }[];
  usGhosts: { id: string; text: string }[];
  usThreads: UnderstoryThread[];
  onBuryThought: (text: string) => void;
  onSurfaceThought: (task: Omit<UnlitTask, 'id'>) => void;
  onRemoveThought: (id: string) => void;
}

export function UnderstoryTab({
  usOwn,
  usGhosts,
  usThreads,
  onBuryThought,
  onSurfaceThought,
  onRemoveThought,
}: UnderstoryTabProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [isBurying, setIsBurying] = useState(false);
  const [showGhosts, setShowGhosts] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [appearingId, setAppearingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const allNodes: UnderstoryNode[] = useMemo(() => {
    const ghosts: UnderstoryNode[] = showGhosts
      ? usGhosts.map((g) => ({ id: g.id, text: g.text, isOwn: false, isGhost: true }))
      : [];
    const own: UnderstoryNode[] = usOwn.map((n) => ({
      id: n.id,
      text: n.text,
      isOwn: true,
      isGhost: false,
      ts: n.ts,
    }));
    return [...ghosts, ...own];
  }, [showGhosts, usGhosts, usOwn]);

  // Similarity function
  const similarity = (a: string, b: string): number => {
    const tok = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3)
      );
    const ta = tok(a);
    const tb = tok(b);
    const inter = [...ta].filter((w) => tb.has(w)).length;
    const union = new Set([...ta, ...tb]).size;
    return union === 0 ? 0 : inter / union;
  };

  // Safe position allocator
  useEffect(() => {
    const w = canvasRef.current?.offsetWidth || 660;
    const h = canvasRef.current?.offsetHeight || 460;
    const pad = 46;
    const safeBottom = h - 30;

    const newPositions: Record<string, { x: number; y: number }> = { ...positions };
    const placed = Object.values(newPositions);

    let changed = false;
    allNodes.forEach((n) => {
      if (!newPositions[n.id]) {
        let chosenPos = { x: pad + Math.random() * (w - pad * 2), y: pad + Math.random() * (h / 2) };
        for (let attempt = 0; attempt < 60; attempt++) {
          const x = pad + Math.random() * (w - pad * 2);
          const y = pad + Math.random() * (safeBottom - pad);
          const tooClose = placed.some((p) => {
            const dx = p.x - x;
            const dy = p.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 48;
          });
          if (!tooClose) {
            chosenPos = { x, y };
            break;
          }
        }
        newPositions[n.id] = chosenPos;
        placed.push(chosenPos);
        changed = true;
      }
    });

    if (changed) {
      setPositions(newPositions);
    }
  }, [allNodes]);

  // Compute all active threads
  const activeThreads = useMemo(() => {
    const threads: UnderstoryThread[] = [];
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < allNodes.length; j++) {
        if (allNodes[i].isGhost && allNodes[j].isGhost) {
          const sim = similarity(allNodes[i].text, allNodes[j].text);
          if (sim > 0.12) {
            threads.push({ from: allNodes[i].id, to: allNodes[j].id });
          }
        }
      }
    }
    usThreads.forEach((t) => {
      const fromExists = allNodes.some((n) => n.id === t.from);
      const toExists = allNodes.some((n) => n.id === t.to);
      if (fromExists && toExists) {
        threads.push(t);
      }
    });
    return threads;
  }, [allNodes, usThreads]);

  const handleBury = () => {
    const text = inputText.trim();
    if (!text || isBurying) return;

    setIsBurying(true);
    setInputText('');
    const newId = 'own-' + Date.now();
    setAppearingId(newId);

    onBuryThought(text);
    audio.chimeBury();

    setTimeout(() => {
      setIsBurying(false);
      setAppearingId(null);
    }, 850);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleBury();
    }
  };

  const handleSurface = (id: string, text: string) => {
    onSurfaceThought({
      text: text.length > 90 ? text.slice(0, 89) + '…' : text,
      cat: 'Work',
      createdAt: Date.now(),
      fromUnderstory: true,
    });
    showToast('surfaced into Not Yet Lit');
  };

  const handleRemove = (id: string) => {
    onRemoveThought(id);
    showToast('pulled back up');
  };

  const ownCount = usOwn.length;
  const connectedCount = activeThreads.filter((t) => {
    const f = allNodes.find((n) => n.id === t.from);
    const to = allNodes.find((n) => n.id === t.to);
    return (f && f.isOwn) || (to && to.isOwn);
  }).length;

  const now = Date.now();

  return (
    <div className="tab-panel active">
      <section className="mt-[54px] first:mt-[26px]">
        <div className="flex justify-between items-baseline mb-5 gap-3.5 flex-wrap">
          <h2 className="font-serif-cormorant font-medium text-[26px] m-0">Understory</h2>
          <span className="text-xs text-[#8890AE] italic">bury a thought — connections find their own way</span>
        </div>

        <p className="text-[13px] text-[#8890AE] -mt-2 mb-[22px] max-w-[66ch] leading-[1.6]">
          Separate from the sky above. What you bury here isn't logged or planned — it just settles, and drifts closer
          to whatever else has been buried near it. Older thoughts sink and dim; nothing is deleted for you.
        </p>

        {/* Canvas Wrap */}
        <div
          ref={canvasRef}
          className="relative w-full h-[460px] bg-[#0D0B08] rounded-[9px] overflow-hidden mb-5 border border-white/6 select-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 500px 300px at 20% 15%, rgba(90,70,40,0.08), transparent 65%)',
          }}
        >
          {/* Subtle noise layer */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.045] z-[1]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Stats & Controls */}
          <div className="absolute top-3.5 left-[18px] font-mono-dm text-[10px] text-[#7A6E5F] leading-[1.8] z-[5]">
            <div>{ownCount} buried</div>
            <div>{connectedCount} connected</div>
          </div>

          <div className="absolute top-3.5 right-[18px] font-serif-cormorant italic text-sm text-[rgba(200,169,110,0.45)] z-[5]">
            the understory
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono-dm text-[10px] text-[#5A5248] whitespace-nowrap z-[5] pointer-events-none">
            hover to read · connections emerge on their own
          </div>

          <button
            onClick={() => setShowGhosts(!showGhosts)}
            className="absolute bottom-3 right-[18px] z-[5] bg-transparent border border-white/10 text-[#7A6E5F] hover:text-[#C8A96E] hover:border-[rgba(200,169,110,0.3)] font-mono-dm text-[9.5px] px-2.5 py-1 rounded-[10px] cursor-pointer transition-colors"
          >
            {showGhosts ? 'hide anonymous' : 'show anonymous'}
          </button>

          {/* SVG Thread Lines */}
          <svg className="absolute inset-0 w-full h-full z-[2] pointer-events-none" preserveAspectRatio="none">
            {activeThreads.map((t, i) => {
              const from = positions[t.from];
              const to = positions[t.to];
              if (!from || !to) return null;

              const fromNode = allNodes.find((n) => n.id === t.from);
              const toNode = allNodes.find((n) => n.id === t.to);
              if (!fromNode || !toNode) return null;

              const isActive = hoveredNodeId === t.from || hoveredNodeId === t.to;
              const midX = (from.x + to.x) / 2 + Math.sin(from.x + to.y) * 18;
              const midY = (from.y + to.y) / 2 + Math.cos(from.y + to.x) * 18;

              const ownInvolved = fromNode.isOwn || toNode.isOwn;
              const bothGhost = fromNode.isGhost && toNode.isGhost;
              const strokeColor = ownInvolved ? '#C8A96E' : '#8FB89A';
              const strokeWidth = isActive ? 1.4 : 0.7;
              const opacity = isActive ? 0.5 : bothGhost ? 0.07 : 0.15;

              return (
                <path
                  key={`${t.from}-${t.to}-${i}`}
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={opacity}
                  style={{ transition: 'opacity 0.35s ease' }}
                />
              );
            })}
          </svg>

          {/* Nodes Layer */}
          <div className="absolute inset-0 z-[3] pointer-events-auto">
            {allNodes.map((n) => {
              const pos = positions[n.id];
              if (!pos) return null;

              let yOffset = 0;
              let opacity = 1;
              if (n.isOwn && n.ts) {
                const days = (now - n.ts) / 86400000;
                yOffset = Math.min(26, days * 4);
                opacity = Math.max(0.5, 1 - days * 0.06);
              }

              const isHovered = hoveredNodeId === n.id;
              const isAppearing = appearingId === n.id;

              return (
                <div
                  key={n.id}
                  onMouseEnter={() => setHoveredNodeId(n.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-[1.3] ${
                    isAppearing ? 'animate-[usNodeIn_0.55s_ease_forwards]' : ''
                  }`}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y + yOffset}px`,
                  }}
                >
                  <div
                    className={`w-[9px] h-[9px] rounded-full transition-opacity duration-1000 ${
                      n.isOwn
                        ? 'bg-[#C8A96E] shadow-[0_0_10px_3px_rgba(200,169,110,0.2)]'
                        : 'bg-[#4A7C59] opacity-[0.38] shadow-[0_0_7px_1px_rgba(74,124,89,0.15)]'
                    }`}
                    style={{ opacity: n.isOwn ? opacity : undefined }}
                  />

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+9px)] left-1/2 -translate-x-1/2 bg-[rgba(20,16,11,0.97)] border border-[rgba(200,169,110,0.18)] rounded-[6px] p-2.5 min-w-[170px] max-w-[230px] font-mono-dm text-[10.5px] leading-[1.6] text-[#E8DCC8] z-20 pointer-events-auto shadow-2xl">
                      {/* Triangle Pointer */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[rgba(200,169,110,0.18)]" />

                      <div>{n.text}</div>

                      {n.isGhost ? (
                        <div className="text-[#7A6E5F] mt-1.5 text-[9.5px]">— anonymous</div>
                      ) : (
                        n.ts && (
                          <div className="text-[#7A6E5F] mt-1.5 text-[9.5px]">
                            buried {Math.floor((now - n.ts) / 86400000) <= 0 ? 'today' : `${Math.floor((now - n.ts) / 86400000)}d ago`}
                          </div>
                        )
                      )}

                      {n.isOwn && (
                        <div className="flex gap-2.5 mt-2 pt-1.5 border-t border-white/6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSurface(n.id, n.text);
                            }}
                            className="bg-transparent border-none text-[#C8A96E] font-mono-dm text-[9.5px] cursor-pointer p-0 underline underline-offset-2 hover:brightness-125"
                          >
                            surface as unlit star
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(n.id);
                            }}
                            className="bg-transparent border-none text-[#B4695A] font-mono-dm text-[9.5px] cursor-pointer p-0 underline underline-offset-2 hover:brightness-125"
                          >
                            remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Row */}
        <div className="flex gap-2.5 items-end">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="bury a thought... (cmd+enter to bury)"
            maxLength={280}
            className="flex-1 bg-[rgba(26,21,16,0.7)] border border-[rgba(200,169,110,0.18)] rounded-[6px] p-3 font-mono-dm text-[12.5px] text-[#E8DCC8] placeholder-[#5A5248] resize-none outline-none leading-[1.6] focus:border-[rgba(200,169,110,0.42)] transition-colors"
          />
          <button
            onClick={handleBury}
            disabled={!inputText.trim() || isBurying}
            className="bg-transparent border border-[rgba(200,169,110,0.3)] hover:bg-[rgba(200,169,110,0.08)] hover:border-[rgba(200,169,110,0.55)] disabled:opacity-30 disabled:cursor-default text-[#C8A96E] font-mono-dm text-[11px] px-4.5 py-2.5 rounded-[6px] cursor-pointer tracking-[0.06em] whitespace-nowrap transition-all"
          >
            bury ↓
          </button>
        </div>

        {/* Toast */}
        <div
          className={`text-[11.5px] text-[#F2C572] font-serif-cormorant italic mt-2.5 transition-opacity duration-300 ${
            toastMessage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {toastMessage || ' '}
        </div>
      </section>
    </div>
  );
}
