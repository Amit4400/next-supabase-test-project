'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']
type SensitiveData = Database['public']['Tables']['sensitive_data']['Row']
type OrganizationMember = Database['public']['Tables']['organization_members']['Row']

export default function RLSDemoPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [sensitiveData, setSensitiveData] = useState<SensitiveData[]>([])
  const [memberships, setMemberships] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Load organizations (should work for all users)
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgError) throw orgError
      setOrganizations(orgs || [])

      // Load sensitive data (RLS should filter by organization membership)
      const { data: sensitive, error: sensitiveError } = await supabase
        .from('sensitive_data')
        .select(`
          *,
          organizations!inner(name),
          users!inner(email)
        `)
        .order('created_at', { ascending: false })

      if (sensitiveError) throw sensitiveError
      setSensitiveData(sensitive || [])

      // Load organization memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .order('created_at', { ascending: false })

      if (membershipError) throw membershipError
      setMemberships(membershipData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createTestData = async () => {
    if (!user) return

    try {
      // Create a test organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `Test Org ${Date.now()}`,
          slug: `test-org-${Date.now()}`,
          owner_id: user.id
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as member
      await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        })

      // Create sensitive data
      await supabase
        .from('sensitive_data')
        .insert({
          organization_id: org.id,
          data: `Sensitive data for ${org.name}`,
          created_by: user.id
        })

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test data')
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view RLS demo</h1>
          <p className="text-gray-600">This demo shows how Row Level Security works in Supabase</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Row Level Security Demo</h1>
          <p className="text-gray-600">
            This page demonstrates Supabase RLS policies. You can only see data from organizations you're a member of.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={createTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Test Data
          </button>
          <button
            onClick={loadData}
            className="ml-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organizations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizations</h2>
            <p className="text-sm text-gray-600 mb-4">
              Organizations you own or are a member of
            </p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {organizations.length === 0 ? (
                  <p className="text-gray-500">No organizations found</p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="border rounded-md p-3">
                      <h3 className="font-medium text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">Slug: {org.slug}</p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(org.created_at).toLocaleDateString()}
                      </p>
                      {org.owner_id === user?.id && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                          Owner
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Organization Memberships */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Memberships</h2>
            <p className="text-sm text-gray-600 mb-4">
              Organizations you're a member of
            </p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {memberships.length === 0 ? (
                  <p className="text-gray-500">No memberships found</p>
                ) : (
                  memberships.map((membership) => (
                    <div key={membership.id} className="border rounded-md p-3">
                      <h3 className="font-medium text-gray-900 capitalize">{membership.role}</h3>
                      <p className="text-sm text-gray-500">Organization ID: {membership.organization_id}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(membership.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sensitive Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sensitive Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              Only shows data from organizations you're a member of (RLS enforced)
            </p>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-3">
                {sensitiveData.length === 0 ? (
                  <p className="text-gray-500">No sensitive data accessible</p>
                ) : (
                  sensitiveData.map((data) => (
                    <div key={data.id} className="border rounded-md p-3 bg-yellow-50">
                      <h3 className="font-medium text-gray-900">{data.data}</h3>
                      <p className="text-sm text-gray-500">
                        Organization: {(data as any).organizations?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created by: {(data as any).users?.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(data.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How RLS Works</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• <strong>Organizations:</strong> You can see organizations you own or are a member of</li>
            <li>• <strong>Sensitive Data:</strong> You can only see data from organizations you're a member of</li>
            <li>• <strong>Policies:</strong> The RLS policies in schema.sql enforce these rules</li>
            <li>• <strong>Security:</strong> Even if you try to query data directly, RLS will filter results</li>
            <li>• <strong>No Recursion:</strong> Policies are designed to avoid circular dependencies</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
