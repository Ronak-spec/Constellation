import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  Flame, 
  Trophy,
  Volume2,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CONSTELLATIONS } from '../data/constellationsData';
import { celestialAudio } from '../utils/audioSynth';

interface QuizQuestion {
  id: string;
  type: 'asterism' | 'star' | 'myth' | 'trivia';
  question: string;
  constellationId?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'star',
    question: 'Which constellation is home to Sirius, the brightest star in the entire night sky?',
    options: ['Canis Major', 'Canis Minor', 'Orion', 'Taurus'],
    correctAnswer: 'Canis Major',
    explanation: 'Sirius (The Dog Star, apparent magnitude -1.46) is the crown jewel of Canis Major.',
    hint: 'This constellation represents the loyal great hunting hound following Orion.'
  },
  {
    id: 'q2',
    type: 'star',
    question: 'The pulsating red supergiant Betelgeuse marks the right shoulder of which famous winter giant?',
    options: ['Orion', 'Hercules', 'Boötes', 'Perseus'],
    correctAnswer: 'Orion',
    explanation: 'Betelgeuse is a massive semiregular variable red supergiant in Orion.',
    hint: 'Look for the constellation with the iconic three-star celestial belt.'
  },
  {
    id: 'q3',
    type: 'asterism',
    question: 'Dubhe and Merak act as "The Pointer Stars" directing stargazers directly to which navigation anchor?',
    options: ['Polaris (North Star)', 'Sirius', 'Vega', 'Canopus'],
    correctAnswer: 'Polaris (North Star)',
    explanation: 'Extending a straight line through Merak and Dubhe in Ursa Major leads straight to Polaris.',
    hint: 'The star sitting almost precisely at the North Celestial Pole.'
  },
  {
    id: 'q4',
    type: 'myth',
    question: 'In Polynesian navigation lore, which constellation represents the magic bone fishhook of Māui (Manaiakalani)?',
    options: ['Scorpius', 'Sagittarius', 'Cygnus', 'Centaurus'],
    correctAnswer: 'Scorpius',
    explanation: 'The hooked tail of Scorpius was seen across Polynesia as the magical fishhook used to pull islands from the sea.',
    hint: 'In Western astronomy, this constellation has a curved venomous stinger.'
  },
  {
    id: 'q5',
    type: 'trivia',
    question: 'What is the smallest of all 88 official modern constellations?',
    options: ['Crux (Southern Cross)', 'Lyra', 'Sagitta', 'Equuleus'],
    correctAnswer: 'Crux (Southern Cross)',
    explanation: 'Crux covers only 68 square degrees of sky, making it the smallest yet one of the most distinctive constellations.',
    hint: 'Featured prominently on the national flags of Australia, New Zealand, and Brazil.'
  },
  {
    id: 'q6',
    type: 'trivia',
    question: 'The famous "Summer Triangle" asterism is formed by Vega, Altair, and which third star in Cygnus?',
    options: ['Deneb', 'Algol', 'Capella', 'Arcturus'],
    correctAnswer: 'Deneb',
    explanation: 'The Summer Triangle vertices are Vega (Lyra), Altair (Aquila), and Deneb (Cygnus).',
    hint: 'This blue-white supergiant marks the tail of the celestial swan.'
  },
  {
    id: 'q7',
    type: 'myth',
    question: 'In Chinese astronomy and the Qixi Festival, Vega and Altair represent which star-crossed lovers separated by the Milky Way?',
    options: ['The Weaver Girl & The Cowherd', 'The Dragon & Phoenix', 'The Moon Goddess & Archer', 'The White Tiger & Black Tortoise'],
    correctAnswer: 'The Weaver Girl & The Cowherd',
    explanation: 'Zhinü (the Weaver Girl / Vega) and Niulang (the Cowherd / Altair) meet once a year on a bridge of magpies.',
    hint: 'One is an immortal celestial weaver; the other is a humble mortal worker.'
  },
  {
    id: 'q8',
    type: 'star',
    question: 'Which golden-orange giant is the brightest star in the northern celestial hemisphere ("Follow the arc to...")?',
    options: ['Arcturus', 'Aldebaran', 'Pollux', 'Capella'],
    correctAnswer: 'Arcturus',
    explanation: '"Follow the arc to Arcturus" is the famous mnemonic following the Big Dipper handle to Boötes.',
    hint: 'Located in the constellation Boötes the Herdsman.'
  },
  {
    id: 'q9',
    type: 'trivia',
    question: 'Which immense spiral galaxy, our nearest major neighbor, is located in the constellation of the Chained Maiden?',
    options: ['Andromeda Galaxy (M31)', 'Triangulum Galaxy (M33)', 'Whirlpool Galaxy (M51)', 'Sombrero Galaxy (M104)'],
    correctAnswer: 'Andromeda Galaxy (M31)',
    explanation: 'The Andromeda Galaxy (M31) contains roughly one trillion stars and is visible to the naked eye.',
    hint: 'Named after the celestial princess rescued by Perseus.'
  },
  {
    id: 'q10',
    type: 'star',
    question: 'Which constellation features the famous "Teapot" asterism pouring steam into the heart of the Milky Way galaxy?',
    options: ['Sagittarius', 'Scorpius', 'Aquarius', 'Capricornus'],
    correctAnswer: 'Sagittarius',
    explanation: 'The stars of Sagittarius form the iconic Teapot asterism pointing into the Galactic Center.',
    hint: 'The zodiac archer centaur.'
  }
];

export function SkySpotterQuiz() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];

  const handleSelectOption = (opt: string) => {
    if (isSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);

    const isCorrect = selectedOption === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 100 + streak * 20);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > highestStreak) setHighestStreak(nextStreak);
      celestialAudio.playStarTone('A', 0.5, 0.4);

      if (nextStreak % 3 === 0) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowHint(false);
    } else {
      setQuizFinished(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      celestialAudio.playConstellationChord(7);
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowHint(false);
    setScore(0);
    setStreak(0);
    setQuizFinished(false);
  };

  // Rank calculation based on score
  const rank = useMemo(() => {
    if (score >= 1200) return { title: 'Cosmos Archon', color: '#c084fc', icon: '🌌' };
    if (score >= 800) return { title: 'Master Astronomer', color: '#38bdf8', icon: '🔭' };
    if (score >= 400) return { title: 'Celestial Navigator', color: '#34d399', icon: '🧭' };
    return { title: 'Apprentice Stargazer', color: '#fbbf24', icon: '✨' };
  }, [score]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Quiz Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 text-xs font-mono-astronomy mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Celestial Knowledge & Observation Challenge</span>
          </div>
          <h1 className="font-cinzel text-3xl font-black text-slate-100 tracking-wide">
            Sky Spotter Challenge
          </h1>
        </div>

        {/* Live Score & Streak */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-[#080d26] border border-slate-800 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono-astronomy uppercase">Score</div>
              <div className="font-mono-astronomy font-bold text-cyan-300 text-sm">{score} pts</div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-[#080d26] border border-slate-800 flex items-center gap-2 shadow-lg">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-500 font-mono-astronomy uppercase">Streak</div>
              <div className="font-mono-astronomy font-bold text-amber-300 text-sm">{streak} 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {!quizFinished ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#080d26] border border-slate-800 space-y-6 shadow-2xl">
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono-astronomy text-slate-400">
              <span>Question {currentIdx + 1} of {QUIZ_QUESTIONS.length}</span>
              <span className="text-purple-300 capitalize">{currentQ.type} Question</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
              {currentQ.question}
            </h3>

            {/* Hint Button */}
            {!isSubmitted && (
              <div>
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Need a telescope hint?</span>
                  </button>
                ) : (
                  <p className="text-xs text-amber-300 italic bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/50">
                    🔭 <strong>Hint:</strong> {currentQ.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map(option => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let style = 'bg-[#050818] border-slate-800 hover:border-slate-700 text-slate-200';
              if (isSubmitted) {
                if (isCorrect) {
                  style = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-950/70 border-rose-500 text-rose-200';
                } else {
                  style = 'bg-[#050818]/50 border-slate-800 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                style = 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md shadow-purple-950';
              }

              return (
                <button
                  key={option}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(option)}
                  className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${style}`}
                >
                  <span>{option}</span>
                  {isSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isSubmitted && (
            <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
              selectedOption === currentQ.correctAnswer
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                {selectedOption === currentQ.correctAnswer ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Brilliant Stargazing! Correct answer.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incorrect. The answer is {currentQ.correctAnswer}.</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed pt-1">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom Action */}
          <div className="pt-2 flex justify-end">
            {!isSubmitted ? (
              <button
                disabled={!selectedOption}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold text-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                Confirm Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs shadow-lg hover:brightness-110 transition-all"
              >
                {currentIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question →' : 'View Celestial Score'}
              </button>
            )}
          </div>

        </div>
      ) : (
        /* Quiz Finished Triumph Card */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#080d26] border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-4xl shadow-xl">
            {rank.icon}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono-astronomy uppercase text-slate-400">Quiz Completed</span>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-slate-100">
              {rank.title}
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              You scored <strong className="text-cyan-300">{score} points</strong> with a peak streak of <strong className="text-amber-300">{highestStreak} in a row</strong>!
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={restartQuiz}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:brightness-110 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Challenge</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
