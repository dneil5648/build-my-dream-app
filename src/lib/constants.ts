// Industry/Sector options for identity onboarding (valid API values)
export const INDUSTRY_SECTORS = [
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'ADVERTISING_AND_MARKETING', label: 'Advertising & Marketing' },
  { value: 'AGRICULTURE_FORESTRY_FISHING_AND_HUNTING', label: 'Agriculture, Forestry, Fishing & Hunting' },
  { value: 'ARTS_ENTERTAINMENT_AND_RECREATION', label: 'Arts, Entertainment & Recreation' },
  { value: 'ASSET_MANAGEMENT', label: 'Asset Management' },
  { value: 'BROKER_DEALER', label: 'Broker Dealer' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'DIGITAL_ASSETS', label: 'Digital Assets' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'FINANCE_AND_INSURANCE', label: 'Finance & Insurance' },
  { value: 'FINANCIAL_TECHNOLOGY', label: 'Financial Technology' },
  { value: 'FOOD_SERVICES', label: 'Food Services' },
  { value: 'GAMING_AND_GAMBLING', label: 'Gaming & Gambling' },
  { value: 'GOVERNMENT_AND_PUBLIC_ADMINISTRATION', label: 'Government & Public Administration' },
  { value: 'HEALTHCARE_AND_SOCIAL_ASSISTANCE', label: 'Healthcare & Social Assistance' },
  { value: 'INFORMATION_TECHNOLOGY', label: 'Information Technology' },
  { value: 'LEGAL_SERVICES', label: 'Legal Services' },
  { value: 'LENDING', label: 'Lending' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'MINING_QUARRYING_OIL_AND_GAS_EXTRACTION', label: 'Mining, Quarrying, Oil & Gas' },
  { value: 'MONEY_SERVICES_BUSINESS', label: 'Money Services Business' },
  { value: 'NON_PROFIT_ORGANIZATION', label: 'Non-Profit Organization' },
  { value: 'PAYMENT_SERVICES', label: 'Payment Services' },
  { value: 'PROFESSIONAL_SCIENTIFIC_AND_TECHNICAL_SERVICES', label: 'Professional, Scientific & Technical' },
  { value: 'REAL_ESTATE_RENTAL_AND_LEASING', label: 'Real Estate, Rental & Leasing' },
  { value: 'RETAIL_TRADE', label: 'Retail Trade' },
  { value: 'TRANSPORTATION_AND_WAREHOUSING', label: 'Transportation & Warehousing' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'WHOLESALE_TRADE', label: 'Wholesale Trade' },
  { value: 'OTHER', label: 'Other' },
] as const;

// CIP ID Types for identity verification
export const CIP_ID_TYPES = [
  { value: 'SSN', label: 'SSN' },
  { value: 'ITIN', label: 'ITIN' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'ID_CARD', label: 'ID Card' },
  { value: 'DRIVING_LICENSE', label: "Driver's License" },
  { value: 'VISA', label: 'Visa' },
] as const;

// Institution types
export const INSTITUTION_TYPES = [
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'LLC', label: 'LLC' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'TRUST', label: 'Trust' },
] as const;

// Regulation status options
export const REGULATION_STATUSES = [
  { value: 'NON_REGULATED', label: 'Non-Regulated' },
  { value: 'US_REGULATED', label: 'US Regulated' },
  { value: 'INTL_REGULATED', label: 'Internationally Regulated' },
] as const;

// Trading type options
export const TRADING_TYPES = [
  { value: 'PRIVATE', label: 'Private' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PUBLICLY_TRADED_SUBSIDIARY', label: 'Publicly Traded Subsidiary' },
] as const;

// Account purpose options
export const ACCOUNT_PURPOSES = [
  { value: 'INVESTMENT_TRADING', label: 'Investment & Trading' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'STABLECOIN_PURCHASE_REDEMPTION', label: 'Stablecoin Purchase/Redemption' },
] as const;

// Institution member roles
export const MEMBER_ROLES = [
  { value: 'BENEFICIAL_OWNER', label: 'Beneficial Owner' },
  { value: 'ACCOUNT_OPENER', label: 'Account Opener' },
  { value: 'TRUSTEE', label: 'Trustee' },
  { value: 'AUTHORIZED_USER', label: 'Authorized User' },
  { value: 'GRANTOR', label: 'Grantor' },
  { value: 'MANAGEMENT_CONTROL_PERSON', label: 'Management Control Person' },
  { value: 'BENEFICIARY', label: 'Beneficiary' },
] as const;
