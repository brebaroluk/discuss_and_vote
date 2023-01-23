import { Neuron, Proposal } from ".dfx/local/canisters/dao/dao.did"
import { useCanister, useWallet } from "@connect2ic/react"
import { DAY, DECIMALS, HOUR, MONTH, YEAR } from "../contants/constants"
import React, { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { AiFillCopy } from "react-icons/ai"
import { FidgetSpinner } from "react-loader-spinner"
import { useNavigate } from "react-router-dom"
import { CreateNeuron } from "./CreateNeuron"
import { CreateProposal } from "./CreateProposal"
import { Header } from "./Header"
import { Principal } from "@dfinity/principal"
import { ManageNeuron } from "./ManageNeuron"

const Neuron = () => {
  const [displayCreateProposalModal, setDisplayCreateModalProposal] =
    useState(false)
    const [displayManageNeuronModal, setDisplayManageNeuronModal] =
    useState(false)
  const [displayCreateNeuronModal, setDisplayCreateNeuronModal] =
    useState(false)
  const [loading, setLoading] = useState(false)

  const [backend] = useCanister("dao")
  const [tokenCanister] = useCanister("tokenCanister")

  const [neuron, setNeuron] = useState<Neuron>()
  const [createdProposals, setCreatedProposals] = useState<Proposal[]>()
  const [neuronOwnerBalance, setNeuronOwnerBalance] = useState("0")
  const [ownerBigintBalance, setOwnerBigintBalance] = useState<bigint>()
  const [wallet] = useWallet()

  const getStatus = (proposal: Proposal) => {
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

  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    await Promise.all([await getNeuron()])
    setLoading(false)
  }

  const getNeuron = async () => {
    let path = window.location.pathname
    var n = path.lastIndexOf("/")
    var proposalId = path.substring(n + 1)
    let neuron = (await backend.get_neuron(proposalId)) as any
    if ("ok" in neuron) {
      setNeuron(neuron.ok)
    } else {
      toast(neuron.err, {
        icon: "❌",
      })
    }
  }

  const getNeuronDissolveDelay = () => {
    if (neuron) {
      let ms = parseInt(neuron.minimumDissolvingTime)
      let years = Math.floor(ms / YEAR)
      let years_remaining = ms - years * YEAR
      let months = Math.floor(years_remaining / MONTH)
      let months_remaining = years_remaining - months * MONTH
      let days = Math.floor(months_remaining / DAY)
      let days_remaining = months_remaining - days * DAY
      let hours = Math.floor(days_remaining / HOUR)
      return (
        years +
        "years, " +
        months +
        "months, " +
        days +
        "days, " +
        hours +
        "hours"
      )
    }
  }

  const getNeuronProposals = async () => {
    let neuronProposals = (await backend.get_proposals_by_ids(
      neuron.createdProposalIds,
    )) as Proposal[]
    setCreatedProposals(neuronProposals)
  }

  const getOwnerTokenBalance = async () => {
    const balance = (await tokenCanister.icrc1_balance_of({
      owner: Principal.fromText(neuron.owner),
      subaccount: [],
    })) as bigint
    setOwnerBigintBalance(balance)
    setNeuronOwnerBalance((parseFloat(balance.toString()) / DECIMALS).toFixed(2))
  }

  useEffect(() => {
    if (backend) {
      load()
    }
  }, [backend])

  useEffect(() => {
    load()
  }, [window.location.pathname])

  useEffect(() => {
    if (neuron) {
      getNeuronProposals()
      getOwnerTokenBalance()
    }
  }, [neuron])

  if (loading) {
    return (
      <div className="page-wrapper">
        <CreateProposal
          visible={displayCreateProposalModal}
          setVisibility={setDisplayCreateModalProposal}
        />
        <CreateNeuron
          visible={displayCreateNeuronModal}
          setVisibility={setDisplayCreateNeuronModal}
        />
        <ManageNeuron
          load={load}
          neuron={neuron}
          visible={displayManageNeuronModal}
          setVisibility={setDisplayManageNeuronModal}
        />
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

        <div className="fidget-wrapper">
          <FidgetSpinner
            visible={true}
            height="80"
            width="80"
            ariaLabel="dna-loading"
            wrapperStyle={{}}
            wrapperClass="dna-wrapper"
            ballColors={["#ff0000", "#00ff00", "#0000ff"]}
            backgroundColor="#F4442E"
          />
        </div>
      </div>
    )
  }
  return (
    <div className="page-wrapper">
      <CreateProposal
        visible={displayCreateProposalModal}
        setVisibility={setDisplayCreateModalProposal}
      />
      <CreateNeuron
        visible={displayCreateNeuronModal}
        setVisibility={setDisplayCreateNeuronModal}
      />
      <ManageNeuron
        load={load}
        neuron={neuron}
        visible={displayManageNeuronModal}
        setVisibility={setDisplayManageNeuronModal}
      />
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
      <div className="neuron-details-wrapper">
        <div
          className="neuron-details-flex"
          style={
            displayCreateProposalModal ||
            displayCreateNeuronModal ||
            displayManageNeuronModal
              ? { position: "inherit" }
              : { position: "relative" }
          }
        >
          {neuron?.owner === wallet?.principal && !displayManageNeuronModal && (
            <div
              onClick={() => {
                setDisplayManageNeuronModal(true)
                
              }}
              className="create-neuron-button"
              style={{ position: "absolute", top: "20px", right: "20px" }}
            >
              Manage neuron
            </div>
          )}
          {neuron?.owner === wallet?.principal && !displayManageNeuronModal && (
            <div
              onClick={ async() => {
                setLoading(true)
                toast(
                  "Checking if there's any token locked that you can withdraw!",
                  {
                    icon: "✅",
                  },
                )
                setTimeout(()=>{
                  setLoading(false);
                }, 8000)
                await backend.send_back_locked_tokens(Principal.fromText(wallet.principal))
                await load();
                setLoading(false)
              }}
              className="create-neuron-button"
              style={{ position: "absolute", top: "20px", right: "200px" }}
            >
              Check payments
            </div>
          )}
          <div className="proposal-id">{"Neuron id: #" + neuron?.neuronId}</div>
          <div className="status-flex">
            <div>Status:</div>
            <div className={`proposal-status ${neuron?.status}`}>
              {neuron?.status}
            </div>
          </div>
          <div className="status-flex">
            <div>Dissolve delay:</div>
            <div className={`proposal-status ${neuron?.status}`}>
              {getNeuronDissolveDelay()}
            </div>
          </div>
          <div className="user-balance-flex" style={{ marginLeft: "2.5%" }}>
            <div className="principal-id">
              <div>{"Principal id: " + neuron?.owner}</div>
              <AiFillCopy
                onClick={() => {
                  navigator.clipboard.writeText(neuron?.owner)
                  toast("Copied to clipboard!", {
                    icon: "✅",
                  })
                }}
              />
            </div>
            <div className="balance-text">
              {"Locked balance: " +
                (parseFloat(neuron?.lockedBalance) / DECIMALS)
                  .toFixed(2)
                  .toString()}
            </div>
            <div className="balance-text">
              {"Total balance: " + neuronOwnerBalance + " MB"}
            </div>
            <div className="balance-text">
              {"Neuron vote power: " +
                (parseFloat(neuron?.votePower) / DECIMALS).toFixed(2) +
                " X"}
            </div>
            <div className="balance-text">
              {"Quadratic vote power: " +
                Math.sqrt(
                  parseFloat(ownerBigintBalance?.toString()) / DECIMALS,
                ).toFixed(2) +
                " X"}
            </div>
          </div>
        </div>
        <div className="vote-voters-flex">
          <div className="vote-flex">
            <div className="proposal-title">Voted proposals</div>
            <div className="voted-neurons-flex">
              {neuron?.votes.map((v) => {
                if (v.neuronId.length) {
                  return (
                    <div key={v.proposalId} className="neuron-list-item">
                      <div>{"#" + v.proposalId}</div>
                      <div
                        className={
                          v.isAccepted ? "neuron-list-yes" : "neuron-list-no"
                        }
                      >
                        {v.isAccepted ? "Yes" : "No"}
                      </div>
                      <div
                        onClick={() => {
                          navigate("/proposal/" + v.proposalId)
                        }}
                        className="details"
                      >
                        See proposal
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          </div>
          <div className="vote-flex">
            <div className="proposal-title">Created proposals</div>
            <div className="voted-neurons-flex">
              {createdProposals?.map((p) => {
                return (
                  <div key={p.proposalId} className="neuron-list-item">
                    <div>{"#" + p.proposalId}</div>
                    <div className={`proposal-status ${getStatus(p)}`}>
                      {getStatus(p)}
                    </div>
                    <div
                      onClick={() => {
                        navigate("/proposal/" + p.proposalId)
                      }}
                      className="details"
                    >
                      See proposal
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Neuron }
