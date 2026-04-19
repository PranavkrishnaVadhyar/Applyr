'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Plus, X } from 'lucide-react'

const initialProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  headline: 'Full Stack Engineer | React & Node.js',
  bio: 'Passionate about building scalable web applications',
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile)
  const [newSkill, setNewSkill] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your public profile information</p>
          </div>
          <Button className="button-neon gap-2" onClick={handleSave} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card className="card-dark glass-effect p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="font-bold text-foreground">{profile.firstName} {profile.lastName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>
            <Button variant="outline" className="button-outline-neon w-full mt-4">
              Change Photo
            </Button>
          </Card>

          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <Card className="card-dark glass-effect p-6">
              <h2 className="font-display text-lg font-bold mb-4">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">First Name</Label>
                  <Input
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Last Name</Label>
                  <Input
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">Location</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="input-dark"
                  />
                </div>
              </div>
            </Card>

            {/* Professional Info */}
            <Card className="card-dark glass-effect p-6">
              <h2 className="font-display text-lg font-bold mb-4">Professional Information</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Headline</Label>
                  <Input
                    value={profile.headline}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    className="input-dark"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Bio</Label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="input-dark w-full h-24 p-4 rounded-lg resize-none"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
            </Card>

            {/* Skills */}
            <Card className="card-dark glass-effect p-6">
              <h2 className="font-display text-lg font-bold mb-4">Skills</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add a skill..."
                    className="input-dark"
                  />
                  <Button className="button-neon gap-2" onClick={handleAddSkill}>
                    <Plus size={18} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 border border-primary/50"
                    >
                      <span className="text-sm text-foreground">{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={16} />
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
