import RCSlider from "rc-slider";
import "rc-slider/assets/index.css";

export const Slider = ({ id, min, max, step, defaultValue, onChange, onChangeComplete, disabled, className }) => (
  <RCSlider
    id={id}
    min={min}
    max={max}
    step={step}
    defaultValue={defaultValue}
    onChange={onChange}
    onChangeComplete={onChangeComplete}
    disabled={disabled}
    className={className}
  />
);

export const RangeSlider = ({ id, min, max, step, defaultValue, onChange, onChangeComplete, disabled, className }) => (
  <RCSlider
    range
    id={id}
    min={min}
    max={max}
    step={step}
    defaultValue={defaultValue}
    onChange={onChange}
    onChangeComplete={onChangeComplete}
    disabled={disabled}
    className={className}
  />
);
