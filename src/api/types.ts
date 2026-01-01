// ============= API Response Types =============

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_count?: number;
    totalPages: number;
    total_pages?: number;
    has_next_page?: boolean;
    has_prev_page?: boolean;
  };
}

// Transactions API response format (matches API spec)
export interface TransactionsApiResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total_count: number;
      total_pages: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
  };
}

// ============= Address Types =============

export interface Address {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ============= User Types =============

export interface User {
  id: string;
  user_name: string;
  role: string;
  status: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationRequest {
  user_name: string;
  password: string;
}

export interface UpdateUserRequest {
  user_name?: string;
  password?: string;
  role?: string;
}

export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_id: string;
}

// ============= Identity Types =============

export type IdentityType = 'INDIVIDUAL' | 'INSTITUTION';

// Paxos Address Structure (different from our Address type)
export interface PaxosAddress {
  country: string;        // ISO 3166-1 Alpha-3 code (e.g., "USA")
  address1: string;       // Primary address line
  address2?: string;      // Secondary address line (optional)
  city: string;           // City name
  province: string;       // State/province code
  zip_code: string;       // Postal/ZIP code
}

// Tax Details
export interface TaxDetails {
  tax_payer_id: string;           // Tax ID (SSN, EIN, etc.)
  tax_payer_country: string;      // ISO 3166-1 Alpha-3 code
  tin_verification_status?: 'VERIFIED' | 'PENDING' | 'FAILED' | 'APPROVED';
}

// Customer Due Diligence
export interface CustomerDueDiligence {
  // Financial Information
  estimated_net_worth?: 'NET_WORTH_0_TO_100K' | 'NET_WORTH_100K_TO_500K' | 'NET_WORTH_500K_TO_1M' |
    'NET_WORTH_1M_TO_2_5M' | 'NET_WORTH_2_5M_TO_5M' | 'NET_WORTH_5M_TO_7_5M' | 'NET_WORTH_7_5M_TO_10M' |
    'NET_WORTH_10M_TO_25M' | 'NET_WORTH_25M_TO_50M' | 'NET_WORTH_OVER_50M';
  estimated_yearly_income?: 'INCOME_0_TO_50K' | 'INCOME_50K_TO_100K' | 'INCOME_100K_TO_250K' |
    'INCOME_250K_TO_500K' | 'INCOME_500K_TO_750K' | 'INCOME_750K_TO_1M' | 'INCOME_ABOVE_1M';
  expected_transfer_value?: 'TRANSFER_VALUE_0_TO_25K' | 'TRANSFER_VALUE_25K_TO_50K' |
    'TRANSFER_VALUE_50K_TO_100K' | 'TRANSFER_VALUE_100K_TO_250K' | 'TRANSFER_VALUE_250K_TO_500K' |
    'TRANSFER_VALUE_500K_TO_750K' | 'TRANSFER_VALUE_750K_TO_1M' | 'TRANSFER_VALUE_1M_TO_2_5M' |
    'TRANSFER_VALUE_2_5M_TO_5M' | 'TRANSFER_VALUE_ABOVE_5M';

  // Source of Funds/Wealth
  source_of_wealth?: 'INHERITANCE' | 'INVESTMENT_GAINS' | 'BUSINESS_OWNERSHIP_DIVIDENDS' |
    'EMPLOYMENT_INCOME' | 'REAL_ESTATE' | 'OTHER_SOURCE_OF_WEALTH';
  source_of_funds?: 'SALARY_DISBURSEMENT' | 'INHERITANCE_DISTRIBUTION' | 'INVESTMENT_RETURNS' |
    'BUSINESS_DIVIDENDS_PROFITS' | 'PROPERTY_SALE' | 'LOAN_DISBURSEMENT' |
    'SAVINGS_ACCOUNT_WITHDRAWAL' | 'GOVERNMENT_BENEFITS';

  // Account Purpose
  purpose_of_account?: 'INVESTMENT_TRADING' | 'SAVINGS' | 'STABLECOIN_PURCHASE_REDEMPTION';

  // Employment (for individuals)
  employment_status?: 'CONTRACTUAL' | 'FULL_TIME' | 'PART_TIME' | 'RETIRED' |
    'SELF_EMPLOYED' | 'STUDENT' | 'UNEMPLOYED';
  employment_industry_sector?: string;  // Uses InstitutionSubType values

  // Merchant Information
  merchant_funding_source?: 'SALARY_SAVINGS' | 'BUSINESS_LOANS_FINANCING' | 'INVESTMENT_GAINS' |
    'INHERITANCE' | 'REAL_ESTATE_INCOME' | 'NON_PROFIT_SOURCES' | 'OTHER_BUSINESS_INCOME';

  // Institutional Structure (for institutions)
  industry_sector?: string;  // REQUIRED for institutions
  has_underlying_trust_structure?: boolean;
  has_nominee_shareholders?: boolean;

  // Additional
  aliases?: string[];
  is_publicly_traded?: boolean;
  customer_regions?: string[];  // ISO 3166-1 Alpha-3 codes
}

// Person Details (Individual Identity)
export interface PersonDetails {
  // Verification Settings
  verifier_type: 'PAXOS' | 'PASSTHROUGH' | 'MANUAL';  // REQUIRED for sandbox: use PAXOS
  passthrough_verifier_type?: 'JUMIO' | 'ALLOY' | 'LEXISNEXIS' | 'MITEK' | 'SUMSUB' |
    'MICROBILT' | 'ONFIDO' | 'CUSTOMER' | 'EQUIFAX' | 'ID3_AUTHENTICATE' | 'FIS' | 'PROVE' | 'PERSONA' | 'PLAID';
  passthrough_verified_at?: string;  // RFC3339 format
  passthrough_verification_status?: 'APPROVED' | 'PENDING' | 'REJECTED';
  id_verification_status?: 'APPROVED' | 'PENDING' | 'REJECTED';

  // Personal Information
  first_name?: string;
  last_name: string;           // REQUIRED
  date_of_birth?: string;      // Format: YYYY-MM-DD
  phone_number?: string;
  email?: string;

  // CIP (Customer Identification Program) Details
  cip_id?: string;             // SSN, passport #, etc.
  cip_id_type?: 'SSN' | 'ID_CARD' | 'ITIN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VISA';
  cip_id_country?: string;     // ISO 3166-1 Alpha-3 code

  // Additional Details
  profession?: string;
  nationality?: string;        // ISO 3166-1 Alpha-3 code

  // Address
  address: PaxosAddress;       // REQUIRED

  // Metadata
  metadata?: Record<string, string>;
}

// Institution Member
export interface InstitutionMember {
  identity_id: string;  // REQUIRED - must be a person identity ID
  roles: ('BENEFICIAL_OWNER' | 'ACCOUNT_OPENER' | 'TRUSTEE' | 'AUTHORIZED_USER' |
    'GRANTOR' | 'MANAGEMENT_CONTROL_PERSON' | 'BENEFICIARY')[];  // REQUIRED
  ownership?: string;   // Ownership percentage as string
  position?: string;    // Position/title in institution
  name?: string;        // Member's full name
}

// Institution Details
export interface InstitutionDetails {
  // Basic Information
  name: string;                    // REQUIRED - legal name
  email: string;                   // REQUIRED
  phone_number: string;            // REQUIRED
  doing_business_as?: string;      // DBA name
  business_description?: string;

  // Institution Type
  institution_type: 'TRUST' | 'CORPORATION' | 'LLC' | 'PARTNERSHIP';  // REQUIRED
  institution_sub_type: string;    // REQUIRED - Industry classification

  // CIP Details
  cip_id: string;                  // REQUIRED (EIN for US institutions)
  cip_id_type: 'EIN' | 'SSN' | 'ITIN' | 'REGISTRATION_NUMBER';  // REQUIRED
  cip_id_country: string;          // REQUIRED - ISO 3166-1 Alpha-3 code

  // Government Registration
  govt_registration_date: string;  // REQUIRED - RFC3339 date-time format

  // Addresses
  business_address: PaxosAddress;  // REQUIRED
  incorporation_address?: PaxosAddress;

  // Regulatory Information
  regulation_status: 'US_REGULATED' | 'INTL_REGULATED' | 'NON_REGULATED';  // REQUIRED
  regulator_name?: string;         // REQUIRED if US_REGULATED
  regulator_jurisdiction?: string; // REQUIRED if US_REGULATED
  regulator_register_number?: string;  // REQUIRED if US_REGULATED

  // Trading Status
  trading_type: 'PRIVATE' | 'PUBLIC' | 'PUBLICLY_TRADED_SUBSIDIARY';  // REQUIRED
  listed_exchange?: string;        // Required if publicly traded
  ticker_symbol?: string;          // Required if publicly traded
  parent_institution_name?: string;

  // Verification Statuses
  sanctions_verification_status?: 'APPROVED' | 'DENIED' | 'PENDING';
  document_verification_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  additional_screening_status?: 'APPROVED' | 'DENIED' | 'PENDING';
}

// Module names for filtering
export type ModuleName = 'PAY_INS' | 'PAY_OUTS' | 'CRYPTO_WALLET' | 'WHITE_LABEL' | 'TREASURY';

// Base Identity Request (matches Paxos SDK)
export interface IdentityRequestPayload {
  // Person Identity
  person_details?: PersonDetails;

  // Institution Identity
  institution_details?: InstitutionDetails;
  institution_members?: InstitutionMember[];  // REQUIRED for institutions

  // Common Fields
  tax_details?: TaxDetails[];
  tax_details_not_required?: boolean;
  customer_due_diligence?: CustomerDueDiligence;
  is_merchant?: boolean;
  ref_id?: string;  // Your internal reference ID
  metadata?: Record<string, string>;
}

// Complete Create Identity Request with module wrapper
export interface CreateIdentityRequest {
  identity_request: IdentityRequestPayload;
  module: ModuleName;
}

// Simplified response from backend
export interface PaxosIdentity {
  id: string;
  identity_id: string;
  identity_type: IdentityType;
  name: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============= Account Types =============

// Inner account object within request
export interface AccountInnerPayload {
  identity_id: string;
  description?: string;
}

// Account request payload with nested account object
export interface AccountRequestPayload {
  account: AccountInnerPayload;
}

// Complete Create Account Request with module wrapper
export interface CreateAccountRequest {
  account_request: AccountRequestPayload;
  module: ModuleName;
  nickname?: string;
}

export interface PaxosAccount {
  id: string;
  paxos_account_id: string;
  paxos_identity_id: string;
  paxos_profile_id: string;
  user_id: string;
  nickname?: string;
  description?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountBalanceItem {
  asset: string;
  available: string;
  trading: string;
  account_id?: string; // Added when aggregating across multiple accounts
}

export interface AccountBalancesResponse {
  items: AccountBalanceItem[];
}

// ============= Fiat Types =============

export type FiatNetwork = 'WIRE' | 'ACH' | 'FEDWIRE' | 'SEPA' | 'CBIT' | 'DBS_ACT' | 'CUBIX' | 'SCB';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type RoutingNumberType = 'ABA' | 'SWIFT' | 'IBAN';

// Address structure for fiat accounts (matches Paxos format)
export interface FiatAddressInput {
  country: string;     // ISO country code (e.g., "US", "GB", "SG")
  address1: string;    // Primary street address
  address2?: string;   // Secondary address (apt, suite, etc.) - Optional
  city: string;        // City name
  province: string;    // State/Province code (e.g., "NY", "CA", "TX")
  zip_code: string;    // Postal/ZIP code
}

// Routing details for WIRE network
export interface FiatRoutingDetails {
  routing_number_type: RoutingNumberType;
  routing_number: string;
  bank_name: string;
  bank_address: FiatAddressInput;
}

// Register Fiat Account Request (WIRE network)
export interface RegisterFiatAccountRequest {
  account_id: string;
  fiat_network: FiatNetwork;
  description?: string;
  account_owner_address: FiatAddressInput;
  // WIRE-specific fields
  wire_account_number?: string;
  routing_details?: FiatRoutingDetails;
  intermediary_routing?: FiatRoutingDetails;
  // CBIT-specific
  cbit_wallet_address?: string;
  // DBS_ACT-specific
  dbs_act_account_number?: string;
  // CUBIX-specific
  cubix_account_id?: string;
  // SCB-specific
  scb_account_number?: string;
}

export interface FiatAccount {
  id: string;
  account_id: string;
  paxos_fiat_account_id: string;
  network: string;
  description?: string;
  status: string;
  user_id: string;
  wire_account_number?: string;
  routing_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFiatDepositInstructionsRequest {
  account_id: string;
  source_asset: string;
  destination_asset: string;
  fiat_network: FiatNetwork;
  fiat_account_type: AccountType;
  routing_number_type?: RoutingNumberType; // Required for WIRE/FEDWIRE, optional for ACH/SEPA
  crypto_address_id?: string; // optional, for orchestration to external wallet
}

export interface FiatDepositInstructions {
  id: string;
  deposit_instructions_id: string;
  account_id: string;
  paxos_account_id: string;
  network: string;
  account_type: string;
  instruction_type: string;
  routing_number_type?: string;
  source_asset?: string;
  destination_asset?: string;
  orchestration_rule_id?: string;
  // Destination type for auto-send scenarios
  destination_type?: 'CRYPTO' | 'FIAT' | 'PROFILE';
  // Linked destination for auto-send scenarios
  destination_crypto_address_id?: string;
  destination_address?: string;
  destination_network?: string;
  destination_nickname?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SandboxDepositAddress {
  country: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip_code: string;
}

export interface SandboxDepositRoutingDetails {
  routing_number_type: 'ABA' | 'SWIFT' | 'IBAN';
  routing_number: string;
  bank_name: string;
  bank_address: SandboxDepositAddress;
}

export interface CreateSandboxDepositRequest {
  deposit_instruction_id: string;
  amount: string;
  asset: string;
  account_number: string;
  account_owner_address: SandboxDepositAddress;
  routing_details: SandboxDepositRoutingDetails;
}

export interface FiatDepositInstructionDetails {
  id: string;
  memo_id: string;
  status: string;
  fiat_network_details: {
    wire?: {
      account_number: string;
      routing_number: string;
      bank_name: string;
      bank_address?: {
        address1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
      beneficiary_name: string;
      reference?: string;
    };
    ach?: {
      account_number: string;
      routing_number: string;
      bank_name: string;
    };
  };
  created_at: string;
  updated_at: string;
}

// ============= Crypto Types =============

export type CryptoNetwork = 'BITCOIN' | 'ETHEREUM' | 'POLYGON' | 'SOLANA' | 'LITECOIN' | 'STELLAR' | 'BASE';

export interface CreateCryptoAddressRequest {
  account_id: string;
  network: CryptoNetwork;
  source_asset: string;
  destination_asset: string; // REQUIRED - backend needs this for orchestration logic
  fiat_account_id?: string; // optional, for orchestration to fiat
  crypto_address_id?: string; // optional, for orchestration to another crypto address
}

export interface CryptoAddress {
  id: string;
  user_id: string;
  paxos_account_id: string;
  wallet_address: string;
  network: string;
  source_asset: string;
  destination_asset: string;
  destination_type: 'CRYPTO' | 'FIAT' | 'PROFILE';
  destination_crypto_address_id?: string | null;
  destination_fiat_account_id?: string | null;
  destination_profile_id?: string | null;
  orchestration_rule_id?: string | null;
  created_at?: string;
  status?: string;
}

export interface CryptoWithdrawalFeeRequest {
  asset: string;
  amount: string;
  crypto_network: string;
  destination_address: string;
}

export interface CryptoWithdrawalFeeResponse {
  fee: string;
  fee_asset: string;
  estimated_total: string;
}

// ============= Crypto Destination Address Types =============

// Travel Rule Types
export interface BeneficiaryPerson {
  first_name: string;
  last_name: string;
}

export interface BeneficiaryInstitution {
  name: string;
}

export interface Beneficiary {
  person_details?: BeneficiaryPerson;
  institution_details?: BeneficiaryInstitution;
}

export interface CryptoDestinationVasp {
  id?: string;
}

export interface TravelRuleMetadata {
  beneficiary?: Beneficiary;
  vasp?: CryptoDestinationVasp;
  custodian_type?: 'VASP' | 'PRIVATE';
}

export interface CreateCryptoDestinationAddressRequest {
  account_id: string;
  crypto_network: CryptoNetwork;
  address: string;
  nickname?: string;
  bookmarked_status?: boolean;
  travelrule_metadata?: TravelRuleMetadata;
}

export interface CryptoDestinationAddress {
  id: string;
  paxos_crypto_destination_id?: string;
  account_id: string;
  paxos_account_id: string;
  crypto_network: string;
  address: string;
  nickname?: string;
  label?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============= Asset Operations Types =============

export interface ConvertAssetRequest {
  account_id: string;
  source_asset: string;
  destination_asset: string;
  amount: string;
}

export interface WithdrawAssetRequest {
  account_id: string;
  source_asset: string;
  destination_asset: string;
  amount: string;
  network?: string;
  destination_address?: string;
  fiat_account_id?: string;
  destination_account_id?: string;
  crypto_destination_id?: string;
}

// ============= Transaction Types =============

export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type TransactionType = 
  | 'CRYPTO_DEPOSIT' 
  | 'CRYPTO_WITHDRAWAL' 
  | 'WIRE_DEPOSIT' 
  | 'WIRE_WITHDRAWAL'
  | 'INTERNAL_TRANSFER_DEBIT'
  | 'INTERNAL_TRANSFER_CREDIT'
  | 'CONVERSION'
  | 'BANK_DEPOSIT'
  | 'BANK_WITHDRAWAL';

export interface Transaction {
  id: string;
  account_id: string;
  paxos_transfer_id?: string;
  paxos_orchestration_id?: string;
  ref_id?: string;
  transaction_type: TransactionType;
  transfer_type?: string;
  source_asset: string;
  destination_asset: string;
  amount: string;
  fee?: string;
  status: TransactionStatus;
  secondary_status?: string;
  orchestration_rule_id?: string;
  network?: string;
  transaction_hash?: string;
  destination_address?: string;
  confirmations?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// ============= Query Parameters =============

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  network?: string;
  account_id?: string;
  module?: ModuleName;
}

export interface IdentityQueryParams extends ListQueryParams {
  name?: string;
  identity_type?: IdentityType;
  module?: ModuleName;
}

export interface TransactionQueryParams extends ListQueryParams {
  type?: TransactionType;
  transaction_type?: TransactionType;
  source_asset?: string;
  destination_asset?: string;
  order?: 'ASC' | 'DESC';
}
