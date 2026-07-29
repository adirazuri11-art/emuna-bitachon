// Fallback database layer using localStorage + mock data
// Used when Supabase is not connected

export async function createOrder(data: any) {
  const order = {
    id: Math.random().toString(36).substr(2, 9),
    orderNumber: `EB-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    ...data,
    createdAt: new Date(),
  }

  const orders = JSON.parse(localStorage.getItem('orders') || '[]')
  orders.push(order)
  localStorage.setItem('orders', JSON.stringify(orders))

  return order
}

export async function createClubMember(email: string) {
  const member = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    couponCode: `CLUB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    couponExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  }

  const members = JSON.parse(localStorage.getItem('club_members') || '[]')
  members.push(member)
  localStorage.setItem('club_members', JSON.stringify(members))

  return member
}

export async function getClubMember(email: string) {
  const members = JSON.parse(localStorage.getItem('club_members') || '[]')
  return members.find((m: any) => m.email === email)
}

export async function saveDraftOrder(cartData: any) {
  localStorage.setItem('draft_order', JSON.stringify(cartData))
}

export function isDatabaseConnected() {
  return process.env.DATABASE_URL?.includes('postgresql') ?? false
}
