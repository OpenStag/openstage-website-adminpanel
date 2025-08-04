'use client'

import { useState, useEffect } from 'react'
import { supabase, Design, DesignWithUser } from '../lib/supabase'

type StatusType = 'pending' | 'accepted' | 'in_development' | 'completed'
type AllStatusType = StatusType | 'rejected'

export default function DesignsAdmin() {
  const [designs, setDesigns] = useState<DesignWithUser[]>([])
  const [activeTab, setActiveTab] = useState<StatusType>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Test Supabase connection first
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        const { data, error } = await supabase.from('designs').select('count').limit(1)
        console.log('Connection test result:', { data, error })
      } catch (err) {
        console.error('Connection test failed:', err)
      }
    }
    
    testConnection()
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching designs from Supabase...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase client initialized:', !!supabase)
      
      const { data, error } = await supabase
        .from('designs')
        .select(`
          *,
          user_profile:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            username
          ),
          reviewer_profile:profiles!reviewed_by (
            id,
            email,
            first_name,
            last_name,
            username
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error details:', error)
        throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`)
      }

      setDesigns(data || [])
      console.log('Successfully loaded designs:', data?.length || 0)
    } catch (err) {
      console.error('Error fetching designs:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Unknown error: ${JSON.stringify(err)}`
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateDesignStatus = async (designId: string, newStatus: StatusType | 'rejected') => {
    try {
      console.log('Updating design status:', { designId, newStatus })
      
      // Check current user session
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      const { data, error } = await supabase
        .from('designs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId)
        .select() // This will return the updated row

      console.log('Update response:', { data, error })

      if (error) {
        console.error('Supabase update error:', error)
        
        // Check for specific RLS errors
        if (error.code === 'PGRST116' || error.message.includes('RLS') || error.message.includes('permission')) {
          throw new Error(`Permission denied: This operation requires admin authentication or RLS policies need to be updated. Error: ${error.message}`)
        }
        
        throw new Error(`Update failed: ${error.message} (Code: ${error.code || 'unknown'})`)
      }

      if (!data || data.length === 0) {
        throw new Error('No rows were updated. The design might not exist or you might not have permission to update it.')
      }

      console.log('Successfully updated design:', data[0])
      
      // Refresh the designs list
      await fetchDesigns()
    } catch (err) {
      console.error('Error updating design status:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : `Unknown error: ${JSON.stringify(err)}`
      setError(errorMessage)
    }
  }

  const filteredDesigns = designs.filter(design => design.status === activeTab)

  const getStatusColor = (status: AllStatusType) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_development': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTabStyle = (status: StatusType) => {
    const isActive = activeTab === status
    const baseClass = "px-4 py-2 font-medium text-sm rounded-lg transition-colors"
    return isActive 
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserName = (design: DesignWithUser) => {
    const profile = design.user_profile
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    }
    return profile?.username || profile?.email || 'Unknown User'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading designs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Design Management</h1>
          <p className="text-gray-600">Manage and track design submissions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchDesigns}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {(['pending', 'accepted', 'in_development', 'completed'] as const).map((status) => {
              const count = designs.filter(d => d.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={getTabStyle(status)}
                >
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Designs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDesigns.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No designs found</h3>
              <p className="text-gray-500">No designs with {activeTab.replace('_', ' ')} status at the moment.</p>
            </div>
          ) : (
            filteredDesigns.map((design) => (
              <div key={design.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{design.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(design.status)}`}>
                      {design.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Type:</span> {design.type.replace('_', ' ')}</p>
                    <p><span className="font-medium">Pages:</span> {design.pages_count}</p>
                    <p><span className="font-medium">User:</span> {getUserName(design)}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(design.created_at)}</p>
                    {design.description && (
                      <p className="mt-2">
                        <span className="font-medium">Description:</span>
                        <span className="block mt-1 text-gray-800">{design.description}</span>
                      </p>
                    )}
                  </div>

                  {design.figma_link && (
                    <div className="mb-4">
                      <a
                        href={design.figma_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        View Figma Design
                      </a>
                    </div>
                  )}

                  {/* Status Change Actions */}
                  <div className="flex flex-wrap gap-2">
                    {design.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'accepted')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'rejected')}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {design.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'in_development')}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                        >
                          Start Development
                        </button>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'pending')}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                        >
                          Back to Pending
                        </button>
                      </>
                    )}
                    {design.status === 'in_development' && (
                      <>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => updateDesignStatus(design.id, 'accepted')}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                        >
                          Back to Accepted
                        </button>
                      </>
                    )}
                    {design.status === 'completed' && (
                      <button
                        onClick={() => updateDesignStatus(design.id, 'in_development')}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
