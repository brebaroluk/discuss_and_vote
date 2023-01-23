import { useCanister, useWallet } from "@connect2ic/react"
import React, { useEffect, useState } from "react"
import { toast } from "react-hot-toast";
import { AiFillCopy } from 'react-icons/ai';
import { Principal } from "@dfinity/principal";
import { Neuron } from ".dfx/local/canisters/dao/dao.did";
import { walletProviders } from "@connect2ic/core/providers";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.png'


const Header = (props: {openProposalModal: Function, openNeuronModal: Function}) => {
  /*
  * This how you use canisters throughout your app.
  */
  const [tokenCanister] = useCanister("tokenCanister")
  const [backend] = useCanister("dao");
  const [balance, setBalance] = useState<string>("0")
  const [userNeuron, setUserNeuron] = useState<Neuron>();
  const [wallet] = useWallet();
  const [ownsNeuron, setOwnsNeuron] = useState(true);
  const navigate = useNavigate();

  const refreshBalance = async () => {
    const balance = await tokenCanister.icrc1_balance_of({
        owner: Principal.fromText(wallet.principal),
        subaccount: []
    }) as bigint;
    setBalance(balance.toString())
  };

  const getMyNeuron = async () =>{
    let my_neuron = await backend.get_my_neuron() as any;
    if("ok" in my_neuron){
        setUserNeuron(my_neuron.ok)
    }
    if("err" in my_neuron && wallet){
        console.log(wallet)
        setOwnsNeuron(false);
    }
    
    
  };

  useEffect(()=>{
    if(wallet){
        getMyNeuron();
    }
  }, [backend])

  useEffect(()=>{
    if(tokenCanister && wallet){
      refreshBalance()
    }

  },[tokenCanister])

  if(!wallet){
    return (
      <div className="header-container">
        <img
          src={logo}
          className={"logo"}
          onClick={() => {
            navigate("/")
          }}
        />
        <div
          onClick={() => {
            window.open(
              "https://hluyh-paaaa-aaaag-abe2a-cai.raw.ic0.app/",
              "_blank",
            )
          }}
          className="faucet-url"
        >
          <div>Go to DAO controlled Webpage!</div>
        </div>
      </div>
    )
  }
  return (
    <div className="header-container">
      <div style={{ display: "flex" }}>
        <img src={logo} className={'logo'} onClick={()=>{
          navigate('/')
        }} />
        <div className="principal">
          <div>Principal Id</div>
          <div className="principal-flex">
            <div>
              {wallet.principal.slice(0, 5) +
                "..." +
                wallet.principal.slice(58, 63)}
            </div>
            <div
              className="icon-wrapper"
              onClick={() => {
                navigator.clipboard.writeText(wallet.principal)
                toast("Copied to clipboard!", {
                  icon: "✅",
                })
              }}
            >
              <AiFillCopy />
            </div>
          </div>
        </div>
        <div className="token-balance">
          <div>MB token balance</div>
          <div>{(parseFloat(balance?.toString()) / 100000000)?.toString()}</div>
        </div>
        <div
          onClick={() => {
            window.open(
              "https://dpzjy-fyaaa-aaaah-abz7a-cai.ic0.app/",
              "_blank",
            )
          }}
          className="faucet-url"
        >
          <div>Get MB token!</div>
        </div>
        <div
          onClick={() => {
            window.open(
              "https://hluyh-paaaa-aaaag-abe2a-cai.raw.ic0.app/",
              "_blank",
            )
          }}
          className="faucet-url"
        >
          <div>Go to DAO controlled Webpage!</div>
        </div>
      </div>
      <div className="create-neuron-proposal-flex">
        {userNeuron ? (
          <div
            onClick={() => {
              navigate("/neuron/" + userNeuron.neuronId)
            }}
            className="create-neuron"
          >
            See your neuron
          </div>
        ) : (
          !ownsNeuron &&
          !userNeuron && (
            <div
              onClick={() => {
                props.openNeuronModal()
              }}
              className="create-neuron"
            >
              Create neuron
            </div>
          )
        )}
        <div
          onClick={() => {
            props.openProposalModal()
          }}
          className="new-proposal"
        >
          New proposal
        </div>
      </div>
    </div>
  )
}

export { Header }