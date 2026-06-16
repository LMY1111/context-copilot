import { useState, useEffect } from 'react'
import { TABS, RISK_COLOR, type AnalysisResult } from './types'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${copied ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'}`}
    >{copied ? '✓ Copied' : 'Copy'}</button>
  )
}

function SummaryCard({ data }: { data: AnalysisResult }) {
  const rc = RISK_COLOR[data.risk]
  return (
    <div className="card-enter bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
      <div className="flex-1 flex flex-col items-center justify-center bg-indigo-50 rounded-xl py-3">
        <span className="text-2xl font-bold text-indigo-700">{data.score}</span>
        <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide mt-0.5">Comm. Score</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3">
        <span className={`text-sm font-bold ${rc.text}`}>{data.risk}</span>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Risk Level</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl py-3">
        <span className="text-2xl font-bold text-gray-700">{data.missingCount}</span>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">Missing Items</span>
      </div>
    </div>
  )
}

function RecommendedCard({ text, onReplace }: { text: string; onReplace: () => void }) {
  return (
    <div className="card-enter bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>📨</span>
          <span className="font-semibold text-sm">推荐发送版本</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Ready to send</span>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-indigo-50 mb-4">{text}</pre>
      <div className="flex gap-2 justify-end">
        <CopyButton text={text} />
        <button onClick={onReplace} className="text-xs px-3 py-1.5 rounded-lg bg-white text-indigo-700 font-medium hover:bg-indigo-50 transition">Replace Original</button>
      </div>
    </div>
  )
}

function TabsAnalysis({ data, audienceLabel }: { data: AnalysisResult; audienceLabel: string }) {
  const [tab, setTab] = useState('perspective')
  const rc = RISK_COLOR[data.risk]
  return (
    <div className="card-enter bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 text-xs py-3 font-medium transition-all ${tab === t.id ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === 'perspective' && (
          <div>
            <p className="text-xs text-indigo-500 font-medium mb-3 uppercase tracking-wide">作为{audienceLabel}，对方可能这样解读你的话：</p>
            <div className="flex flex-col gap-2">
              {data.perspective.map((p, i) => (
                <div key={i} className="perspective-bubble rounded-xl px-4 py-2.5 text-sm text-indigo-800 flex items-start gap-2">
                  <span className="mt-0.5 text-indigo-400">💭</span><span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'risk' && (
          <div className="flex items-start gap-3">
            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${rc.badge}`}>{data.risk}风险</span>
            <p className="text-gray-600 text-sm leading-relaxed">{data.riskNote}</p>
          </div>
        )}
        {tab === 'missing' && (
          <ul className="space-y-2">
            {data.suggested.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>{s}
              </li>
            ))}
          </ul>
        )}
        {tab === 'notes' && (
          <p className="text-sm text-gray-700 leading-relaxed">{data.optimizationNotes}</p>
        )}
      </div>
    </div>
  )
}

export default function ResultPanel({ data, audienceLabel, onReplace }: { data: AnalysisResult; audienceLabel: string; onReplace: () => void }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs text-gray-400 font-medium">
        分析对象：<span className="text-indigo-600 font-semibold">{audienceLabel}</span> · 5 维度分析完成
      </div>
      {phase >= 0 && <SummaryCard data={data} />}
      {phase >= 1 && <RecommendedCard text={data.recommended} onReplace={onReplace} />}
      {phase >= 2 && <TabsAnalysis data={data} audienceLabel={audienceLabel} />}
    </div>
  )
}
