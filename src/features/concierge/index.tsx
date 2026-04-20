import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  Building2,
  Car,
  ClipboardList,
  FileText,
  Loader2,
  MapPin,
  Save,
  UtensilsCrossed,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { api } from '@/lib/api'
import { useConciergeKnowledge, useUpdateConcierge } from './api'

interface Property {
  id: string
  name: string
}

const SECTIONS = [
  {
    key: 'checkInInstructions' as const,
    label: 'Check-in Instructions',
    icon: ClipboardList,
    placeholder:
      'e.g. Key lockbox is on the front gate, code is 1234. Self check-in available 24/7...',
  },
  {
    key: 'houseRules' as const,
    label: 'House Rules',
    icon: FileText,
    placeholder:
      'e.g. No smoking inside. No parties. Quiet hours after 10pm. Max 4 guests...',
  },
  {
    key: 'localRestaurants' as const,
    label: 'Local Restaurants',
    icon: UtensilsCrossed,
    placeholder:
      'e.g. The Bistro (5 min walk) – great for breakfast. Pizza Palace (2 blocks) – delivery available...',
  },
  {
    key: 'localActivities' as const,
    label: 'Local Activities',
    icon: MapPin,
    placeholder:
      'e.g. City Museum (10 min drive). Sunset Beach (15 min). Farmers Market every Sunday 9am...',
  },
  {
    key: 'transportation' as const,
    label: 'Transportation',
    icon: Car,
    placeholder:
      'e.g. Bus stop on Main St (Line 12 to downtown). Uber/Lyft available. Free street parking...',
  },
  {
    key: 'customNotes' as const,
    label: 'Custom Notes',
    icon: BookOpen,
    placeholder: 'Any additional information guests should know...',
  },
]

export default function ConciergePage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  )
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  const { data: propertiesRes } = useQuery({
    queryKey: ['properties', 'all'],
    queryFn: () =>
      api.get<{ data: Property[] }>('/properties?per_page=100'),
  })
  const properties = propertiesRes?.data ?? []

  const { data: conciergeRes, isLoading } = useConciergeKnowledge(
    selectedPropertyId
  )
  const updateMutation = useUpdateConcierge(selectedPropertyId ?? '')

  // When data loads, populate form
  const knowledge = conciergeRes?.data

  function handleSelectProperty(id: string) {
    setSelectedPropertyId(id)
    setIsDirty(false)
    setFormValues({})
  }

  function getValue(key: string): string {
    if (key in formValues) return formValues[key]
    if (!knowledge) return ''
    return (knowledge as unknown as Record<string, string | null>)[key] ?? ''
  }

  function handleChange(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  function handleSave() {
    const payload: Record<string, string> = {}
    for (const section of SECTIONS) {
      payload[section.key] = getValue(section.key)
    }
    updateMutation.mutate(payload, {
      onSuccess: () => {
        setIsDirty(false)
        setFormValues({})
      },
    })
  }

  const filledSections = SECTIONS.filter((s) => {
    const val = knowledge
      ? (knowledge as unknown as Record<string, string | null>)[s.key]
      : null
    return val && val.trim().length > 0
  }).length

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Concierge Knowledge
            </h2>
            <p className='text-muted-foreground'>
              Manage property-specific guest information and local guides
            </p>
          </div>
          {selectedPropertyId && isDirty && (
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-2 h-4 w-4' />
              )}
              Save Changes
            </Button>
          )}
        </div>

        {/* Property selector */}
        <Card className='mb-6'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Select Property</CardTitle>
            <CardDescription>
              Choose a property to view and edit its concierge knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <Select
                value={selectedPropertyId ?? ''}
                onValueChange={handleSelectProperty}
              >
                <SelectTrigger className='w-[320px]'>
                  <Building2 className='mr-2 h-4 w-4 text-muted-foreground' />
                  <SelectValue placeholder='Select a property…' />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPropertyId && knowledge && (
                <Badge variant='secondary'>
                  {filledSections}/{SECTIONS.length} sections filled
                </Badge>
              )}
              {selectedPropertyId && !knowledge && !isLoading && (
                <Badge variant='outline'>No content yet</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedPropertyId && (
          <div className='flex h-48 items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
            Select a property above to manage its concierge information
          </div>
        )}

        {selectedPropertyId && isLoading && (
          <div className='flex h-48 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        )}

        {selectedPropertyId && !isLoading && (
          <>
            <div className='grid gap-4 md:grid-cols-2'>
              {SECTIONS.map(({ key, label, icon: Icon, placeholder }) => (
                <Card key={key}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                      <Icon className='h-4 w-4 text-muted-foreground' />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor={key} className='sr-only'>
                      {label}
                    </Label>
                    <Textarea
                      id={key}
                      rows={5}
                      placeholder={placeholder}
                      value={getValue(key)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className='resize-none text-sm'
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className='mt-4 flex justify-end'>
              {isDirty && (
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='mr-2 h-4 w-4' />
                  )}
                  Save Changes
                </Button>
              )}
              {!isDirty && knowledge && (
                <p className='text-sm text-muted-foreground'>
                  Last updated:{' '}
                  {new Date(knowledge.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </>
        )}
      </Main>
    </>
  )
}
