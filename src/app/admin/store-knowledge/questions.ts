// v2.1 API response types

export interface KitchenQuestionOption {
  value: string
  label: string
}

export interface KitchenQuestion {
  id: string
  question: string
  type: 'radio' | 'checkbox'
  options: KitchenQuestionOption[]
  affected_menu_count: number
  is_branch: boolean
  parent_id: string | null
}

export interface DishQuestion {
  index: number
  template: string
  question: string
  menu_uids: string[]
  menu_names: string[]
  type: 'text' | 'multi_select' | 'menu_select'
  options: KitchenQuestionOption[] | null
  max_select?: number
}

export interface SurveyPreview {
  restaurant_name: string
  kitchen_questions: KitchenQuestion[]
  dish_questions: DishQuestion[]
  existing_answers: Record<string, string>
}
