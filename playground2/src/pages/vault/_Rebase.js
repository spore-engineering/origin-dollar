import React, { useState } from 'react'
import ethers from 'ethers'

import { Button, Dialog, FormGroup, InputGroup } from '@blueprintjs/core'

import { useStateValue } from '../../state'

import ErrorCallout from 'components/ErrorCallout'

const Rebase = ({ style }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [{ contracts, provider, vault }, dispatch] = useStateValue()

  return (
    <>
      <Button
        style={style}
        onClick={() => {
          setOpen(true)
        }}
      >
        Rebase
      </Button>
      <Dialog title="Rebase" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Rebase"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(vault.governor)
              contracts.Vault.connect(signer)
                .rebase()
                .then(() => {
                  setOpen(false)
                  dispatch({ type: 'reload', target: 'vault' })
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

export default Rebase
