import { useCanister, useWallet } from "@connect2ic/react"
import React, { useEffect, useState } from "react"
import { Header } from "./Header"
import { Principal } from "@dfinity/principal";
import { AiFillCopy } from "react-icons/ai";
import toast from "react-hot-toast";
import { FidgetSpinner } from "react-loader-spinner";
import { HOUR, DAY, MONTH, YEAR, FEE, DECIMALS, DAO_CANISTER_ID } from "../contants/constants";
import { Result, TransferArgs } from "../token-canister-service/token.did";
import { useNavigate } from "react-router-dom";
import { AccountIdentifier, accountIdentifierFromBytes } from "@dfinity/nns";
import { Neuron } from ".dfx/local/canisters/dao/dao.did";


const ManageNeuron = (props: {
  visible: boolean
  setVisibility: Function
  neuron: Neuron | undefined
  load: Function
}) => {
    const [loading, setLoading] = useState(props.neuron===undefined);
    const [tokenCanister] = useCanister("tokenCanister");
    const [backend] = useCanister("dao");
    const [balance, setBalance] = useState("");
    const [balanceBigInt, setBalanceBigInt] = useState<bigint>();
    const [lockingTokenAmount, setLockingTokenAmount] = useState("0");
    const [wallet] = useWallet();
    const [year, setYear] = useState("0");
    const [month, setMonth] = useState("6");
    const [day, setDay] = useState("0");
    const [hour, setHour] = useState("0")

    const [isLocked, setIsLocked] = useState(props.neuron?.status==='Locked');
    const navigate = useNavigate();

    const refreshBalance = async () => {
      setLoading(true);
      const balance = await tokenCanister.icrc1_balance_of({
          owner: Principal.fromText(wallet.principal),
          subaccount: []
      }) as bigint;
      setBalance(
        (parseFloat(balance.toString()) / 100000000).toFixed(2).toString(),
      )
      setBalanceBigInt(balance)
      setLoading(false)
      
    };

    const handleUpdateNeuron = async () =>{
      let lockTime = parseInt(year) * YEAR + parseInt(month) * MONTH + parseInt(day) *DAY + parseInt(hour) * HOUR
      if(lockTime < parseInt(props.neuron.minimumDissolvingTime)){
        toast("User can not decrease the lock time!", {
          icon: "❌",
        })
        return;
      }

      if(lockingTokenAmount !== '0'){
        let subaccount = await backend.get_subaccount_to_lock_tokens_by_principal(wallet.principal) as Uint8Array;
        let subaccountArray = [...subaccount];
        var transferArgs: TransferArgs = {
          to: {
            owner: Principal.fromText(DAO_CANISTER_ID),
            subaccount: [subaccountArray],
          },
          fee: [BigInt(FEE)],
          memo: [],
          from_subaccount: [],
          created_at_time: [],
          amount: BigInt(parseInt(lockingTokenAmount) * DECIMALS),
        };
        let transferReturn = await tokenCanister.icrc1_transfer(transferArgs) as Result;
        
        if(!("ok" in transferReturn)){
          toast("An error occured while trying to lock the tokens! It's probably too low!", {
            icon: "❌",
          })
          setLoading(false)
          return
        }
        
      }
      if(props.neuron.status==='Locked' && !isLocked){
        let dissolveReturn = (await backend.dissolveNeuron(
          props.neuron.neuronId,
        )) as any
        if ("err" in dissolveReturn) {
          toast(dissolveReturn.err, {
            icon: "❌",
          })

          setLoading(false)
          return
        }
      }

      let updateReturn = (await backend.updateNeuron(
        props.neuron.neuronId,
        !(props.neuron.status === "Locked" && !isLocked),
        [BigInt(lockTime)],
      )) as any
      
      
      if ("ok" in updateReturn) {
        toast("Success!", {
          icon: "✅",
        })
        await props.load();
        props.setVisibility(false)
      } else {
        toast(updateReturn.err, {
          icon: "❌",
        })
        await backend.send_back_locked_tokens(
          Principal.fromText(wallet.principal),
        )

        setLoading(false)
      }
    }

    const changeYear = (val) => {
      if(parseInt(val) >= 8){
        setMonth("0");
        setDay("0");
        setHour("0");
        setYear("8");
        return;
      };
      setYear(val);
    }

    const changeMonth = (val) => {
      if(year === '8') return;
      if(parseInt(val) >= 12){
        changeYear((parseInt(year) + 1).toString());
        setMonth("0")
        return;
      }
      setMonth(val);
    }

    const changeDay = (val) => {
      if(year === '8') return;
      if(parseInt(val) >= 30){
        changeMonth((parseInt(month) + 1).toString());
        setDay("0")
        return;
      }
      setDay(val);
    }

    const changeHour = (val) => {
      if(year === '8') return;
      if(parseInt(val) >= 24){
        changeDay((parseInt(day) + 1).toString());
        setHour("0")
        return;
      }
      setHour(val)
    }

    const fillFields = () => {
      if(props.neuron){
        let dissolve_delay = getNeuronDissolveDelay(props.neuron);
        console.log(dissolve_delay);
        setYear(dissolve_delay[0].toString())
        setMonth(dissolve_delay[1].toString())
        setHour(dissolve_delay[3].toString())
        setDay(dissolve_delay[2].toString())
        setIsLocked(props.neuron.status === "Locked")
      }
    }

    const getNeuronDissolveDelay = (neuron: Neuron) => {
      if (neuron) {
        let ms = parseInt(neuron.minimumDissolvingTime)
        let years = Math.floor(ms / YEAR)
        let years_remaining = ms - years * YEAR
        let months = Math.floor(years_remaining / MONTH)
        let months_remaining = years_remaining - months * MONTH
        let days = Math.floor(months_remaining / DAY)
        let days_remaining = months_remaining - days * DAY
        let hours = Math.floor(days_remaining / HOUR)
        return [years, months, days, hours + 1]
      }
    }


    useEffect(()=>{
      if(wallet){
        refreshBalance()
        fillFields()
      }
      
    },[props])

    console.log(isLocked)

    if(!props.visible){
        return null
    }
    else{
        if(loading){
          return (
            <div className="modal-wrapper">
              <div className="modal-container">
                <div
                  onClick={() => {
                    props.setVisibility(false)
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
        }
      
        return (
          <div className="modal-wrapper">
            <div className="modal-container">
              <div
                onClick={() => {
                  props.setVisibility(false)
                }}
                className="cancel-button"
              >
                Cancel
              </div>
              <div className="create-neuron-header">Manage your neuron</div>
              <div className="user-balance-flex">
                <div className="principal-id">
                  <div>{"Principal id: " + props.neuron?.owner}</div>
                  <AiFillCopy
                    onClick={() => {
                      navigator.clipboard.writeText(props.neuron?.owner)
                      toast("Copied to clipboard!", {
                        icon: "✅",
                      })
                    }}
                  />
                </div>
                <div className="balance-text">
                  {"Locked balance: " +
                    (parseFloat(props.neuron?.lockedBalance) / DECIMALS)
                      .toFixed(2)
                      .toString()}
                </div>
                <div className="balance-text">
                  {"Total balance: " + balance + " MB"}
                </div>
                <div className="balance-text">
                  {"Neuron vote power: " +
                    (parseFloat(props.neuron?.votePower) / DECIMALS).toFixed(
                      2,
                    ) +
                    " X"}
                </div>
                <div className="balance-text">
                  {"Quadratic vote power: " +
                    Math.sqrt(
                      parseFloat(balanceBigInt?.toString()) / DECIMALS,
                    ).toFixed(2) +
                    " X"}
                </div>
              </div>
              <div className="set-dissolve-delay-flex">
                <div
                  className="create-neuron-header"
                  style={{ marginBottom: "40px" }}
                >
                  Set dissolve delay
                </div>
                <div className="headers-flex">
                  <div className="dissolve-header">Year</div>
                  <div className="dissolve-header">Month</div>
                  <div className="dissolve-header">Day</div>
                  <div className="dissolve-header">Hour</div>
                </div>
                <div className="values-flex">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={8}
                    className="dissolve-input"
                    value={year}
                    onChange={(evt) => {
                      changeYear(evt.target.value)
                    }}
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={12}
                    className="dissolve-input"
                    value={month}
                    onChange={(evt) => {
                      changeMonth(evt.target.value)
                    }}
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={30}
                    className="dissolve-input"
                    value={day}
                    onChange={(evt) => {
                      changeDay(evt.target.value)
                    }}
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={24}
                    className="dissolve-input"
                    value={hour}
                    onChange={(evt) => {
                      changeHour(evt.target.value)
                    }}
                  />
                </div>
              </div>
              <div className="lock-tokens-flex">
                <div className="create-neuron-header">
                  Additional amount of tokens to lock
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={balance}
                  className="dissolve-input"
                  value={lockingTokenAmount}
                  onChange={(evt) => {
                    if (
                      Number(parseInt(evt.target.value)) <= parseInt(balance) &&
                      evt.target.value.length < balance.length + 8
                    ) {
                      setLockingTokenAmount(evt.target.value)
                    }
                  }}
                />
              </div>
              <div className="checkbox-flex">
                <div className="locked">Locked</div>
                <input
                  type={"checkbox"}
                  checked={isLocked}
                  onChange={() => {
                    setIsLocked(!isLocked)
                  }}
                />
              </div>
              <div
                onClick={async () => {
                  setLoading(true)
                  await handleUpdateNeuron()
                  setLoading(false)
                }}
                className="create-neuron-button"
              >
                Update neuron
              </div>
            </div>
          </div>
        )
    }
  
}

export { ManageNeuron }
