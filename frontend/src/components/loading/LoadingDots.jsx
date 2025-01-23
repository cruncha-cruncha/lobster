import "./LoadingDots.css";

export const LoadingDots = ({ className }) => {
  return (
    <div className={"lobster-loading" + (!className ? "" : ` ${className}`)}>
      <div className="dot-one" />
      <div className="dot-two" />
      <div className="dot-three" />
    </div>
  );
};

export const AbsoluteLoadingDots = ({ className }) => {
  return (
    <div className="absolute left-0 right-0 flex h-full items-center justify-center">
      <LoadingDots className={className} />
    </div>
  );
};
