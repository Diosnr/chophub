interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

/**
 * Touch-friendly quantity selector: big − [value] + buttons.
 * Replaces the awful <input type="number"> mobile UX.
 */
export default function QuantityStepper({ value, onChange, min = 1, max = 99, label = 'Quantity' }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={atMin}
          aria-label="Decrease quantity"
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${
            atMin
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100'
          }`}
        >
          −
        </button>
        <div className="flex-1 h-12 rounded-lg border-2 border-gray-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{value}</span>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={atMax}
          aria-label="Increase quantity"
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all active:scale-90 ${
            atMax
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-brand-600 text-brand-600 hover:bg-brand-50 active:bg-brand-100'
          }`}
        >
          +
        </button>
      </div>
      {max < 99 && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {value} of {max} available
        </p>
      )}
    </div>
  );
}