import React, { useState, useEffect } from 'react'
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

const Redeem = ({ style }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [{ accounts, contracts, provider, reload }, dispatch] = useStateValue()
  const [account, setAccount] = useState()
  const [amount, setAmount] = useState('')

  return (
    <>
      <Button
        style={style}
        onClick={(e) => {
          setOpen(true)
          setAccount(accounts[0])
        }}
      >
        Redeem
      </Button>
      <Dialog title="Redeem" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="Account">
            <HTMLSelect
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              options={accounts}
            />
          </FormGroup>
          <FormGroup label="Amount">
            <InputGroup
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormGroup>
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Redeem"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(account)
              contracts.Vault.connect(signer)
                .redeem(ethers.utils.parseEther(amount))
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

export default Redeem
