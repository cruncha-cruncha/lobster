import { CenteredLoadingDots } from "./loading/LoadingDots";

export const Button = ({
  variant,
  size,
  text,
  onClick,
  disabled,
  isLoading,
}) => {
  let buttonClasses = "rounded-full transition-colors";

  if (variant === "blue") {
    buttonClasses +=
      (!disabled ? " bg-blue-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-blue-900 hover:text-white" : "");
  } else if (variant === "red") {
    buttonClasses +=
      (!disabled ? " bg-red-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-red-900 hover:text-white" : "");
  } else if (variant === "orange") {
    buttonClasses +=
      (!disabled ? " bg-orange-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-orange-900 hover:text-white" : "");
  } else {
    buttonClasses +=
      (!disabled ? " bg-emerald-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-emerald-900 hover:text-white" : "");
  }

  if (size === "sm") {
    buttonClasses += " px-3 py-1";
  } else {
    buttonClasses += " px-4 py-2";
  }

  return (
    <div className="button flex">
      <button
        className={buttonClasses}
        onClick={onClick}
        disabled={disabled || isLoading}
      >
        {isLoading && <CenteredLoadingDots />}
        <span className={isLoading ? "invisible" : ""}>{text}</span>
      </button>
    </div>
  );
};
