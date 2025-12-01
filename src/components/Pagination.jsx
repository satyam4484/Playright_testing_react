import React from 'react'

export default function Pagination({ page, pageSize, total, onChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-600">Page {page} of {pageCount}</div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`rounded-md border px-3 py-1 text-sm ${page <= 1 ? 'text-gray-400 bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          Previous
        </button>
        <button
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className={`rounded-md border px-3 py-1 text-sm ${page >= pageCount ? 'text-gray-400 bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          Next
        </button>
      </div>
    </div>
  )
}

