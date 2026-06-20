'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      router.push(data.user ? '/dashboard' : '/login')
    })
  }, [])
  return <div className="p-8">Loading...</div>
}
