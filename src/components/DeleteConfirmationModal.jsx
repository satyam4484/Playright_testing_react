import React from 'react'

export default function DeleteConfirmationModal({ visible, onCancel, onConfirm }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold">Delete User</div>
        <div className="p-4 text-sm text-gray-700">Are you sure you want to delete this user?</div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onCancel} className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  )
}

