import { useMemo } from 'react'
import type { GetServerSideProps } from 'next'
import { randomUUID } from 'crypto'

import createMenu from '@/lib/ncb/createMenu'
import createMenuItem from '@/lib/ncb/createMenuItem'
import { createRestaurant } from '@/lib/ncb/createRestaurant'
import type { MenuRecord, MenuItemRecord } from '@/types/ncdb/menu'
import type { RestaurantRecord } from '@/types/ncdb/restaurant'

interface DevMenuTestProps {
  restaurant?: RestaurantRecord | null
  menu?: MenuRecord | null
  menuItem?: MenuItemRecord | null
  errors: string[]
}

export const getServerSideProps: GetServerSideProps<DevMenuTestProps> = async () => {
  const errors: string[] = []
  let restaurant: RestaurantRecord | null = null
  let menu: MenuRecord | null = null
  let menuItem: MenuItemRecord | null = null

  try {
    const now = Date.now()
    console.log('[dev-menu-test] starting dev helper smoke test')

    restaurant = await createRestaurant({
      name: `Dev Test Restaurant ${now}`,
      owner_id: randomUUID(),
      description: 'Temporary restaurant for menu helper validation',
    })

    console.log('[dev-menu-test] restaurant created', {
      id: restaurant.id,
      name: restaurant.name,
    })

    const restaurantId = Number(restaurant.id)

    const menuPayload = {
      name: 'Dev Test Menu',
      description: 'Sample menu for validation',
      restaurant_id: restaurantId,
      created_at: Date.now(),
      updated_at: Date.now(),
      external_id: randomUUID(),
      menu_type: 'dev-test',
    }

    menu = await createMenu(menuPayload)
    console.log('[dev-menu-test] menu created', {
      id: menu.id,
      external_id: menu.external_id,
    })

    const allergens = ['nuts', 'gluten'].join(', ')

    const menuId = Number(menu.id)

    const menuItemPayload = {
      menu_id: menuId,
      restaurant_id: restaurantId,
      name: 'Fake Dish',
      description: 'Menu item generated during helper smoke test',
      price: 12.99,
      allergens,
      external_id: randomUUID(),
      created_at: Date.now(),
      updated_at: Date.now(),
    }

    menuItem = await createMenuItem(menuItemPayload)
    console.log('[dev-menu-test] menu item created', {
      id: menuItem.id,
      external_id: menuItem.external_id,
    })
  } catch (error) {
    console.error('[dev-menu-test] helper test failed', error)
    errors.push(error instanceof Error ? error.message : 'Unknown error occurred during helper test')
  }

  return {
    props: {
      restaurant,
      menu,
      menuItem,
      errors,
    },
  }
}

export default function DevMenuTestPage({ restaurant, menu, menuItem, errors }: DevMenuTestProps) {
  const status = useMemo(() => {
    if (errors.length > 0) {
      return 'failed'
    }
    if (restaurant && menu && menuItem) {
      return 'passed'
    }
    return 'pending'
  }, [errors.length, menu, menuItem, restaurant])

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <section>
        <h1 className="text-2xl font-semibold">NCDB Menu Helper Smoke Test</h1>
        <p className="text-sm text-muted-foreground">Status: {status}</p>
      </section>

      {errors.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">Errors</h2>
          <ul className="list-disc space-y-2 pl-4">
            {errors.map((message, index) => (
              <li key={index} className="text-destructive">
                {message}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Restaurant</h2>
            <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
              {JSON.stringify(restaurant, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Menu</h2>
            <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
              {JSON.stringify(menu, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Menu Item</h2>
            <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
              {JSON.stringify(menuItem, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </main>
  )
}
