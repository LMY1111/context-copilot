export const AUDIENCES = [
  { id: 'dev', label: '研发', emoji: '💻' },
  { id: 'design', label: '设计', emoji: '🎨' },
  { id: 'pm', label: '产品', emoji: '📋' },
  { id: 'qa', label: '测试', emoji: '🔍' },
  { id: 'client', label: '客户', emoji: '🤝' },
  { id: 'boss', label: '领导', emoji: '👔' },
]

export const RISK_COLOR = {
  低: { badge: 'bg-green-100 text-green-700 border-green-200', text: 'text-green-700' },
  中: { badge: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700' },
  高: { badge: 'bg-red-100 text-red-700 border-red-200', text: 'text-red-700' },
} as const

export type RiskLevel = '低' | '中' | '高'

export interface AnalysisResult {
  score: number
  risk: RiskLevel
  missingCount: number
  recommended: string
  perspective: string[]
  riskNote: string
  optimizationNotes: string
  suggested: string[]
}

export interface Attachment {
  id: number
  name: string
  url: string
}

export const TABS = [
  { id: 'perspective', label: 'Receiver Perspective', icon: '🧠' },
  { id: 'risk', label: 'Communication Risk', icon: '⚠️' },
  { id: 'missing', label: 'Missing Context', icon: '📎' },
  { id: 'notes', label: 'Optimization Notes', icon: '✨' },
] as const

export const MOCK: Record<string, AnalysisResult> = {
  dev: {
    score: 62, risk: '中', missingCount: 4,
    recommended: "你好，关于 XX 需求，想了解一下目前的开发进展。\n\n有没有遇到技术层面的问题或资源瓶颈？如果需要产品这边提供更多信息或协调其他支持，请随时告诉我，我们一起推进。\n\n目前期望的上线节点是 XX，如有时间线上的风险，也麻烦提前同步，方便我们统一规划。谢谢！",
    perspective: ["产品在催进度，认为我慢了", "需求优先级较高", "产品可能不了解技术复杂度", "我需要解释或自证"],
    riskNote: "原始表达带有质疑语气，可能引发防御性回应，降低协作效率",
    optimizationNotes: "去除质疑语气，改为开放式询问；补充上下文背景；增加协作意愿表达；明确时间预期。",
    suggested: ["业务背景与上线目标", "期望交付时间节点", "当前优先级排序", "是否需要产品/设计配合"],
  },
  design: {
    score: 70, risk: '中', missingCount: 3,
    recommended: "你好，想跟进一下 XX 设计稿的进度。\n\n如果在某个环节有疑问或需要更多背景信息，欢迎随时来沟通，我可以补充需求细节或提供参考案例。\n\n期望在 XX 时间前能看到初稿，方便我们提前做评审安排，谢谢你的配合！",
    perspective: ["需求方在催稿", "不清楚哪里没做好", "感到压力和不被信任", "可能需要更多参考资料"],
    riskNote: "措辞偏直接，设计师可能感到被指责而非被支持",
    optimizationNotes: "增加对设计工作的认可；补充设计目标与参考；给出明确的时间节点；强调协作支持。",
    suggested: ["设计目标与用户场景", "参考风格与规范", "期望交付格式", "反馈截止时间"],
  },
  pm: {
    score: 45, risk: '高', missingCount: 4,
    recommended: "你好，关于 XX 需求，我们开发团队在当前迭代中存在资源压力，想和你对齐一下优先级。\n\n能否帮忙确认该需求在本期的核心目标，以及是否有可以拆分或延后的部分？我们希望在保证质量的前提下，合理安排交付节奏。",
    perspective: ["被质疑需求价值", "认为技术在推卸责任", "自己的规划没有被尊重", "需要捍卫需求合理性"],
    riskNote: "跨角色质询容易引发边界争议，需要明确以对齐目标为出发点",
    optimizationNotes: "以协作对齐为出发点而非质疑；提供具体资源背景；聚焦范围讨论而非指责；保持建设性。",
    suggested: ["当前迭代整体目标", "该需求的用户价值", "依赖关系与阻塞项", "是否有可裁剪的范围"],
  },
  qa: {
    score: 78, risk: '低', missingCount: 3,
    recommended: "你好，想了解一下 XX 功能的测试进展。\n\n当前开发已完成主流程，想确认测试用例是否已覆盖 XX 等边界场景。如果需要提供更多技术文档或接口说明，我可以配合准备，确保测试质量。",
    perspective: ["被认为测试不够认真", "工作成果被质疑", "需要更多上下文支持", "希望协作而非追责"],
    riskNote: "测试角色对质量问题较为敏感，建议以协作而非追责的方式沟通",
    optimizationNotes: "肯定测试工作价值；提供具体场景描述；明确协作支持意愿；聚焦质量目标而非进度催促。",
    suggested: ["功能边界与验收标准", "已知风险点", "测试环境与数据准备", "上线前必过用例清单"],
  },
  client: {
    score: 55, risk: '高', missingCount: 4,
    recommended: "尊敬的 XX，\n\n感谢您的关注。关于 XX 需求，目前开发工作正在按计划推进，预计 XX 时间完成并提交验收。\n\n如您在此期间有任何补充需求或调整，欢迎随时联系我，我们会第一时间评估并反馈。",
    perspective: ["服务方在拖延", "信息不透明", "需求不被重视", "担心项目交付质量"],
    riskNote: "面向客户的沟通需要高度专业，避免任何可能引发信任危机的措辞",
    optimizationNotes: "使用正式礼貌用语；给出明确时间承诺；主动提供状态更新；表达持续服务意愿。",
    suggested: ["当前完成进度百分比", "下一个里程碑时间", "是否需要客户提供信息", "联系人与升级渠道"],
  },
  boss: {
    score: 68, risk: '中', missingCount: 3,
    recommended: "您好，关于 XX 需求，目前进度为 XX%，计划于 XX 完成。\n\n当前主要挑战是 XX，团队已制定应对方案 XX。如需协调 XX 资源或需要您的决策支持，请告知，我们会及时同步进展。",
    perspective: ["团队执行力存疑", "项目管理有漏洞", "需要介入协调", "下属是否能独立解决"],
    riskNote: "向上沟通时措辞需要简洁、有数据支撑，避免引起不必要关注和担忧",
    optimizationNotes: "先给结论再给背景；用数据而非感受描述问题；明确是否需要决策支持；保持简洁自信。",
    suggested: ["当前进度与原计划对比", "阻塞原因与解决方案", "是否需要领导决策支持", "预计完成时间"],
  },
}
