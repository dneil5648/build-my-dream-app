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

// Institution sub-types - required by Paxos API
export const INSTITUTION_SUB_TYPES = [
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'HEDGE_FUND', label: 'Hedge Fund' },
  { value: 'MONEY_SERVICE_BUSINESS', label: 'Money Service Business' },
  { value: 'STO_ISSUER', label: 'STO Issuer' },
  { value: 'PRECIOUS_METALS', label: 'Precious Metals' },
  { value: 'NON_PROFIT', label: 'Non-Profit' },
  { value: 'REGISTERED_INVESTMENT_ADVISOR', label: 'Registered Investment Advisor' },
  { value: 'AGRICULTURE_FORESTRY_FISHING_HUNTING', label: 'Agriculture, Forestry, Fishing & Hunting' },
  { value: 'MINING', label: 'Mining' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'WHOLESALE_TRADE', label: 'Wholesale Trade' },
  { value: 'RETAIL_TRADE', label: 'Retail Trade' },
  { value: 'TRANSPORTATION_WAREHOUSING', label: 'Transportation & Warehousing' },
  { value: 'INFORMATION', label: 'Information' },
  { value: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
  { value: 'REAL_ESTATE_RENTAL_LEASING', label: 'Real Estate, Rental & Leasing' },
  { value: 'PROFESSIONAL_SCIENTIFIC_TECHNICAL_SERVICES', label: 'Professional, Scientific & Technical Services' },
  { value: 'MANAGEMENT_OF_COMPANIES_ENTERPRISES', label: 'Management of Companies & Enterprises' },
  { value: 'ADMINISTRATIVE_SUPPORT_WASTE_MANAGEMENT_REMEDIATION_SERVICES', label: 'Administrative & Waste Management Services' },
  { value: 'EDUCATIONAL_SERVICES', label: 'Educational Services' },
  { value: 'HEALTH_CARE_SOCIAL_ASSISTANCE', label: 'Health Care & Social Assistance' },
  { value: 'ARTS_ENTERTAINMENT_RECREATION', label: 'Arts, Entertainment & Recreation' },
  { value: 'ACCOMMODATION_FOOD_SERVICES', label: 'Accommodation & Food Services' },
  { value: 'OTHER_SERVICES', label: 'Other Services' },
  { value: 'PUBLIC_ADMINISTRATION', label: 'Public Administration' },
  { value: 'NOT_CLASSIFIED', label: 'Not Classified' },
  { value: 'ADULT_ENTERTAINMENT', label: 'Adult Entertainment' },
  { value: 'AUCTIONS', label: 'Auctions' },
  { value: 'AUTOMOBILES', label: 'Automobiles' },
  { value: 'BLOCKCHAIN', label: 'Blockchain' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'DRUGS', label: 'Drugs' },
  { value: 'EXPORT_IMPORT', label: 'Export/Import' },
  { value: 'E_COMMERCE', label: 'E-Commerce' },
  { value: 'FINANCIAL_INSTITUTION', label: 'Financial Institution' },
  { value: 'GAMBLING', label: 'Gambling' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MARKET_MAKER', label: 'Market Maker' },
  { value: 'SHELL_BANK', label: 'Shell Bank' },
  { value: 'TRAVEL_TRANSPORT', label: 'Travel & Transport' },
  { value: 'WEAPONS', label: 'Weapons' },
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

// Employment status options for CDD
export const EMPLOYMENT_STATUSES = [
  { value: 'FULL_TIME', label: 'Full-Time Employee' },
  { value: 'PART_TIME', label: 'Part-Time Employee' },
  { value: 'SELF_EMPLOYED', label: 'Self-Employed' },
  { value: 'CONTRACTUAL', label: 'Contractor' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
] as const;

// Source of wealth options for CDD
export const SOURCE_OF_WEALTH = [
  { value: 'EMPLOYMENT_INCOME', label: 'Employment Income' },
  { value: 'BUSINESS_OWNERSHIP_DIVIDENDS', label: 'Business Ownership/Dividends' },
  { value: 'INVESTMENT_GAINS', label: 'Investment Gains' },
  { value: 'INHERITANCE', label: 'Inheritance' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'OTHER_SOURCE_OF_WEALTH', label: 'Other' },
] as const;

// Source of funds options for CDD
export const SOURCE_OF_FUNDS = [
  { value: 'SALARY_DISBURSEMENT', label: 'Salary/Paycheck' },
  { value: 'BUSINESS_DIVIDENDS_PROFITS', label: 'Business Profits/Dividends' },
  { value: 'INVESTMENT_RETURNS', label: 'Investment Returns' },
  { value: 'SAVINGS_ACCOUNT_WITHDRAWAL', label: 'Savings Withdrawal' },
  { value: 'INHERITANCE_DISTRIBUTION', label: 'Inheritance Distribution' },
  { value: 'PROPERTY_SALE', label: 'Property Sale' },
  { value: 'LOAN_DISBURSEMENT', label: 'Loan Disbursement' },
  { value: 'GOVERNMENT_BENEFITS', label: 'Government Benefits' },
] as const;

// Net worth ranges for CDD
export const NET_WORTH_RANGES = [
  { value: 'NET_WORTH_0_TO_100K', label: '$0 - $100,000' },
  { value: 'NET_WORTH_100K_TO_500K', label: '$100,000 - $500,000' },
  { value: 'NET_WORTH_500K_TO_1M', label: '$500,000 - $1,000,000' },
  { value: 'NET_WORTH_1M_TO_2_5M', label: '$1M - $2.5M' },
  { value: 'NET_WORTH_2_5M_TO_5M', label: '$2.5M - $5M' },
  { value: 'NET_WORTH_5M_TO_7_5M', label: '$5M - $7.5M' },
  { value: 'NET_WORTH_7_5M_TO_10M', label: '$7.5M - $10M' },
  { value: 'NET_WORTH_10M_TO_25M', label: '$10M - $25M' },
  { value: 'NET_WORTH_25M_TO_50M', label: '$25M - $50M' },
  { value: 'NET_WORTH_OVER_50M', label: 'Over $50M' },
] as const;

// Yearly income ranges for CDD
export const YEARLY_INCOME_RANGES = [
  { value: 'INCOME_0_TO_50K', label: '$0 - $50,000' },
  { value: 'INCOME_50K_TO_100K', label: '$50,000 - $100,000' },
  { value: 'INCOME_100K_TO_250K', label: '$100,000 - $250,000' },
  { value: 'INCOME_250K_TO_500K', label: '$250,000 - $500,000' },
  { value: 'INCOME_500K_TO_750K', label: '$500,000 - $750,000' },
  { value: 'INCOME_750K_TO_1M', label: '$750,000 - $1M' },
  { value: 'INCOME_ABOVE_1M', label: 'Above $1M' },
] as const;

// Expected transfer value ranges for CDD
export const EXPECTED_TRANSFER_VALUES = [
  { value: 'TRANSFER_VALUE_0_TO_25K', label: '$0 - $25,000' },
  { value: 'TRANSFER_VALUE_25K_TO_50K', label: '$25,000 - $50,000' },
  { value: 'TRANSFER_VALUE_50K_TO_100K', label: '$50,000 - $100,000' },
  { value: 'TRANSFER_VALUE_100K_TO_250K', label: '$100,000 - $250,000' },
  { value: 'TRANSFER_VALUE_250K_TO_500K', label: '$250,000 - $500,000' },
  { value: 'TRANSFER_VALUE_500K_TO_750K', label: '$500,000 - $750,000' },
  { value: 'TRANSFER_VALUE_750K_TO_1M', label: '$750,000 - $1M' },
  { value: 'TRANSFER_VALUE_1M_TO_2_5M', label: '$1M - $2.5M' },
  { value: 'TRANSFER_VALUE_2_5M_TO_5M', label: '$2.5M - $5M' },
  { value: 'TRANSFER_VALUE_ABOVE_5M', label: 'Above $5M' },
] as const;
