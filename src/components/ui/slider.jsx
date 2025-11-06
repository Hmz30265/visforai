import React from 'react';

const Slider = React.forwardRef(({ className = '', value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (Array.isArray(value)) {
      // Range slider
      const [minVal, maxVal] = value;
      if (e.target.dataset.input === 'min') {
        onValueChange([Math.min(newValue, maxVal), maxVal]);
      } else {
        onValueChange([minVal, Math.max(newValue, minVal)]);
      }
    } else {
      onValueChange(newValue);
    }
  };

  if (Array.isArray(value)) {
    const [minVal, maxVal] = value;
    return (
      <div className={`relative flex items-center ${className}`} ref={ref}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleChange}
          data-input="min"
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((minVal - min) / (max - min)) * 100}%, #e5e7eb ${((minVal - min) / (max - min)) * 100}%, #e5e7eb ${((maxVal - min) / (max - min)) * 100}%, #3b82f6 ${((maxVal - min) / (max - min)) * 100}%, #3b82f6 100%)`
          }}
          {...props}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleChange}
          data-input="max"
          className="absolute w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer slider"
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
      }}
      {...props}
    />
  );
});
Slider.displayName = 'Slider';

export { Slider };

