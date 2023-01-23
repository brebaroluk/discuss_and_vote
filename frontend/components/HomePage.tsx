import { useCanister, useWallet } from "@connect2ic/react"
import React, { useEffect, useState } from "react"
import { Header } from "./Header"
import { Proposal } from ".dfx/local/canisters/dao/dao.did"
import { ProposalCard } from "./ProposalCard"
import { CreateProposal } from "./CreateProposal"
import { CreateNeuron } from "./CreateNeuron"

const HomePage = () => {
  const [selectedProposals, setSelectedProposals] = useState("all")
  const [wallet] = useWallet()
  const [backend] = useCanister("dao");
  const [allProposals, setAllProposals] = useState<Proposal []>([]);
  const [myProposals, setMyProposals] = useState<Proposal []>([]);
  const [displayingProposals, setDisplayingProposals] = useState<Proposal []>([])

  const [displayCreateProposalModal, setDisplayCreateModalProposal] = useState(false);
  const [displayCreateNeuronModal, setDisplayCreateNeuronModal] = useState(false);

  const getMyProposals = async () => {
    let myProposals = await backend.get_my_proposals() as Proposal [];
    setMyProposals(myProposals.sort((p1, p2)=>{
      return parseFloat(p2.created_at) - parseFloat(p1.created_at)
    }));
  };

  const getAllProposals = async () => {
    let allProposals = await backend.get_all_proposals() as Proposal [];
    setAllProposals(allProposals);
    setDisplayingProposals(
      allProposals.sort((p1, p2) => {
        return parseFloat(p2.created_at) - parseFloat(p1.created_at)
      }),
    )
  };

  useEffect(()=>{
    if(selectedProposals==='all'){
      setDisplayingProposals(allProposals.sort((p1, p2)=>{
        return parseFloat(p2.created_at) - parseFloat(p1.created_at)
      }));
      getAllProposals();
    };
    if(selectedProposals==='my'){
      setDisplayingProposals(myProposals.sort((p1, p2)=>{
        return parseFloat(p2.created_at) - parseFloat(p1.created_at)
      }));
      getMyProposals();
    }
  },[selectedProposals])

  useEffect(()=>{
    getMyProposals();
    getAllProposals();
  },[])

  useEffect(()=>{
    getMyProposals();
  }, [wallet])

  return (
    <div className="page-wrapper">
      <div className="header">
        <Header
          openNeuronModal={() => {
            setDisplayCreateNeuronModal(true)
          }}
          openProposalModal={() => {
            setDisplayCreateModalProposal(true)
          }}
        />
      </div>
      <CreateProposal
        visible={displayCreateProposalModal}
        setVisibility={setDisplayCreateModalProposal}
      />
      <CreateNeuron
        visible={displayCreateNeuronModal}
        setVisibility={setDisplayCreateNeuronModal}
      />
      <div className="homepage-nav-wrapper">
        <div className="homepage-nav">
          {wallet && (
            <div
              onClick={() => {
                setSelectedProposals("my")
              }}
              className={`homepage-nav-element ${
                selectedProposals === "my" ? "selected-nav" : ""
              }`}
            >
              My proposals
            </div>
          )}
          <div
            onClick={() => {
              setSelectedProposals("all")
            }}
            className={`homepage-nav-element ${
              selectedProposals === "all" ? "selected-nav" : ""
            }`}
          >
            All proposals
          </div>
        </div>
        <div className="horizontal-line"></div>
      </div>
      <div className="proposals-grid">
        {displayingProposals.map((proposal) => {
          return <ProposalCard key={proposal.proposalId} proposal={proposal} />
        })}
      </div>
    </div>
  )
}

export { HomePage }
