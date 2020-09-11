import React, { createContext, useContext, useReducer } from 'react'
import ethers from 'ethers'

import get from 'lodash/get'
import set from 'lodash/set'
import cloneDeep from 'lodash/cloneDeep'

import network from '../../dapp/network.json'
import IViewVault from '../../dapp/IViewVault.json'
import IViewIViewMinMaxOracle from '../../contracts/artifacts/IViewMinMaxOracle.json'

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

const contracts = {}
for (const key in network.contracts) {
  const proxy = network.contracts[key + 'Proxy']
  const address = (proxy ? proxy : network.contracts[key]).address
  const abi = network.contracts[key].abi
  console.log(key, address)
  contracts[key] = new ethers.Contract(address, abi, provider)
}
contracts.VaultView = new ethers.Contract(
  network.contracts.VaultProxy.address,
  IViewVault.abi,
  provider
)
contracts.OracleView = new ethers.Contract(
  network.contracts.MixOracle.address,
  IViewIViewMinMaxOracle.abi,
  provider
)

const defaultState = {
  network,
  accounts: [],
  balances: { eth: {}, ousd: {}, dai: {}, usdt: {}, usdc: {} },
  tokens: {},
  oracles: {},
  provider,
  contracts,
  ousd: contracts.OUSD,
  dai: contracts.MockDAI,
  usdc: contracts.MockUSDC,
  usdt: contracts.MockUSDT,
  vault: {},
  reload: {}
}

const reducer = (state, action) => {
  let newState = cloneDeep(state)

  if (action.type === 'set') {
    newState = set(newState, action.key, action.value)
  } else if (action.type === 'reload') {
    const key = get(newState, `reload.${action.target}`, 0)
    newState = set(newState, `reload.${action.target}`, key + 1)
  }

  window.state = newState

  return newState
}

export const StateContext = createContext()

export const StateProvider = ({ children }) => {
  const value = useReducer(reducer, defaultState)
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateValue = () => useContext(StateContext)
