import { Neuron, Post, Proposal } from ".dfx/local/canisters/dao/dao.did"
import { useCanister, useWallet } from "@connect2ic/react"
import { DAY, DECIMALS, HOUR, MONTH, YEAR } from "../contants/constants"
import NanoDate from "nano-date"
import React, { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { AiOutlineArrowRight } from "react-icons/ai"
import { FidgetSpinner } from "react-loader-spinner"
import { useNavigate } from "react-router-dom"
import { CreateNeuron } from "./CreateNeuron"
import { CreateProposal } from "./CreateProposal"
import { Header } from "./Header"

const Proposal = () => {
  const [displayCreateProposalModal, setDisplayCreateModalProposal] =
    useState(false)
  const [displayCreateNeuronModal, setDisplayCreateNeuronModal] =
    useState(false)

  const [daoText, setDaoText] = useState("")

  const [backend] = useCanister("dao")
  const [wallet] = useWallet()

  const [proposal, setProposal] = useState<Proposal>()
  const [loading, setLoading] = useState(false)
  const [acceptanceThreshold, setAcceptanceThreshold] = useState("")
  const [minimumTokenAmount, setMinimumTokenAmount] = useState("")
  const [isVoteLoading, setIsVoteLoading] = useState(false)
  const [userVote, setUserVote] = useState(false)
  const [isUserVoted, setIsUserVoted] = useState(false)

  const [discussionPosts, setDiscussionposts] = useState<Post []>();
  const [newPost, setNewPost] = useState("");
  const [newPostLoading, setNewPostLoading] = useState(false);

  const [userNeuron, setUserNeuron] = useState<Neuron>()



  const navigate = useNavigate()

  const load = async () => {
    setUserVote(false);
    setIsUserVoted(false);
    let path = window.location.pathname
    var n = path.lastIndexOf("/")
    var proposalId = path.substring(n + 1)
    setLoading(true)
    Promise.all([
      await getProposal(proposalId),
      await getDaoText(),
      await getParameters(),
      await getUserNeuron(),
      await getPosts(proposalId),
    ])
    
    setLoading(false)
  }

  
  
  const handleNewPost = async () => {
    if(newPost.length <= 0){
      toast("Post content can not be empty!", {
        icon: "❌",
      })
      return;
    }
    let path = window.location.pathname
    var n = path.lastIndexOf("/")
    var proposalId = path.substring(n + 1)
    setNewPostLoading(true);
    let createPostReturn = await backend.discussion_post(proposalId, newPost) as any;
    if("ok" in createPostReturn){
      toast("Posted!", {
        icon: "✅",
      });
      setNewPost("");
      await getPosts(proposalId)
    }
    else{
      toast(createPostReturn.err, {
        icon: "❌",
      })
    };
    setNewPostLoading(false);
  }


  const getPosts = async (proposalId: string) =>{
    let posts = await backend.get_proposal_discussion_posts(proposalId) as Post[];
    setDiscussionposts(posts);
  }

  const getAcceptedWidth = () => {
    if (
      Number(proposal.voteAccepted) === 0 &&
      Number(proposal.voteRejected) === 0
    ) {
      return "50%"
    }
    return (
      (
        (parseFloat(proposal.voteAccepted?.toString()) /
          (parseFloat(proposal.voteAccepted?.toString()) +
            parseFloat(proposal.voteRejected?.toString()))) *
        100
      ).toString() + "%"
    )
  }

  const getUserNeuron = async () => {
    let my_neuron = (await backend.get_my_neuron()) as any
    if ("ok" in my_neuron) {
      setUserNeuron(my_neuron.ok)
      console.log(my_neuron)
    }
    if ("err" in my_neuron) {
    }
  }

  const getRejectedWidth = () => {
    if (
      Number(proposal.voteAccepted) === 0 &&
      Number(proposal.voteRejected) === 0
    ) {
      return "50%"
    }
    return (
      (
        (parseFloat(proposal.voteRejected?.toString()) /
          (parseFloat(proposal.voteAccepted?.toString()) +
            parseFloat(proposal.voteRejected?.toString()))) *
        100
      ).toString() + "%"
    )
  }

  const getParameters = async () => {
    let parameters = (await backend.get_parameters()) as any
    setMinimumTokenAmount((parseInt(parameters[0]) / DECIMALS).toString())
    setAcceptanceThreshold((parseInt(parameters[1]) / DECIMALS).toString())
  }

  const getProposal = async (id: string) => {
    let proposal = (await backend.get_proposal(id)) as any
    if ("ok" in proposal) {
      setProposal(proposal.ok)
    } else {
      toast("Proposal not found!", {
        icon: "❌",
      })
    }
    console.log(proposal)
  }

  const getDaoText = async () => {
    let text = (await backend.get_dao_controlled_text()) as string
    setDaoText(text)
  }

  const getProposalTopic = () => {
    switch (proposal.proposalType) {
      case "changePageContent":
        return "Change the webpage content."
      case "changeThreshold":
        return "Change the proposal acceptance threshold."
      case "changeMinimumAmount":
        return "Change the minimum amount of tokens to vote!"

      default:
        break
    }
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

  const handleVote = async (isAccepted: boolean) => {
    setIsVoteLoading(true)
    let vote_return = (await backend.vote(
      proposal.proposalId,
      isAccepted,
    )) as any
    if ("ok" in vote_return) {
      load()
    } else {
      toast(vote_return.err, {
        icon: "❌",
      })
    }
    setIsVoteLoading(false)
  }

  const handleQuadraticVote = async (isAccepted: boolean) => {
    setIsVoteLoading(true)
    let vote_return = (await backend.quadratic_voting(
      proposal.proposalId,
      isAccepted,
    )) as any
    if ("ok" in vote_return) {
      load()
    } else {
      toast(vote_return.err, {
        icon: "❌",
      })
    }
    setIsVoteLoading(false)
  }

  useEffect(() => {
    if (proposal && wallet) {
      proposal.votes.forEach((v) => {
        if (wallet.principal === v.voterPrincipal) {
          setUserVote(v.isAccepted)
          setIsUserVoted(true)
        }
      })
    }
  }, [proposal])

  useEffect(() => {
    if (backend) {
      load()
    }
  }, [backend])

  useEffect(() => {
    load()
  }, [window.location.pathname])
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
  if (proposal) {
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

        <div className="proposal-details-wrapper">
          <div className="proposal-details-flex">
            <div className="proposal-title">{proposal.proposalTitle}</div>
            <div className="proposal-id">
              {"Proposal id: #" + proposal.proposalId}
            </div>
            <div className="status-flex">
              <div>Status:</div>
              <div className={`proposal-status ${getStatus()}`}>
                {getStatus()}
              </div>
            </div>

            <div className="neuron-flex">
              <div className="neuron-id">
                {"Proposer neuron: #" + proposal.neuronId}
              </div>
              <div
                onClick={() => {
                  navigate("/neuron/" + proposal.neuronId)
                }}
                className="details"
              >
                See neuron
              </div>
            </div>
            <div className="dates-flex">
              <div className="date">
                {"Created at:  " +
                  new NanoDate(proposal.created_at).toLocaleString()}
              </div>
              {proposal.isProposalActive ? (
                null && proposal.resulted_at
              ) : (
                <div className="date">
                  {"Resulted at:  " +
                    new NanoDate(proposal.resulted_at[0]).toLocaleString()}
                </div>
              )}
            </div>
            <div className="topic-simulate-flex">
              <div className="proposal-title">
                {"Topic:  " + getProposalTopic()}
              </div>
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
            </div>

            {proposal.proposalType === "changePageContent" ? (
              <div className="proposal-code-flex">
                <div className="headers-flex" style={{ marginBottom: "10px" }}>
                  <div style={{ width: "100%" }}>Current HTML code</div>
                  <div style={{ width: "100%", marginLeft: "80px" }}>
                    Proposing HTML code
                  </div>
                </div>
                <div className="text-areas-wrapper">
                  <textarea
                    className="simulate-code"
                    value={daoText}
                    readOnly={true}
                  />

                  <AiOutlineArrowRight className="arrow" />
                  <textarea
                    className="simulate-code"
                    readOnly={true}
                    value={proposal.newPageContent[0]}
                  />
                </div>
              </div>
            ) : proposal.proposalType === "changeThreshold" ? (
              <div className="change-parameters-flex">
                <div className="box">
                  <div>Current acceptance threshold</div>
                  <div>{acceptanceThreshold + " X"}</div>
                </div>
                <AiOutlineArrowRight className="arrow" />
                <div className="box">
                  <div>Proposing acceptance threshold</div>
                  <div>
                    {(
                      parseInt(proposal.newAcceptanceThreshold[0].toString()) /
                      DECIMALS
                    ).toString() + " X"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="change-parameters-flex">
                <div className="box">
                  <div>Current token amount</div>
                  <div>{minimumTokenAmount + " MB"}</div>
                </div>
                <AiOutlineArrowRight className="arrow" />
                <div className="box">
                  <div>Proposing token amount</div>
                  <div>
                    {(
                      parseInt(proposal.newMinimumAmountOfToken[0].toString()) /
                      DECIMALS
                    ).toString() + " MB"}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="vote-voters-flex">
            <div className="vote-flex">
              <div className="proposal-title">Vote</div>
              <div className="voting-bar-flex">
                <div className="yes-no">
                  <div>{`Yes (${(
                    parseFloat(proposal.voteAccepted?.toString()) / 100000000
                  )
                    .toFixed(2)
                    ?.toString()} X)`}</div>
                  <div>{`(${(
                    parseFloat(proposal.voteRejected?.toString()) / 100000000
                  )
                    .toFixed(2)
                    ?.toString()} X) No`}</div>
                </div>
                <div className="voting-bar">
                  <div
                    style={{ width: getAcceptedWidth() }}
                    className="accepted-bar"
                  />
                  <div
                    style={{ width: getRejectedWidth() }}
                    className="rejected-bar"
                  />
                </div>
              </div>
              {isVoteLoading ? (
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
              ) : !proposal.isProposalActive ? (
                <div className="quadratic-neuron-vote-flex">
                  <div className="box">
                    <div className="proposal-title" style={{ margin: "20px" }}>
                      Voting has ended!
                    </div>
                  </div>
                </div>
              ) : isUserVoted ? (
                <div className="quadratic-neuron-vote-flex">
                  {userNeuron && (
                    <div className="box">
                      <div
                        className="proposal-title"
                        style={{ margin: "20px" }}
                      >
                        Already voted as
                      </div>
                      <div className={userVote ? "yes-button" : "no-button"}>
                        {userVote ? "Yes" : "No"}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="quadratic-neuron-vote-flex">
                  {userNeuron && (
                    <div className="box">
                      <div className="proposal-title">Vote with neuron</div>
                      <div className="vote-buttons-flex">
                        <div
                          className="yes-button"
                          onClick={async () => {
                            await handleVote(true)
                          }}
                        >
                          Yes
                        </div>
                        <div
                          className="no-button"
                          onClick={async () => {
                            await handleVote(false)
                          }}
                        >
                          No
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="box">
                    <div className="proposal-title">Quadratic vote</div>
                    <div className="vote-buttons-flex">
                      <div
                        className="yes-button"
                        onClick={async () => {
                          await handleQuadraticVote(true)
                        }}
                      >
                        Yes
                      </div>
                      <div
                        className="no-button"
                        onClick={async () => {
                          await handleQuadraticVote(false)
                        }}
                      >
                        No
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="vote-flex">
              <div className="proposal-title">Voted neurons</div>
              <div className="voted-neurons-flex">
                {proposal.votes.map((v) => {
                  if (v.neuronId.length) {
                    return (
                      <div key={v.proposalId} className="neuron-list-item">
                        <div>{"#" + v.neuronId[0]}</div>
                        <div
                          className={
                            v.isAccepted ? "neuron-list-yes" : "neuron-list-no"
                          }
                        >
                          {v.isAccepted ? "Yes" : "No"}
                        </div>
                        <div
                          onClick={() => {
                            navigate("/neuron/" + v.neuronId[0])
                          }}
                          className="details"
                        >
                          See neuron
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="chat-wrapper">
          <div className="proposal-title" style={{ marginBottom: "25px" }}>
            Discussion chat
          </div>
          {discussionPosts.length < 100 && (
            <div
              className="title-flex"
              style={
                newPostLoading
                  ? { padding: "10px", alignItems: "center", height: "150px" }
                  : { padding: "10px", height: "150px" }
              }
            >
              <div className="submit-post-flex">
                <div className="topic">
                  {"New post (" + newPost.length + ")"}
                </div>
                <div
                  onClick={async () => {
                    if (!newPostLoading) {
                      await handleNewPost()
                    }
                  }}
                  className="submit-post-button"
                >
                  Share
                </div>
              </div>
              {newPostLoading ? (
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
              ) : (
                <textarea
                  className="text-area"
                  value={newPost}
                  onChange={(e) => {
                    if (e.target.value.length <= 280) {
                      if (!newPostLoading) {
                        setNewPost(e.target.value)
                      }
                    }
                  }}
                />
              )}
            </div>
          )}
          {discussionPosts?.map((p) => {
            return (
              <div className="post-wrapper">
                <div
                  className="neuron-flex"
                  style={{
                    width: "100%",
                    marginTop: "5px",
                    marginBottom: "5px",
                  }}
                >
                  <div>{"Neuron id: #" + p.neuronId}</div>
                  <div
                    onClick={() => {
                      navigate("/neuron/" + p.neuronId)
                    }}
                    className="details"
                  >
                    See writer neuron
                  </div>
                </div>
                <div className="vote-power">
                  {"Vote power: " + parseInt(p.neuronPower) / DECIMALS + " X"}
                </div>
                <textarea
                  className="read-post"
                  readOnly={true}
                  value={p.content}
                />
              </div>
            )
          })}
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
    </div>
  )
}

export { Proposal }
