'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Plus, X, Loader2 } from 'lucide-react'
import { usersApi, UserProfile } from '@/lib/users-api'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getMe()
        setProfile(data)
      } catch (err: any) {
        console.error("Failed to fetch profile:", err)
        setError(err.message || 'Failed to load profile details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfile((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        location: profile.location,
        headline: profile.headline,
        bio: profile.bio,
        skills: profile.skills || [],
      }
      const response = await usersApi.updateMe(updateData)
      // Update with exact response from server if needed
      setProfile((prev) => ({ ...prev, ...response.data }))
      // Optional: Add success toast here
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err.message || 'Failed to update user profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your public profile information</p>
          </div>
          <Button className="bg-primary text-primary-foreground font-medium hover:brightness-95 gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card className="bg-card border border-border rounded-xl shadow-soft p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="font-semibold text-foreground">
              {profile.first_name} {profile.last_name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{profile.headline || 'Add a professional headline'}</p>
            <Button variant="outline" className="w-full mt-4">
              Change Photo
            </Button>
          </Card>

          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">First Name</Label>
                  <Input
                    value={profile.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Last Name</Label>
                  <Input
                    value={profile.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email (Cannot be changed)</Label>
                  <Input
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Phone</Label>
                  <Input
                    value={profile.phone_number || ''}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">Location</Label>
                  <Input
                    value={profile.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Professional Info */}
            <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Professional Information</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Headline</Label>
                  <Input
                    value={profile.headline || ''}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bio</Label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full h-24 p-4 rounded-lg resize-none border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
            </Card>

            {/* Skills */}
            <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Skills</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add a skill..."
                  />
                  <Button className="bg-primary text-primary-foreground font-medium hover:brightness-95 gap-2" onClick={handleAddSkill}>
                    <Plus size={18} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(profile.skills || []).map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border"
                    >
                      <span className="text-sm text-foreground">{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
