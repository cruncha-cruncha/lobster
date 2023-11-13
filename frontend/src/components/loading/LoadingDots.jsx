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

export const CenteredLoadingDots = ({ className }) => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute flex h-full w-full items-center justify-center">
        <LoadingDots className={className} />
      </div>
    </div>
  );
};
