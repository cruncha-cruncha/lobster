import { useState } from "react";

export const useInfoModal = () => {
  const [text, setText] = useState("");
  const [flavour, setFlavour] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  return {
    open: (text, flavour) => {
      setText(text);
      setFlavour(flavour);
      setIsOpen(true);
    },
    isOpen,
    onClose: () => setIsOpen(false),
    text,
    flavour,
  };
};

export const PureInfoModal = (infoModal) => {
  const bgColor = (() => {
    switch (infoModal?.flavour) {
      case "error":
        return "bg-red-600";
      case "success":
        return "bg-emerald-600";
      default:
        return "bg-sky-600";
    }
  })();

  return (
    <>
      {infoModal?.isOpen && (
        <div
          className={`fixed left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-opacity-75 ${bgColor}`}
        >
          <div className="flex w-full max-w-xs flex-col items-center justify-center">
            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="mb-6">{infoModal?.text}</p>
              <div className="flex justify-center">
                <button
                  className="rounded-full bg-sky-200 px-4 py-1 hover:bg-sky-900 hover:text-white"
                  onClick={(e) => infoModal?.onClose?.(e)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
