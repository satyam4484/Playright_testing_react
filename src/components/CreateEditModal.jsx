import React from 'react'

export default function CreateEditModal({ visible, mode, form, errors, busy, onClose, onChange, onSubmit }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold">{mode === 'edit' ? 'Edit User' : 'Add User'}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="Name"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
            {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
            {errors.email && <div className="mt-1 text-xs text-red-600">{errors.email}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${errors.role ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              value={form.role}
              onChange={(e) => onChange('role', e.target.value)}
            >
              <option value="">Select role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            {errors.role && <div className="mt-1 text-xs text-red-600">{errors.role}</div>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={busy} className={`rounded-md px-4 py-2 text-white transition ${busy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}>{mode === 'edit' ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

