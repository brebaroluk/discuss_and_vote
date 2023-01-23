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


const CreateNeuron = (props: {
  visible: boolean
  setVisibility: Function
}) => {
    const [loading, setLoading] = useState(false);
    const [tokenCanister] = useCanister("tokenCanister");
    const [backend] = useCanister("dao");
    const [balance, setBalance] = useState("");
    const [balanceBigInt, setBalanceBigInt] = useState<bigint>();
    const [lockingTokenAmount, setLockingTokenAmount] = useState("1");
    const [wallet] = useWallet();
    const [year, setYear] = useState("0");
    const [month, setMonth] = useState("6");
    const [day, setDay] = useState("0");
    const [hour, setHour] = useState("0")

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

    const handleCreateNeuron = async () => {
      let miliseconds = YEAR * parseInt(year) + MONTH * parseInt(month) + DAY * parseInt(day) + HOUR * parseInt(hour);
      if(miliseconds > 8 * YEAR){
        toast("Dissolve delay can not be higher than 8 years!", {
          icon: "❌",
        });
        return;
      }
      if(miliseconds < 6 * MONTH){
        toast("Dissolve delay can not be lower than 6 months!", {
          icon: "❌",
        });
        return;
      }
      if(parseInt(lockingTokenAmount) * DECIMALS > Number(balanceBigInt)){
        toast("Unsufficient token balance!", {
          icon: "❌",
        });
        return;
      };
      if (parseInt(lockingTokenAmount) * DECIMALS < 2 * FEE) {
        toast("Locking amount is too low!", {
          icon: "❌",
        })
        return;
      };

      try {
        let subaccount = await backend.get_subaccount_to_lock_tokens_by_principal(wallet.principal) as Uint8Array;
        let subaccountArray = [...subaccount];
        console.log(DAO_CANISTER_ID);
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
        console.log(transferArgs);
        let transferReturn = await tokenCanister.icrc1_transfer(transferArgs) as Result;
        console.log(transferReturn);
        if("ok" in transferReturn){
          console.log("also here");
          let lockTime = BigInt(parseInt(year) * YEAR + parseInt(month) * MONTH + parseInt(day) *DAY + parseInt(hour) * HOUR)
          console.log(lockTime);
          let createNeuronReturn = (await backend.createNeuron(
            lockTime
          )) as any;
          if("ok" in createNeuronReturn){
            toast("Neuron is created succesfully!", {
              icon: "✅",
          });
          console.log(createNeuronReturn)
            navigate("/neuron/" + createNeuronReturn.ok.neuronId)

          }
          else{
            await backend.send_back_locked_tokens(
              Principal.fromText(wallet.principal),
            )
          }
        }
        else{
          toast("An error occured while trying to lock the tokens!", {
            icon: "❌",
          })
          return;
        }
      } catch (error) {
        toast("Unexpected error!", {
          icon: "❌",
        })
        console.log(error);
        return;
      }
    };

    useEffect(()=>{
      if(wallet){
        refreshBalance()
      }
      
      
    },[props])

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
              <div className="create-neuron-header">Create a neuron</div>
              <div className="user-balance-flex">
                <div className="principal-id">
                  <div>{"Principal id: " + wallet.principal}</div>
                  <AiFillCopy
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.principal)
                      toast("Copied to clipboard!", {
                        icon: "✅",
                      })
                    }}
                  />
                </div>
                <div className="balance-text">{"Balance: " + balance}</div>
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
                  Amount of tokens to lock
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
                      Number(parseInt(evt.target.value)) > 1 &&
                      evt.target.value.length < balance.length + 8
                    ) {
                      setLockingTokenAmount(evt.target.value)
                    }
                  }}
                />
              </div>
              <div
                onClick={async () => {
                  setLoading(true)
                  await handleCreateNeuron()
                  setLoading(false)
                }}
                className="create-neuron-button"
              >
                Create neuron
              </div>
            </div>
          </div>
        )
    }
  
}

export { CreateNeuron }
