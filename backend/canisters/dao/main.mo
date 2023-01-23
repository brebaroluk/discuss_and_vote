import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Option "mo:base/Option";
import Blob "mo:base/Blob";
import Float "mo:base/Float";
import U "utility";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Nat32 "mo:base/Nat32";
import Char "mo:base/Char";
actor DAO{
  private stable var proposalId : Nat = 0;
  private stable var neuronId : Nat = 0;
  private stable var postId : Nat = 0;
  private stable var minimumAmountOfToken = 100000000;
  private stable var acceptanceThreshold = 10000000000;
  private stable var dao_controlled_text : Text = "The almighty text!";

  public type Proposal = {
    proposalId: Text;
    proposalTitle: Text;
    newPageContent: ?Text;
    newMinimumAmountOfToken: ?Nat;
    newAcceptanceThreshold: ?Nat;
    proposalType: Text; //changeMinimumAmount, changeThreshold, changePageContent
    owner: Text; //Principal id
    neuronId: Text; //if this proposal is created 
    voteAccepted: Nat; 
    voteRejected: Nat;
    isProposalActive: Bool;
    created_at: Text;
    resulted_at: ?Text;
    votes: [Vote];
  };

  public type SubmitProposalModal = {
    proposalType: Text;
    newPageContent: ?Text;
    newMinimumAmountOfToken: ?Nat;
    newAcceptanceThreshold: ?Nat;
    proposalTitle: Text;
  };

  public type Neuron = {
    owner: Text;
    created_at: Text;
    subaccount: [Nat8];
    votePower: Text;
    lockedBalance: Text;
    status: Text;//Locked, Dissolving, Dissolved
    minimumDissolvingTime: Text;
    createdProposalIds: [Text];
    votes: [Vote];
    neuronId: Text;
  };

  public type Vote = {
    proposalId: Text;
    created_at: Text;
    isAccepted: Bool;
    voterPrincipal: Text;
    neuronId: ?Text;
  };

  public type Post = {
    proposalId: Text;
    postId: Text;
    neuronId: Text;
    owner: Text;
    neuronPower: Text;
    content: Text;
    upVote: Text;
    downVote: Text;
  };

  //ICRC-1 type declarations
  public type TransferArgs = {
    from_subaccount : ?[Nat8];
    to : ICRC_1_account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;

    created_at_time : ?Nat64;
  };
  public type TimeError = {
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
  };
  public type TransferError = TimeError or {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };
  public type ICRC_1_account = { owner : Principal; subaccount : ?[Nat8]};
  let Token = actor ("db3eq-6iaaa-aaaah-abz6a-cai") : actor {
        icrc1_balance_of : (account: ICRC_1_account) -> async Nat;
        icrc1_transfer : (args : TransferArgs) -> async Result.Result<Nat, TransferError>;
        icrc1_fee: ()-> async Nat;
  };

  let DaoCanister = actor("hluyh-paaaa-aaaag-abe2a-cai") : actor{
      set_webpage_content : (new_text: Text) -> async ()
  };


  stable var proposalOwnersEntries: [(Text, Text)] = [];
  stable var proposalTitlesEntries: [(Text, Text)] = [];
  stable var proposingTextsEntries: [(Text, Text)] = [];
  stable var proposingNewMinimumAmountOfTokensEntries: [(Text, Nat)] = [];
  stable var proposingNewAcceptanceThresholdEntries: [(Text, Nat)] = [];
  stable var proposalTypesEntries : [(Text, Text)] = [];
  stable var proposalAcceptedVotesEntries: [(Text, Nat)] = [];
  stable var proposalRejectedVotesEntries: [(Text, Nat)] = [];
  stable var proposalVotesEntries: [(Text, [Vote])] = [];
  stable var isProposalEndedEntries: [(Text, Bool)] = [];
  stable var proposalCreatedAtEntries: [(Text, Text)] = [];
  stable var proposalResultedAtEntries: [(Text, Text)] = [];
  stable var ownerProposalIdsEntries: [(Text, [Text])] = [];
  stable var ownerVotesEntries: [(Text, [Vote])] = [];

  //proposal discussion posts data
  stable var proposalPostIdsEntries : [(Text, [Text])] = [];
  stable var proposalPostIdsReverseEntries : [(Text, Text)] = [];
  stable var neuronPostedPostIdsEntries : [(Text, [Text])] = [];
  stable var postContentsEntries : [(Text, Text)] = [];
  stable var postUpVotesEntries : [(Text, Text)] = [];
  stable var postDownVotesEntries : [(Text, Text)] = [];
  stable var postOwnersEntries : [(Text, Text)] = [];


  //neuron data
  stable var neuronOwnersEntries : [(Text, Text)] = [];
  stable var neuronOwnersReverseEntries : [(Text, Text)] = [];
  stable var neuronLockedTimesEntries : [(Text, Int)] = [];
  stable var neuronDissolveDatesEntries : [(Text, Int)] = [];
  stable var neuronCreatedAtEntries : [(Text, Text)] = [];
  stable var neuronSubaccountsEntries : [(Text, [Nat8])] = [];
  stable var neuronLockedBalancesEntries : [(Text, Nat)] = [];

  //neuron  hashmaps
  //key: neuronId, value: owner principal
  var neuronOwnersHashmap = HashMap.fromIter<Text, Text>(neuronOwnersEntries.vals(), 100000, Text.equal, Text.hash);
  //value: neuronId, key: owner principal
  var neuronOwnersReverseHashmap = HashMap.fromIter<Text, Text>(neuronOwnersReverseEntries.vals(), 100000, Text.equal, Text.hash);
  //key: neuronId, value: neuron dissolving time
  var neuronDissolveDatesHashmap = HashMap.fromIter<Text, Int>(neuronDissolveDatesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: neuronId, value: created time
  var neuronCreatedAtHashmap = HashMap.fromIter<Text, Text>(neuronCreatedAtEntries.vals(), 100000, Text.equal, Text.hash);
  //key: neuronId, value: subaccount that holds the assets of the neuron
  var neuronSubaccountsHashmap = HashMap.fromIter<Text, [Nat8]>(neuronSubaccountsEntries.vals(), 100000, Text.equal, Text.hash);
  //key: neuronId, value: locked time as Int
  var neuronLockedTimesHashmap = HashMap.fromIter<Text, Int>(neuronLockedTimesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: neuronId, value: balance of the locked tokens in the neuron
  var neuronLockedBalancesHashmap = HashMap.fromIter<Text, Nat>(neuronLockedBalancesEntries.vals(), 100000, Text.equal, Text.hash);

  //proposal hashmaps
  //key: proposalId, value: proposer principal
  var proposalOwnersHashmap = HashMap.fromIter<Text, Text>(proposalOwnersEntries.vals(), 100000, Text.equal, Text.hash);
  //key: principal id, value: [proposalId]
  var ownerProposalIdsHashmap = HashMap.fromIter<Text, [Text]>(ownerProposalIdsEntries.vals(), 100000, Text.equal, Text.hash);
  //key: principal id, value: [Vote]
  var ownerVotesHashmap = HashMap.fromIter<Text, [Vote]>(ownerVotesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: proposal title
  var proposalTitlesHashmap = HashMap.fromIter<Text, Text>(proposalTitlesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: proposing text
  var proposingTextsHashmap = HashMap.fromIter<Text, Text>(proposingTextsEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: proposing new minimum amount of tokens to vote
  var proposingNewMinimumAmountOfTokensHashmap = HashMap.fromIter<Text, Nat>(proposingNewMinimumAmountOfTokensEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: proposing new acceptance threshold
  var proposingNewAcceptanceThresholdHashmap = HashMap.fromIter<Text, Nat>(proposingNewAcceptanceThresholdEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: proposal type
  var proposalTypesHashmap = HashMap.fromIter<Text, Text>(proposalTypesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: accepted votes power
  var proposalAcceptedVotesHashmap = HashMap.fromIter<Text, Nat>(proposalAcceptedVotesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: rejected votes power
  var proposalRejectedVotesHashmap = HashMap.fromIter<Text, Nat>(proposalRejectedVotesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: [Vote]
  var proposalVotesHashmap = HashMap.fromIter<Text, [Vote]>(proposalVotesEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: isProposalEnded
  var isProposalEndedHashmap = HashMap.fromIter<Text, Bool>(isProposalEndedEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: crated time
  var proposalCreatedAtHashmap = HashMap.fromIter<Text, Text>(proposalCreatedAtEntries.vals(), 100000, Text.equal, Text.hash);
  //key: proposalId, value: resulted time
  var proposalResultedAtHashmap = HashMap.fromIter<Text, Text>(proposalResultedAtEntries.vals(), 100000, Text.equal, Text.hash);


  //discussion posts hashmaps
  //key proposalId, val: [postId]
  var proposalPostIdsHashmap = HashMap.fromIter<Text, [Text]>(proposalPostIdsEntries.vals(), 100000, Text.equal, Text.hash);
  //key: postId, val proposalId
  var proposalPostIdsReverseHashmap = HashMap.fromIter<Text, Text>(proposalPostIdsReverseEntries.vals(), 100000, Text.equal, Text.hash);
  var neuronPostedPostIdsHashmap = HashMap.fromIter<Text, [Text]>(neuronPostedPostIdsEntries.vals(), 100000, Text.equal, Text.hash);
  var postUpVotesHashmap = HashMap.fromIter<Text, Text>(postUpVotesEntries.vals(), 100000, Text.equal, Text.hash);
  var postDownVotesHashmap = HashMap.fromIter<Text, Text>(postDownVotesEntries.vals(), 100000, Text.equal, Text.hash);
  var postOwnersHashmap = HashMap.fromIter<Text, Text>(postOwnersEntries.vals(), 100000, Text.equal, Text.hash);
  var postContentsHashmap = HashMap.fromIter<Text, Text>(postContentsEntries.vals(), 100000, Text.equal, Text.hash);
    

  




  public shared ({caller}) func submit_proposal(proposalModal: SubmitProposalModal) : async Result.Result<Proposal, Text>{
    let callerPrincipal = Principal.toText(caller);
    switch(neuronOwnersReverseHashmap.get(callerPrincipal)){
        case(?neuronId){
            if(not isNeuronAllowedToSubmitProposal(neuronId)){
                return #err("Neuron should be locked at least 6 months");
            };
            let newProposalId = getNextProposalId();
            let callerPrincipal = Principal.toText(caller);
            let now = Time.now();
            let userProposals = U.safeGet(ownerProposalIdsHashmap, callerPrincipal, []);
            switch(proposalModal.proposalType){
                case("changeMinimumAmount"){
                    switch(proposalModal.newMinimumAmountOfToken){
                        case(?minimumTokenAmount){
                            proposingNewMinimumAmountOfTokensHashmap.put(newProposalId, minimumTokenAmount);
                        };
                        case(_){
                            return #err("Invalid input!");
                        };

                    }
                };
                case("changeThreshold"){
                    switch(proposalModal.newAcceptanceThreshold){
                        case(?newThreshold){
                            proposingNewAcceptanceThresholdHashmap.put(newProposalId, newThreshold);
                        };
                        case(_){
                            return #err("Invalid input!");
                        };

                    }
                };
                case("changePageContent"){
                    switch(proposalModal.newPageContent){
                        case(?newContent){
                            proposingTextsHashmap.put(newProposalId, newContent);
                        };
                        case(_){
                            return #err("Invalid input!");
                        };

                    }
                };
                case(_){
                    return #err("Invalid proposal type!");
                }

            };
            proposalOwnersHashmap.put(newProposalId, callerPrincipal);
            ownerProposalIdsHashmap.put(callerPrincipal, Array.append(userProposals, [newProposalId]));
            proposalTitlesHashmap.put(newProposalId, proposalModal.proposalTitle);
            proposalTypesHashmap.put(newProposalId, proposalModal.proposalType);
            proposalAcceptedVotesHashmap.put(newProposalId, 0);
            proposalRejectedVotesHashmap.put(newProposalId, 0);
            proposalVotesHashmap.put(newProposalId, []);
            isProposalEndedHashmap.put(newProposalId, false);
            proposalCreatedAtHashmap.put(newProposalId, Int.toText(now));

            #ok(get_proposal_internal(newProposalId));

        };
        case(null){
            #err("User needs to create a neuron to submit a proposal!")
        };
    }
  };

  public shared query func get_proposal(proposalId: Text) : async Result.Result<Proposal, Text>{
    switch(proposalOwnersHashmap.get(proposalId)){
      case(?proposalOwner){
        return #ok(get_proposal_internal(proposalId));
      };
      case(_){
        return #err("Proposal does not exist!");
      };
    }
  };


  private func get_proposal_internal(proposalId: Text) : Proposal{
    {
          proposalId = proposalId;
            created_at = unwrap(proposalCreatedAtHashmap.get(proposalId));
            isProposalActive = not unwrap(isProposalEndedHashmap.get(proposalId));
            neuronId = unwrap(neuronOwnersReverseHashmap.get(unwrap(proposalOwnersHashmap.get(proposalId))));
            newAcceptanceThreshold = proposingNewAcceptanceThresholdHashmap.get(proposalId);
            newMinimumAmountOfToken = proposingNewMinimumAmountOfTokensHashmap.get(proposalId);
            newPageContent = proposingTextsHashmap.get(proposalId);
            owner = unwrap(proposalOwnersHashmap.get(proposalId));
            proposalType = unwrap(proposalTypesHashmap.get(proposalId));
            resulted_at = proposalResultedAtHashmap.get(proposalId);
            voteAccepted = unwrap(proposalAcceptedVotesHashmap.get(proposalId));
            voteRejected = unwrap(proposalRejectedVotesHashmap.get(proposalId));
            votes = unwrap(proposalVotesHashmap.get(proposalId));
            proposalTitle = unwrap(proposalTitlesHashmap.get(proposalId))
    }
  };

  private func get_proposal_internal_lighter(proposalId: Text) : Proposal{
    {
          proposalId = proposalId;
            created_at = unwrap(proposalCreatedAtHashmap.get(proposalId));
            isProposalActive = not unwrap(isProposalEndedHashmap.get(proposalId));
            neuronId = unwrap(neuronOwnersReverseHashmap.get(unwrap(proposalOwnersHashmap.get(proposalId))));
            newAcceptanceThreshold = proposingNewAcceptanceThresholdHashmap.get(proposalId);
            newMinimumAmountOfToken = proposingNewMinimumAmountOfTokensHashmap.get(proposalId);
            newPageContent = null;
            owner = unwrap(proposalOwnersHashmap.get(proposalId));
            proposalType = unwrap(proposalTypesHashmap.get(proposalId));
            resulted_at = proposalResultedAtHashmap.get(proposalId);
            voteAccepted = unwrap(proposalAcceptedVotesHashmap.get(proposalId));
            voteRejected = unwrap(proposalRejectedVotesHashmap.get(proposalId));
            votes = unwrap(proposalVotesHashmap.get(proposalId));
            proposalTitle = unwrap(proposalTitlesHashmap.get(proposalId))
    }
  };

  public shared query func get_all_proposals() : async [Proposal]{
    var allProposalsBuffer = Buffer.Buffer<Proposal>(0);
    for(proposalId in proposalOwnersHashmap.keys()){
      allProposalsBuffer.add(get_proposal_internal_lighter(proposalId))
    };
    allProposalsBuffer.toArray()
  };

  public shared ({caller}) func vote(proposalId: Text, isAccepted: Bool) : async Result.Result<Proposal, Text>{
    switch(neuronOwnersReverseHashmap.get(Principal.toText(caller))){
        case(?neuronId){
            let neuronLockedBalance = U.safeGet(neuronLockedBalancesHashmap, neuronId, 0);
            if(neuronLockedBalance > minimumAmountOfToken){
                let callerPrincipal = Principal.toText(caller);
                let existingVotes = U.safeGet(proposalVotesHashmap, proposalId, []);
                let userVotes = U.safeGet(ownerVotesHashmap, callerPrincipal, []);

                for(vote in existingVotes.vals()){
                    if(vote.voterPrincipal == callerPrincipal){
                        return #err("This user already voted!");
                    }
                };

                let neuronPower = Int.abs(getNeuronVotePower(neuronId));
                if(isAccepted){
                    let acceptedPower = U.safeGet(proposalAcceptedVotesHashmap, proposalId, 0);
                    proposalAcceptedVotesHashmap.put(proposalId, acceptedPower + neuronPower);
                }
                else{
                    let rejectedPower = U.safeGet(proposalRejectedVotesHashmap, proposalId, 0);
                    proposalRejectedVotesHashmap.put(proposalId, rejectedPower + neuronPower);
                };
                proposalVotesHashmap.put(proposalId,Array.append(existingVotes, [{
                    proposalId = proposalId;
                    isAccepted = isAccepted;
                    created_at = Int.toText(Time.now());
                    voterPrincipal = callerPrincipal;
                    neuronId = ?neuronId
                }]));
                ownerVotesHashmap.put(callerPrincipal, Array.append(userVotes, [{
                    proposalId = proposalId;
                    isAccepted = isAccepted;
                    created_at = Int.toText(Time.now());
                    voterPrincipal = callerPrincipal;
                    neuronId = ?neuronId
                }]));
                await external_heartbeat_check_proposals();
                #ok(get_proposal_internal(proposalId))
            }
            else{
                return #err("Neuron don't have enough token to vote!");
            };
        };
        case(null){
            return #err("User don't have any neuron!")
        };
    };

    
  };

  private func modify_parameters(minimum_token: Nat, threshold: Nat) : (){
    minimumAmountOfToken := minimum_token;
    acceptanceThreshold := threshold;
  };

  public shared query func get_parameters() : async (Text, Text){
    (Nat.toText(minimumAmountOfToken), Nat.toText(acceptanceThreshold))
  };

  public shared ({caller}) func quadratic_voting(proposalId: Text, isAccepted: Bool) : async Result.Result<Proposal, Text>{
    let userBalance = await Token.icrc1_balance_of({owner= caller; subaccount = null});
    if(userBalance < minimumAmountOfToken){
        return #err("User don't have enough token to qouadratic vote!");
    };
    let callerPrincipal = Principal.toText(caller);
    let existingVotes = U.safeGet(proposalVotesHashmap, proposalId, []);
    for(vote in existingVotes.vals()){
        if(vote.voterPrincipal == callerPrincipal){
            return #err("User has already voted!");
        }
    };
                
    let userPower = Int.abs(Float.toInt(Float.sqrt(Float.fromInt(userBalance) / 100000000)))*100000000;
    if(isAccepted){
        let acceptedPower = U.safeGet(proposalAcceptedVotesHashmap, proposalId, 0);
        proposalAcceptedVotesHashmap.put(proposalId, acceptedPower + userPower);
    }
    else{
        let rejectedPower = U.safeGet(proposalRejectedVotesHashmap, proposalId, 0);
        proposalRejectedVotesHashmap.put(proposalId, rejectedPower + userPower);
    };
    proposalVotesHashmap.put(proposalId,Array.append(existingVotes, [{
        proposalId = proposalId;
        isAccepted = isAccepted;
        created_at = Int.toText(Time.now());
        neuronId = null;
        voterPrincipal = callerPrincipal
    }]));
    ownerVotesHashmap.put(callerPrincipal, Array.append(U.safeGet(ownerVotesHashmap, callerPrincipal, []), [{
        proposalId = proposalId;
        isAccepted = isAccepted;
        created_at = Int.toText(Time.now());
        neuronId = null;
        voterPrincipal = callerPrincipal
    }]));
    await external_heartbeat_check_proposals();
    #ok(get_proposal_internal(proposalId))

  };

  public shared query({caller}) func get_subaccount_to_lock_tokens() : async [Nat8]{
    get_subaccount_by_principal(caller)
  };

  public shared query func get_subaccount_to_lock_tokens_by_principal(p: Text) : async [Nat8]{
    get_subaccount_by_principal(Principal.fromText(p))
  };
  
  //this should be called after sending tokens to the subaccount get_subaccount_to_lock_tokens returned
  public shared ({caller}) func createNeuron(lockTime: Int) : async Result.Result<Neuron, Text>{
    let six_months = 15552000000000000;
    if(lockTime > 16 * six_months or lockTime < six_months){
        return #err("Dissolve delay can not be higher than 8 years or lower than 6 months!");
    };
    Debug.print("here");
    let neuronBalance = await getNeuronBalance(caller);
    Debug.print("also here");
    Debug.print(Nat.toText(neuronBalance));
    Debug.print(Principal.toText(caller));
    let fee = await Token.icrc1_fee();
    if(neuronBalance < minimumAmountOfToken and neuronBalance > fee){
         Debug.print("or here");
        
        //send back tokens
        ignore await Token.icrc1_transfer({
            amount = neuronBalance - fee;
            created_at_time = null;
            fee = null;
            from_subaccount = ?get_subaccount_by_principal(caller);
            memo = null;
            to = {
                owner= caller;
                subaccount = null;
            }
        });
        return #err("Locked token is too low!");
    }
    else if(neuronBalance == 0){
        Debug.print("i was here");
        return #err("Locked token is too low!");
    }
    else{
        Debug.print("and here");
        let callerPrincipal = Principal.toText(caller);
        switch(neuronOwnersReverseHashmap.get(callerPrincipal)){
            case(?neuronId){
                //user already owns an neuron
                return #err("User already has an neuron!")
            };
            case(null){
                let newNeuronId = getNextNeuronId();
                let now = Time.now();
                neuronOwnersHashmap.put(newNeuronId, callerPrincipal);
                neuronOwnersReverseHashmap.put(callerPrincipal, newNeuronId);
                neuronCreatedAtHashmap.put(newNeuronId, Int.toText(now));
                neuronSubaccountsHashmap.put(newNeuronId, get_subaccount_by_principal(caller));
                neuronLockedTimesHashmap.put(newNeuronId, lockTime);
                neuronLockedBalancesHashmap.put(newNeuronId, neuronBalance);

                let neuronPower = getNeuronVotePower(newNeuronId);
                
                return #ok(get_neuron_internal(newNeuronId));
            };

        };
    };

   
  };
  
  public shared ({caller}) func dissolveNeuron(neuronId: Text) : async Result.Result<Neuron, Text>{
    let owner = U.safeGet(neuronOwnersHashmap, neuronId, "");
    if(owner != Principal.toText(caller)){
        return #err("Unauthorized!");
    };
    switch(neuronLockedTimesHashmap.get(neuronId)){
        case(null){
            //if the locked time is deleted, user is started to dissolve already
            #err("The neuron is not locked!");
        };
        case(?lockedTime){
            //it's locked
            let now = Time.now();
            neuronDissolveDatesHashmap.put(neuronId, now + lockedTime);
            neuronLockedTimesHashmap.delete(neuronId);
            #ok(get_neuron_internal(neuronId))
        };
    };
  };

  public shared ({caller}) func updateNeuron(neuronId: Text, stopDissolving: Bool, newLockTime: ?Int) : async Result.Result<Neuron, Text>{
    let owner = U.safeGet(neuronOwnersHashmap, neuronId, "");
    let six_months = 15552000000000000;
    if(owner != Principal.toText(caller)){
        return #err("Unauthorized!");
    };
    switch(newLockTime){
        case(?lockTime){
            switch(neuronLockedTimesHashmap.get(neuronId)){
                case(null){
                    let now = Time.now();
                    //neuron is dissolving or already dissolved
                    //this will not trap because if an neuron is not locked, it definitely has a dissolve date
                    let dissolveDate = unwrap(neuronDissolveDatesHashmap.get(neuronId));
    
                    if(dissolveDate > now){
                        //status: dissolving
                        if(stopDissolving){
                            let alreadyLockedTime = dissolveDate - now;
                            //if user is trying to decrease the lock time, give an error
                            if(alreadyLockedTime > lockTime){
                                return #err("Can not decrease the lock time!");
                            };
                            //control the neuron balance and update the balances hashmap with the balance fetched from token canister
                            let neuronBalance = await getNeuronBalance(Principal.fromText(owner)); 

                            //stop dissolving buy deleting the dissolve date and adding the locked time
                            neuronDissolveDatesHashmap.delete(neuronId);
                            neuronLockedTimesHashmap.put(neuronId, lockTime);
                            neuronLockedBalancesHashmap.put(neuronId, neuronBalance);
                            //updated locked time and fetched the neuron balance from token canister
                            //return the neuron
                            return #ok(get_neuron_internal(neuronId));
                        }
                        else{
                            

                            //if user is trying to decrease the lock time, give an error
                            if(dissolveDate - now > lockTime){
                                return #err("Can not decrease the lock time!");
                            };

                            let newDissolveDate = now + lockTime;

                            //control the neuron balance and update the balances hashmap with the balance fetched from token canister
                            let neuronBalance = await getNeuronBalance(Principal.fromText(owner));
                            
                            //update the fields
                            neuronDissolveDatesHashmap.put(neuronId, newDissolveDate);
                            neuronLockedBalancesHashmap.put(neuronId, neuronBalance);

                            //return the neuron
                            return #ok(get_neuron_internal(neuronId));

                        };

                    }
                    else{
                        //status: dissolved
                        //since it's already dissolved, ignore stopDissolving argument
                        //lock it
                        if(six_months > lockTime or six_months * 16 < lockTime){
                            return #err("Dissolve delay can not be higher than 8 years or lower than 6 months!");
                        };
                        let neuronBalance = await getNeuronBalance(caller);
                        if(neuronBalance < minimumAmountOfToken and neuronBalance != 0){
                            let fee = await Token.icrc1_fee();
                            //send back tokens
                            ignore await Token.icrc1_transfer({
                                amount = neuronBalance - fee;
                                created_at_time = null;
                                fee = null;
                                from_subaccount = ?get_subaccount_by_principal(caller);
                                memo = null;
                                to = {
                                    owner= caller;
                                    subaccount = null;
                                }
                            });
                            return #err("Locked token is too low!");
                        };
                        //stop dissolving buy deleting the dissolve date and adding the locked time
                        neuronDissolveDatesHashmap.delete(neuronId);
                        neuronLockedTimesHashmap.put(neuronId, lockTime);
                        neuronLockedBalancesHashmap.put(neuronId, neuronBalance);
                        //updated locked time and fetched the neuron balance from token canister
                        //return the neuron
                        return #ok(get_neuron_internal(neuronId));
                    }
                };
                case(?alreadyLockedTime){

                    //status: locked
                    if(lockTime > 16 * six_months){
                        return #err("An neuron can not be locked more than 8 years!");
                    };

                    if(alreadyLockedTime > lockTime){
                        return #err("Can not decrease the lock time!");
                    };
                    //control the neuron balance and update the balances hashmap with the balance fetched from token canister
                    let neuronBalance = await getNeuronBalance(Principal.fromText(owner)); 
                    
                    neuronLockedTimesHashmap.put(neuronId, lockTime);
                    neuronLockedBalancesHashmap.put(neuronId, neuronBalance);
                    //updated locked time and fetched the neuron balance from token canister
                    //return the neuron
                    return #ok(get_neuron_internal(neuronId));
                };
            };
        };
        case(null){
            //user didn't specify any new time for dissolve delay
            //if stopDissolving is true and neuron status is dissolving, lock the neuron
            //if stopDissolving is false do nothing
            if(stopDissolving){
                
                let now = Time.now();
                let dissolveDate = U.safeGet(neuronDissolveDatesHashmap, neuronId, 0);
                if(dissolveDate == 0){
                    //status: locked
                    return #err("This neuron has already locked!")
                };
                if(dissolveDate < now){
                    //status: dissolved
                    //since this is a dissolved neuron and user didn't specify any lock time, throw an error because user needs to specify a lockTime to lock the token
                    return #err("This neuron has dissolved. LockTime not found!")
                }
                else{
                    //status: dissolving
                    //stop dissolving by deleting the dissolve date and adding the locked time
                    neuronDissolveDatesHashmap.delete(neuronId);
                    neuronLockedTimesHashmap.put(neuronId, dissolveDate - now);
                };
            };
            //just control the neuron balance and return the neuron
            let neuronBalance = await getNeuronBalance(Principal.fromText(owner));
            neuronLockedBalancesHashmap.put(neuronId, neuronBalance);
            return #ok(get_neuron_internal(neuronId));
        }
    };
  };
    
  public shared ({caller}) func withdrawTokensFromNeuron() : async Result.Result<Nat, Text>{
    let callerPrincipal = Principal.toText(caller);
    let neuronId = U.safeGet(neuronOwnersReverseHashmap, callerPrincipal, "");
    if(neuronId == ""){
        //neuron not found
        //check if there's any token in the subaccount of caller. if there's, send back and then return the error.
        let fee = await Token.icrc1_fee();
        let balance = await getNeuronBalance(caller);
        //send back tokens
        ignore await Token.icrc1_transfer({
            amount = balance - fee;
            created_at_time = null;
            fee = null;
            from_subaccount = ?get_subaccount_by_principal(caller);
            memo = null;
            to = {
                owner= caller;
                subaccount = null;
            }
        });
        return #err("Neuron not found");
    };
    let dissolveDate = U.safeGet(neuronDissolveDatesHashmap, neuronId, 0);
    if(dissolveDate == 0){
        return #err("Neuron status is locked!");
    };
    let now = Time.now();
    if(now < dissolveDate){
        return #err("Neuron has not dissolved yet!");
    };
    //if we're here, the neuron is dissolved
    //send tokens to neuron owner
    
    let fee = await Token.icrc1_fee();
    let neuronBalance = await getNeuronBalance(caller);
    //send back tokens
    let transferReturn = await Token.icrc1_transfer({
        amount = neuronBalance - fee;
        created_at_time = null;
        fee = null;
        from_subaccount = ?get_subaccount_by_principal(caller);
        memo = null;
        to = {
            owner= caller;
            subaccount = null;
        }
    });

    switch(transferReturn){
        case(#ok(amount)){
            return #ok(amount);
        };
        case(_){
            return #err("Error while transferring the tokens. Please try again!");
        };
    }
    
  };

  public shared query func get_neuron(neuronId: Text) : async Result.Result<Neuron, Text>{
    try{
        #ok(get_neuron_internal(neuronId));
    }
    catch(error){
        #err("Neuron not found!");
    };
  };

  public shared query({caller}) func get_my_neuron() : async Result.Result<Neuron, Text>{
    switch(neuronOwnersReverseHashmap.get(Principal.toText(caller))){
        case(?neuronId){
            return #ok(get_neuron_internal(neuronId));
        };
        case(null){
            return #err("Neuron not found!");
        };
    };
  };

  public shared query func get_proposals_by_ids(proposalIds: [Text]) : async [Proposal]{
    let proposalsBuffer = Buffer.Buffer<Proposal>(0);
    for(proposalId in proposalIds.vals()){
        proposalsBuffer.add(get_proposal_internal(proposalId));
    };
    Buffer.toArray(proposalsBuffer);
  };

  public shared query({caller}) func get_my_proposals() : async [Proposal] {
    let proposalIds = U.safeGet(ownerProposalIdsHashmap, Principal.toText(caller), []);
    let proposalsBuffer = Buffer.Buffer<Proposal>(0);
    for(proposalId in proposalIds.vals()){
        proposalsBuffer.add(get_proposal_internal(proposalId));
    };
    Buffer.toArray(proposalsBuffer);
  };

  public shared query func get_neuron_proposals(neuronId: Text) : async [Proposal]{
    let neuronOwner = U.safeGet(neuronOwnersHashmap, neuronId, "");
    if(neuronOwner == ""){
        return [];
    };
    let proposalIds = U.safeGet(ownerProposalIdsHashmap, neuronOwner, []);
    let proposalsBuffer = Buffer.Buffer<Proposal>(0);
    for(proposalId in proposalIds.vals()){
        proposalsBuffer.add(get_proposal_internal(proposalId));
    };
    Buffer.toArray(proposalsBuffer);
  };



  private func get_neuron_internal(neuronId: Text) : Neuron{
    var status = "";
    var minimumDissolvingTime = 0;
    switch(neuronLockedTimesHashmap.get(neuronId)){
        case(null){
            //if the locked time is deleted, user is started to dissolve
            let now = Time.now();
            let dissolvingDate = unwrap(neuronDissolveDatesHashmap.get(neuronId));
            if(now < dissolvingDate){
                status := "Dissolving";
                minimumDissolvingTime := Int.abs(dissolvingDate) - Int.abs(now);
            }
            else{
                status := "Dissolved";
                minimumDissolvingTime := 0;
            }
        };
        case(?lockedTime){
            //it's locked
            status := "Locked";
            minimumDissolvingTime := Int.abs(lockedTime);
        };
    };
    let owner = unwrap(neuronOwnersHashmap.get(neuronId));
    return {
        created_at = unwrap(neuronCreatedAtHashmap.get(neuronId));
        lockedBalance = Nat.toText(unwrap(neuronLockedBalancesHashmap.get(neuronId)));
        minimumDissolvingTime = Nat.toText(minimumDissolvingTime);
        owner = owner;
        status = status;
        subaccount = get_subaccount_by_principal(Principal.fromText(owner));
        votePower = Int.toText(getNeuronVotePower(neuronId));
        createdProposalIds = U.safeGet(ownerProposalIdsHashmap, owner, []);
        votes = U.safeGet(ownerVotesHashmap, owner, []);
        neuronId = neuronId
    };
  };



  //discussion chat
  public shared ({caller}) func discussion_post(proposalId: Text, content: Text) : async Result.Result<Post, Text>{
    let callerPrincipal = Principal.toText(caller);
    let neuronId = U.safeGet(neuronOwnersReverseHashmap, callerPrincipal, "");
    if(neuronId == ""){
        return #err("Only neuron owners can create a post!");
    };
    if(content.size() > 280){
        return #err("Post is too long.Supporting max 280 characters!");
    };

    if(content.size() == 0){
        return #err("Post can not be empty!");
    };
    switch(proposalOwnersHashmap.get(proposalId)){
      case(?proposalOwner){
        let alreadyPostedPostsList = List.fromArray(U.safeGet(proposalPostIdsHashmap, proposalId, []));
        if(List.size(alreadyPostedPostsList) > 99){
            return #err("There're already 100 posts under this discussion. Each proposal supports max 100 posts!");
        };
        //everything is ok
        let neuronAlreadyPostedPostIdsList = List.fromArray(U.safeGet(neuronPostedPostIdsHashmap, neuronId, []));
        let newPostId = getNextPostId();
        postContentsHashmap.put(newPostId, content);
        postUpVotesHashmap.put(newPostId, "0");
        postDownVotesHashmap.put(newPostId, "0");
        postOwnersHashmap.put(newPostId,callerPrincipal);
        neuronPostedPostIdsHashmap.put(neuronId, List.toArray(List.push(newPostId, neuronAlreadyPostedPostIdsList)));
        proposalPostIdsHashmap.put(proposalId, List.toArray(List.push(newPostId, alreadyPostedPostsList)));
        proposalPostIdsReverseHashmap.put(newPostId, proposalId);
        #ok(get_post_internal(newPostId))
      };
      case(_){
        return #err("Proposal does not exist!");
      };
    };
    
  };

  public shared query func get_proposal_discussion_posts(proposalId: Text) : async [Post]{
    let postIds = U.safeGet(proposalPostIdsHashmap, proposalId, []);
    var returningPosts = Buffer.Buffer<Post>(0);
    for(postId in postIds.vals()){
        returningPosts.add(get_post_internal(postId));
    };
    Buffer.toArray(returningPosts)
  };

  private func get_post_internal(postId: Text) : Post{
    let owner = U.safeGet(postOwnersHashmap, postId, "");
    let neuronId = U.safeGet(neuronOwnersReverseHashmap, owner, "");
    {
        content = U.safeGet(postContentsHashmap, postId, "");
        downVote = U.safeGet(postDownVotesHashmap, postId, "");
        upVote = U.safeGet(postUpVotesHashmap, postId, "");
        owner = owner;
        neuronId = neuronId;
        neuronPower = Int.toText(getNeuronVotePower(neuronId));
        postId = postId;
        proposalId = U.safeGet(proposalPostIdsReverseHashmap, postId, "");
    }
  };

  public shared func external_heartbeat_check_proposals() : async (){
    var activeProposals = Buffer.Buffer<Proposal>(0);
    for(proposalId in proposalOwnersHashmap.keys()){
      let proposal = get_proposal_internal(proposalId);
      if(proposal.isProposalActive){
        activeProposals.add(proposal);
      };
    };

    for(activeProposal in activeProposals.vals()){
      if(activeProposal.voteAccepted > acceptanceThreshold){
        let now = Int.toText(Time.now());
        switch(activeProposal.proposalType){
            case("changeMinimumAmount"){
                try{
                    minimumAmountOfToken := unwrap(activeProposal.newMinimumAmountOfToken);
                }
                catch(err){
                    //this shouldn't happen but if does, don't let it to crash the whole loop
                };
                
            };
            case("changeThreshold"){
                try{
                    acceptanceThreshold := unwrap(activeProposal.newAcceptanceThreshold);
                }
                catch(err){
                    //this shouldn't happen but if does, don't let it to crash the whole loop
                };
            };
            case("changePageContent"){
                try{
                    dao_controlled_text := unwrap(activeProposal.newPageContent);
                    await DaoCanister.set_webpage_content(dao_controlled_text);
                }
                catch(err){
                    //this shouldn't happen but if does, don't let it to crash the whole loop
                };
            };
            case(_){
                //this will never happen
            };
        };
        isProposalEndedHashmap.put(activeProposal.proposalId, true);
        proposalResultedAtHashmap.put(activeProposal.proposalId, now);
        return;
      }
      else if(activeProposal.voteRejected > acceptanceThreshold){
        let now = Int.toText(Time.now());
        isProposalEndedHashmap.put(activeProposal.proposalId, true);
        proposalResultedAtHashmap.put(activeProposal.proposalId, now);
        return;
      };
    }

  };
  //if someone locked tokens and there's an error while creating or updation neuron, this method sends back the tokens
  public shared func send_back_locked_tokens(p:Principal) : async () {
    switch(neuronOwnersReverseHashmap.get(Principal.toText(p))){
        case(null){
            let fee = await Token.icrc1_fee();
            let neuronBalance = await getNeuronBalance(p);
            //send back tokens
            ignore await Token.icrc1_transfer({
                amount = neuronBalance - fee;
                created_at_time = null;
                fee = null;
                from_subaccount = ?get_subaccount_by_principal(p);
                memo = null;
                to = {
                    owner= p;
                    subaccount = null;
                }
            });
            Debug.print("1");
        };
        case(?neuronId){
            Debug.print("2");
            let neuronLocked = unwrap(neuronLockedBalancesHashmap.get(neuronId));
            let neuronBalance = await getNeuronBalance(p);
            if(neuronLocked != neuronBalance){
                let fee = await Token.icrc1_fee();
                let sendingAmount = neuronBalance - neuronLocked;
                Debug.print("sending" # Nat.toText(sendingAmount));
                //send back tokens
                let response =  await Token.icrc1_transfer({
                    amount = sendingAmount - fee;
                    created_at_time = null;
                    fee = ?fee;
                    from_subaccount = ?get_subaccount_by_principal(p);
                    memo = null;
                    to = {
                        owner= p;
                        subaccount = null;
                    }
                });
                switch(response){
                    case(#err(err)){
                        Debug.print("err");
                    };
                    case(#ok(r)){
                        Debug.print(Nat.toText(r));
                    }
                }
            };
        };
    };
  };

  public shared query func get_dao_controlled_text() : async Text{
    dao_controlled_text
  };

  

  private func get_subaccount_by_principal(p: Principal) : [Nat8]{
    let buffer = Buffer.Buffer<Nat8>(0);
    for(nat8 in Blob.toArray(Text.encodeUtf8(Principal.toText(p))).vals()){
        if(buffer.size() < 32){
            buffer.add(nat8);
        };
    };
    buffer.toArray()
  };


  private func getNeuronBalance(user: Principal) : async Nat {
    return await Token.icrc1_balance_of({
      owner = Principal.fromActor(DAO);
      subaccount = ?get_subaccount_by_principal(user)
    });
    
  };

  private func arrayContains(array: [Text], element: Text) : Bool{
    for(el in array.vals()){
      if(Text.equal(element, el)){
        return true;
      }
    };
    return false;
  };

  private func unwrap<T>(val: ?T) : T{
    Option.unwrap(val)
  };

  
  private func getNextProposalId() : Text{
    proposalId += 1;
    Nat.toText(proposalId)
  };

  private func getNextNeuronId() : Text{
    neuronId += 1;
    Nat.toText(neuronId)
  };

  private func getNextPostId () : Text{
    postId += 1;
    Nat.toText(postId)
  };

  private func isNeuronAllowedToSubmitProposal(neuronId: Text) : Bool{
    switch(neuronLockedTimesHashmap.get(neuronId)){
        case(?lockedTime){
            //users can lock their tokens at least for 6 months. So, if it's locked, user is allowed
            return true;
        };
        case(null){
            switch(neuronDissolveDatesHashmap.get(neuronId)){
                case(?dissolveDate){
                    //if the neuron is dissolving, the dissolving date should be longer than 6 months
                    Int.greater(dissolveDate - Time.now(), 15778800000000000)
                };
                case(null){
                    return false;
                }
            };
        }
    };
    
  };

  private func getNeuronVotePower(neuronId: Text) : Int{
    let six_months = 15552000000000000;
    let neuronOwner = unwrap(neuronOwnersHashmap.get(neuronId));
    switch(neuronLockedTimesHashmap.get(neuronId)){
        case(?lockedTime){
            Debug.print("here");
            let dissolve_delay_bonus = if(lockedTime < six_months){Float.fromInt(0)} else{((Float.fromInt(lockedTime) / Float.fromInt(six_months * 15)) * 0.94) + 1.06};
            let age_bonus = if(lockedTime > six_months*8){1.25} else{((Float.fromInt(lockedTime) / Float.fromInt(six_months*8))*0.25) + 1};
            let neuron_locked = U.safeGet(neuronLockedBalancesHashmap, neuronId, 0);
            let neuron_locked_factor = Float.fromInt(neuron_locked);
            Debug.print(Int.toText(lockedTime));
            Debug.print(Int.toText(six_months));
            Debug.print(Float.toText(dissolve_delay_bonus));
            Debug.print(Float.toText(age_bonus));
            Debug.print(Float.toText(neuron_locked_factor));
            Float.toInt(dissolve_delay_bonus * age_bonus * neuron_locked_factor);
        };
        case(null){
            switch(neuronDissolveDatesHashmap.get(neuronId)){
                case(?dissolveDate){
                    if(Int.greater(six_months, dissolveDate - Time.now())){
                        return 0;
                    }
                    else{
                        let lockedTime = dissolveDate - Time.now();
                        let dissolve_delay_bonus = Float.fromInt(lockedTime) / Float.fromInt(six_months * 15) * 0.94;
                        let age_bonus = if(lockedTime > six_months*8){1.25} else{Float.fromInt(lockedTime) / Float.fromInt(six_months*8)*0.25 + 1};
                        let neuron_locked = U.safeGet(neuronLockedBalancesHashmap, neuronId, 0);
                        let neuron_locked_factor = Float.fromInt(neuron_locked);
                        Float.toInt(dissolve_delay_bonus * age_bonus * neuron_locked_factor);
                    }
                };
                case(null){
                    return 0;
                }
            };
        }
    };
  };

  system func preupgrade() {
    proposalOwnersEntries := Iter.toArray(proposalOwnersHashmap.entries());
    proposalTitlesEntries := Iter.toArray(proposalTitlesHashmap.entries());
    proposingTextsEntries := Iter.toArray(proposingTextsHashmap.entries());
    proposingNewMinimumAmountOfTokensEntries := Iter.toArray(proposingNewMinimumAmountOfTokensHashmap.entries());
    proposingNewAcceptanceThresholdEntries := Iter.toArray(proposingNewAcceptanceThresholdHashmap.entries());
    proposalTypesEntries := Iter.toArray(proposalTypesHashmap.entries());
    proposalAcceptedVotesEntries := Iter.toArray(proposalAcceptedVotesHashmap.entries());
    proposalRejectedVotesEntries := Iter.toArray(proposalRejectedVotesHashmap.entries());
    proposalVotesEntries := Iter.toArray(proposalVotesHashmap.entries());
    isProposalEndedEntries := Iter.toArray(isProposalEndedHashmap.entries());
    proposalCreatedAtEntries := Iter.toArray(proposalCreatedAtHashmap.entries());
    proposalResultedAtEntries := Iter.toArray(proposalResultedAtHashmap.entries());
    ownerProposalIdsEntries := Iter.toArray(ownerProposalIdsHashmap.entries());
    neuronOwnersEntries := Iter.toArray(neuronOwnersHashmap.entries());
    neuronOwnersReverseEntries := Iter.toArray(neuronOwnersReverseHashmap.entries());
    neuronLockedTimesEntries := Iter.toArray(neuronLockedTimesHashmap.entries());
    neuronDissolveDatesEntries := Iter.toArray(neuronDissolveDatesHashmap.entries());
    neuronCreatedAtEntries := Iter.toArray(neuronCreatedAtHashmap.entries());
    neuronSubaccountsEntries := Iter.toArray(neuronSubaccountsHashmap.entries());
    neuronLockedBalancesEntries := Iter.toArray(neuronLockedBalancesHashmap.entries());
    ownerVotesEntries:= Iter.toArray(ownerVotesHashmap.entries());
    proposalPostIdsEntries := Iter.toArray(proposalPostIdsHashmap.entries());
    neuronPostedPostIdsEntries := Iter.toArray(neuronPostedPostIdsHashmap.entries());
    postUpVotesEntries := Iter.toArray(postUpVotesHashmap.entries());
    postDownVotesEntries := Iter.toArray(postDownVotesHashmap.entries());
    postOwnersEntries := Iter.toArray(postOwnersHashmap.entries());
    postContentsEntries := Iter.toArray(postContentsHashmap.entries());
    proposalPostIdsReverseEntries := Iter.toArray(proposalPostIdsReverseHashmap.entries());

  };

  system func postupgrade() {
    proposalOwnersEntries := [];
    proposalTitlesEntries := [];
    proposingTextsEntries := [];
    proposingNewMinimumAmountOfTokensEntries := [];
    proposingNewAcceptanceThresholdEntries := [];
    proposalTypesEntries := [];
    proposalAcceptedVotesEntries := [];
    proposalRejectedVotesEntries := [];
    proposalVotesEntries := [];
    isProposalEndedEntries := [];
    proposalCreatedAtEntries := [];
    proposalResultedAtEntries := [];
    ownerProposalIdsEntries := [];
    neuronOwnersEntries := [];
    neuronOwnersReverseEntries := [];
    neuronLockedTimesEntries := [];
    neuronDissolveDatesEntries := [];
    neuronCreatedAtEntries := [];
    neuronSubaccountsEntries := [];
    neuronLockedBalancesEntries := [];
    ownerVotesEntries := [];
    proposalPostIdsEntries := [];
    neuronPostedPostIdsEntries := [];
    postUpVotesEntries := [];
    postDownVotesEntries := [];
    postOwnersEntries := [];
    postContentsEntries := [];
    proposalPostIdsReverseEntries := [];
  };

  system func heartbeat() : async () {
    await external_heartbeat_check_proposals();
  };






  //HTTP
  public type HttpRequest = {
        body: Blob;
        headers: [HeaderField];
        method: Text;
        url: Text;
    };

    public type StreamingCallbackToken =  {
        content_encoding: Text;
        index: Nat;
        key: Text;
        sha256: ?Blob;
    };
    public type StreamingCallbackHttpResponse = {
        body: Blob;
        token: ?StreamingCallbackToken;
    };
    public type ChunkId = Nat;
    public type SetAssetContentArguments = {
        chunk_ids: [ChunkId];
        content_encoding: Text;
        key: Key;
        sha256: ?Blob;
    };
    public type Path = Text;
    public type Key = Text;

    public type HttpResponse = {
        body: Blob;
        headers: [HeaderField];
        status_code: Nat16;
        streaming_strategy: ?StreamingStrategy;
    };

    public type StreamingStrategy = {
        #Callback: {
            callback: query (StreamingCallbackToken) ->
            async (StreamingCallbackHttpResponse);
            token: StreamingCallbackToken;
        };
    };

    public type HeaderField = (Text, Text);

    private func removeQuery(str: Text): Text {
        return Option.unwrap(Text.split(str, #char '?').next());
    };

    public query func http_request(req: HttpRequest): async (HttpResponse) {
        let path = removeQuery(req.url);
        var proposalId = "";
        for(char in path.chars()){
            if(char != Char.fromNat32(47)){
                proposalId := proposalId # Text.fromChar(char);
            }
        };
        switch(proposingTextsHashmap.get(proposalId)){
            case(?proposingPage){
                return {
                body = Text.encodeUtf8(proposingPage);
                headers = [("Content-Type", "text/html; charset=UTF-8")];
                status_code = 200;
                streaming_strategy = null;
            };
            };
            case(_){
                return {
                body = Text.encodeUtf8("not found");
                headers = [];
                status_code = 200;
                streaming_strategy = null;
            };
            };
        };
    };
};
