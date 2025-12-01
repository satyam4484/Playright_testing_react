import { useEffect, useState } from 'react'
import { createItem, updateItem, deleteItem, getItem } from './api'

function App() {
  const [myItems, setMyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: '' })
  const [formErrors, setFormErrors] = useState({ name: '', email: '', role: '' })
  const [toasts, setToasts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [idsText, setIdsText] = useState('')
  const [dummyMode, setDummyMode] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 5

  useEffect(() => {
    refresh()
  }, [])

  

  function addToast(type, message) {
    const id = Date.now()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3000)
  }

  function validate(values) {
    const errs = { name: '', email: '', role: '' }
    if (!values.name.trim()) errs.name = 'Name is required'
    const email = values.email.trim()
    if (!email) errs.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Email is invalid'
    if (!values.role.trim()) errs.role = 'Role is required'
    setFormErrors(errs)
    return !errs.name && !errs.email && !errs.role
  }

  function loadIds() {
    try {
      return JSON.parse(localStorage.getItem('userItemIds') || '[]')
    } catch {
      return []
    }
  }

  function saveIds(ids) {
    localStorage.setItem('userItemIds', JSON.stringify(ids))
  }

  async function loadFileIds() {
    try {
      const res = await fetch('/src/createdIds.json', { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json()
      return Array.isArray(json) ? json : []
    } catch {
      return []
    }
  }

  async function loadDummyUsers() {
    try {
      const res = await fetch('/src/dummyUsers.json', { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json()
      return Array.isArray(json) ? json : []
    } catch {
      return []
    }
  }

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const [idsLocal, idsFile] = await Promise.all([loadIds(), loadFileIds()])
      const ids = Array.from(new Set([...(idsLocal || []), ...(idsFile || [])]))
      if (Array.isArray(ids) && ids.length) {
        const fetched = await Promise.all(
          ids.map(async (id) => {
            try {
              return await getItem(id)
            } catch {
              return null
            }
          })
        )
        const list = fetched.filter(Boolean)
        if (list.length) {
          setMyItems(list)
          setDummyMode(false)
        } else {
          const dummy = await loadDummyUsers()
          setMyItems(dummy)
          setDummyMode(true)
        }
      } else {
        const dummy = await loadDummyUsers()
        setMyItems(dummy)
        setDummyMode(true)
      }
    } catch (e) {
      const dummy = await loadDummyUsers()
      setMyItems(dummy)
      setDummyMode(true)
      setError(e.message || 'Error loading items; showing dummy data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [myItems])

  function startEdit(item) {
    setEditingId(item.id)
    const email = item?.data?.email || ''
    const role = item?.data?.role || ''
    setForm({ name: item.name || '', email, role })
    setModalMode('edit')
    setShowModal(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ name: '', email: '', role: '' })
    setFormErrors({ name: '', email: '', role: '' })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name.trim(),
      data: { email: form.email.trim(), role: form.role.trim() },
    }
    if (!validate({ name: payload.name, email: payload.data.email, role: payload.data.role })) return
    try {
      setBusy(true)
      if (editingId) {
        await updateItem(editingId, payload)
        addToast('success', 'Updated successfully')
      } else {
        const created = await createItem(payload)
        const ids = loadIds()
        saveIds([created.id, ...ids])
        addToast('success', 'Created successfully')
      }
      await refresh()
      resetForm()
    } catch (e) {
      setError(e.message || 'Submit failed')
      addToast('error', e.message || 'Submit failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id) {
    setError('')
    try {
      setBusy(true)
      await deleteItem(id)
      const ids = loadIds().filter((x) => x !== id)
      saveIds(ids)
      await refresh()
      if (editingId === id) resetForm()
      addToast('success', 'Deleted successfully')
    } catch (e) {
      setError(e.message || 'Delete failed')
      addToast('error', e.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Users CRUD</h1>
          <button
            onClick={() => {
              resetForm();
              setModalMode('create');
              setShowModal(true);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add User
          </button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setShowImport(true)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Import IDs</button>
          <button onClick={() => { saveIds([]); setMyItems([]); addToast('success', 'Cleared tracked users'); }} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Clear All</button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Backed by free API at <a className="underline" href="https://api.restful-api.dev/objects" target="_blank" rel="noreferrer">restful-api.dev</a>
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </div>
        )}

        {/* List only My Users on homepage */}

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium">My Users{dummyMode ? ' (Dummy)' : ''}</span>
            <button onClick={refresh} className="text-sm rounded-md border px-3 py-1 hover:bg-gray-50">
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="p-4 text-gray-600">Loading...</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {myItems.slice((page - 1) * pageSize, page * pageSize).map((item) => (
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
                      onClick={() => startEdit(item)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-gray-800 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {myItems.length === 0 && (
                <li className="p-4 text-gray-600">No items found. Create one above.</li>
              )}
            </ul>
          )}
          {!loading && myItems.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(myItems.length / pageSize))}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`rounded-md border px-3 py-1 text-sm ${page <= 1 ? 'text-gray-400 bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(myItems.length / pageSize), p + 1))}
                  disabled={page >= Math.ceil(myItems.length / pageSize)}
                  className={`rounded-md border px-3 py-1 text-sm ${page >= Math.ceil(myItems.length / pageSize) ? 'text-gray-400 bg-gray-100' : 'hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="font-semibold">{modalMode === 'edit' ? 'Edit User' : 'Add User'}</div>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <form
                onSubmit={onSubmit}
                className="p-4 space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.name ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  {formErrors.name && <div className="mt-1 text-xs text-red-600">{formErrors.name}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.email ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  {formErrors.email && <div className="mt-1 text-xs text-red-600">{formErrors.email}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.role ? 'border-red-300 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  {formErrors.role && <div className="mt-1 text-xs text-red-600">{formErrors.role}</div>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className={`rounded-md px-4 py-2 text-white transition ${busy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {modalMode === 'edit' ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200 font-semibold">Delete User</div>
              <div className="p-4 text-sm text-gray-700">Are you sure you want to delete this user?</div>
              <div className="flex justify-end gap-2 px-4 pb-4">
                <button onClick={() => setConfirmDeleteId(null)} className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancel</button>
                <button onClick={() => { const id = confirmDeleteId; setConfirmDeleteId(null); onDelete(id); }} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Import IDs Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="font-semibold">Import Existing User IDs</div>
                <button onClick={() => { setShowImport(false); setIdsText(''); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-600">Paste comma or line-separated IDs created previously.</div>
                <textarea
                  className="w-full h-32 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="id1, id2, id3"
                  value={idsText}
                  onChange={(e) => setIdsText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setShowImport(false); setIdsText(''); }} className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancel</button>
                  <button
                    onClick={async () => {
                      const ids = Array.from(new Set((idsText.match(/[a-f0-9]{32}/gi) || []).map((s) => s.trim())))
                      if (!ids.length) { addToast('error', 'No IDs found in text'); return }
                      setBusy(true)
                      try {
                        const fetched = await Promise.all(ids.map(async (id) => {
                          try { return await getItem(id) } catch { return null }
                        }))
                        const valid = fetched.filter(Boolean)
                        const existing = loadIds()
                        const merged = Array.from(new Set([...(existing || []), ...valid.map((x) => x.id)]))
                        saveIds(merged)
                        setMyItems(valid)
                        addToast('success', `Imported ${valid.length} user(s)`) 
                        setShowImport(false)
                        setIdsText('')
                      } catch (e) {
                        addToast('error', e.message || 'Import failed')
                      } finally {
                        setBusy(false)
                      }
                    }}
                    className={`rounded-md px-4 py-2 text-white ${busy ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {busy && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <div className="text-sm text-gray-700">Processing...</div>
            </div>
          </div>
        )}

        <div className="fixed bottom-4 right-4 space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className={`min-w-[220px] rounded-md px-4 py-2 shadow text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>{t.message}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
