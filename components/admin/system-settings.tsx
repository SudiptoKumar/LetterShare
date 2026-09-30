"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, Save, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  registrationEnabled: boolean
  maxLettersPerDay: number
  maxCommentsPerDay: number
  requireEmailVerification: boolean
  moderationEnabled: boolean
  autoModeration: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  welcomeMessage: string
  communityGuidelines: string
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    registrationEnabled: true,
    maxLettersPerDay: 10,
    maxCommentsPerDay: 50,
    requireEmailVerification: true,
    moderationEnabled: true,
    autoModeration: true,
    maintenanceMode: false,
    maintenanceMessage: "Letter Share is currently undergoing maintenance. Please check back later.",
    welcomeMessage: "Welcome to Letter Share! We're excited to have you join our community.",
    communityGuidelines: "Be respectful to others. No hate speech or harassment. Keep content appropriate.",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    type: "info",
  })
  const { toast } = useToast()

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)

        const settingsRef = doc(db, "system", "settings")
        const settingsSnap = await getDoc(settingsRef)

        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SystemSettings)
        } else {
          // Create default settings if they don't exist
          await setDoc(settingsRef, settings)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true)

      const settingsRef = doc(db, "system", "settings")
      await updateDoc(settingsRef, settings)

      // Add activity log
      await addDoc(collection(db, "activity"), {
        type: "settings_updated",
        adminId: "admin", // Should be the current admin's ID
        timestamp: serverTimestamp(),
        details: "System settings were updated",
      })

      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully.",
        variant: "default",
      })

      setSaving(false)
    } catch (error) {
      console.error("Error saving settings:", error)

      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })

      setSaving(false)
    }
  }

  // Send announcement
  const sendAnnouncement = async () => {
    try {
      if (!announcement.title || !announcement.message) {
        toast({
          title: "Error",
          description: "Please provide both a title and message for the announcement.",
          variant: "destructive",
        })
        return
      }

      await addDoc(collection(db, "announcements"), {
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        createdAt: serverTimestamp(),
        active: true,
      })

      // Add activity log
      await addDoc(collection(db, "activity"), {
        type: "announcement_sent",
        adminId: "admin", // Should be the current admin's ID
        timestamp: serverTimestamp(),
        details: `Announcement sent: ${announcement.title}`,
      })

      toast({
        title: "Announcement sent",
        description: "Your announcement has been sent to all users.",
        variant: "default",
      })

      setShowAnnouncementDialog(false)
      setAnnouncement({
        title: "",
        message: "",
        type: "info",
      })
    } catch (error) {
      console.error("Error sending announcement:", error)

      toast({
        title: "Error",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure platform-wide settings and controls</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="announcements">Announcements</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Require users to verify their email before posting
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Put the site in maintenance mode (only admins can access)
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                    />
                  </div>

                  {settings.maintenanceMode && (
                    <div className="space-y-2">
                      <Label htmlFor="maintenance-message">Maintenance Message</Label>
                      <Textarea
                        id="maintenance-message"
                        value={settings.maintenanceMessage}
                        onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                        placeholder="Message to display during maintenance"
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="max-letters">Maximum Letters Per Day</Label>
                    <Input
                      id="max-letters"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxLettersPerDay}
                      onChange={(e) => setSettings({ ...settings, maxLettersPerDay: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limit the number of letters a user can post per day (1-100)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-comments">Maximum Comments Per Day</Label>
                    <Input
                      id="max-comments"
                      type="number"
                      min="1"
                      max="500"
                      value={settings.maxCommentsPerDay}
                      onChange={(e) => setSettings({ ...settings, maxCommentsPerDay: Number.parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limit the number of comments a user can post per day (1-500)
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="moderation" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Content Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable content moderation for letters and comments
                      </p>
                    </div>
                    <Switch
                      checked={settings.moderationEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, moderationEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automated Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to automatically flag potentially inappropriate content
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoModeration}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoModeration: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="community-guidelines">Community Guidelines</Label>
                    <Textarea
                      id="community-guidelines"
                      value={settings.communityGuidelines}
                      onChange={(e) => setSettings({ ...settings, communityGuidelines: e.target.value })}
                      placeholder="Community guidelines for users"
                      className="min-h-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      These guidelines will be displayed to users when they register and in the help section
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      value={settings.welcomeMessage}
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                      placeholder="Message to display to new users"
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be displayed to new users after they register
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="announcements" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Send announcements to all users on the platform</p>

                  <Button onClick={() => setShowAnnouncementDialog(true)} className="w-full md:w-auto">
                    <Bell className="mr-2 h-4 w-4" />
                    Create New Announcement
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={saveSettings} disabled={loading || saving} className="w-full md:w-auto">
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>This announcement will be sent to all users on the platform</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="Announcement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                placeholder="Announcement message"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-type">Type</Label>
              <select
                id="announcement-type"
                value={announcement.type}
                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendAnnouncement}>
              <Send className="mr-2 h-4 w-4" />
              Send Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
