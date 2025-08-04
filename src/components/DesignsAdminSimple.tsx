'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DesignsAdminSimple() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [designs, setDesigns] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Debug environment variables
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
    
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing Supabase connection...')
      
      // Test 1: Check if we can connect to Supabase at all
      console.log('Step 1: Testing basic connection...')
      
      // Test 2: Try to access a table with RLS disabled (if any)
      console.log('Step 2: Testing table access...')
      
      const { data, error, count } = await supabase
        .from('designs')
        .select(`
          *,
          user_profile:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            username
          )
        `, { count: 'exact' })
        .limit(5)

      console.log('Query result:', { data, error, count })

      if (error) {
        console.error('Supabase error details:', error)
        
        // Check if it's an RLS issue
        if (error.code === 'PGRST116' || error.message.includes('RLS')) {
          setError(`RLS Policy Issue: ${error.message}. You may need to disable RLS or add proper policies for public access.`)
        } else if (error.code === '42P01') {
          setError(`Table doesn't exist: ${error.message}. Please run the database setup script.`)
        } else {
          setError(`Database error: ${error.message} (Code: ${error.code})`)
        }
        
        setConnectionStatus('Connection failed')
        return
      }

      setConnectionStatus(`✅ Connected successfully! Found ${count} designs total, showing ${data?.length || 0}`)
      setDesigns(data || [])
      
    } catch (err) {
      console.error('Connection test error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      setConnectionStatus('❌ Error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Design Admin Panel - Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-lg">{connectionStatus}</p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800">Error Details:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {designs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Designs</h2>
            <div className="space-y-4">
              {designs.map((design, index) => (
                <div key={design.id || index} className="border rounded p-4">
                  <h3 className="font-semibold">{design.name || 'Unnamed Design'}</h3>
                  <p className="text-gray-600">Status: {design.status}</p>
                  <p className="text-sm text-gray-500">ID: {design.id}</p>
                  <p className="text-sm text-gray-500">Created: {design.created_at}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={testConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Connection Again
          </button>
        </div>
      </div>
    </div>
  )
}
