import React, { useState } from "react"
import { useBalance, useCanister, useWallet } from "@connect2ic/react"
import { FidgetSpinner } from "react-loader-spinner"
import NanoDate from "nano-date"
import { toast } from "react-hot-toast"
import { Neuron, Proposal } from ".dfx/local/canisters/dao/dao.did"
import { AiFillCopy } from "react-icons/ai"
import { useNavigate } from "react-router-dom"

const ProposalCard = (props: { proposal: Proposal}) => {
  let proposal = props.proposal
  let createdDate = new NanoDate(proposal.created_at)

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false)
  const [backend] = useCanister("dao")
  const [wallet] = useWallet();

  const getProposalType = () =>{
    switch (proposal.proposalType) {
        case "changeMinimumAmount":
            return "Change minimum amount to vote."
        case "changeThreshold":
            return "Change proposal acceptance threshold.";

        case "changePageContent":
            return "Change the webpage content!";
        default:
            return "Invalid.";
            break;
    }
  };

  const getAcceptedWidth = () => {
    if(Number(proposal.voteAccepted) === 0 && Number(proposal.voteRejected) === 0){
        return '50%';
    };
    return (
      (
        (parseFloat(proposal.voteAccepted?.toString()) /
          (parseFloat(proposal.voteAccepted?.toString()) +
            parseFloat(proposal.voteRejected?.toString()))) *
        100
      ).toString() + "%"
    )
  }
  const getRejectedWidth = () => {
    if(Number(proposal.voteAccepted) === 0 && Number(proposal.voteRejected) === 0){
        return '50%';
    };
    return (
      (
        (parseFloat(proposal.voteRejected?.toString()) /
          (parseFloat(proposal.voteAccepted?.toString()) +
            parseFloat(proposal.voteRejected?.toString()))) *
        100
      ).toString() + "%"
    )
  }

  const getStatus = () => {
    if (proposal.isProposalActive) {
      return "Active"
    } else {
      if (proposal.voteAccepted > proposal.voteRejected) {
        return "Accepted"
      } else {
        return "Rejected"
      }
    }
  }

  return (
    <div className="proposal-card">
      <div className="proposal-id-owner-flex">
        <div className="id">{"#" + proposal.proposalId}</div>
        <div className="title">
          {proposal.proposalTitle.slice(0.15) +
            (proposal.proposalTitle.length >= 18 ? "..." : "")}
        </div>
        <div className="owner-flex">
          <div className="owner">{proposal.owner?.slice(0, 3) + "..."}</div>
          <AiFillCopy
            onClick={() => {
              navigator.clipboard.writeText(proposal.owner)
              toast("Copied to clipboard!", {
                icon: "✅",
              })
            }}
          />
        </div>
      </div>
      <div className="neuron-flex">
        <div className="neuron-id">{"Neuron id:  #" + proposal.neuronId}</div>
        <div
          onClick={() => {
            navigate("/neuron/" + proposal.neuronId)
          }}
          className="details"
        >
          See neuron
        </div>
      </div>
      <div className="status-flex">
        <div>Status:</div>
        <div className={`proposal-status ${getStatus()}`}>{getStatus()}</div>
      </div>
      <div className="voting-bar-flex">
        <div className="yes-no">
          <div>{`Yes (${(
            parseFloat(proposal.voteAccepted?.toString()) / 100000000
          )
            .toFixed(2)
            ?.toString()} X)`}</div>
          <div>{`(${(parseFloat(proposal.voteRejected?.toString()) / 100000000)
            .toFixed(2)
            ?.toString()} X) No`}</div>
        </div>
        <div className="voting-bar">
          <div style={{ width: getAcceptedWidth() }} className="accepted-bar" />
          <div style={{ width: getRejectedWidth() }} className="rejected-bar" />
        </div>
      </div>
      <div className="dates-flex">
        <div className="date">
          {"Created at:  " + createdDate.toLocaleString()}
        </div>
        {proposal.isProposalActive ? null : (
          <div className="date">
            {"Resulted at:  " +
              new NanoDate(proposal.resulted_at[0]).toLocaleString()}
          </div>
        )}
      </div>
      <div className="proposal-text-flex">
        <div className="proposal-text-header">Topic:</div>
        <div className="proposal-type">{getProposalType()}</div>
      </div>
      <div className="simulate-details-flex">
        {proposal.proposalType === "changePageContent" ? (
          <div
            className="simulate-button"
            onClick={() => {
              window.open(
                "https://wvlqu-tqaaa-aaaak-aeahq-cai.raw.ic0.app/" +
                  proposal.proposalId,
                "_blank",
              )
            }}
          >
            Simulate the proposal
          </div>
        ) : null}
        <div
          onClick={() => {
            navigate("/proposal/" + proposal.proposalId)
          }}
          className="details"
        >
          Discuss and vote!
        </div>
      </div>
    </div>
  )
}

export { ProposalCard }
