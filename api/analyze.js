export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, audience, hasAttachments } = req.body
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ZHIPU_API_KEY not configured' })

  const audienceMap = {
    dev: '研发工程师', design: 'UI设计师', pm: '产品经理',
    qa: '测试工程师', client: '客户', boss: '直属领导',
  }
  const targetRole = audienceMap[audience] ?? audience

  const prompt = `你是一个专业的职场沟通分析助手。
用户准备发送以下消息给【${targetRole}】：
"${message}"
${hasAttachments ? '（用户附带了截图/PRD文档作为上下文）' : ''}

请按以下JSON格式返回分析结果（只返回JSON，不要有任何其他文字）：
{
  "score": <沟通质量评分0-100整数>,
  "risk": <"低"或"中"或"高">,
  "missingCount": <缺失上下文数量整数>,
  "recommended": <优化后的推荐发送版本>,
  "perspective": [<对方可能的理解方式3-5条>],
  "riskNote": <风险说明一句话>,
  "optimizationNotes": <优化建议一句话>,
  "suggested": [<建议补充的信息3-5条>]
}`

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(500).json({ error: data.error?.message ?? 'API error' })

    const raw = data.choices?.[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return res.status(500).json({ error: 'Invalid AI response' })

    res.status(200).json(JSON.parse(match[0]))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
