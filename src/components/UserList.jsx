import React from 'react'

export default function UserList({ items, loading, onEdit, onDeleteRequest }) {
  if (loading) return <div className="p-4 text-gray-600">Loading...</div>
  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.id} className="p-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-600">
              {item?.data?.email && <span className="mr-3">{item.data.email}</span>}
              {item?.data?.role && <span className="mr-3">{item.data.role}</span>}
              <span className="text-xs text-gray-400">id: {item.id}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="rounded-md border border-gray-300 px-3 py-1 text-gray-800 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteRequest(item.id)}
              className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="p-4 text-gray-600">No items found. Create one above.</li>
      )}
    </ul>
  )
}

