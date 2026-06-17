import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { AUDIENCES, MY_ROLES, MOCK, type AnalysisResult, type Attachment } from './types'
import ContextAttachments from './ContextAttachments'
import ResultPanel from './ResultPanel'

const THINKING_STEPS = ['Reading context...', 'Modeling perspective...', 'Assessing risk...', 'Drafting response...']

type ReviewIntent = 'intentional' | 'mistake'
type PlatformTool = 'communication' | 'inspection'

interface ReviewDiffPayload {
  diff: {
    id: number
    level: string
    pairLabel: string
    title: string
    detail: string
    fix: string
  }
  myRole?: string
  audience?: string
  suggestedReason?: string
}

function createReviewResult(payload: ReviewDiffPayload, intent: ReviewIntent): AnalysisResult {
  if (intent === 'mistake') {
    return {
      score: 88,
      risk: '低',
      missingCount: 1,
      recommended: `你好，这里走查发现一个差异：${payload.diff.title}。\n\n这个点应该是我这边实现/处理时没有完全对齐，感谢提醒。我会按当前走查建议调整：${payload.diff.fix}\n\n改完后我会再同步一版结果，麻烦你到时帮忙确认一下是否符合预期。`,
      perspective: ['对方能明确知道这是一个已确认的问题', '责任边界清楚，不需要继续追问原因', '后续动作和确认节点比较明确'],
      riskNote: '主动承认差异并给出修复动作，可以降低跨角色沟通中的追责感。',
      optimizationNotes: '先确认问题，再说明修复动作，最后邀请对方复核，避免把走查结果变成争论。',
      suggested: ['预计修复时间', '修改后的验证截图', '是否影响其他页面或组件'],
    }
  }

  return {
    score: 82,
    risk: '中',
    missingCount: 2,
    recommended: `你好，这里走查发现一个差异：${payload.diff.title}。\n\n这个差异不是单纯漏改，我当时的考虑是：${payload.suggestedReason || '基于当前页面场景做了一个取舍，希望先和你对齐是否合理'}\n\n如果从你的视角看，这个取舍会影响体验一致性或后续规范沉淀，我可以按走查建议调整：${payload.diff.fix}。如果这个取舍可以接受，我们也可以把原因补到备注里，避免后续走查时再次被判为问题。`,
    perspective: ['对方会先理解这是有原因的取舍，而不是随意改动', '保留了回到规范的选择空间', '把讨论焦点从对错转成是否接受取舍'],
    riskNote: '刻意差异容易被理解成不按规范执行，需要把原因、影响和可回退方案说清楚。',
    optimizationNotes: '避免直接说“我是故意的”，改为说明场景约束、取舍收益和可调整方案。',
    suggested: ['取舍原因', '影响范围', '是否需要沉淀为规范备注', '如果不接受，按哪个方案回退'],
  }
}

function readReviewDiffPayload(): ReviewDiffPayload | null {
  const hash = window.location.hash
  const match = hash.match(/reviewDiff=([^&]+)/)
  const raw = match ? decodeURIComponent(match[1]) : localStorage.getItem('cc_review_diff')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

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

function PlatformShell({ activeTool, onToolChange, onOpenModal, children }: { activeTool: PlatformTool; onToolChange: (tool: PlatformTool) => void; onOpenModal: () => void; children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navItems = [
    { id: 'communication' as const, title: '沟通助手', subtitle: 'Communication Copilot', icon: '💬' },
    { id: 'inspection' as const, title: '走查助手', subtitle: 'AI Inspection Tool', icon: '🔍' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-40 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">PI</div>
          <div className="flex items-baseline gap-3">
            <span className="font-semibold text-gray-900 text-sm">产品迭代协作平台</span>
            <span className="text-xs text-gray-400 font-medium">Product Iteration Platform</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenModal} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">Personal Memory</button>
          <button onClick={onOpenModal} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">Communication Review</button>
        </div>
      </nav>

      <div className="flex flex-1 min-h-0">
        <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[14.285vw] min-w-[180px] max-w-[240px]'} shrink-0 border-r border-gray-100 bg-white/70 px-3 py-5 transition-all duration-200`}>
          <button onClick={() => setSidebarCollapsed(v => !v)}
            className="mb-4 w-full h-9 rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 transition text-sm font-medium">
            {sidebarCollapsed ? '›' : '‹ 收起'}
          </button>
          <div className="flex flex-col gap-3">
            {navItems.map(item => (
              <button key={item.id} onClick={() => onToolChange(item.id)}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} rounded-2xl py-4 text-left transition ${activeTool === item.id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}
                title={item.title}>
                <span className="text-2xl w-8 text-center">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                    <span className="text-xs text-gray-400 font-medium truncate">{item.subtitle}</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

function InspectionTool() {
  return (
    <div className="h-full bg-slate-50">
      <iframe
        title="AI Inspection Tool"
        src="/inspection/index.html"
        className="w-full h-full border-0"
      />
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
  const [myRole, setMyRole] = useState('pm')
  const [myRoleOpen, setMyRoleOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'thinking' | 'done'>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [modal, setModal] = useState(false)
  const [activeTool, setActiveTool] = useState<PlatformTool>('communication')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [stepIdx, setStepIdx] = useState(0)
  const [reviewPayload, setReviewPayload] = useState<ReviewDiffPayload | null>(null)
  const [reviewIntent, setReviewIntent] = useState<ReviewIntent>('intentional')
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const applyReviewPayload = () => {
      const payload = readReviewDiffPayload()
      if (!payload) return
      setActiveTool('communication')
      setStatus('idle')
      setResult(null)
      setReviewPayload(payload)
      if (payload.myRole) setMyRole(payload.myRole)
      if (payload.audience) setAudience(payload.audience)
      setText(`这里有差异：${payload.diff.title}\n${payload.diff.detail}\n\n我这样处理的原因是：${payload.suggestedReason || ''}`)
    }

    applyReviewPayload()
    window.addEventListener('hashchange', applyReviewPayload)
    window.addEventListener('focus', applyReviewPayload)
    return () => {
      window.removeEventListener('hashchange', applyReviewPayload)
      window.removeEventListener('focus', applyReviewPayload)
    }
  }, [])

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

    if (reviewPayload) {
      let i = 0
      stepRef.current = setInterval(() => {
        i++
        if (i < THINKING_STEPS.length) setStepIdx(i)
      }, 600)
      setTimeout(() => {
        clearInterval(stepRef.current!)
        setStatus('done')
        setResult(createReviewResult(reviewPayload, reviewIntent))
        localStorage.setItem('cc_review_result', JSON.stringify({
          diffId: reviewPayload.diff.id,
          status: reviewIntent === 'mistake' ? '已沟通-待修复' : '已沟通-保留设计',
        }))
      }, THINKING_STEPS.length * 600)
      return
    }

    let i = 0
    stepRef.current = setInterval(() => {
      i++
      if (i < THINKING_STEPS.length) setStepIdx(i)
    }, 600)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, audience, myRole, hasAttachments: attachments.length > 0 }),
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
  }, [text, audience, myRole, attachments, reviewPayload, reviewIntent])

  const myRoleObj = MY_ROLES.find(r => r.id === myRole)!

  const audienceLabel = AUDIENCES.find(a => a.id === audience)?.label ?? ''
  const checklist = [
    { label: 'Message', done: text.trim().length > 0 },
    { label: 'Target Role', done: true },
    { label: reviewPayload ? 'Review Diff' : 'Context Attachments', done: reviewPayload ? true : attachments.length > 0, optional: !reviewPayload },
  ]

  return (
    <PlatformShell activeTool={activeTool} onToolChange={setActiveTool} onOpenModal={() => setModal(true)}>
      {modal && <ComingSoonModal onClose={() => setModal(false)} />}

      {activeTool === 'inspection' ? <InspectionTool /> : (
      <div className="flex h-full max-w-6xl mx-auto w-full gap-6 p-6 overflow-y-auto">
        {/* LEFT */}
        <div className="w-[420px] shrink-0 flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Context Copilot <span className="text-indigo-500">·</span> 沟通副驾</h1>
            <p className="text-gray-400 text-sm mt-1">Before you send, understand how it will be received.</p>
          </div>

          {/* Your Role */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Role</span>
                <span className="text-base">{myRoleObj.emoji}</span>
                <span className="text-sm font-medium text-gray-800">{myRoleObj.label}</span>
              </div>
              <button onClick={() => setMyRoleOpen(o => !o)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition">
                {myRoleOpen ? '收起' : '修改'}
              </button>
            </div>
            {myRoleOpen && (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {MY_ROLES.map(r => (
                  <button key={r.id} onClick={() => { setMyRole(r.id); setMyRoleOpen(false) }}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[11px] font-medium transition-all ${myRole === r.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                    <span className="text-base">{r.emoji}</span>{r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {reviewPayload && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">走查差异</label>
              <div className="text-sm text-gray-800 font-medium mb-1">{reviewPayload.diff.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed mb-3">{reviewPayload.diff.detail}</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setReviewIntent('intentional')}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${reviewIntent === 'intentional' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'}`}>刻意取舍</button>
                <button onClick={() => setReviewIntent('mistake')}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all ${reviewIntent === 'mistake' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200'}`}>这是失误</button>
              </div>
            </div>
          )}

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
            ) : reviewPayload ? '生成差异沟通话术 →' : 'Analyze Communication →'}
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
      )}
    </PlatformShell>
  )
}
