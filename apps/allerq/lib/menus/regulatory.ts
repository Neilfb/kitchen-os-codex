export interface RegulatoryAllergenDefinition {
  code: string
  label: string
  icon: string
  description?: string
  required?: boolean
  referenceUrl?: string
  localeLabels?: Record<string, { label?: string; description?: string }>
}

export interface RegulatoryRegionDefinition {
  region: string
  name: string
  countryCodes: string[]
  allergens: RegulatoryAllergenDefinition[]
  defaultLanguage?: string
  regulationReference?: string
}

const UK_EU_ALLERGENS: RegulatoryAllergenDefinition[] = [
  {
    code: 'celery',
    label: 'Celery',
    icon: 'celery',
    description: 'Includes stalks, leaves, seeds, and celeriac.',
    required: true,
    referenceUrl: 'https://www.food.gov.uk/business-guidance/allergen-labelling',
  },
  {
    code: 'gluten',
    label: 'Cereals containing gluten',
    icon: 'wheat',
    description: 'Wheat, rye, barley, oats, or their hybridised strains.',
    required: true,
  },
  {
    code: 'crustaceans',
    label: 'Crustaceans',
    icon: 'lobster',
    description: 'Includes crab, lobster, prawn, shrimp.',
    required: true,
  },
  {
    code: 'eggs',
    label: 'Eggs',
    icon: 'egg',
    required: true,
  },
  {
    code: 'fish',
    label: 'Fish',
    icon: 'fish',
    required: true,
  },
  {
    code: 'lupin',
    label: 'Lupin',
    icon: 'leaf',
    description: 'Includes lupin seeds and flour.',
    required: true,
  },
  {
    code: 'milk',
    label: 'Milk',
    icon: 'milk',
    required: true,
  },
  {
    code: 'molluscs',
    label: 'Molluscs',
    icon: 'shell',
    description: 'Includes mussels, whelks, oysters, snails.',
    required: true,
  },
  {
    code: 'mustard',
    label: 'Mustard',
    icon: 'mustard',
    required: true,
  },
  {
    code: 'peanuts',
    label: 'Peanuts',
    icon: 'peanut',
    required: true,
  },
  {
    code: 'sesame',
    label: 'Sesame',
    icon: 'sesame',
    required: true,
  },
  {
    code: 'soy',
    label: 'Soybeans',
    icon: 'soy',
    required: true,
  },
  {
    code: 'sulphites',
    label: 'Sulphur dioxide and sulphites',
    icon: 'chemical',
    description: 'At concentrations of more than 10mg/kg or 10mg/litre.',
    required: true,
  },
  {
    code: 'tree-nuts',
    label: 'Tree Nuts',
    icon: 'nut',
    description: 'Almonds, hazelnuts, walnuts, cashews, pecans, brazil nuts, pistachios, macadamia.',
    required: true,
  },
]

const US_FDA_ALLERGENS: RegulatoryAllergenDefinition[] = [
  { code: 'milk', label: 'Milk', icon: 'milk', required: true },
  { code: 'eggs', label: 'Eggs', icon: 'egg', required: true },
  { code: 'fish', label: 'Fish', icon: 'fish', required: true },
  {
    code: 'shellfish',
    label: 'Crustacean shellfish',
    icon: 'lobster',
    required: true,
  },
  { code: 'tree-nuts', label: 'Tree nuts', icon: 'nut', required: true },
  { code: 'peanuts', label: 'Peanuts', icon: 'peanut', required: true },
  { code: 'wheat', label: 'Wheat', icon: 'wheat', required: true },
  { code: 'soy', label: 'Soybeans', icon: 'soy', required: true },
  {
    code: 'sesame',
    label: 'Sesame',
    icon: 'sesame',
    required: true,
    referenceUrl: 'https://www.fda.gov/food',
  },
]

export const REGULATORY_REGIONS: RegulatoryRegionDefinition[] = [
  {
    region: 'uk',
    name: 'United Kingdom',
    countryCodes: ['GB', 'UK'],
    allergens: UK_EU_ALLERGENS,
    defaultLanguage: 'en',
    regulationReference: "Natasha's Law / UK Food Information Regulations",
  },
  {
    region: 'eu',
    name: 'European Union',
    countryCodes: [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ],
    allergens: UK_EU_ALLERGENS,
    defaultLanguage: 'en',
    regulationReference: 'EU FIC (Regulation (EU) No 1169/2011)',
  },
  {
    region: 'us',
    name: 'United States',
    countryCodes: ['US'],
    allergens: US_FDA_ALLERGENS,
    defaultLanguage: 'en',
    regulationReference: 'Food Allergen Labeling and Consumer Protection Act (FALCPA)',
  },
]

export function getRegulatoryRegion(region: string): RegulatoryRegionDefinition | undefined {
  const normalised = region.toLowerCase()
  return REGULATORY_REGIONS.find(
    (definition) =>
      definition.region === normalised ||
      definition.countryCodes.map((code) => code.toLowerCase()).includes(normalised)
  )
}
