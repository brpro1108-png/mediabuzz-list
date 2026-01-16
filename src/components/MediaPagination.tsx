import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface MediaPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const MediaPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems,
  itemsPerPage 
}: MediaPaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      {/* Info */}
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{startItem.toLocaleString()}</span>
        {' - '}
        <span className="font-medium text-foreground">{endItem.toLocaleString()}</span>
        {' sur '}
        <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span>
        {' résultats'}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Première page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Dernière page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page Jump */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Page</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          className="w-16 h-9 rounded-lg bg-secondary border border-border text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="text-muted-foreground">/ {totalPages.toLocaleString()}</span>
      </div>
    </div>
  );
};