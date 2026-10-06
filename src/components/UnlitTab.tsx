import React, { useState } from 'react';
import { StarCategory, UnlitTask, CAT_COLORS } from '../types/constellation';
import { audio } from '../utils/audio';

interface UnlitTabProps {
  tasks: UnlitTask[];
  onAddTask: (text: string, cat: StarCategory) => void;
  onLightTask: (index: number, mins: number) => void;
  onRemoveTask: (index: number) => void;
}

export function UnlitTab({ tasks, onAddTask, onLightTask, onRemoveTask }: UnlitTabProps) {
  const [taskText, setTaskText] = useState('');
  const [taskTextError, setTaskTextError] = useState(false);
  const [taskCat, setTaskCat] = useState<StarCategory>('Work');
  const [lightingIdx, setLightingIdx] = useState<number | null>(null);
  const [lightingMins, setLightingMins] = useState('');
  const [lightMinsError, setLightMinsError] = useState(false);

  const daysBetween = (a: number, b: number) => Math.round((b - a) / 86400000);
  const now = Date.now();

  let oldestDays = 0;
  tasks.forEach((t) => {
    const d = daysBetween(t.createdAt || now, now);
    if (d > oldestDays) oldestDays = d;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskText.trim();
    if (!trimmed) {
      setTaskTextError(true);
      return;
    }
    onAddTask(trimmed, taskCat);
    setTaskText('');
    setTaskTextError(false);
  };

  const handleConfirmLight = (index: number) => {
    const mins = parseInt(lightingMins, 10);
    if (!mins || mins <= 0 || isNaN(mins)) {
      setLightMinsError(true);
      return;
    }

    onLightTask(index, mins);
    audio.chimeLightTask();
    setLightingIdx(null);
    setLightingMins('');
    setLightMinsError(false);
  };

  return (
    <div className="tab-panel active pt-[26px]">
      <section className="panel">
        <div className="flex justify-between items-baseline mb-5 gap-3.5 flex-wrap">
          <h2 className="font-serif-cormorant font-medium text-[26px] m-0">Not Yet Lit</h2>
          <span className="text-xs text-[#8890AE] italic">stars you intend to earn — not planned, just waiting</span>
        </div>

        {/* Summary stats */}
        {tasks.length > 0 && (
          <div className="flex gap-[26px] mb-5 flex-wrap">
            <div className="text-xs text-[#8890AE]">
              <b className="text-[#F2C572] font-serif-cormorant text-[17px] font-medium block">
                {tasks.length}
              </b>
              waiting in the dark
            </div>
            <div className="text-xs text-[#8890AE]">
              <b className="text-[#F2C572] font-serif-cormorant text-[17px] font-medium block">
                {oldestDays <= 0 ? 'today' : `${oldestDays}d`}
              </b>
              oldest still unlit
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAddTask} className="flex gap-2.5 flex-wrap items-center mb-[22px]">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="a star you intend to earn"
              value={taskText}
              onChange={(e) => {
                setTaskText(e.target.value);
                if (taskTextError && e.target.value.trim()) setTaskTextError(false);
              }}
              className={`w-full bg-white/4 text-[#EDEFF7] font-sans-manrope text-sm p-[11px_14px] rounded-lg outline-none transition-all ${
                taskTextError
                  ? 'border-2 border-[#E0654A] shadow-[0_0_10px_rgba(224,101,74,0.35)] focus:border-[#E0654A]'
                  : 'border border-white/10 focus:border-[#F2C572]'
              }`}
            />
          </div>

          {/* Category Picker */}
          <div className="flex gap-[7px]">
            {(['Work', 'Chores', 'Connection', 'Rest', 'Joy', 'Scroll'] as StarCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTaskCat(cat)}
                title={cat === 'Scroll' ? 'Scroll / waste' : cat}
                className={`w-[30px] h-[30px] rounded-full border-[1.5px] cursor-pointer flex items-center justify-center bg-transparent transition-transform duration-150 hover:scale-110 ${
                  taskCat === cat ? 'border-[#EDEFF7]' : 'border-white/10'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CAT_COLORS[cat] }}
                />
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="bg-[#F2C572] text-[#1A1408] border-none font-sans-manrope font-bold text-[13px] px-5 py-[11px] rounded-lg cursor-pointer hover:bg-[#f5d38c] hover:-translate-y-0.5 transition-all"
          >
            Add to darkness
          </button>
        </form>

        {/* Task List */}
        <ul className="list-none m-0 p-0">
          {tasks.length === 0 ? (
            <li className="text-[#8890AE] text-[13px] italic py-3">No unlit stars waiting.</li>
          ) : (
            tasks.map((t, i) => {
              const days = daysBetween(t.createdAt || now, now);
              const opacity = Math.max(0.4, 1 - days * 0.1);
              const ageTxt = days <= 0 ? 'today' : `${days}d waiting`;

              const isBeingLit = lightingIdx === i;

              return (
                <li
                  key={t.id || i}
                  className="flex items-center gap-3 py-[11px] px-1 border-b border-white/10 text-sm"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 border-[1.5px] bg-transparent"
                    style={{ borderColor: CAT_COLORS[t.cat], opacity }}
                  />
                  <span className="flex-1 text-[#EDEFF7]">{t.text}</span>
                  <span className="text-[#8890AE] text-[11px] font-mono-dm whitespace-nowrap">{ageTxt}</span>

                  {t.fromUnderstory && (
                    <span className="text-[10.5px] text-[#F2C572] opacity-70 italic font-serif-cormorant">
                      surfaced
                    </span>
                  )}

                  <span className="text-[#8890AE] text-[12.5px]">{t.cat}</span>

                  {!isBeingLit ? (
                    <>
                      <button
                        onClick={() => {
                          setLightingIdx(i);
                          setLightingMins('');
                          setLightMinsError(false);
                        }}
                        className="bg-transparent border border-[#F2C572] text-[#F2C572] hover:bg-[#F2C572] hover:text-[#1A1408] text-[11px] px-2.5 py-1 rounded-xl cursor-pointer font-sans-manrope transition-colors"
                      >
                        light it
                      </button>
                      <button
                        onClick={() => onRemoveTask(i)}
                        className="bg-transparent border-none text-[#8890AE] hover:text-[#E0654A] cursor-pointer text-xs transition-colors"
                      >
                        remove
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        min="1"
                        placeholder="mins"
                        autoFocus
                        value={lightingMins}
                        onChange={(e) => {
                          setLightingMins(e.target.value);
                          if (lightMinsError && parseInt(e.target.value, 10) > 0) setLightMinsError(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmLight(i);
                        }}
                        className={`bg-white/4 text-[#EDEFF7] font-sans-manrope text-[13px] px-2.5 py-1.5 rounded-[6px] w-16 outline-none transition-all ${
                          lightMinsError
                            ? 'border-2 border-[#E0654A] shadow-[0_0_8px_rgba(224,101,74,0.35)] focus:border-[#E0654A]'
                            : 'border border-white/10 focus:border-[#F2C572]'
                        }`}
                      />
                      <button
                        onClick={() => handleConfirmLight(i)}
                        className="bg-[#F2C572] text-[#1A1408] border-none font-bold text-xs px-3 py-1.5 rounded-[6px] cursor-pointer hover:bg-[#f5d38c]"
                      >
                        light this star
                      </button>
                      <button
                        onClick={() => {
                          setLightingIdx(null);
                          setLightMinsError(false);
                        }}
                        className="bg-transparent border-none text-[#8890AE] hover:text-[#EDEFF7] text-xs cursor-pointer"
                      >
                        cancel
                      </button>
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
