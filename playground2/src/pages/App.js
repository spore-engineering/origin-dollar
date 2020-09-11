import React, { useEffect } from 'react'
import { Navbar, HTMLTable } from '@blueprintjs/core'
import ethers from 'ethers'
import cloneDeep from 'lodash/cloneDeep'

import { useStateValue } from '../state'

import Accounts from './Accounts'
import Vault from './vault/Vault'

const App = () => {
  const [
    { provider, accounts, balances, ousd, dai, usdc, usdt, reload },
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
          <Navbar.Heading>Nick's OUSD Playground</Navbar.Heading>
        </Navbar.Group>
      </Navbar>
      <div style={{ padding: 10 }}>
        <Accounts />
        <Vault />
      </div>
    </>
  )
}

export default App
