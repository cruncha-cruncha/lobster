import { atom, useAtom } from "jotai";

const layoutModalInfoAtom = atom([]); // { text, flavour }
const layoutModalIsOpenAtom = atom(false);

export const useLayoutInfoModal = () => {
  const [info, setInfo] = useAtom(layoutModalInfoAtom);
  const [isOpen, setIsOpen] = useAtom(layoutModalIsOpenAtom);

  return {
    open: (text, flavour) => {
      setInfo((prev) => [...prev, { text, flavour }]);
      setIsOpen(true);
    },
    isOpen,
    onClose: () => {
      if (info.length <= 1) {
        setIsOpen(false);
      }

      if (info.length > 0) {
        setInfo((prev) => prev.slice(1));
      }
    },
    text: info.length ? info[0].text : "",
    flavour: info.length ? info[0].flavour : "",
  };
};
