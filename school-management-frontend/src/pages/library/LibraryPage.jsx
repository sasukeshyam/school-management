import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Library, BookOpen, Users, RotateCcw } from 'lucide-react'
import { bookCategoriesAPI, booksAPI, libraryMembersAPI, bookIssuesAPI } from '@/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, Badge, Input, Label, Select } from '@/components/ui/index.jsx'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { toast } from '@/hooks/useToast'
import { fDate, STATUS_COLORS } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useForm } from 'react-hook-form'

const TABS = ['Books', 'Categories', 'Members', 'Issued Books']

const BookForm = ({ initial, categories, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title:            initial?.title            || '',
      author:           initial?.author           || '',
      isbn:             initial?.isbn             || '',
      publisher:        initial?.publisher        || '',
      edition:          initial?.edition          || '',
      category_id:      initial?.category_id?._id || '',
      total_copies:     initial?.total_copies     || 1,
      shelf_location:   initial?.shelf_location   || '',
    }
  })
  const mutation = useMutation({
    mutationFn: d => {
      const clean = { ...d }
      if (!clean.category_id) delete clean.category_id
      return initial ? booksAPI.update(initial._id, clean) : booksAPI.create(clean)
    },
    onSuccess: () => { toast.success(initial ? 'Book updated' : 'Book added'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Title *</Label>
          <Input placeholder="Book title" {...register('title', { required: true })} />
          {errors.title && <p className="text-xs text-destructive">Title is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Author</Label>
          <Input placeholder="Author name" {...register('author')} />
        </div>
        <div className="space-y-1.5">
          <Label>ISBN</Label>
          <Input placeholder="978-XXXXXXXXXX" {...register('isbn')} />
        </div>
        <div className="space-y-1.5">
          <Label>Publisher</Label>
          <Input placeholder="Publisher name" {...register('publisher')} />
        </div>
        <div className="space-y-1.5">
          <Label>Edition</Label>
          <Input placeholder="e.g. 3rd Edition" {...register('edition')} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select {...register('category_id')}>
            <option value="">Select category</option>
            {(categories || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Total Copies</Label>
          <Input type="number" min="1" placeholder="1" {...register('total_copies')} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Shelf Location</Label>
          <Input placeholder="e.g. Rack A - Shelf 2" {...register('shelf_location')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>{initial ? 'Update Book' : 'Add Book'}</Button>
      </div>
    </form>
  )
}

const IssueForm = ({ books, members, onSuccess, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const mutation = useMutation({
    mutationFn: d => {
      const clean = { ...d }
      if (!clean.book_id) delete clean.book_id
      if (!clean.library_member_id) delete clean.library_member_id
      return bookIssuesAPI.create(clean)
    },
    onSuccess: () => { toast.success('Book issued successfully'); onSuccess?.() },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Book *</Label>
          <Select {...register('book_id', { required: true })}>
            <option value="">Select book</option>
            {(books || []).map(b => (
              <option key={b._id} value={b._id} disabled={b.available_copies < 1}>
                {b.title} {b.available_copies < 1 ? '(Not available)' : `(${b.available_copies} available)`}
              </option>
            ))}
          </Select>
          {errors.book_id && <p className="text-xs text-destructive">Book is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Member *</Label>
          <Select {...register('library_member_id', { required: true })}>
            <option value="">Select member</option>
            {(members || []).map(m => (
              <option key={m._id} value={m._id}>{m.user_id?.name} ({m.member_type})</option>
            ))}
          </Select>
          {errors.library_member_id && <p className="text-xs text-destructive">Member is required</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Due Date *</Label>
          <Input type="date" {...register('due_date', { required: true })} />
          {errors.due_date && <p className="text-xs text-destructive">Due date is required</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Issue Book</Button>
      </div>
    </form>
  )
}

export const LibraryPage = () => {
  const qc = useQueryClient()
  const [tab, setTab]           = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data: booksData,      isLoading: l0 } = useQuery({ queryKey: ['books', page, search],      queryFn: () => booksAPI.getAll({ page, limit: 10, search }).then(r => r.data),          enabled: tab === 0 })
  const { data: categoriesData, isLoading: l1 } = useQuery({ queryKey: ['book-categories', page],    queryFn: () => bookCategoriesAPI.getAll({ page, limit: 10 }).then(r => r.data),         enabled: tab === 1 })
  const { data: membersData,    isLoading: l2 } = useQuery({ queryKey: ['library-members', page],    queryFn: () => libraryMembersAPI.getAll({ page, limit: 10 }).then(r => r.data),        enabled: tab === 2 })
  const { data: issuesData,     isLoading: l3 } = useQuery({ queryKey: ['book-issues', page],        queryFn: () => bookIssuesAPI.getAll({ page, limit: 10, status: 'issued' }).then(r => r.data), enabled: tab === 3 })

  // For dropdowns
  const { data: allBooks }   = useQuery({ queryKey: ['books-all'],      queryFn: () => booksAPI.getAll({ limit: 100 }).then(r => r.data.data)          })
  const { data: allMembers } = useQuery({ queryKey: ['members-all'],    queryFn: () => libraryMembersAPI.getAll({ limit: 100 }).then(r => r.data.data)  })
  const { data: allCats }    = useQuery({ queryKey: ['book-cats-all'],  queryFn: () => bookCategoriesAPI.getAll({ limit: 100 }).then(r => r.data.data)  })

  const returnMutation = useMutation({
    mutationFn: id => bookIssuesAPI.update(id, { status: 'returned', return_date: new Date() }),
    onSuccess: () => { toast.success('Book returned successfully'); qc.invalidateQueries(['book-issues']); qc.invalidateQueries(['books']) },
    onError:   e  => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (tab === 0) return booksAPI.remove(id)
      if (tab === 1) return bookCategoriesAPI.remove(id)
      if (tab === 2) return libraryMembersAPI.remove(id)
    },
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries(['books']); qc.invalidateQueries(['book-categories']); qc.invalidateQueries(['library-members'])
      setDeleting(null)
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const tabs = [
    {
      data: booksData, loading: l0,
      columns: [
        { header: 'Title',     cell: r => <div><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.author || '—'}</p></div> },
        { header: 'ISBN',      cell: r => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.isbn || '—'}</code> },
        { header: 'Category',  cell: r => <Badge variant="outline">{r.category_id?.name || '—'}</Badge> },
        { header: 'Total',     cell: r => <p className="text-sm font-mono text-center">{r.total_copies}</p> },
        { header: 'Available', cell: r => (
          <span className={cn('text-sm font-semibold', r.available_copies > 0 ? 'text-emerald-600' : 'text-red-500')}>
            {r.available_copies}
          </span>
        )},
        { header: 'Location',  cell: r => <p className="text-xs text-muted-foreground">{r.shelf_location || '—'}</p> },
        { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )},
      ],
      emptyTitle: 'No books yet', emptyDesc: 'Add books to the library collection',
    },
    {
      data: categoriesData, loading: l1,
      columns: [
        { header: 'Name',   cell: r => <p className="text-sm font-medium">{r.name}</p> },
        { header: 'Status', cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setShowForm(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )},
      ],
      emptyTitle: 'No categories yet', emptyDesc: 'Create categories like Fiction, Science, History',
    },
    {
      data: membersData, loading: l2,
      columns: [
        { header: 'Member',      cell: r => <div><p className="text-sm font-medium">{r.user_id?.name}</p><p className="text-xs text-muted-foreground">{r.user_id?.email}</p></div> },
        { header: 'Member No',   cell: r => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.member_no || '—'}</code> },
        { header: 'Type',        cell: r => <Badge variant="outline" className="capitalize">{r.member_type}</Badge> },
        { header: 'Status',      cell: r => <Badge variant={r.is_active ? 'success' : 'secondary'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
        { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
        )},
      ],
      emptyTitle: 'No members yet', emptyDesc: 'Library members are students and teachers who can borrow books',
    },
    {
      data: issuesData, loading: l3,
      columns: [
        { header: 'Book',    cell: r => <p className="text-sm font-medium">{r.book_id?.title}</p> },
        { header: 'Member',  cell: r => <p className="text-sm">{r.library_member_id?.user_id?.name || '—'}</p> },
        { header: 'Issued',  cell: r => <p className="text-sm text-muted-foreground">{fDate(r.issue_date)}</p> },
        { header: 'Due',     cell: r => (
          <p className={cn('text-sm font-medium', new Date(r.due_date) < new Date() ? 'text-red-500' : 'text-foreground')}>
            {fDate(r.due_date)}
          </p>
        )},
        { header: 'Status',  cell: r => <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md capitalize', STATUS_COLORS[r.status] || '')}>{r.status}</span> },
        { header: 'Fine',    cell: r => <p className="text-sm">{r.fine ? `₹${r.fine}` : '—'}</p> },
        { header: 'Actions', className: 'text-right', cellClassName: 'text-right', cell: r => (
          r.status === 'issued'
            ? <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(r._id)} loading={returnMutation.isPending}>
                <RotateCcw className="h-3.5 w-3.5" /> Return
              </Button>
            : <span className="text-xs text-muted-foreground">Returned</span>
        )},
      ],
      emptyTitle: 'No books currently issued', emptyDesc: 'Issue books to library members',
    },
  ]

  const current = tabs[tab]
  const rows    = current.data?.data       || []
  const pag     = current.data?.pagination || {}

  const addLabels    = ['Add Book', 'Add Category', 'Add Member', 'Issue Book']
  const emptyDescs   = tabs.map(t => t.emptyDesc)
  const emptyTitles  = tabs.map(t => t.emptyTitle)

  return (
    <div>
      <PageHeader
        title="Library"
        description="Manage books, members and issue/return tracking"
        breadcrumbs={[{ label: 'Library' }]}
        action={
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> {addLabels[tab]}
          </Button>
        }
      />

      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setPage(1) }}
            className={cn('px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>{t}</button>
        ))}
      </div>

      <Card><CardContent className="pt-5">
        <DataTable
          columns={current.columns} data={rows}
          total={pag.total} page={pag.page} pages={pag.pages} limit={pag.limit}
          isLoading={current.loading} onPageChange={setPage}
          onSearch={tab === 0 ? (v => { setSearch(v); setPage(1) }) : undefined}
          searchPlaceholder="Search books..."
          emptyIcon={Library}
          emptyTitle={emptyTitles[tab]}
          emptyDescription={emptyDescs[tab]}
        />
      </CardContent></Card>

      {/* Book Modal */}
      {tab === 0 && (
        <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Book' : 'Add Book'} size="lg">
          <BookForm initial={editing} categories={allCats}
            onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries(['books']) }}
            onCancel={() => { setShowForm(false); setEditing(null) }} />
        </Modal>
      )}

      {/* Category Modal */}
      {tab === 1 && (
        <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
          <form onSubmit={e => {
            e.preventDefault()
            const name = e.target.name.value
            const fn = editing ? bookCategoriesAPI.update(editing._id, { name }) : bookCategoriesAPI.create({ name })
            fn.then(() => { toast.success('Saved'); qc.invalidateQueries(['book-categories']); qc.invalidateQueries(['book-cats-all']); setShowForm(false); setEditing(null) })
              .catch(err => toast.error(err.response?.data?.message || 'Failed'))
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input name="name" defaultValue={editing?.name || ''} placeholder="e.g. Science, Fiction" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Issue Book Modal */}
      {tab === 3 && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title="Issue Book" size="md">
          <IssueForm books={allBooks} members={allMembers}
            onSuccess={() => { setShowForm(false); qc.invalidateQueries(['book-issues']); qc.invalidateQueries(['books']) }}
            onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting?._id)} loading={deleteMutation.isPending}
        title="Confirm Delete" description="Are you sure you want to delete this?" />
    </div>
  )
}