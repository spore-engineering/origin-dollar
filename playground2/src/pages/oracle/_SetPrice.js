import React, { useState } from 'react'
import ethers from 'ethers'

import { Button, Dialog, FormGroup, InputGroup } from '@blueprintjs/core'

import { useStateValue } from '../../state'

import ErrorCallout from 'components/ErrorCallout'

const SetPrice = ({ style, token }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [{ contracts, provider, vault }, dispatch] = useStateValue()
  const [amount, setAmount] = useState('')

  return (
    <>
      <Button
        style={style}
        onClick={() => {
          setOpen(true)
        }}
      >
        Set Price
      </Button>
      <Dialog title="Redeem" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="Amount in USD">
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
              const signer = provider.getSigner(vault.governor)
              contracts[`MockChainlinkOracleFeed${token}`]
                .connect(signer)
                .setPrice(ethers.utils.parseEther(amount))
                .then(() => {
                  setOpen(false)
                  dispatch({ type: 'reload', target: 'oracle' })
                  dispatch({ type: 'reload', target: 'vault' })
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

export default SetPrice
