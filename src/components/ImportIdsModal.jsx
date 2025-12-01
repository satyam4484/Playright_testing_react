import React from 'react'

export default function ImportIdsModal({ visible, idsText, busy, onClose, onChange, onImport }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold">Import Existing User IDs</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-600">Paste comma or line-separated IDs created previously.</div>
          <textarea
            className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="id1, id2, id3"
            value={idsText}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancel</button>
            <button onClick={onImport} className={`rounded-md px-4 py-2 text-white ${busy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}>Import</button>
          </div>
        </div>
      </div>
    </div>
  )
}

