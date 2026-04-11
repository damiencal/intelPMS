import { createFileRoute } from '@tanstack/react-router'
import { PropertyDetail } from '@/features/properties/components/property-detail'

export const Route = createFileRoute('/_authenticated/properties/$propertyId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { propertyId } = Route.useParams()
  return <PropertyDetail propertyId={propertyId} />
}
