"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Zap,
  Plus,
  Play,
  Pause,
  Settings,
  Calendar,
  Clock,
  Mail,
  Webhook,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Bot,
  AlertTriangle,
  CheckCircle,
  Globe,
  FileText,
} from "lucide-react"

interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  status: "active" | "paused" | "error"
  lastRun: string
  nextRun: string
  runsCount: number
  website: string
}

export function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "1",
      name: "Weekly SEO Analysis",
      description: "Automatically analyze website SEO every Monday",
      trigger: "Schedule: Weekly",
      action: "Run SEO Analysis",
      status: "active",
      lastRun: "2024-01-15 09:00",
      nextRun: "2024-01-22 09:00",
      runsCount: 12,
      website: "example.com",
    },
    {
      id: "2",
      name: "Performance Alert",
      description: "Send email when page load time exceeds 3 seconds",
      trigger: "Performance Threshold",
      action: "Send Email Alert",
      status: "active",
      lastRun: "2024-01-14 14:30",
      nextRun: "Continuous",
      runsCount: 3,
      website: "mystore.com",
    },
    {
      id: "3",
      name: "Monthly Report Generation",
      description: "Generate and email monthly performance report",
      trigger: "Schedule: Monthly",
      action: "Generate Report",
      status: "paused",
      lastRun: "2024-01-01 08:00",
      nextRun: "Paused",
      runsCount: 6,
      website: "techblog.io",
    },
    {
      id: "4",
      name: "Broken Link Checker",
      description: "Check for broken links and create report",
      trigger: "Schedule: Daily",
      action: "Link Analysis",
      status: "error",
      lastRun: "2024-01-15 12:00",
      nextRun: "Error - Check Config",
      runsCount: 45,
      website: "portfolio.dev",
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((automation) =>
        automation.id === id
          ? {
              ...automation,
              status: automation.status === "active" ? "paused" : "active",
            }
          : automation,
      ),
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-neon-green/10 text-neon-green border-neon-green/20"
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "error":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const activeAutomations = automations.filter((a) => a.status === "active").length
  const totalRuns = automations.reduce((sum, a) => sum + a.runsCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Automations</h1>
          <p className="text-slate-400">Set up automated workflows for your website analysis and monitoring</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription className="text-slate-400">
                Set up a new automated workflow for your website analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="automation-name">Automation Name</Label>
                <Input
                  id="automation-name"
                  placeholder="e.g., Weekly SEO Check"
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="automation-description">Description</Label>
                <Textarea
                  id="automation-description"
                  placeholder="Describe what this automation does..."
                  className="bg-slate-800 border-slate-600 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="schedule" className="text-slate-200">
                        Schedule
                      </SelectItem>
                      <SelectItem value="threshold" className="text-slate-200">
                        Performance Threshold
                      </SelectItem>
                      <SelectItem value="webhook" className="text-slate-200">
                        Webhook
                      </SelectItem>
                      <SelectItem value="manual" className="text-slate-200">
                        Manual Trigger
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="seo-analysis" className="text-slate-200">
                        SEO Analysis
                      </SelectItem>
                      <SelectItem value="performance-check" className="text-slate-200">
                        Performance Check
                      </SelectItem>
                      <SelectItem value="send-email" className="text-slate-200">
                        Send Email
                      </SelectItem>
                      <SelectItem value="generate-report" className="text-slate-200">
                        Generate Report
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Select>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Select website" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="example.com" className="text-slate-200">
                      example.com
                    </SelectItem>
                    <SelectItem value="mystore.com" className="text-slate-200">
                      mystore.com
                    </SelectItem>
                    <SelectItem value="techblog.io" className="text-slate-200">
                      techblog.io
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-electric-blue hover:bg-cyan-500 text-slate-900"
                >
                  Create Automation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Automations</p>
                <p className="text-2xl font-bold text-slate-100">{automations.length}</p>
              </div>
              <Bot className="h-8 w-8 text-electric-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active</p>
                <p className="text-2xl font-bold text-neon-green">{activeAutomations}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-neon-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Runs</p>
                <p className="text-2xl font-bold text-electric-blue">{totalRuns}</p>
              </div>
              <Zap className="h-8 w-8 text-electric-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-yellow-400">94%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((automation) => (
          <Card
            key={automation.id}
            className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Bot className="h-6 w-6 text-electric-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 mb-1">{automation.name}</h3>
                    <p className="text-sm text-slate-400 mb-2">{automation.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {automation.website}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {automation.trigger}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {automation.runsCount} runs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Last Run</p>
                    <p className="text-sm text-slate-300">{automation.lastRun}</p>
                    <p className="text-xs text-slate-500">Next: {automation.nextRun}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(automation.status)}>
                      {getStatusIcon(automation.status)}
                      <span className="ml-1">{automation.status}</span>
                    </Badge>

                    <Switch
                      checked={automation.status === "active"}
                      onCheckedChange={() => toggleAutomation(automation.id)}
                      className="data-[state=checked]:bg-neon-green"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                          <Play className="mr-2 h-4 w-4" />
                          Run Now
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:bg-slate-700">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-700 hover:border-electric-blue/50 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-electric-blue mx-auto mb-3" />
            <h3 className="font-semibold text-slate-100 mb-2">Scheduled Analysis</h3>
            <p className="text-sm text-slate-400 mb-4">Set up regular website analysis on a schedule</p>
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
              Create Schedule
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700 hover:border-electric-blue/50 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-100 mb-2">Performance Alerts</h3>
            <p className="text-sm text-slate-400 mb-4">Get notified when performance drops below thresholds</p>
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
              Setup Alerts
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700 hover:border-electric-blue/50 transition-colors cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-neon-green mx-auto mb-3" />
            <h3 className="font-semibold text-slate-100 mb-2">Auto Reports</h3>
            <p className="text-sm text-slate-400 mb-4">Automatically generate and send reports to stakeholders</p>
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent">
              Setup Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Templates */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Popular Automation Templates</CardTitle>
          <CardDescription className="text-slate-400">
            Get started quickly with these pre-built automation templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-electric-blue" />
                <h4 className="font-medium text-slate-200">Weekly SEO Digest</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Automatically analyze your website's SEO every week and email a summary report
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
              >
                Use Template
              </Button>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Webhook className="h-5 w-5 text-neon-green" />
                <h4 className="font-medium text-slate-200">Slack Notifications</h4>
              </div>
              <p className="text-sm text-slate-400 mb-3">
                Send critical issues and performance alerts directly to your Slack channel
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800 bg-transparent"
              >
                Use Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
