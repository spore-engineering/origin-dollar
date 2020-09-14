import React, { useState } from 'react'
import ethers from 'ethers'

import {
  Button,
  Dialog,
  FormGroup,
  InputGroup,
  HTMLSelect
} from '@blueprintjs/core'

import { useStateValue } from '../../state'

import ErrorCallout from 'components/ErrorCallout'

const AddStrategy = ({ style }) => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [weight, setWeight] = useState('100')
  const [{ contracts, provider, vault }, dispatch] = useStateValue()
  const [strategy, setStrategy] = useState(contracts.CompoundStrategy.address)

  return (
    <>
      <Button
        style={style}
        onClick={() => {
          setOpen(true)
        }}
      >
        Add Strategy
      </Button>
      <Dialog title="Add Strategy" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="Strategy">
            <HTMLSelect
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              options={[{ label: 'Compound', value: '' }]}
            />
          </FormGroup>
          <FormGroup label="Weight">
            <InputGroup
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </FormGroup>
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Add Strategy"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(vault.governor)
              contracts.Vault.connect(signer)
                .addStrategy(strategy, weight)
                .then(() => {
                  setOpen(false)
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

export default AddStrategy
