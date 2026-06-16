export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, audience, hasAttachments } = req.body
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'GEMINI_API_KEY not configured' })

  const audienceMap = {
    dev: '研发工程师', design: 'UI设计师', pm: '产品经理',
    qa: '测试工程师', client: '客户', boss: '直属领导',
  }
  const targetRole = audienceMap[audience] ?? audience

  const prompt = `你是一个专业的职场沟通分析助手。
用户准备发送以下消息给【${targetRole}】：
"${message}"
${hasAttachments ? '（用户附带了截图/PRD文档作为上下文）' : ''}

请按以下JSON格式返回分析结果（不要有任何其他文字，只返回JSON）：
{
  "score": <沟通质量评分，0-100整数>,
  "risk": <"低"|"中"|"高">,
  "missingCount": <缺失上下文数量，整数>,
  "recommended": <优化后的推荐发送版本，字符串>,
  "perspective": [<对方可能的理解方式，3-5条，字符串数组>],
  "riskNote": <风险说明，一句话>,
  "optimizationNotes": <优化建议，一句话>,
  "suggested": [<建议补充的信息，3-5条，字符串数组>]
}`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Invalid AI response' })
    const result = JSON.parse(jsonMatch[0])
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
