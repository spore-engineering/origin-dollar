import React, { useState } from 'react'
import ethers from 'ethers'

import {
  Button,
  Dialog,
  FormGroup,
  HTMLSelect,
  InputGroup
} from '@blueprintjs/core'

import { useStateValue } from '../../state'

import ErrorCallout from 'components/ErrorCallout'

const TransferToken = ({ token }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [
    { accounts, contracts, provider, balances },
    dispatch
  ] = useStateValue()
  const [from, setFrom] = useState()
  const [to, setTo] = useState()
  const [amount, setAmount] = useState('')

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true)
          setFrom(accounts[0])
          setTo(accounts[0])
        }}
      >
        Transfer
      </Button>
      <Dialog
        title={`Transfer ${token}`}
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="From">
            <HTMLSelect
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              options={accounts}
            />
          </FormGroup>
          <FormGroup label="To">
            <HTMLSelect
              value={to}
              onChange={(e) => setTo(e.target.value)}
              options={accounts}
            />
          </FormGroup>
          <FormGroup label="Amount">
            <InputGroup
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Balance">
            {balances[token.toLowerCase()][from]}
          </FormGroup>
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Transfer"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(from)
              const contract = contracts[token] || contracts[`Mock${token}`]
              let decimals = await contract.decimals()
              decimals =
                typeof decimals === 'number' ? decimals : decimals.toNumber()

              const amountEth = ethers.utils.parseUnits(amount, decimals)

              contract
                .connect(signer)
                .transfer(to, amountEth)
                .then(() => {
                  setOpen(false)
                  dispatch({ type: 'reload', target: 'accounts' })
                })
                .catch((err) => {
                  try {
                    setError(JSON.parse(err.body).error.message)
                  } catch (e) {
                    setError(err.body)
                  }
                })
                .finally(() => {
                  setLoading(false)
                })
            }}
          />
        </div>
      </Dialog>
    </>
  )
}

export default TransferToken
