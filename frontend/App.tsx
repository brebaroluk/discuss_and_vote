import React from "react"
import logo from "./assets/100_on_chain-stripe-white_text.svg"
/*
 * Connect2ic provides essential utilities for IC app development
 */
import { createClient } from "@connect2ic/core"
import { defaultProviders } from "@connect2ic/core/providers"
import {
  ConnectButton,
  ConnectDialog,
  Connect2ICProvider,
} from "@connect2ic/react"
import "@connect2ic/core/style.css"
/*
 * Import canister definitions like this:
 */
import * as dao from "../.dfx/local/canisters/dao"
import * as tokenCanister from "./token-canister-service"


import { _SERVICE } from "src/declarations/dao/dao.did"
import { BrowserRouter as Router, useRoutes } from "react-router-dom"
import { HomePage } from "./components/HomePage"
import { Neuron } from "./components/Neuron"
import { Proposal } from "./components/Proposal"
import { Header } from "./components/Header"
import { Toaster } from "react-hot-toast"
//import { canisterId as daoCanisterId } from "src/declarations/dao"
//import { getPageText } from "src/declarations/dao/dao.did"

/*
 * Some examples to get you started
 */

const Routes = () => {
  return useRoutes([
    { path: '/', element: <HomePage /> },
    { path: '/neuron/:id', element: <Neuron /> },
    { path: '/proposal/:id', element: <Proposal /> },
  ]);
};

function App() {

  return (
    <div className="App">
      <div className="auth-section">
        <ConnectButton />
      </div>
      <ConnectDialog />
      <Toaster />
      <Router>
        <Routes />
      </Router>
    </div>
  )
}

const client = createClient({
  canisters: {
    dao,
    tokenCanister
  },
  providers: defaultProviders,
  globalProviderConfig: {
    dev: false,
    whitelist: ["wvlqu-tqaaa-aaaak-aeahq-cai", "wvlqu-tqaaa-aaaak-aeahq-cai"]
  },
})

export default () => (
  <Connect2ICProvider client={client}>
    <App />
  </Connect2ICProvider>
)
