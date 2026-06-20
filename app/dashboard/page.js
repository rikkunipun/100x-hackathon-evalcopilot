'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [features, setFeatures] = useState([])
  const [builderName, setBuilderName] = useState('')
  const [featureName, setFeatureName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      loadFeatures()
    })
  }, [])

  async function loadFeatures() {
    const { data } = await supabase.from('features').select('*').order('created_at', { ascending: false })
    setFeatures(data || [])
  }

  async function createFeature(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('features').insert({
      owner_user_id: user.id,
      builder_name: builderName,
      feature_name: featureName
    }).select().single()
    if (!error) {
      router.push(`/feature/${data.id}`)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Eval Co-pilot</h1>
          <div className="text-sm text-gray-500">
            {user.email} <button onClick={logout} className="underline ml-3">Logout</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">New feature to evaluate</h2>
          <form onSubmit={createFeature} className="flex gap-3">
            <input placeholder="Builder name (e.g. Varun)" value={builderName}
              onChange={e => setBuilderName(e.target.value)}
              className="flex-1 border rounded px-3 py-2" required />
            <input placeholder="Feature name (e.g. RAG workflow eval)" value={featureName}
              onChange={e => setFeatureName(e.target.value)}
              className="flex-1 border rounded px-3 py-2" required />
            <button className="bg-black text-white rounded px-4 py-2">Create</button>
          </form>
        </div>

        <div className="space-y-3">
          {features.map(f => (
            <div key={f.id} onClick={() => router.push(`/feature/${f.id}`)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md">
              <div className="font-semibold">{f.feature_name}</div>
              <div className="text-sm text-gray-500">Builder: {f.builder_name}</div>
            </div>
          ))}
          {features.length === 0 && <p className="text-gray-400">No features yet. Add one above.</p>}
        </div>
      </div>
    </div>
  )
}
