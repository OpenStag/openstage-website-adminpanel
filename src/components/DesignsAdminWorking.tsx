'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type StatusType = 'pending' | 'accepted' | 'in_development' | 'completed'

interface SimpleDesign {
  id: string
  name: string
  type: string
  status: StatusType | 'rejected'
  created_at: string
  description?: string
  figma_link?: string
  pages_count: number
}

export default function DesignsAdminWorking() {
  const [designs, setDesigns] = useState<SimpleDesign[]>([])
  const [activeTab, setActiveTab] = useState<StatusType>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching designs from Supabase...')
      
      // Simple query without joins first
      const { data, error } = await supabase
        .from('designs')
        .select('id, name, type, status, created_at, description, figma_link, pages_count')
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      setDesigns(data || [])
      console.log('Successfully loaded designs:', data?.length || 0)
    } catch (err) {
      console.error('Error fetching designs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load designs')
    } finally {
      setLoading(false)
    }
  }

  const updateDesignStatus = async (designId: string, newStatus: StatusType | 'rejected') => {
    try {
      console.log('Updating design:', designId, 'to status:', newStatus)
      
      // First, let's try to update without triggering the history
      const { data, error } = await supabase
        .from('designs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
          // Don't update admin_notes to avoid triggering the history trigger
        })
        .eq('id', designId)
        .select()

      if (error) {
        console.error('Update error:', error)
        throw new Error(`Update failed: ${error.message}`)
      }

      console.log('Update successful:', data)
      
      // Refresh the list
      await fetchDesigns()
    } catch (err) {
      console.error('Error updating design:', err)
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  useEffect(() => {
    fetchDesigns()
  }, [])

  const filteredDesigns = designs.filter(design => design.status === activeTab)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'in_development': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTabStyle = (status: StatusType) => {
    const isActive = activeTab === status
    return isActive 
      ? "px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
      : "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Design Management</h1>
          <p className="text-gray-600">Total designs: {designs.length}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchDesigns}
              className="mt-2 bg-red-100 px-3 py-1 rounded text-red-800 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'accepted', 'in_development', 'completed'] as StatusType[]).map((status) => {
              const count = designs.filter(d => d.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={getTabStyle(status)}
                >
                  {status.replace('_', ' ').toUpperCase()} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Designs List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDesigns.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No {activeTab} designs found.</p>
            </div>
          ) : (
            filteredDesigns.map((design) => (
              <div key={design.id} className="bg-white rounded-lg shadow border p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{design.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(design.status)}`}>
                    {design.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p><strong>Type:</strong> {design.type.replace('_', ' ')}</p>
                  <p><strong>Pages:</strong> {design.pages_count}</p>
                  <p><strong>Created:</strong> {new Date(design.created_at).toLocaleDateString()}</p>
                  {design.description && (
                    <p><strong>Description:</strong> {design.description}</p>
                  )}
                </div>

                {design.figma_link && (
                  <div className="mb-4">
                    <a
                      href={design.figma_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Figma Design →
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {design.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateDesignStatus(design.id, 'accepted')}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateDesignStatus(design.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {design.status === 'accepted' && (
                    <button
                      onClick={() => updateDesignStatus(design.id, 'in_development')}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                    >
                      Start Development
                    </button>
                  )}
                  {design.status === 'in_development' && (
                    <button
                      onClick={() => updateDesignStatus(design.id, 'completed')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
