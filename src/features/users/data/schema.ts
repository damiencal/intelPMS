import { z } from 'zod'

const userRoleSchema = z.union([
  z.literal('owner'),
  z.literal('manager'),
  z.literal('viewer'),
])

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  createdAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
