"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Clock, Shield, AlertCircle } from "lucide-react"
import { useLockdown } from "@/contexts/LockdownContext"
import { toast } from "sonner"

export default function LockdownPage() {
  const { isLocked, setLockdown, scheduledTime, setScheduledLockdown } = useLockdown()
  
  const handleImmediateLockdown = () => {
    setLockdown(true)
    toast.success("System has been locked down")
  }

  const handleScheduleLockdown = () => {
    if (scheduledTime) {
      toast.success(`Lockdown scheduled for ${formatTime(scheduledTime)}`)
    }
  }

  const handleUnlock = () => {
    setLockdown(false)
    toast.success("System has been unlocked")
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":")
    const time = new Date()
    time.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">System Lockdown</h1>
          </div>
          <p className="text-slate-600">Control student access to the system</p>
        </div>

        {/* Status Card */}
        <Card className="text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2">
              {isLocked ? <Lock className="h-6 w-6 text-red-500" /> : <Unlock className="h-6 w-6 text-green-500" />}
              <CardTitle>System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={isLocked ? "destructive" : "default"} className="text-lg px-4 py-2">
              {isLocked ? "LOCKED DOWN" : "ACTIVE"}
            </Badge>
            <p className="text-sm text-slate-500 mt-3">
              {isLocked ? "Students cannot access rock-minerals and field-works sections" : "Students can access the system normally"}
            </p>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* Immediate Lockdown */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="font-medium">Immediate Lockdown</h3>
                </div>
                <p className="text-sm text-slate-600">Lock down the system right now</p>
                <Button
                  onClick={handleImmediateLockdown}
                  disabled={isLocked}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Down Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Lockdown */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Schedule Lockdown</h3>
                </div>
                <p className="text-sm text-slate-600">Set a specific time for lockdown</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="schedule-time" className="text-sm">
                      Lockdown Time
                    </Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduledTime || ""}
                      onChange={(e) => setScheduledLockdown(e.target.value || null)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleScheduleLockdown}
                    disabled={!scheduledTime || isLocked}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Lockdown
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unlock */}
          {isLocked && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Unlock System</h3>
                  </div>
                  <p className="text-sm text-green-700">Restore normal access for students</p>
                  <Button
                    onClick={handleUnlock}
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info */}
        <div className="text-center text-xs text-slate-500 bg-blue-50 p-3 rounded-md">
          <p>Admin access is never restricted</p>
          <p className="mt-1">When locked, students cannot access the rocks-minerals and field-works sections</p>
        </div>
      </div>
    </div>
  )
}
