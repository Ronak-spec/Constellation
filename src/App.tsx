import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SkyHero } from './components/SkyHero';
import { TonightTab } from './components/TonightTab';
import { UnlitTab } from './components/UnlitTab';
import { UnderstoryTab } from './components/UnderstoryTab';
import { WeeklyEphemerisTab } from './components/WeeklyEphemerisTab';
import { AuthBar } from './components/AuthBar';
import {
  ConstellationState,
  StarCategory,
  StarEntry,
  UnlitTask,
  MeteorSub,
  ArchivedNight,
  CONST_NAMES,
} from './types/constellation';
import { 
  auth, 
  loadUserConstellationState, 
  saveUserConstellationState,
  deleteFirestoreDocument
} from './utils/firebase';
import { shiftDate } from './utils/skyEngine';

const STORAGE_KEY = 'constellation-state-v5';

const GHOST_THOUGHTS = [
  'the feeling right before you remember something important',
  'every tool I use shapes how I think',
  'what we call rest is just a different kind of attention',
  "i keep starting sentences i don't know how to finish",
  'the gap between knowing and doing feels like a physical weight',
  'something about the way light changes at 5pm',
  'i wonder if patience is just faith without a name',
  "everything I create is an argument I'm making to myself",
  "the things that comfort me most are the things I can't explain",
  'there are conversations still going in my head from years ago',
  'noticing has become harder the more i know',
  'i am not the same person who started reading this sentence',
  "somewhere between discipline and obsession there's a place i want to live",
  'the best ideas arrive when I stop looking',
  'i keep returning to the same handful of questions',
  'attention is the only thing I actually own',
  'silence as a complete thought',
  'i miss things i have never had',
  'the maps we draw of ourselves are always already outdated',
  "what would it mean to build something that doesn't scale",
];

function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function getDefaultState(): ConstellationState {
  return {
    birthYear: 1996,
    lifeExp: 80,
    wage: 25,
    entries: [],
    tasks: [],
    subs: [],
    archive: [],
    usOwn: [],
    usThreads: [],
    usGhosts: null,
    lastDate: todayStr(),
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [state, setState] = useState<ConstellationState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const d = getDefaultState();
        const shuffled = [...GHOST_THOUGHTS].sort(() => Math.random() - 0.5).slice(0, 14);
        d.usGhosts = shuffled.map((text) => ({
          id: 'g-' + Math.random().toString(36).slice(2),
          text,
        }));
        return d;
      }
      const parsed = JSON.parse(raw);
      const combined = { ...getDefaultState(), ...parsed };
      if (!combined.usGhosts || combined.usGhosts.length === 0) {
        const shuffled = [...GHOST_THOUGHTS].sort(() => Math.random() - 0.5).slice(0, 14);
        combined.usGhosts = shuffled.map((text) => ({
          id: 'g-' + Math.random().toString(36).slice(2),
          text,
        }));
      }
      return combined;
    } catch {
      return getDefaultState();
    }
  });

  const [activeTab, setActiveTab] = useState<'tonight' | 'unlit' | 'understory' | 'ephemeris'>('tonight');
  const [viewingDate, setViewingDate] = useState<string>(todayStr());
  const [viewingArchiveIdx, setViewingArchiveIdx] = useState<number | null>(null);
  const skyHeroContainerRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const today = todayStr();
  const isViewingToday = viewingDate === today && viewingArchiveIdx === null;

  // Auto-save state to localStorage and debounce sync to Firestore
  const updateState = useCallback(
    (updater: (prev: ConstellationState) => ConstellationState) => {
      setState((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }

        // If authenticated, sync to Firestore
        if (auth.currentUser) {
          setIsSyncing(true);
          if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = setTimeout(async () => {
            if (auth.currentUser) {
              await saveUserConstellationState(auth.currentUser, next);
              setIsSyncing(false);
            }
          }, 600);
        }

        return next;
      });
    },
    []
  );

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setIsSyncing(true);
        try {
          const cloudState = await loadUserConstellationState(user);

          if (cloudState) {
            setState((prev) => {
              const merged: ConstellationState = {
                ...cloudState,
                usGhosts: prev.usGhosts || cloudState.usGhosts,
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {
                // ignore
              }
              return merged;
            });
          } else {
            // No remote state or offline: synchronize local state if online
            if (typeof navigator === 'undefined' || navigator.onLine) {
              setState((currentLocal) => {
                saveUserConstellationState(user, currentLocal).catch(() => {});
                return currentLocal;
              });
            }
          }
        } catch (err) {
          // Graceful fallback to existing local storage state
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Force sync helper
  const handleForceSync = useCallback(async () => {
    if (auth.currentUser) {
      setIsSyncing(true);
      try {
        await saveUserConstellationState(auth.currentUser, state);
      } catch {
        // ignore offline errors
      } finally {
        setIsSyncing(false);
      }
    }
  }, [state]);

  // Rotate on new day
  useEffect(() => {
    const currentDay = todayStr();
    if (state.lastDate !== currentDay) {
      updateState((prev) => {
        const newArchive = [...prev.archive];
        if (prev.entries.length > 0) {
          const totals: Record<string, number> = {};
          prev.entries.forEach((e) => {
            totals[e.cat] = (totals[e.cat] || 0) + e.mins;
          });
          let topCat = 'Work';
          let topMins = -1;
          Object.keys(totals).forEach((k) => {
            if (totals[k] > topMins) {
              topMins = totals[k];
              topCat = k;
            }
          });
          const name = CONST_NAMES[topCat] || 'The Wanderer';
          newArchive.push({
            date: prev.lastDate,
            name,
            entries: prev.entries,
          });
        }
        return {
          ...prev,
          archive: newArchive,
          entries: [],
          lastDate: currentDay,
        };
      });
    }
  }, [state.lastDate, updateState]);

  // Shooting star trigger
  const launchShootingStar = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'shooting-star';
    el.style.top = 60 + Math.random() * 140 + 'px';
    el.style.right = '40px';
    el.style.animation = 'shoot 1.1s ease-out forwards';
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1200);
  }, []);

  // Compute displayed entries for whatever date is currently being viewed
  const displayEntries = React.useMemo(() => {
    if (isViewingToday) {
      return state.entries;
    }
    if (viewingArchiveIdx !== null && state.archive[viewingArchiveIdx]) {
      return state.archive[viewingArchiveIdx].entries;
    }
    const matchingArch = state.archive.find((a) => a.date === viewingDate);
    if (matchingArch) {
      return matchingArch.entries;
    }
    return [];
  }, [isViewingToday, viewingArchiveIdx, viewingDate, state.archive, state.entries]);

  // Date Navigation: Previous Day Arrow
  const handlePrevDay = useCallback(() => {
    const prevDate = shiftDate(viewingDate, -1);
    setViewingDate(prevDate);
    const archIdx = state.archive.findIndex((a) => a.date === prevDate);
    setViewingArchiveIdx(archIdx >= 0 ? archIdx : null);
  }, [viewingDate, state.archive]);

  // Date Navigation: Next Day Arrow
  const handleNextDay = useCallback(() => {
    if (viewingDate >= today) return;
    const nextDate = shiftDate(viewingDate, 1);
    if (nextDate >= today) {
      setViewingDate(today);
      setViewingArchiveIdx(null);
    } else {
      setViewingDate(nextDate);
      const archIdx = state.archive.findIndex((a) => a.date === nextDate);
      setViewingArchiveIdx(archIdx >= 0 ? archIdx : null);
    }
  }, [viewingDate, today, state.archive]);

  // Jump back to tonight
  const handleJumpToToday = useCallback(() => {
    setViewingDate(today);
    setViewingArchiveIdx(null);
  }, [today]);

  // Select a specific night from Ring Atlas or Ephemeris
  const handleSelectArchiveNight = useCallback((idx: number | null) => {
    if (idx === null || !state.archive[idx]) {
      setViewingDate(today);
      setViewingArchiveIdx(null);
    } else {
      setViewingArchiveIdx(idx);
      setViewingDate(state.archive[idx].date);
    }
  }, [state.archive, today]);

  // Select a specific date string from Ephemeris Day cards
  const handleSelectDate = useCallback(
    (dateStr: string) => {
      if (dateStr === today) {
        setViewingDate(today);
        setViewingArchiveIdx(null);
      } else {
        setViewingDate(dateStr);
        const archIdx = state.archive.findIndex((a) => a.date === dateStr);
        setViewingArchiveIdx(archIdx >= 0 ? archIdx : null);
      }
      skyHeroContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    [today, state.archive]
  );

  // Keyboard Shortcuts: T, L, U, E, N, ArrowLeft, ArrowRight, Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!isTyping) {
        if (e.key === 't' || e.key === 'T') {
          setActiveTab('tonight');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          setActiveTab('unlit');
          return;
        }
        if (e.key === 'u' || e.key === 'U') {
          setActiveTab('understory');
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          setActiveTab('ephemeris');
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevDay();
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextDay();
          return;
        }
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          if (activeTab === 'tonight') {
            document.querySelector<HTMLInputElement>('input[placeholder="what just happened?"]')?.focus();
          } else if (activeTab === 'unlit') {
            document.querySelector<HTMLInputElement>('input[placeholder="a star you intend to earn"]')?.focus();
          } else if (activeTab === 'understory') {
            document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
          }
          return;
        }
      }

      if (e.key === 'Escape') {
        handleJumpToToday();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handlePrevDay, handleNextDay, handleJumpToToday]);

  // Tonight handlers
  const handleAddEntry = (activity: string, mins: number, cat: StarCategory) => {
    // If user was viewing a past date and logs a new star, return to tonight
    if (!isViewingToday) {
      handleJumpToToday();
    }
    const newEntry: StarEntry = {
      id: 'star-' + Date.now(),
      activity,
      mins,
      cat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateState((prev) => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }));
  };

  const handleRemoveEntry = (index: number) => {
    if (!isViewingToday) return;
    const entryToRemove = state.entries[index];
    if (entryToRemove && currentUser) {
      deleteFirestoreDocument(currentUser, 'entries', entryToRemove.id);
    }
    updateState((prev) => {
      const updated = [...prev.entries];
      updated.splice(index, 1);
      return { ...prev, entries: updated };
    });
  };

  const handleCloseNight = () => {
    if (state.entries.length === 0 || !isViewingToday) return;
    const totals: Record<string, number> = {};
    state.entries.forEach((e) => {
      totals[e.cat] = (totals[e.cat] || 0) + e.mins;
    });
    let topCat = 'Work';
    let topMins = -1;
    Object.keys(totals).forEach((k) => {
      if (totals[k] > topMins) {
        topMins = totals[k];
        topCat = k;
      }
    });
    const name = CONST_NAMES[topCat] || 'The Wanderer';

    updateState((prev) => ({
      ...prev,
      archive: [
        ...prev.archive,
        {
          date: today,
          name,
          entries: [...prev.entries],
        },
      ],
      entries: [],
    }));

    launchShootingStar();
  };

  const handleAddSub = (name: string, cost: number) => {
    updateState((prev) => ({
      ...prev,
      subs: [...prev.subs, { id: 'sub-' + Date.now(), name, cost, kept: false }],
    }));
  };

  const handleToggleSub = (index: number) => {
    updateState((prev) => {
      const updated = [...prev.subs];
      updated[index] = { ...updated[index], kept: !updated[index].kept };
      return { ...prev, subs: updated };
    });
  };

  const handleRemoveSub = (index: number) => {
    const subToRemove = state.subs[index];
    if (subToRemove && currentUser) {
      deleteFirestoreDocument(currentUser, 'subs', subToRemove.id);
    }
    updateState((prev) => {
      const updated = [...prev.subs];
      updated.splice(index, 1);
      return { ...prev, subs: updated };
    });
  };

  const handleUpdateWage = (wage: number) => {
    updateState((prev) => ({ ...prev, wage }));
  };

  // Unlit handlers
  const handleAddTask = (text: string, cat: StarCategory, fromUnderstory?: boolean) => {
    const newTask: UnlitTask = {
      id: 'task-' + Date.now(),
      text,
      cat,
      createdAt: Date.now(),
      fromUnderstory,
    };
    updateState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  };

  const handleLightTask = (index: number, mins: number) => {
    const task = state.tasks[index];
    if (!task) return;

    if (currentUser) {
      deleteFirestoreDocument(currentUser, 'tasks', task.id);
    }

    updateState((prev) => {
      const updatedTasks = [...prev.tasks];
      updatedTasks.splice(index, 1);

      const newEntry: StarEntry = {
        id: 'star-' + Date.now(),
        activity: task.text,
        mins,
        cat: task.cat,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      return {
        ...prev,
        tasks: updatedTasks,
        entries: [...prev.entries, newEntry],
      };
    });

    handleJumpToToday();
    setActiveTab('tonight');
    launchShootingStar();
  };

  const handleRemoveTask = (index: number) => {
    const taskToRemove = state.tasks[index];
    if (taskToRemove && currentUser) {
      deleteFirestoreDocument(currentUser, 'tasks', taskToRemove.id);
    }
    updateState((prev) => {
      const updated = [...prev.tasks];
      updated.splice(index, 1);
      return { ...prev, tasks: updated };
    });
  };

  // Understory handlers
  const handleBuryThought = (text: string) => {
    const newThought = {
      id: 'u-' + Date.now(),
      text,
      ts: Date.now(),
    };
    updateState((prev) => ({
      ...prev,
      usOwn: [newThought, ...prev.usOwn],
    }));
  };

  const handleSurfaceThought = (task: Omit<UnlitTask, 'id'>) => {
    handleAddTask(task.text, task.cat, true);
    setActiveTab('unlit');
  };

  const handleRemoveUnderstoryThought = (id: string) => {
    if (currentUser) {
      deleteFirestoreDocument(currentUser, 'understory', id);
    }
    updateState((prev) => ({
      ...prev,
      usOwn: prev.usOwn.filter((t) => t.id !== id),
      usThreads: prev.usThreads.filter((th) => th.from !== id && th.to !== id),
    }));
  };

  return (
    <div className="relative min-h-screen bg-[#050714] text-[#EDEFF7] font-sans-manrope selection:bg-[#F2C572]/20 selection:text-[#F2C572]">
      
      {/* Google Auth & Cloud Sync Widget */}
      <AuthBar
        user={currentUser}
        loading={authLoading}
        syncing={isSyncing}
        onRefreshSync={handleForceSync}
      />

      {/* Sky Hero Visual */}
      <div ref={skyHeroContainerRef}>
        <SkyHero
          activeTab={activeTab}
          entries={state.entries}
          displayEntries={displayEntries}
          currentViewingDate={viewingDate}
          isViewingToday={isViewingToday}
          tasks={state.tasks}
          archive={state.archive}
          birthYear={state.birthYear}
          lifeExp={state.lifeExp}
          viewingArchiveIdx={viewingArchiveIdx}
          onUpdateBirthYear={(y) => updateState((prev) => ({ ...prev, birthYear: y }))}
          onUpdateLifeExp={(e) => updateState((prev) => ({ ...prev, lifeExp: e }))}
          onSelectArchiveNight={handleSelectArchiveNight}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          onJumpToToday={handleJumpToToday}
          onFlashTask={() => setActiveTab('unlit')}
        />
      </div>

      {/* Main Body Wrap */}
      <div className="max-w-[720px] mx-auto px-7 pb-[90px]">
        
        {/* Navigation Tabs */}
        <div className="flex gap-1.5 mt-[54px] border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('tonight');
            }}
            className={`bg-transparent border-none font-serif-cormorant text-lg italic py-2.5 px-[18px] pb-3 cursor-pointer border-b-2 -mb-[1px] transition-all duration-300 whitespace-nowrap ${
              activeTab === 'tonight'
                ? 'text-[#F2C572] border-[#F2C572]'
                : 'text-[#8890AE] border-transparent hover:text-[#EDEFF7]'
            }`}
          >
            Tonight
          </button>

          <button
            onClick={() => {
              setActiveTab('unlit');
            }}
            className={`bg-transparent border-none font-serif-cormorant text-lg italic py-2.5 px-[18px] pb-3 cursor-pointer border-b-2 -mb-[1px] transition-all duration-300 whitespace-nowrap ${
              activeTab === 'unlit'
                ? 'text-[#F2C572] border-[#F2C572]'
                : 'text-[#8890AE] border-transparent hover:text-[#EDEFF7]'
            }`}
          >
            Not Yet Lit
          </button>

          <button
            onClick={() => {
              setActiveTab('understory');
            }}
            className={`bg-transparent border-none font-serif-cormorant text-lg italic py-2.5 px-[18px] pb-3 cursor-pointer border-b-2 -mb-[1px] transition-all duration-300 whitespace-nowrap ${
              activeTab === 'understory'
                ? 'text-[#F2C572] border-[#F2C572]'
                : 'text-[#8890AE] border-transparent hover:text-[#EDEFF7]'
            }`}
          >
            Understory
          </button>

          <button
            onClick={() => {
              setActiveTab('ephemeris');
            }}
            className={`bg-transparent border-none font-serif-cormorant text-lg italic py-2.5 px-[18px] pb-3 cursor-pointer border-b-2 -mb-[1px] transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ephemeris'
                ? 'text-[#F2C572] border-[#F2C572]'
                : 'text-[#8890AE] border-transparent hover:text-[#EDEFF7]'
            }`}
          >
            <span>✦ Weekly Ephemeris</span>
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'tonight' && (
          <TonightTab
            entries={displayEntries}
            subs={state.subs}
            wage={state.wage}
            viewingArchiveIdx={isViewingToday ? null : (viewingArchiveIdx ?? 0)}
            onAddEntry={handleAddEntry}
            onRemoveEntry={handleRemoveEntry}
            onCloseNight={handleCloseNight}
            onAddSub={handleAddSub}
            onToggleSub={handleToggleSub}
            onRemoveSub={handleRemoveSub}
            onUpdateWage={handleUpdateWage}
            onLaunchShootingStar={launchShootingStar}
          />
        )}

        {activeTab === 'unlit' && (
          <UnlitTab
            tasks={state.tasks}
            onAddTask={handleAddTask}
            onLightTask={handleLightTask}
            onRemoveTask={handleRemoveTask}
          />
        )}

        {activeTab === 'understory' && (
          <UnderstoryTab
            usOwn={state.usOwn}
            usGhosts={state.usGhosts || []}
            usThreads={state.usThreads}
            onBuryThought={handleBuryThought}
            onSurfaceThought={handleSurfaceThought}
            onRemoveThought={handleRemoveUnderstoryThought}
          />
        )}

        {activeTab === 'ephemeris' && (
          <WeeklyEphemerisTab
            currentEntries={state.entries}
            archive={state.archive}
            currentViewingDate={viewingDate}
            onSelectDate={handleSelectDate}
            onJumpToToday={handleJumpToToday}
          />
        )}

        {/* Footer */}
        <footer className="mt-[60px] text-[11px] text-[#8890AE] leading-[1.7] border-t border-white/10 pt-[18px]">
          Figures are simplified estimates (16 waking hrs/day, no leap-year precision) meant for reflection, not
          prediction. {currentUser ? 'Your sky is securely saved to your Google account in Firestore.' : 'Your sky is currently saved to this browser — sign in with Google to sync across devices.'}
          <br />
          <span className="opacity-75">
            Shortcuts: <b className="text-[#EDEFF7] font-semibold">T</b> tonight ·{' '}
            <b className="text-[#EDEFF7] font-semibold">L</b> not yet lit ·{' '}
            <b className="text-[#EDEFF7] font-semibold">U</b> understory ·{' '}
            <b className="text-[#EDEFF7] font-semibold">E</b> ephemeris ·{' '}
            <b className="text-[#EDEFF7] font-semibold">← / →</b> previous / next day ·{' '}
            <b className="text-[#EDEFF7] font-semibold">N</b> focus the input ·{' '}
            <b className="text-[#EDEFF7] font-semibold">Esc</b> back to tonight
          </span>
        </footer>

      </div>
    </div>
  );
}
