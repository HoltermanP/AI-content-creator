'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Channel } from '@/lib/constants'

interface Company {
  id: string
  name: string
}

interface Schedule {
  id: string
  channel: Channel
  enabled: boolean
  postsPerWeek: number
  preferredDays?: string | null
  preferredHours?: string | null
  timezone: string
  randomization: boolean
}

const channelLabels: Record<Channel, string> = {
  LINKEDIN: 'LinkedIn',
  INSTAGRAM: 'Instagram',
  X_TWITTER: 'X (Twitter)',
  FACEBOOK: 'Facebook',
  TIKTOK: 'TikTok',
}

const dayLabels = [
  'Zondag',
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
]

export function SchedulerSettings() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompanyId) {
      loadSchedules(selectedCompanyId)
    } else {
      setSchedules([])
    }
  }, [selectedCompanyId])

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const loadSchedules = async (companyId: string) => {
    try {
      const company = await fetch(`/api/companies/${companyId}`)
      const companyData = await company.json()
      setSchedules(companyData.schedules || [])
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  const getOrCreateSchedule = async (channel: Channel): Promise<Schedule> => {
    const existing = schedules.find((s) => s.channel === channel)
    if (existing) return existing

    // Maak nieuwe schedule aan
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          channel,
          enabled: false,
          postsPerWeek: 3,
          randomization: true,
        }),
      })

      if (!response.ok) throw new Error('Fout bij aanmaken schedule')

      const newSchedule = await response.json()
      setSchedules((prev) => [...prev, newSchedule])
      return newSchedule
    } catch (error) {
      console.error('Error creating schedule:', error)
      throw error
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<Schedule>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Fout bij bijwerken')

      const updated = await response.json()
      setSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? updated : s))
      )
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('Fout bij bijwerken schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (channel: Channel, enabled: boolean) => {
    const schedule = await getOrCreateSchedule(channel)
    await updateSchedule(schedule.id, { enabled })
  }

  const handlePostsPerWeekChange = async (
    channel: Channel,
    postsPerWeek: number
  ) => {
    const schedule = await getOrCreateSchedule(channel)
    await updateSchedule(schedule.id, { postsPerWeek })
  }

  const handleRandomizationToggle = async (
    channel: Channel,
    randomization: boolean
  ) => {
    const schedule = await getOrCreateSchedule(channel)
    await updateSchedule(schedule.id, { randomization })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publicatie Scheduler</CardTitle>
          <CardDescription>
            Configureer automatische publicatie-instellingen per kanaal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="scheduler-company">Bedrijf</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger id="scheduler-company">
                <SelectValue placeholder="Selecteer bedrijf" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyId ? (
            <div className="space-y-6">
              {(Object.keys(Channel) as Channel[]).map((channel) => {
                const schedule = schedules.find((s) => s.channel === channel)
                const enabled = schedule?.enabled || false
                const postsPerWeek = schedule?.postsPerWeek || 3
                const randomization = schedule?.randomization ?? true

                return (
                  <Card key={channel}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {channelLabels[channel]}
                        </CardTitle>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            handleToggle(channel, checked)
                          }
                          disabled={loading}
                        />
                      </div>
                    </CardHeader>
                    {enabled && (
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor={`posts-${channel}`}>
                            Posts per week
                          </Label>
                          <Input
                            id={`posts-${channel}`}
                            type="number"
                            min="1"
                            max="20"
                            value={postsPerWeek}
                            onChange={(e) =>
                              handlePostsPerWeekChange(
                                channel,
                                parseInt(e.target.value) || 1
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor={`random-${channel}`}>
                            Tijdstippen randomiseren
                          </Label>
                          <Switch
                            id={`random-${channel}`}
                            checked={randomization}
                            onCheckedChange={(checked) =>
                              handleRandomizationToggle(channel, checked)
                            }
                            disabled={loading}
                          />
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {randomization
                            ? `Posts worden automatisch gepland met ${postsPerWeek} posts per week, met gerandomiseerde tijdstippen voor een natuurlijk patroon.`
                            : `Posts worden gepland met ${postsPerWeek} posts per week op vaste tijdstippen.`}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecteer een bedrijf om scheduler instellingen te configureren
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

