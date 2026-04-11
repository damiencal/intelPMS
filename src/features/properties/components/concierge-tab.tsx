import { useState, useEffect } from 'react'
import {
  BookOpenText,
  DoorOpen,
  Loader2,
  MapPin,
  Notebook,
  ScrollText,
  TrainFront,
  Utensils,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useConciergeKnowledge, useUpdateConcierge } from '../api'

const fields = [
  {
    key: 'checkInInstructions' as const,
    label: 'Check-in Instructions',
    icon: DoorOpen,
    placeholder: 'Door codes, key locations, parking instructions…',
  },
  {
    key: 'houseRules' as const,
    label: 'House Rules',
    icon: ScrollText,
    placeholder: 'Quiet hours, smoking policy, pet rules…',
  },
  {
    key: 'localRestaurants' as const,
    label: 'Local Restaurants',
    icon: Utensils,
    placeholder: 'Recommend nearby restaurants and cafes…',
  },
  {
    key: 'localActivities' as const,
    label: 'Local Activities',
    icon: MapPin,
    placeholder: 'Things to do, attractions, tours…',
  },
  {
    key: 'transportation' as const,
    label: 'Transportation',
    icon: TrainFront,
    placeholder: 'Airport transfers, public transit, taxi info…',
  },
  {
    key: 'customNotes' as const,
    label: 'Custom Notes',
    icon: Notebook,
    placeholder: 'Any additional information for guests…',
  },
] as const

type FieldKey = (typeof fields)[number]['key']

export function ConciergeTab({ propertyId }: { propertyId: string }) {
  const { data: knowledge, isLoading } = useConciergeKnowledge(propertyId)
  const updateMutation = useUpdateConcierge(propertyId)
  const [form, setForm] = useState<Record<FieldKey, string>>({
    checkInInstructions: '',
    houseRules: '',
    localRestaurants: '',
    localActivities: '',
    transportation: '',
    customNotes: '',
  })

  useEffect(() => {
    if (knowledge) {
      setForm({
        checkInInstructions: knowledge.checkInInstructions ?? '',
        houseRules: knowledge.houseRules ?? '',
        localRestaurants: knowledge.localRestaurants ?? '',
        localActivities: knowledge.localActivities ?? '',
        transportation: knowledge.transportation ?? '',
        customNotes: knowledge.customNotes ?? '',
      })
    }
  }, [knowledge])

  function handleSave() {
    updateMutation.mutate(form, {
      onSuccess: () => toast.success('Concierge knowledge saved'),
      onError: () => toast.error('Failed to save concierge knowledge'),
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-10'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <BookOpenText className='h-5 w-5 text-muted-foreground' />
          <div>
            <CardTitle>Concierge Knowledge</CardTitle>
            <CardDescription>
              Information that powers AI guest messaging for this property
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6 sm:grid-cols-2'>
          {fields.map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className='space-y-2'>
              <Label htmlFor={key} className='flex items-center gap-1.5'>
                <Icon className='h-3.5 w-3.5 text-muted-foreground' />
                {label}
              </Label>
              <Textarea
                id={key}
                rows={4}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <div className='mt-6 flex justify-end'>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
