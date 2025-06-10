'use client'

import { RealtimeDemo } from '../../../components/RealtimeDemo'

export default function RealtimeTestPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-time Test</h1>
          <p className="text-muted-foreground">
            Test and monitor Supabase real-time subscriptions
          </p>
        </div>
      </div>

      <RealtimeDemo />
    </div>
  )
} 