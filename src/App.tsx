import { useState, useRef, useEffect, useCallback } from 'react'
import { AUDIENCES, MOCK, type AnalysisResult, type Attachment } from './types'
import ContextAttachments from './ContextAttachments'
import ResultPanel from './ResultPanel'

const THINKING_STEPS = ['Reading context...', 'Modeling perspective...', 'Assessing risk...', 'Drafting response...']

function ComingSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-xs mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-3">🚀</div>
        <div className="font-semibold text-gray-900 text-lg mb-2">Coming Soon</div>
        <div className="text-gray-500 text-sm mb-5">该功能正在开发中，敬请期待。</div>
        <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">好的</button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl mb-6 shadow-inner">🪞</div>
      <h3 className="text-gray-800 font-semibold text-lg mb-2">了解你的沟通，在发送之前</h3>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">输入你想说的话，选择沟通对象，AI 将帮你理解对方如何接收这条消息。</p>
      <div className="mt-8 flex gap-6">
        {[['🎯', '精准表达'], ['🔍', '风险预判'], ['✅', '发前确认']].map(([icon, label]) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <span className="text-xs text-gray-400 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [text, setText] = useState('')
  const [audience, setAudience] = useState('dev')
  const [status, setStatus] = useState<'idle' | 'thinking' | 'done'>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [modal, setModal] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [stepIdx, setStepIdx] = useState(0)
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Paste screenshot globally
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      Array.from(items).forEach(item => {
        if (item.kind !== 'file') return
        const file = item.getAsFile()
        if (!file) return
        setAttachments(prev => [...prev, { id: Date.now() + Math.random(), name: file.name || 'screenshot.png', url: URL.createObjectURL(file) }])
      })
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const analyze = useCallback(async () => {
    if (!text.trim()) return
    setStatus('thinking')
    setResult(null)
    setStepIdx(0)

    let i = 0
    stepRef.current = setInterval(() => {
      i++
      if (i < THINKING_STEPS.length) setStepIdx(i)
    }, 600)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, audience, hasAttachments: attachments.length > 0 }),
      })
      if (res.ok) {
        const data = await res.json()
        clearInterval(stepRef.current!)
        setStatus('done')
        setResult(data)
        return
      }
    } catch {
      // API not available, fall through to mock
    }

    // Fallback to mock
    setTimeout(() => {
      clearInterval(stepRef.current!)
      setStatus('done')
      setResult(MOCK[audience])
    }, THINKING_STEPS.length * 600)
  }, [text, audience, attachments])

  const audienceLabel = AUDIENCES.find(a => a.id === audience)?.label ?? ''
  const checklist = [
    { label: 'Message', done: text.trim().length > 0 },
    { label: 'Target Role', done: true },
    { label: 'Context Attachments', done: attachments.length > 0, optional: true },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {modal && <ComingSoonModal onClose={() => setModal(false)} />}

      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">CC</div>
          <span className="font-semibold text-gray-900 text-sm">Context Copilot</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal(true)} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">Personal Memory</button>
          <button onClick={() => setModal(true)} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">Communication Review</button>
        </div>
      </nav>

      <div className="flex flex-1 max-w-6xl mx-auto w-full gap-6 p-6">
        {/* LEFT */}
        <div className="w-[420px] shrink-0 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Context Copilot <span className="text-indigo-500">·</span> 沟通副驾</h1>
            <p className="text-gray-400 text-sm mt-1">Before you send, understand how it will be received.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">你想说什么</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
              placeholder="这个需求怎么还没开发完？"
              className="w-full resize-none text-sm text-gray-800 placeholder-gray-300 outline-none leading-relaxed"
            />
          </div>

          <ContextAttachments
            attachments={attachments}
            onAdd={att => setAttachments(prev => [...prev, att])}
            onRemove={id => setAttachments(prev => prev.filter(a => a.id !== id))}
          />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">沟通对象</label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCES.map(a => (
                <button key={a.id} onClick={() => setAudience(a.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${audience === a.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                  <span className="text-lg">{a.emoji}</span>{a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 px-1">
            {checklist.map(item => (
              <div key={item.label} className={`flex items-center gap-1.5 text-xs font-medium ${item.done ? 'text-green-600' : item.optional ? 'text-gray-300' : 'text-gray-400'}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}>
                  {item.done ? '✓' : '○'}
                </span>
                {item.label}
              </div>
            ))}
          </div>

          <button onClick={analyze} disabled={status === 'thinking' || !text.trim()}
            className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200">
            {status === 'thinking' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="dot w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                <span className="dot w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                <span className="dot w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                <span className="ml-1">Analyzing...</span>
              </span>
            ) : 'Analyze Communication →'}
          </button>
        </div>

        {/* RIGHT */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {status === 'idle' && <EmptyState />}

          {status === 'thinking' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col justify-center items-center gap-4 min-h-64">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl animate-pulse">🤔</div>
              <div className="text-center">
                <div className="font-semibold text-gray-800 mb-1">正在分析沟通上下文</div>
                {attachments.length > 0 && <div className="text-xs text-amber-600 font-medium mb-1">✓ PRD Screenshot Attached — 正在理解上下文...</div>}
                <div className="text-sm text-indigo-500 font-medium">{THINKING_STEPS[stepIdx]}</div>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                <div className="flex gap-1">
                  <span className="dot w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span className="dot w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                  <span className="dot w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                </div>
                <span>Analyzing communication context...</span>
              </div>
            </div>
          )}

          {status === 'done' && result && (
            <ResultPanel data={result} audienceLabel={audienceLabel} onReplace={() => setText(result.recommended)} />
          )}
        </div>
      </div>
    </div>
  )
}
