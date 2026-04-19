'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AlertCircle, Copy, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    applicationStatus: true,
    newMatches: true,
    weeklyDigest: false,
  })

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('sk_live_1234567890abcdef')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your preferences and account settings</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Theme Settings */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-lg font-bold mb-4">Appearance</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Theme</Label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'Auto' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        theme === option.value
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-lg font-bold mb-4">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications' },
                { key: 'applicationStatus', label: 'Application Status Updates' },
                { key: 'newMatches', label: 'New Job Matches' },
                { key: 'weeklyDigest', label: 'Weekly Digest' },
              ].map((option) => (
                <div key={option.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30">
                  <Label className="text-foreground cursor-pointer">{option.label}</Label>
                  <input
                    type="checkbox"
                    checked={notifications[option.key as keyof typeof notifications]}
                    onChange={(e) => handleNotificationChange(option.key, e.target.checked)}
                    className="w-5 h-5 rounded border-border cursor-pointer accent-primary"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* API Keys */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-lg font-bold mb-4">API Keys</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use API keys for integrations with third-party tools
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Production API Key</p>
                  <p className="font-mono text-sm">
                    {showApiKey ? 'sk_live_1234567890abcdef' : '••••••••••••••••'}
                  </p>
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Copy size={18} />
                </button>
              </div>
              <Button variant="outline" className="button-outline-neon w-full">
                Regenerate Key
              </Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="card-dark glass-effect p-6 border-destructive/30 bg-destructive/5">
            <h2 className="font-display text-lg font-bold mb-4 text-destructive">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle size={20} className="text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-destructive/80 mt-1">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </div>
          </Card>

          {/* Logout */}
          <div className="flex gap-3">
            <Button
              onClick={handleLogout}
              className="flex-1 button-neon"
            >
              Log Out
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 button-outline-neon"
            >
              Log Out All Devices
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
