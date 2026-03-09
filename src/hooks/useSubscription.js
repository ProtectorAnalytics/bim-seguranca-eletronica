import { useAuth } from '../contexts/AuthContext'

export function useSubscription() {
  const { subscription, plan, isAdmin } = useAuth()

  // Admin = acesso ilimitado a tudo
  if (isAdmin) return {
    planName: 'Admin',
    planSlug: 'admin',
    maxProjects: Infinity,
    maxDevicesPerFloor: Infinity,
    canExportPdf: true,
    canExportDwg: true,
    canCustomDevices: true,
    isTrialing: false,
    isExpired: false,
    isActive: true,
    daysLeft: Infinity,
  }

  const status = subscription?.status
  const isTrialing = status === 'trialing'
  const isActive = status === 'active' || isTrialing
  const isExpired = ['expired', 'cancelled', 'suspended'].includes(status)

  const daysLeft = isTrialing && subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / 86400000))
    : null

  // -1 nos planos = ilimitado
  const maxProjects = plan?.max_projects === -1 ? Infinity : (plan?.max_projects ?? 1)
  const maxDevicesPerFloor = plan?.max_devices_per_floor === -1 ? Infinity : (plan?.max_devices_per_floor ?? 20)

  return {
    planName: plan?.name || 'Grátis',
    planSlug: plan?.slug || 'gratis',
    maxProjects,
    maxDevicesPerFloor,
    canExportPdf: plan?.can_export_pdf ?? false,
    canExportDwg: plan?.can_export_dwg ?? false,
    canCustomDevices: plan?.can_custom_devices ?? false,
    isTrialing,
    isExpired,
    isActive,
    daysLeft,
  }
}
