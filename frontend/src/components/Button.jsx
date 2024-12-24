import { CenteredLoadingDots } from "./loading/LoadingDots";

export const Button = ({
  variant,
  text,
  onClick,
  disabled,
  isLoading,
}) => {
  let buttonClasses =
    "rounded-full px-4 py-2 transition-colors" +
    (!disabled ? " bg-emerald-200" : " bg-stone-300 text-white") +
    (!disabled && !isLoading ? " hover:bg-emerald-900 hover:text-white" : "");

  if (variant === "blue") {
    buttonClasses =
      "rounded-full px-4 py-2 transition-colors" +
      (!disabled ? " bg-blue-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-blue-900 hover:text-white" : "");
  } else if (variant === "red") {
    buttonClasses =
      "rounded-full px-4 py-2 transition-colors" +
      (!disabled ? " bg-red-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-red-900 hover:text-white" : "");
  } else if (variant === "orange") {
    buttonClasses =
      "rounded-full px-4 py-2 transition-colors" +
      (!disabled ? " bg-orange-200" : " bg-stone-300 text-white") +
      (!disabled && !isLoading ? " hover:bg-orange-900 hover:text-white" : "");
  }

  return (
    <div className="flex">
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
