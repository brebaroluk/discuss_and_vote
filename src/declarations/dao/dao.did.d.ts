import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Proposal {
  'id' : bigint,
  'status' : string,
  'vote' : bigint,
  'pageText' : string,
}
export type Result = { 'ok' : Proposal } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<Proposal> } |
  { 'err' : string };
export type Result_3 = { 'ok' : Array<string> } |
  { 'err' : string };
export interface _SERVICE {
  'adminReset' : ActorMethod<[], undefined>,
  'getMBTokenBalance' : ActorMethod<[string], bigint>,
  'getMembers' : ActorMethod<[], Result_3>,
  'getPageText' : ActorMethod<[], string>,
  'getProposalId' : ActorMethod<[], string>,
  'get_all_proposals' : ActorMethod<[], Result_2>,
  'get_proposal' : ActorMethod<[bigint], Result>,
  'registerMember' : ActorMethod<[string], Result_1>,
  'submit_proposal' : ActorMethod<[string], Result_1>,
  'unregisterMember' : ActorMethod<[string], Result_1>,
  'vote' : ActorMethod<[bigint, string], Result>,
}
