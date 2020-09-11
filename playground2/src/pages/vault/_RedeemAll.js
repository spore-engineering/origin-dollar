import React, { useState } from 'react'

import { Button, Dialog, FormGroup, HTMLSelect } from '@blueprintjs/core'

import { useStateValue } from '../../state'

import ErrorCallout from 'components/ErrorCallout'

const RedeemAll = ({ style }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [{ accounts, contracts, provider }, dispatch] = useStateValue()
  const [account, setAccount] = useState()

  return (
    <>
      <Button
        style={style}
        onClick={() => {
          setOpen(true)
          setAccount(accounts[0])
        }}
      >
        Redeem All
      </Button>
      <Dialog title="Redeem All" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="Account">
            <HTMLSelect
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              options={accounts}
            />
          </FormGroup>
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Redeem All"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(account)
              contracts.Vault.connect(signer)
                .redeemAll()
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

export default RedeemAll
