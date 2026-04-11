import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-hostgrowth' },
    update: {},
    create: {
      name: 'HostGrowth Demo',
      slug: 'demo-hostgrowth',
      plan: 'growth',
      timezone: 'America/Santo_Domingo',
    },
  })

  // Create demo admin user (password: "password123")
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync('password123', salt, 64).toString('hex')
  const passwordHash = `${salt}:${hash}`

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hostgrowth.com' },
    update: {},
    create: {
      email: 'admin@hostgrowth.com',
      passwordHash,
      name: 'Admin User',
      role: 'owner',
      organizationId: org.id,
    },
  })

  // Create a viewer user (password: "password123")
  const salt2 = crypto.randomBytes(16).toString('hex')
  const hash2 = crypto.scryptSync('password123', salt2, 64).toString('hex')

  await prisma.user.upsert({
    where: { email: 'viewer@hostgrowth.com' },
    update: {},
    create: {
      email: 'viewer@hostgrowth.com',
      passwordHash: `${salt2}:${hash2}`,
      name: 'Viewer User',
      role: 'viewer',
      organizationId: org.id,
    },
  })

  console.log(`✅ Organization created: ${org.name} (${org.slug})`)
  console.log(`✅ Admin user: admin@hostgrowth.com / password123`)
  console.log(`✅ Viewer user: viewer@hostgrowth.com / password123`)
  console.log('🌱 Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
