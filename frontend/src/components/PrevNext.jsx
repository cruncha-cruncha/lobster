import { useState } from "react";

export const usePrevNext = ({ pageNumber = 1 } = {}) => {
  const [page, setPage] = useState(pageNumber);

  const prevPage = () => {
    setPage((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const nextPage = () => setPage((prev) => prev + 1);

  return {
    prev: prevPage,
    next: nextPage,
    pageNumber: page,
    setPage,
  };
};

export const PurePrevNext = (prevNext) => {
  const { prev, next, pageNumber } = prevNext;

  const prevClasses =
    "rounded-r-full pl-6 pr-4 py-2 transition-colors" +
    (pageNumber > 1
      ? " bg-blue-200 hover:bg-blue-900 hover:text-white"
      : " bg-stone-300 text-white");
  const nextClasses =
    "rounded-l-full pl-4 pr-6 py-2 transition-colors bg-blue-200 hover:bg-blue-900 hover:text-white";

  const prevStyle = {
    clipPath:
      "polygon(100% 0, 1rem 0, 0 1rem, 0 50%, 0 calc(100% - 1rem), 1rem 100%, 100% 100%)",
  };
  const nextStyle = {
    clipPath:
      "polygon(0 0, calc(100% - 1rem) 0, 100% 1rem, 100% 50%, 100% calc(100% - 1rem), calc(100% - 1rem) 100%, 0 100%)",
  };

  return (
    <div className="prev-next flex items-center justify-center">
      <div className="flex">
        <button
          onClick={prev}
          className={prevClasses}
          style={prevStyle}
          disabled={pageNumber <= 1}
        >
          <span>Prev</span>
        </button>
      </div>
      <span className="px-4">Page {pageNumber}</span>
      <div className="flex">
        <button onClick={next} className={nextClasses} style={nextStyle}>
          <span>Next</span>
        </button>
      </div>
    </div>
  );
};
