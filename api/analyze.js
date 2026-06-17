export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, audience, myRole, hasAttachments } = req.body
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ZHIPU_API_KEY not configured' })

  const audienceMap = {
    dev: '研发工程师', design: 'UI设计师', pm: '产品经理',
    qa: '测试工程师', client: '客户', boss: '直属领导',
  }
  const myRoleMap = {
    pm: '产品经理', dev: '研发工程师', design: 'UI设计师',
    qa: '测试工程师', manager: '项目经理', sales: '销售', other: '职场人士',
  }
  const targetRole = audienceMap[audience] ?? audience
  const senderRole = myRoleMap[myRole] ?? '职场人士'

  const prompt = `你是一个专业的职场沟通分析助手。
发送方身份：【${senderRole}】
接收方身份：【${targetRole}】
发送方准备发送的原始消息：
"${message}"
${hasAttachments ? '（发送方附带了截图/PRD文档作为上下文）' : ''}

请站在${senderRole}的立场，针对${targetRole}这个受众，对原始消息进行分析和优化。
推荐发送版本需要真正重写，不能只是微调原话，要根据${senderRole}与${targetRole}的沟通场景，
使用更专业、更有建设性的表达，补充必要背景信息，降低沟通风险。

按以下JSON格式返回（只返回JSON，不要有任何其他文字）：
{
  "score": <沟通质量评分0-100整数>,
  "risk": <"低"或"中"或"高">,
  "missingCount": <缺失上下文数量整数>,
  "recommended": <真正重写的推荐发送版本，不能只是微调原话>,
  "perspective": [<${targetRole}可能的理解方式3-5条>],
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
