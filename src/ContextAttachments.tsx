import { useState } from 'react'

interface Attachment { id: number; name: string; url: string }
interface Props { attachments: Attachment[]; onAdd: (a: Attachment) => void; onRemove: (id: number) => void }

function processFiles(files: FileList | File[], onAdd: (a: Attachment) => void) {
  Array.from(files).forEach(file => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return
    onAdd({ id: Date.now() + Math.random(), name: file.name, url: URL.createObjectURL(file) })
  })
}

export default function ContextAttachments({ attachments, onAdd, onRemove }: Props) {
  const [dragging, setDragging] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Context Attachments</label>
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">Upload screenshots, meeting notes, PRD snippets or chat history to provide additional context.</p>

      <label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files, onAdd) }}
        className={`flex flex-col items-center gap-1 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-all ${dragging ? 'drop-zone-active' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'}`}
      >
        <span className="text-2xl mb-1">📎</span>
        <span className="text-xs font-semibold text-gray-600">Drag &amp; Drop</span>
        <span className="text-xs text-gray-400">Paste Screenshot · Browse Files</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden"
          onChange={e => e.target.files && processFiles(e.target.files, onAdd)} />
      </label>

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map(att => (
            <div key={att.id} className="relative group flex flex-col items-center gap-1">
              <img src={att.url} alt={att.name} className="thumb-img" />
              <span className="text-[10px] text-gray-500 max-w-[64px] truncate">{att.name}</span>
              <button
                onClick={() => onRemove(att.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
