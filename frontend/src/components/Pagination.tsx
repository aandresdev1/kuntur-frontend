interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  setPage,
  totalItems,
  pageSize,
  setPageSize,
  pageSizeOptions = [6, 10, 20, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);

  const nums: number[] = [];
  for (let n = Math.max(1, page - 1); n <= Math.min(totalPages, page + 1); n++) {
    nums.push(n);
  }

  return (
    <div className="paginacion">
      <span className="paginacionInfo">
        {from}–{to} de {totalItems}
      </span>
      <div className="paginacionBtns">
        <button
          className="btnGhost pagBtn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          aria-label="Página anterior"
        >
          ‹
        </button>
        {nums[0]! > 1 && <span className="pagDots">…</span>}
        {nums.map((n) => (
          <button
            key={n}
            className={"btnGhost pagBtn" + (n === page ? " pagBtnOn" : "")}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        ))}
        {nums[nums.length - 1]! < totalPages && (
          <span className="pagDots">…</span>
        )}
        <button
          className="btnGhost pagBtn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          aria-label="Página siguiente"
        >
          ›
        </button>
        <div className="paginacionSize">
          <span>Filas por página</span>
          <select
            className="input pagSizeSelect"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
