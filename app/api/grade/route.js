export async function POST(req) {
  const { query, expected, actual, rubric } = await req.json()

  const prompt = `You are a strict grader. Compare the ACTUAL OUTPUT against the EXPECTED OUTPUT using the RUBRIC below. Be strict, not generous — your job is to catch real failures, not to be agreeable.

QUERY: ${query}

EXPECTED OUTPUT (golden answer): ${expected}

RUBRIC (what makes an output good): ${rubric}

ACTUAL OUTPUT: ${actual}

Decide PASS or FAIL. PASS only if the actual output genuinely satisfies the rubric against the expected output — same key points covered, no hallucination, no missing critical info. If it's vague, generic, missing something the expected output specifically calls for, or invents something not grounded in the expected output, it's a FAIL.

Respond ONLY with valid JSON, no markdown, no preamble:
{"pass_fail": true or false, "judge_notes": "one or two sentence specific reason"}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    const text = data.content.find(b => b.type === 'text')?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Response.json(parsed)
  } catch (err) {
    return Response.json({ pass_fail: false, judge_notes: 'Judge error: ' + err.message })
  }
}
