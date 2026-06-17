import { useState } from 'react'
import type { InspectionContext } from './types'

type Step = 1 | 2 | 3

// Mock blob URLs for demo attachments (data URIs of tiny colored squares)
const PRD_MOCK_URL = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#DBEAFE"/><text x="60" y="85" text-anchor="middle" font-size="12" fill="#1D4ED8">PRD</text></svg>')
const FIGMA_MOCK_URL = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#EDE9FE"/><text x="60" y="85" text-anchor="middle" font-size="12" fill="#7C3AED">Figma</text></svg>')
const IMPL_MOCK_URL = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#FFEDD5"/><text x="60" y="85" text-anchor="middle" font-size="11" fill="#C2410C">Dev Impl</text></svg>')

const diffs = [
  { id: 1, level: 'P0', priority: 0, pairKey: 'PF', pairLabel: 'PRD ↔ Figma', title: '缺失「空数据兜底」状态', detail: 'PRD 第 4 条要求支持「空数据兜底」状态，Figma 中未发现对应设计稿。', fix: '设计师补充空状态画面，含插画 + 引导文案。' },
  { id: 2, level: 'P1', priority: 1, pairKey: 'FD', pairLabel: 'Figma ↔ 实现', title: '按钮文案不一致', detail: 'Figma 文案为「立即购买」，研发实现为「马上购买」。', fix: '研发同学按 Figma 文案修改为「立即购买」。' },
  { id: 3, level: 'P2', priority: 2, pairKey: 'FD', pairLabel: 'Figma ↔ 实现', title: '主色色值偏差', detail: 'Figma 主色 #FF5722，实现取色 #FF6633，色相偏差约 4°。', fix: '研发同学统一为设计令牌 token: brand/primary (#FF5722)。' },
]

const levelStyle: Record<string, { box: string; tag: string }> = {
  P0: { box: 'bg-red-50 border-red-400', tag: 'bg-red-500 text-white' },
  P1: { box: 'bg-orange-50 border-orange-400', tag: 'bg-orange-500 text-white' },
  P2: { box: 'bg-yellow-50 border-yellow-500', tag: 'bg-yellow-500 text-white' },
}
const pairStyle: Record<string, string> = {
  PF: 'bg-blue-100 text-blue-700',
  FD: 'bg-purple-100 text-purple-700',
}

export default function InspectionTool({ onNavigateToComm }: { onNavigateToComm: (ctx: InspectionContext) => void }) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [filterPair, setFilterPair] = useState('all')
  const [sort, setSort] = useState('prio')
  const [started, setStarted] = useState(false)

  const handleNavigate = (pairKey: 'PF' | 'FD') => {
    // audience mapping: PF → design (talk to designer), FD → dev (talk to dev)
    const audience = pairKey === 'PF' ? 'design' : 'dev'
    const relevantDiffs = diffs.filter(d => d.pairKey === pairKey)
    const attachments = pairKey === 'PF'
      ? [
          { id: 1, name: 'PRD-商品详情页.png', url: PRD_MOCK_URL },
          { id: 2, name: 'Figma-商品详情页.png', url: FIGMA_MOCK_URL },
        ]
      : [
          { id: 3, name: 'Figma-商品详情页.png', url: FIGMA_MOCK_URL },
          { id: 4, name: '研发实现截图.png', url: IMPL_MOCK_URL },
        ]
    onNavigateToComm({ pairKey, audience, attachments, diffs: relevantDiffs })
  }

  const goStep = (n: Step) => { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const runCompare = () => {
    goStep(3)
    setLoading(true)
    setStarted(false)
    setTimeout(() => { setLoading(false); setStarted(true) }, 1500)
  }

  const filtered = diffs
    .filter(d => filterPair === 'all' || d.pairKey === filterPair)
    .sort((a, b) => sort === 'prioDesc' ? b.priority - a.priority : sort === 'pair' ? a.pairKey.localeCompare(b.pairKey) || a.priority - b.priority : a.priority - b.priority)

  const StepBadge = ({ n }: { n: number }) => {
    const cls = n < step ? 'bg-green-600 text-white' : n === step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{n === 1 ? '1 输入' : n === 2 ? '2 预览' : '3 结果'}</span>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* step nav */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-white/60">
        <StepBadge n={1} /><span className="text-slate-300 text-xs">›</span>
        <StepBadge n={2} /><span className="text-slate-300 text-xs">›</span>
        <StepBadge n={3} />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">第一步：上传走查素材</h2>
            <p className="text-sm text-slate-500 mb-6">支持如流 PRD 链接、Figma 设计稿链接、研发实现截图</p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="inline-block w-5 h-5 rounded bg-blue-100 text-blue-600 text-xs text-center leading-5 mr-1">P</span>
                  PRD 文档链接（如流）
                </label>
                <input type="text" defaultValue="https://ku.baidu-int.com/knowledge/HFVrC7IYBQ/pKzJz9xK/PRD-detail-v2.3"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">已自动识别：商品详情页 PRD v2.3 · 张三 · 2026-06-10</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="inline-block w-5 h-5 rounded bg-purple-100 text-purple-600 text-xs text-center leading-5 mr-1">F</span>
                  Figma 设计稿链接
                </label>
                <input type="text" defaultValue="https://www.figma.com/file/abc123/Product-Detail?node-id=12%3A48"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-slate-400 mt-1">已自动识别：商品详情页 / Frame 12:48 · 设计师 李四</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="inline-block w-5 h-5 rounded bg-orange-100 text-orange-600 text-xs text-center leading-5 mr-1">D</span>
                  研发实现截图
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-16 rounded bg-gradient-to-br from-orange-200 to-orange-400 flex-shrink-0"></div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-700">product-detail-impl.png</p>
                      <p className="text-xs text-slate-400">已上传 · 1242 × 2208 · 320 KB</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">点击或拖拽替换截图（demo 已预填示例）</p>
                </div>
              </div>
            </div>
            <button onClick={() => goStep(2)} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium shadow">
              下一步：预览素材 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">第二步：素材预览</h2>
              <p className="text-sm text-slate-500">确认无误后启动 AI 多模态对比</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => goStep(1)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white">← 返回修改</button>
              <button onClick={runCompare} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium shadow">开始 AI 对比 →</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><span className="w-5 h-5 rounded bg-blue-100 text-blue-600 text-xs text-center leading-5">P</span>PRD（如流文档）</h3>
                <span className="text-xs text-green-600">已解析</span>
              </div>
              <div className="text-sm text-slate-700 space-y-2 leading-relaxed">
                <p><b>商品详情页</b></p>
                <p>1. 主图区展示商品图片，支持轮播</p>
                <p>2. 标题区显示商品名称、价格</p>
                <p>3. 操作区：<span className="bg-yellow-100">「立即购买」</span>按钮</p>
                <p>4. 状态：正常 / 售罄 / <span className="bg-yellow-100">空数据兜底</span></p>
                <p>5. 主色：<span className="bg-yellow-100">#FF5722</span></p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><span className="w-5 h-5 rounded bg-purple-100 text-purple-600 text-xs text-center leading-5">F</span>Figma 设计稿</h3>
                <span className="text-xs text-green-600">已加载</span>
              </div>
              <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{aspectRatio:'3/4'}}>
                <div className="absolute inset-3 bg-white rounded shadow-sm flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-orange-200 to-orange-400"></div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-semibold text-sm">夏季新品 T 恤</p>
                    <p className="text-orange-600 font-bold mt-1">¥199</p>
                    <div className="mt-auto"><button className="w-full bg-orange-500 text-white py-2 rounded text-sm">立即购买</button></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><span className="w-5 h-5 rounded bg-orange-100 text-orange-600 text-xs text-center leading-5">D</span>研发实现截图</h3>
                <span className="text-xs text-green-600">已上传</span>
              </div>
              <div className="relative bg-slate-100 rounded-lg overflow-hidden" style={{aspectRatio:'3/4'}}>
                <div className="absolute inset-3 bg-white rounded shadow-sm flex flex-col">
                  <div className="h-32 bg-gradient-to-br from-orange-300 to-orange-500"></div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="font-semibold text-sm">夏季新品 T 恤</p>
                    <p className="font-bold mt-1" style={{color:'#FF6633'}}>¥199</p>
                    <div className="mt-auto"><button className="w-full text-white py-2 rounded text-sm" style={{background:'#FF6633'}}>马上购买</button></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">第三步：AI 走查结果</h2>
              <p className="text-sm text-slate-500">共检出 <span className="font-bold text-red-600">3</span> 项差异</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => goStep(2)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white">← 返回预览</button>
              <button onClick={() => { goStep(1); setStarted(false) }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-white">↺ 重新走查</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-600">P · PRD</span>
                <span className="text-slate-400">↔</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-600">F · Figma</span>
                <span className="ml-auto text-xs text-slate-500 font-normal">需求 vs 设计</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">1 项差异</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">检查需求点是否在设计稿中完整落地</p>
              <button onClick={() => handleNavigate('PF')}
                className="w-full text-xs py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium">
                💬 去沟通助手跟进 →
              </button>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-600">F · Figma</span>
                <span className="text-slate-400">↔</span>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-600">D · 实现</span>
                <span className="ml-auto text-xs text-slate-500 font-normal">设计 vs 实现</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">2 项差异</p>
              <p className="text-xs text-slate-500 mt-1 mb-3">检查设计稿与研发产物的视觉/文案一致性</p>
              <button onClick={() => handleNavigate('FD')}
                className="w-full text-xs py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium">
                💬 去沟通助手跟进 →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-slate-800">AI 检出差异清单</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">对比对象：</span>
                {[['all','全部'],['PF','PRD ↔ Figma'],['FD','Figma ↔ 实现']].map(([k,l])=>(
                  <button key={k} onClick={()=>setFilterPair(k)}
                    className={`px-3 py-1 rounded-full border transition ${filterPair===k?'bg-blue-600 text-white border-blue-600':'border-slate-300 hover:bg-slate-50'}`}>{l}</button>
                ))}
                <span className="mx-1 text-slate-300">|</span>
                <select value={sort} onChange={e=>setSort(e.target.value)} className="border border-slate-300 rounded px-2 py-1 text-xs">
                  <option value="prio">按优先级（P0→P2）</option>
                  <option value="prioDesc">按优先级（P2→P0）</option>
                  <option value="pair">按对比对象分组</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-slate-500 py-6">
                <div className="w-6 h-6 rounded-full border-3 border-slate-200 border-t-blue-500 animate-spin" style={{borderWidth:3}}></div>
                AI 正在多模态对比中…
              </div>
            )}

            {started && (
              <ul className="space-y-3">
                {filtered.length === 0
                  ? <p className="text-slate-400 text-sm py-6 text-center">当前筛选条件下没有差异 ✅</p>
                  : filtered.map((d, i) => (
                    <li key={d.id} className={`border-l-4 rounded p-4 ${levelStyle[d.level].box}`}
                      style={{animation:`fadeSlideUp 0.35s ease ${i*0.08}s forwards`, opacity:0}}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${levelStyle[d.level].tag}`}>{d.level}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${pairStyle[d.pairKey]}`}>{d.pairLabel}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{d.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{d.detail}</p>
                      <p className="text-sm text-slate-700 mt-2"><b>修复建议：</b>{d.fix}</p>
                    </li>
                  ))
                }
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
