import type { Principal } from '@dfinity/agent';
export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Subaccount],
};
export interface Account__1 {
  'owner' : Principal,
  'subaccount' : [] | [Subaccount],
};
export interface ArchivedTransaction {
  'callback' : QueryArchiveFn,
  'start' : TxIndex,
  'length' : bigint,
};
export type Balance = bigint;
export type Balance__1 = bigint;
export interface Burn {
  'from' : Account,
  'memo' : [] | [Array<number>],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export interface BurnArgs {
  'memo' : [] | [Array<number>],
  'from_subaccount' : [] | [Subaccount],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export interface GetTransactionsRequest {
  'start' : TxIndex,
  'length' : bigint,
};
export interface GetTransactionsRequest__1 {
  'start' : TxIndex,
  'length' : bigint,
};
export interface GetTransactionsResponse {
  'first_index' : TxIndex,
  'log_length' : bigint,
  'transactions' : Array<Transaction>,
  'archived_transactions' : Array<ArchivedTransaction>,
};
export type MetaDatum = [string, Value];
export interface Mint {
  'to' : Account,
  'memo' : [] | [Array<number>],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export interface Mint__1 {
  'to' : Account,
  'memo' : [] | [Array<number>],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export type QueryArchiveFn = (arg_0: GetTransactionsRequest__1) => Promise<
    TransactionRange
  >;
export type Result = { 'ok' : Balance__1 } |
  { 'err' : TransferError };
export type Subaccount = Array<number>;
export interface SupportedStandard { 'url' : string, 'name' : string };
export type Timestamp = bigint;
export interface TokenInitArgs {
  'fee' : Balance,
  'decimals' : number,
  'minting_account' : [] | [Account],
  'permitted_drift' : [] | [Timestamp],
  'name' : string,
  'initial_balances' : Array<[Account, Balance]>,
  'transaction_window' : [] | [Timestamp],
  'min_burn_amount' : [] | [Balance],
  'max_supply' : Balance,
  'symbol' : string,
};
export interface Transaction {
  'burn' : [] | [Burn],
  'kind' : string,
  'mint' : [] | [Mint__1],
  'timestamp' : Timestamp,
  'index' : TxIndex,
  'transfer' : [] | [Transfer],
};
export interface TransactionRange { 'transactions' : Array<Transaction> };
export interface Transaction__1 {
  'burn' : [] | [Burn],
  'kind' : string,
  'mint' : [] | [Mint__1],
  'timestamp' : Timestamp,
  'index' : TxIndex,
  'transfer' : [] | [Transfer],
};
export interface Transfer {
  'to' : Account,
  'fee' : [] | [Balance],
  'from' : Account,
  'memo' : [] | [Array<number>],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export interface TransferArgs {
  'to' : Account,
  'fee' : [] | [Balance],
  'memo' : [] | [Array<number>],
  'from_subaccount' : [] | [Subaccount],
  'created_at_time' : [] | [bigint],
  'amount' : Balance,
};
export type TransferError = {
    'GenericError' : { 'message' : string, 'error_code' : bigint }
  } |
  { 'TemporarilyUnavailable' : null } |
  { 'BadBurn' : { 'min_burn_amount' : Balance } } |
  { 'Duplicate' : { 'duplicate_of' : TxIndex } } |
  { 'BadFee' : { 'expected_fee' : Balance } } |
  { 'CreatedInFuture' : { 'ledger_time' : Timestamp } } |
  { 'TooOld' : null } |
  { 'InsufficientFunds' : { 'balance' : Balance } };
export type TxIndex = bigint;
export type TxIndex__1 = bigint;
export type Value = { 'Int' : bigint } |
  { 'Nat' : bigint } |
  { 'Blob' : Array<number> } |
  { 'Text' : string };
export interface _SERVICE {
  'burn' : (arg_0: BurnArgs) => Promise<Result>,
  'deposit_cycles' : () => Promise<undefined>,
  'get_transaction' : (arg_0: TxIndex__1) => Promise<[] | [Transaction__1]>,
  'get_transactions' : (arg_0: GetTransactionsRequest) => Promise<
      GetTransactionsResponse
    >,
  'icrc1_balance_of' : (arg_0: Account__1) => Promise<Balance__1>,
  'icrc1_decimals' : () => Promise<number>,
  'icrc1_fee' : () => Promise<Balance__1>,
  'icrc1_metadata' : () => Promise<Array<MetaDatum>>,
  'icrc1_minting_account' : () => Promise<[] | [Account__1]>,
  'icrc1_name' : () => Promise<string>,
  'icrc1_supported_standards' : () => Promise<Array<SupportedStandard>>,
  'icrc1_symbol' : () => Promise<string>,
  'icrc1_total_supply' : () => Promise<Balance__1>,
  'icrc1_transfer' : (arg_0: TransferArgs) => Promise<Result>,
  'mint' : (arg_0: Mint) => Promise<Result>,
};