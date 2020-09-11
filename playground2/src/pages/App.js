import React, { useEffect } from 'react'
import { Navbar } from '@blueprintjs/core'
import ethers from 'ethers'
import cloneDeep from 'lodash/cloneDeep'

import { useStateValue } from '../state'

import Accounts from './Accounts'
import Vault from './vault/Vault'
import Token from './token/Token'
import Oracle from './oracle/Oracle'

const App = () => {
  const [
    { provider, balances, ousd, dai, usdc, usdt, reload },
    dispatch
  ] = useStateValue()

  useEffect(() => {
    async function go() {
      const accounts = (await provider.listAccounts()).slice(0, 7)
      dispatch({ type: 'set', key: 'accounts', value: accounts })

      const newBalances = cloneDeep(balances)
      for (const account of accounts) {
        const ethBalance = await provider.getBalance(account)
        newBalances.eth[account] = ethers.utils.formatEther(ethBalance)

        const ousdBalance = await ousd.balanceOf(account)
        newBalances.ousd[account] = ethers.utils.formatEther(ousdBalance)

        const daiBalance = await dai.balanceOf(account)
        newBalances.dai[account] = ethers.utils.formatEther(daiBalance)

        const usdcBalance = await usdc.balanceOf(account)
        newBalances.usdc[account] = ethers.utils.formatUnits(usdcBalance, 6)

        const usdtBalance = await usdt.balanceOf(account)
        newBalances.usdt[account] = ethers.utils.formatUnits(usdtBalance, 6)
      }
      dispatch({ type: 'set', key: 'balances', value: newBalances })
    }
    go()
  }, [reload.accounts])

  return (
    <>
      <Navbar>
        <Navbar.Group>
          <Navbar.Heading>Nick&apos;s OUSD Playground</Navbar.Heading>
        </Navbar.Group>
      </Navbar>
      <div style={{ padding: 10 }}>
        <Accounts />
        <div style={{ display: 'flex', marginTop: 20 }}>
          <Vault />
          <Token style={{ marginLeft: 20 }} />
          <Oracle style={{ marginLeft: 20 }} />
        </div>
      </div>
    </>
  )
}

export default App
