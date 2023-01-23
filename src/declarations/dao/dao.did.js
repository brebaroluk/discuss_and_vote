export const idlFactory = ({ IDL }) => {
  const Result_3 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const Proposal = IDL.Record({
    'id' : IDL.Nat,
    'status' : IDL.Text,
    'vote' : IDL.Int,
    'pageText' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(Proposal), 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : Proposal, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  return IDL.Service({
    'adminReset' : IDL.Func([], [], ['oneway']),
    'getMBTokenBalance' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'getMembers' : IDL.Func([], [Result_3], ['query']),
    'getPageText' : IDL.Func([], [IDL.Text], ['query']),
    'getProposalId' : IDL.Func([], [IDL.Text], ['query']),
    'get_all_proposals' : IDL.Func([], [Result_2], []),
    'get_proposal' : IDL.Func([IDL.Nat], [Result], []),
    'registerMember' : IDL.Func([IDL.Text], [Result_1], []),
    'submit_proposal' : IDL.Func([IDL.Text], [Result_1], []),
    'unregisterMember' : IDL.Func([IDL.Text], [Result_1], []),
    'vote' : IDL.Func([IDL.Nat, IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
