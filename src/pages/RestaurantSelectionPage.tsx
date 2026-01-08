'use client'

import { useState } from 'react'
import { mockRestaurants, type Restaurant } from '../api/mockApi'
import { getUiCopy, type LanguageCode } from '../i18n/uiCopy'
import LanguageSelect from '../components/LanguageSelect'

type RestaurantSelectionPageProps = {
  language?: LanguageCode
  onLanguageOpen?: () => void
  onContinue?: (restaurantId: string) => void
}

export default function RestaurantSelectionPage({
  language = 'ja',
  onLanguageOpen,
  onContinue,
}: RestaurantSelectionPageProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const copy = getUiCopy(language)

  const handleRestaurantClick = () => {
    if (selectedRestaurant && onContinue) {
      onContinue(selectedRestaurant)
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
          <select
            className="restaurant-dropdown"
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            aria-label={copy.restaurant.selectPlaceholder}
          >
            <option value="">{copy.restaurant.selectPlaceholder}</option>
            {mockRestaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name} - {restaurant.cuisine} ★ {restaurant.rating}
              </option>
            ))}
          </select>
        </div>

        {selectedRestaurant && (
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
              const restaurant = mockRestaurants.find(r => r.id === selectedRestaurant)
              if (!restaurant) return null
              return (
                <>
                  <div className="restaurant-card-content">
                    <div>
                      <h2 className="restaurant-card-name">{restaurant.name}</h2>
                      <div className="restaurant-card-info">
                        <span className="restaurant-card-cuisine">{restaurant.cuisine}</span>
                        <span className="restaurant-card-rating">★ {restaurant.rating}</span>
                      </div>
                      <p className="restaurant-card-description">{restaurant.description}</p>
                    </div>
                    <div className="restaurant-card-arrow">→</div>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {!selectedRestaurant && (
          <p className="restaurant-selection-hint">{copy.restaurant.noSelection}</p>
        )}
      </main>
    </div>
  )
}
