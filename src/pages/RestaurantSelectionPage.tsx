'use client'

import { useState, useEffect } from 'react'
import { getUiCopy, type LanguageCode } from '../i18n/uiCopy'
import LanguageSelect from '../components/LanguageSelect'

type ApiRestaurant = {
  uid: string
  name: string
  description?: string
  is_active: boolean
  slug: string
  created_at: string
  updated_at: string
}

type RestaurantSelectionPageProps = {
  language?: LanguageCode
  onLanguageOpen?: () => void
  onContinue?: (restaurant: ApiRestaurant) => void
}

export default function RestaurantSelectionPage({
  language = 'ja',
  onLanguageOpen,
  onContinue,
}: RestaurantSelectionPageProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const copy = getUiCopy(language)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000'
        const response = await fetch(`${apiBaseUrl}/api/restaurants/?page=1&size=10`)
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        const data = await response.json()
        // Filter to only show active restaurants
        const activeRestaurants = data.result?.items?.filter((restaurant: ApiRestaurant) => restaurant.is_active) || []
        setRestaurants(activeRestaurants)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const handleRestaurantClick = () => {
    if (selectedRestaurant && onContinue) {
      const restaurant = restaurants.find(r => r.uid === selectedRestaurant)
      if (restaurant) {
        onContinue(restaurant)
      }
    }
  }

  return (
    <div className="page restaurant-selection-page">
      <header className="restaurant-selection-header">
        <h1 className="restaurant-selection-title">{copy.restaurant.title}</h1>
        <p className="restaurant-selection-subtitle">{copy.restaurant.subtitle}</p>
        <LanguageSelect selected={language} onOpen={onLanguageOpen} />
      </header>

      <main className="restaurant-selection-main">
        <div className="restaurant-dropdown-container">
          {loading ? (
            <p>Loading restaurants...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : (
            <select
              className="restaurant-dropdown"
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              aria-label={copy.restaurant.selectPlaceholder}
            >
              <option value="">{copy.restaurant.selectPlaceholder}</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.uid} value={restaurant.uid}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedRestaurant && !loading && !error && (
          <div 
            className="restaurant-card restaurant-card-clickable"
            onClick={handleRestaurantClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleRestaurantClick()
              }
            }}
          >
            {(() => {
              const restaurant = restaurants.find(r => r.uid === selectedRestaurant)
              if (!restaurant) return null
              return (
                <>
                  <div className="restaurant-card-content">
                    <div>
                      <h2 className="restaurant-card-name">{restaurant.name}</h2>
                      <p className="restaurant-card-description">{restaurant.description || 'No description available'}</p>
                    </div>
                    <div className="restaurant-card-arrow">→</div>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {!selectedRestaurant && !loading && !error && (
          <p className="restaurant-selection-hint">{copy.restaurant.noSelection}</p>
        )}
      </main>
    </div>
  )
}
