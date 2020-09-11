import React, { useEffect, useState } from 'react'
import {
  Label,
  Switch,
  Button,
  Dialog,
  FormGroup,
  HTMLSelect
} from '@blueprintjs/core'

import { useStateValue } from '../../state'
import { ethers } from 'ethers'

import Mint from './_Mint'
import Redeem from './_Redeem'
import RedeemAll from './_RedeemAll'

const Vault = () => {
  const [modal, setModal] = useState()
  const [{ accounts, contracts, vault, provider }, dispatch] = useStateValue()

  useEffect(() => {
    async function go() {
      const governor = await contracts.Vault.governor()
      const rebasePaused = await contracts.Vault.rebasePaused()
      const depositPaused = await contracts.Vault.depositPaused()
      const strategyCount = await contracts.Vault.getStrategyCount()
      const assetCount = await contracts.Vault.getAssetCount()
      const apr = await contracts.VaultView.getAPR()
      const totalValue = await contracts.VaultView.totalValue()
      const priceDai = await contracts.VaultView.priceUSD('DAI')
      const priceUsdc = await contracts.VaultView.priceUSD('USDC')
      const priceUsdt = await contracts.VaultView.priceUSD('USDT')
      dispatch({
        type: 'set',
        key: 'vault',
        value: {
          ...vault,
          rebasePaused,
          depositPaused,
          governor,
          strategyCount: strategyCount.toNumber(),
          assetCount: assetCount.toNumber(),
          apr: ethers.utils.formatEther(apr),
          totalValue: ethers.utils.formatEther(totalValue),
          priceDai: ethers.utils.formatEther(priceDai),
          priceUsdc: ethers.utils.formatEther(priceUsdc),
          priceUsdt: ethers.utils.formatEther(priceUsdt)
        }
      })
    }
    go()
  }, [])

  return (
    <div>
      <h4>Vault</h4>
      <table>
        <tbody>
          <tr>
            <td>Address</td>
            <td>{contracts.Vault.address}</td>
          </tr>
          <tr>
            <td>Governer</td>
            <td>{vault.governor}</td>
          </tr>
          <tr>
            <td>APR</td>
            <td>{vault.apr}</td>
          </tr>
          <tr>
            <td># Strategies</td>
            <td>{vault.strategyCount}</td>
          </tr>
          <tr>
            <td># Assets</td>
            <td>{vault.assetCount}</td>
          </tr>
          <tr>
            <td>Total Value</td>
            <td>{vault.totalValue}</td>
          </tr>
          <tr>
            <td>Price DAI</td>
            <td>{vault.priceDai}</td>
          </tr>
          <tr>
            <td>Price USDC</td>
            <td>{vault.priceUsdc}</td>
          </tr>
          <tr>
            <td>Price USDT</td>
            <td>{vault.priceUsdt}</td>
          </tr>
        </tbody>
      </table>
      <Switch
        labelElement="Rebase Paused"
        checked={vault.rebasePaused ? true : false}
        onChange={async (e) => {
          const checked = e.target.checked
          const gov = provider.getSigner(vault.governor)
          if (checked) {
            await contracts.Vault.connect(gov).pauseRebase()
          } else {
            await contracts.Vault.connect(gov).unpauseRebase()
          }

          dispatch({
            type: 'set',
            key: 'vault.rebasePaused',
            value: checked
          })
        }}
      />
      <Switch
        labelElement="Deposits Paused"
        checked={vault.depositPaused ? true : false}
        onChange={async (e) => {
          const checked = e.target.checked
          const gov = provider.getSigner(vault.governor)
          if (checked) {
            await contracts.Vault.connect(gov).pauseDeposits()
          } else {
            await contracts.Vault.connect(gov).unpauseDeposits()
          }

          dispatch({
            type: 'set',
            key: 'vault.depositPaused',
            value: checked
          })
        }}
      />
      <Mint />
      <Redeem style={{ marginLeft: 10 }} />
      <RedeemAll style={{ marginLeft: 10 }} />
    </div>
  )
}

export default Vault
