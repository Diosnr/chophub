interface Props {
  value: number; // current kg
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const PRESETS = [0.5, 1, 2, 3, 5];

/**
 * Touch-friendly weight picker for per-kg products:
 *  - Common weight chips (one tap to select)
 *  - Range slider for fine-tune between min and max
 * Replaces the awful <input type="number" step={0.1}> UX.
 */
export default function WeightSelector({ value, onChange, min = 0.5, max = 10 }: Props) {
  const handlePreset = (kg: number) => onChange(kg);
  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">How much do you want?</label>
        <span className="text-2xl font-bold text-brand-600 tabular-nums">
          {value.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg</span>
        </span>
      </div>

      {/* preset chips */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {PRESETS.map((kg) => {
          const active = Math.abs(value - kg) < 0.001;
          return (
            <button
              key={kg}
              type="button"
              onClick={() => handlePreset(kg)}
              className={`py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                active
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {kg}kg
            </button>
          );
        })}
      </div>

      {/* fine-tune slider */}
      <div className="px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={value}
          onChange={handleSlider}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-brand-600
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1 tabular-nums">
          <span>{min}kg</span>
          <span className="text-brand-600 font-semibold">{value.toFixed(1)}kg</span>
          <span>{max}kg</span>
        </div>
      </div>
    </div>
  );
}