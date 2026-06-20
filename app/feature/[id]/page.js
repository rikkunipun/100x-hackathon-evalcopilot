'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function FeaturePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [feature, setFeature] = useState(null)
  const [cases, setCases] = useState([])
  const [rubricText, setRubricText] = useState('')
  const [rubricId, setRubricId] = useState(null)
  const [runs, setRuns] = useState([])
  const [grading, setGrading] = useState(false)

  const [newQuery, setNewQuery] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [outputs, setOutputs] = useState({})

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    const { data: f } = await supabase.from('features').select('*').eq('id', id).single()
    setFeature(f)
    const { data: c } = await supabase.from('golden_cases').select('*').eq('feature_id', id).order('created_at')
    setCases(c || [])
    const { data: r } = await supabase.from('rubric').select('*').eq('feature_id', id).limit(1)
    if (r && r[0]) { setRubricText(r[0].rubric_text); setRubricId(r[0].id) }
    const { data: runData } = await supabase.from('runs').select('*, grades(*)').eq('feature_id', id).order('run_timestamp', { ascending: false })
    setRuns(runData || [])
  }

  async function addCase(e) {
    e.preventDefault()
    await supabase.from('golden_cases').insert({ feature_id: id, query_text: newQuery, expected_output: newExpected })
    setNewQuery(''); setNewExpected('')
    loadAll()
  }

  async function saveRubric() {
    if (rubricId) {
      await supabase.from('rubric').update({ rubric_text: rubricText }).eq('id', rubricId)
    } else {
      const { data } = await supabase.from('rubric').insert({ feature_id: id, rubric_text: rubricText }).select().single()
      setRubricId(data.id)
    }
  }

  async function gradeAll() {
    if (cases.length === 0) return alert('Add golden cases first')
    if (!rubricText) return alert('Add a rubric first')
    setGrading(true)
    try {
      const { data: run } = await supabase.from('runs').insert({ feature_id: id, config_notes: 'Manual run' }).select().single()

      for (const c of cases) {
        const actual = outputs[c.id] || ''
        if (!actual.trim()) continue

        const res = await fetch('/api/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: c.query_text, expected: c.expected_output, actual, rubric: rubricText })
        })
        const { pass_fail, judge_notes } = await res.json()

        await supabase.from('grades').insert({
          case_id: c.id, run_id: run.id, actual_output: actual, pass_fail, judge_notes
        })
      }
      loadAll()
    } finally {
      setGrading(false)
    }
  }

  if (!feature) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-500 underline mb-4">← Back</button>
        <h1 className="text-2xl font-bold mb-1">{feature.feature_name}</h1>
        <p className="text-gray-500 mb-6">Builder: {feature.builder_name}</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-3">Rubric</h2>
          <textarea value={rubricText} onChange={e => setRubricText(e.target.value)}
            placeholder="What makes an output good? (correctness, completeness, no hallucination...)"
            className="w-full border rounded px-3 py-2 h-24 mb-2" />
          <button onClick={saveRubric} className="bg-gray-200 rounded px-3 py-1 text-sm">Save rubric</button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-3">Golden cases ({cases.length})</h2>
          <form onSubmit={addCase} className="mb-4 space-y-2">
            <input placeholder="Query / input" value={newQuery} onChange={e => setNewQuery(e.target.value)}
              className="w-full border rounded px-3 py-2" required />
            <textarea placeholder="Expected good output" value={newExpected} onChange={e => setNewExpected(e.target.value)}
              className="w-full border rounded px-3 py-2 h-20" required />
            <button className="bg-black text-white rounded px-4 py-2 text-sm">Add golden case</button>
          </form>

          <div className="space-y-4">
            {cases.map((c, i) => (
              <div key={c.id} className="border rounded p-3">
                <div className="text-sm font-medium mb-1">#{i + 1} — {c.query_text}</div>
                <div className="text-xs text-gray-500 mb-2">Expected: {c.expected_output}</div>
                <textarea
                  placeholder="Paste the actual output from the AI feature here"
                  value={outputs[c.id] || ''}
                  onChange={e => setOutputs({ ...outputs, [c.id]: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm h-16"
                />
              </div>
            ))}
          </div>

          {cases.length > 0 && (
            <button onClick={gradeAll} disabled={grading}
              className="mt-4 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
              {grading ? 'Grading...' : `Grade all ${cases.length} cases`}
            </button>
          )}
        </div>

        {runs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Runs</h2>
            {runs.map(r => {
              const passed = r.grades?.filter(g => g.pass_fail).length || 0
              const total = r.grades?.length || 0
              return (
                <div key={r.id} className="border-b last:border-0 py-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">{new Date(r.run_timestamp).toLocaleString()}</span>
                    <span className={`font-bold ${passed === total ? 'text-green-600' : 'text-orange-600'}`}>
                      {passed}/{total} passed
                    </span>
                  </div>
                  {r.grades?.map(g => (
                    <div key={g.id} className="text-sm mb-1">
                      <span className={g.pass_fail ? 'text-green-600' : 'text-red-600'}>
                        {g.pass_fail ? '✓ PASS' : '✗ FAIL'}
                      </span>
                      {' — '}{g.judge_notes}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
