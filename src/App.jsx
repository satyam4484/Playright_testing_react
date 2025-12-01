
import { useEffect, useState } from 'react'
import { createItem, updateItem, deleteItem, getItem } from './api'
import UserList from './components/UserList.jsx'
import Pagination from './components/Pagination.jsx'
import CreateEditModal from './components/CreateEditModal.jsx'
import DeleteConfirmationModal from './components/DeleteConfirmationModal.jsx'
import ImportIdsModal from './components/ImportIdsModal.jsx'

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

  async function importIdsFromText(text) {
    const ids = Array.from(new Set((text.match(/[a-f0-9]{32}/gi) || []).map((s) => s.trim())))
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
            data-testid="add-user-btn"
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
            <button  data-testid="refresh-btn" onClick={refresh} className="text-sm rounded-md border px-3 py-1 hover:bg-gray-50">
              Refresh
            </button>
          </div>
          <UserList
            items={myItems.slice((page - 1) * pageSize, page * pageSize)}
            loading={loading}
            onEdit={startEdit}
            onDeleteRequest={(id) => setConfirmDeleteId(id)}
          />
          {!loading && myItems.length > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={myItems.length}
              onChange={setPage}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <CreateEditModal
          visible={showModal}
          mode={modalMode}
          form={form}
          errors={formErrors}
          busy={busy}
          onClose={() => { setShowModal(false); resetForm(); }}
          onChange={(field, value) => setForm((f) => ({ ...f, [field]: value }))}
          onSubmit={onSubmit}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          visible={!!confirmDeleteId}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); onDelete(id); }}
        />

        {/* Import IDs Modal */}
        <ImportIdsModal
          visible={showImport}
          idsText={idsText}
          busy={busy}
          onClose={() => { setShowImport(false); setIdsText('') }}
          onChange={(val) => setIdsText(val)}
          onImport={() => importIdsFromText(idsText)}
        />

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
