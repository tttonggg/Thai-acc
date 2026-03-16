import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/user/preferences - Get user preferences
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId: session.user.id,
          theme: 'system',
          density: 'normal',
          language: 'th',
          pageSize: 25,
          dateFormat: 'DD/MM/YYYY',
          currencyFormat: 'THB',
          emailNotifications: true,
          pushNotifications: true,
        },
      })
    }

    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    )
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      theme,
      density,
      language,
      pageSize,
      dateFormat,
      currencyFormat,
      dashboardLayout,
      emailNotifications,
      pushNotifications,
    } = body

    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: {
        ...(theme && { theme }),
        ...(density && { density }),
        ...(language && { language }),
        ...(pageSize && { pageSize }),
        ...(dateFormat && { dateFormat }),
        ...(currencyFormat && { currencyFormat }),
        ...(dashboardLayout && { dashboardLayout }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(pushNotifications !== undefined && { pushNotifications }),
      },
      create: {
        userId: session.user.id,
        theme: theme || 'system',
        density: density || 'normal',
        language: language || 'th',
        pageSize: pageSize || 25,
        dateFormat: dateFormat || 'DD/MM/YYYY',
        currencyFormat: currencyFormat || 'THB',
        ...(dashboardLayout && { dashboardLayout }),
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
      },
    })

    return NextResponse.json({ success: true, preferences })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    )
  }
}
