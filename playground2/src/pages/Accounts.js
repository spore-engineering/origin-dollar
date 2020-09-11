import React from 'react'
import { HTMLTable } from '@blueprintjs/core'

import { useStateValue } from '../state'
import Address from 'components/Address'

function fmt(val) {
  if (!val) return
  const [p1, p2] = val.split('.')
  return `${p1}.${p2.substr(0, 2)}`
}

const Accounts = () => {
  const [{ accounts, balances }] = useStateValue()

  return (
    <HTMLTable condensed>
      <thead>
        <tr>
          <th>Accounts</th>
          <th>Eth</th>
          <th>OUSD</th>
          <th>DAI</th>
          <th>USDC</th>
          <th>USDT</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account) => (
          <tr key={account}>
            <td>
              <Address>{account}</Address>
            </td>
            <td>{fmt(balances.eth[account] || '')}</td>
            <td>{fmt(balances.ousd[account] || '')}</td>
            <td>{fmt(balances.dai[account] || '')}</td>
            <td>{fmt(balances.usdc[account] || '')}</td>
            <td>{fmt(balances.usdt[account] || '')}</td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  )
}

export default Accounts
