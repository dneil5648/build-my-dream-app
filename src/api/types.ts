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
    totalPages: number;
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
  user: User;
}

// ============= Identity Types =============

export type IdentityType = 'INDIVIDUAL' | 'INSTITUTION';

export interface IndividualIdentityRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  tax_identification_number: string;
  address: Address;
}

export interface InstitutionIdentityRequest {
  legal_name: string;
  doing_business_as: string;
  email: string;
  phone_number: string;
  entity_type: string;
  tax_identification_number: string;
  address: Address;
}

export interface CreateIdentityRequest {
  type: IdentityType;
  individual?: IndividualIdentityRequest;
  institution?: InstitutionIdentityRequest;
}

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

export interface CreateAccountRequest {
  identity_id: string;
  description?: string;
}

export interface PaxosAccount {
  id: string;
  paxos_account_id: string;
  paxos_identity_id: string;
  paxos_profile_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountBalance {
  asset: string;
  available: string;
  trading: string;
  total: string;
}

// ============= Fiat Types =============

export type FiatNetwork = 'WIRE' | 'ACH' | 'CBIT' | 'DBS_ACT' | 'CUBIX' | 'SCB';
export type AccountType = 'CHECKING' | 'SAVINGS';

export interface RoutingDetails {
  routing_number: string;
  account_number: string;
}

export interface RegisterFiatAccountRequest {
  account_id: string;
  fiat_network: FiatNetwork;
  account_type: AccountType;
  description: string;
  routing_details: RoutingDetails;
  address: Address;
}

export interface FiatAccount {
  id: string;
  account_id: string;
  paxos_fiat_account_id: string;
  network: string;
  description: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFiatDepositInstructionsRequest {
  account_id: string;
  network: FiatNetwork;
  source_asset: string;
  account_type: AccountType;
}

export interface FiatDepositInstructions {
  id: string;
  deposit_instructions_id: string;
  account_id: string;
  paxos_account_id: string;
  network: string;
  account_type: string;
  instruction_type: string;
  orchestration_rule_id?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSandboxDepositRequest {
  account_id: string;
  amount: string;
  asset: string;
}

// ============= Crypto Types =============

export type CryptoNetwork = 'BITCOIN' | 'ETHEREUM' | 'SOLANA' | 'POLYGON' | 'TRON';

export interface CreateCryptoAddressRequest {
  account_id: string;
  network: CryptoNetwork;
  source_asset: string;
  destination_asset?: string;
  fiat_account_id?: string;
  crypto_address_id?: string;
}

export interface CryptoAddress {
  id: string;
  network: string;
  wallet_address: string;
  paxos_account_id: string;
  user_id: string;
}

export interface CryptoWithdrawalFeeRequest {
  asset: string;
  amount: string;
  network: CryptoNetwork;
  destination_address: string;
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
  network?: CryptoNetwork | FiatNetwork;
  destination_address?: string;
  fiat_account_id?: string;
  destination_account_id?: string;
}

// ============= Transaction Types =============

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal' | 'conversion' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  source_asset: string;
  destination_asset: string;
  amount: string;
  fee?: string;
  account_id: string;
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
}

export interface IdentityQueryParams extends ListQueryParams {
  name?: string;
  identity_type?: IdentityType;
}

export interface TransactionQueryParams extends ListQueryParams {
  type?: TransactionType;
}
