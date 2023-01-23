import { useCanister, useWallet } from "@connect2ic/react"
import { DECIMALS } from "../contants/constants"
import React, { useEffect, useState } from "react"
import Dropdown from "react-bootstrap/Dropdown"
import DropdownButton from "react-bootstrap/DropdownButton"
import { Header } from "./Header"
import { FidgetSpinner } from "react-loader-spinner"
import toast from "react-hot-toast"
import { SubmitProposalModal } from ".dfx/local/canisters/dao/dao.did"
import { useNavigate } from "react-router-dom"

const CreateProposal = (props: {
  visible: boolean
  setVisibility: Function
}) => {
  const [topic, setTopic] = useState("changePageContent")
  const [title, setTitle] = useState("")
  const [html, setHtml] = useState("")
  const [acceptanceThreshold, setAcceptanceThreshold] = useState("")
  const [minimumTokenAmount, setMinimumTokenAmount] = useState("")
  const [acceptanceThresholdInput, setAcceptanceThresholdInput] = useState("0")
  const [minimumTokenAmountInput, setMinimumTokenAmountInput] = useState("0")
  const [loading, setLoading] = useState(true)

  const [backend] = useCanister("dao")
  const [wallet] = useWallet()

  const navigate = useNavigate()

  const getParameters = async () => {
    setLoading(true)
    let parameters = (await backend.get_parameters()) as any
    setMinimumTokenAmount((parseInt(parameters[0]) / DECIMALS).toString())
    setAcceptanceThreshold((parseInt(parameters[1]) / DECIMALS).toString())
    setMinimumTokenAmountInput((parseInt(parameters[0]) / DECIMALS).toString())
    setAcceptanceThresholdInput((parseInt(parameters[1]) / DECIMALS).toString())
    setLoading(false)
  }

  const handleSubmitProposal = async () => {
    if (title.length === 0) {
      toast("Title field can not be empty!", {
        icon: "❌",
      })
      return
    }
    if (title.length > 40) {
      toast("Title can not be longer than 140 characters!", {
        icon: "❌",
      })
      return
    }
    if (topic === "changePageContent" && html.length === 0) {
      toast("HTML code field can not be empty!", {
        icon: "❌",
      })
      return
    }
    let args: SubmitProposalModal = {
      newPageContent: [html],
      proposalType: topic,
      proposalTitle: title,
      newMinimumAmountOfToken: [
        BigInt(parseInt(minimumTokenAmountInput) * DECIMALS),
      ],
      newAcceptanceThreshold: [
        BigInt(parseInt(acceptanceThresholdInput) * DECIMALS),
      ],
    }
    let submit_proposal_return = (await backend.submit_proposal(args)) as any

    if ("ok" in submit_proposal_return) {
      toast("Proposal is created succesfully!", {
        icon: "✅",
      })
      props.setVisibility(false);
      navigate("/proposal/" + submit_proposal_return.ok.proposalId)
    } else {
      toast(submit_proposal_return.err, {
        icon: "❌",
      })
    }
  }

  useEffect(() => {
    getParameters()
  }, [wallet])

  if (!props.visible) {
    return null
  }
  if (loading) {
    return (
      <div className="modal-wrapper">
        <div className="modal-container">
          <div
            onClick={() => {
              props.setVisibility(false)
              setHtml("")
              setTitle("")
              setTopic("changePageContent")
            }}
            className="cancel-button"
          >
            Cancel
          </div>
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
  } else {
    return (
      <div className="modal-wrapper">
        <div className="modal-container">
          <div
            onClick={() => {
              props.setVisibility(false)
              setHtml("")
              setTitle("")
              setTopic("changePageContent")
            }}
            className="cancel-button"
          >
            Cancel
          </div>
          <div className="create-neuron-header">Create a proposal</div>
          <div className="topic-select-flex">
            <div className="topic">Topic: </div>
            <select
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value)
              }}
            >
              <option value="changePageContent">
                Change the content of the page.
              </option>
              <option value="changeThreshold">
                Change the acceptance threshold.
              </option>
              <option value="changeMinimumAmount">
                Change the minimum amount of token to vote.
              </option>
            </select>
          </div>
          <div className="title-flex">
            <div className="topic">{`Title: (${title.length})`}</div>
            <textarea
              className="text-area"
              value={title}
              onChange={(e) => {
                if (e.target.value.length < 40) {
                  setTitle(e.target.value)
                }
              }}
            />
          </div>
          {topic === "changePageContent" ? (
            <div className="code-input-flex">
              <div className="topic">{`HTML code (${html.length})`}</div>
              <textarea
                className="code-area"
                value={html}
                onChange={(e) => {
                  if (e.target.value.length < 2000) {
                    setHtml(e.target.value)
                  }
                }}
              />
            </div>
          ) : topic === "changeThreshold" ? (
            <div className="set-dissolve-delay-flex">
              <div
                className="create-neuron-header"
                style={{ marginBottom: "40px" }}
              >
                Acceptance threshold
              </div>
              <div className="proposal-headers-flex">
                <div className="dissolve-header">Current</div>
                <div className="dissolve-header">Proposal</div>
              </div>
              <div className="proposal-values-flex">
                <input
                  className="dissolve-input"
                  readOnly={true}
                  value={acceptanceThreshold}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="dissolve-input"
                  value={acceptanceThresholdInput}
                  onChange={(evt) => {
                    if (
                      evt.target.value.length < 8 &&
                      parseInt(evt.target.value) > 0
                    ) {
                      setAcceptanceThresholdInput(evt.target.value)
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="set-dissolve-delay-flex">
              <div
                className="create-neuron-header"
                style={{ marginBottom: "40px" }}
              >
                Minimum amount of token to vote
              </div>
              <div className="proposal-headers-flex">
                <div className="dissolve-header">Current</div>
                <div className="dissolve-header">Proposal</div>
              </div>
              <div className="proposal-values-flex">
                <input
                  className="dissolve-input"
                  readOnly={true}
                  value={minimumTokenAmount}
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="dissolve-input"
                  value={minimumTokenAmountInput}
                  onChange={(evt) => {
                    if (
                      evt.target.value.length < 8 
                    ) {
                      setMinimumTokenAmountInput(evt.target.value)
                    }
                    
        
                  }}
                />
              </div>
            </div>
          )}
          <div
            onClick={async () => {
              setLoading(true)
              await handleSubmitProposal()
              setLoading(false)
            }}
            className="create-neuron-button"
          >
            Submit proposal
          </div>
        </div>
      </div>
    )
  }
}

export { CreateProposal }
