import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  complete: boolean;
  finish: () => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      complete: false,
      finish: () => set({ complete: true }),
      reset: () => set({ complete: false }),
    }),
    { name: 'chophub-onboarding' }
  )
);

interface Slide {
  title: string;
  subtitle: string;
  icon: string;
  bg: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Fresh catfish, by weight',
    subtitle: 'Live catfish sized to your order. Pick 1kg, 2kg, 5kg — vendors handle the rest.',
    icon: '🐟',
    bg: 'from-orange-500 to-red-500',
  },
  {
    title: 'Frozen chicken, by pack',
    subtitle: 'Whole birds, halves, packs. Vendor-graded and ready for your freezer.',
    icon: '🍗',
    bg: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Cooked food, by plate',
    subtitle: 'Jollof, pounded yam, egusi — straight from neighbourhood vendors near you.',
    icon: '🍲',
    bg: 'from-red-500 to-rose-600',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const finish = useOnboarding((s) => s.finish);
  const navigate = useNavigate();

  // Lock scroll while onboarding is shown
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function next() {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      finish();
      navigate('/');
    }
  }

  function skip() {
    finish();
    navigate('/');
  }

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Skip button — only on first two slides */}
      {!isLast && (
        <div className="absolute top-0 right-0 pt-[max(env(safe-area-inset-top),1rem)] pr-4 z-10">
          <button onClick={skip} className="text-gray-500 hover:text-gray-900 font-medium text-sm px-3 py-2">
            Skip
          </button>
        </div>
      )}

      {/* Slide content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 bg-gradient-to-br ${slide.bg} text-white transition-colors duration-500`}>
        <div className="text-9xl mb-6 drop-shadow-lg">{slide.icon}</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 leading-tight px-4">{slide.title}</h1>
        <p className="text-lg text-center text-white/90 max-w-md px-4">{slide.subtitle}</p>
      </div>

      {/* Bottom controls */}
      <div className="bg-white px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-brand-600' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Next / Get Started */}
        <button
          onClick={next}
          className="w-full bg-brand-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-brand-700 active:scale-[0.98] transition"
        >
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  );
}