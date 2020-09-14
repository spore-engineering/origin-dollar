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

const Mint = () => {
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [open, setOpen] = useState()
  const [
    { accounts, contracts, provider, reload, balances },
    dispatch
  ] = useStateValue()
  const [account, setAccount] = useState()
  const [asset, setAsset] = useState('DAI')
  const [amount, setAmount] = useState('')
  const [allowance, setAllowance] = useState('')

  useEffect(() => {
    if (!account || !asset || !open) {
      return
    }
    const contract = contracts[`Mock${asset}`]
    contract.decimals().then((decimals) => {
      contract.allowance(account, contracts.Vault.address).then((val) => {
        setAllowance(ethers.utils.formatUnits(val, decimals.toNumber()))
      })
    })
  }, [open, account, asset, reload.allowance])

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true)
          setAccount(accounts[0])
        }}
      >
        Mint
      </Button>
      <Dialog title="Mint OUSD" isOpen={open} onClose={() => setOpen(false)}>
        <div className="bp3-dialog-body">
          <ErrorCallout error={error} />
          <FormGroup label="Account">
            <HTMLSelect
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              options={accounts}
            />
          </FormGroup>
          <FormGroup label="Asset">
            <HTMLSelect
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              options={['DAI', 'USDC', 'USDT']}
            />
          </FormGroup>
          <FormGroup label="Amount">
            <InputGroup
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormGroup>
          <div
            style={{
              display: 'inline-grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'auto',
              columnGap: '1rem'
            }}
          >
            <FormGroup label="Balance">
              {balances[asset.toLowerCase()][account]}
            </FormGroup>
            <FormGroup label="Allowance">{allowance}</FormGroup>
          </div>
        </div>
        <div
          className="bp3-dialog-footer"
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Button
            text="Set Allowance"
            loading={loading}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(account)
              const contract = contracts[`Mock${asset}`]
              const decimals = (await contract.decimals()).toNumber()
              contracts[`Mock${asset}`]
                .connect(signer)
                .approve(
                  contracts.Vault.address,
                  ethers.utils.parseUnits(amount, decimals)
                )
                .then(() => {
                  dispatch({ type: 'reload', target: 'allowance' })
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
          <Button
            text="Mint"
            intent="primary"
            loading={loading}
            style={{ marginLeft: 10 }}
            onClick={async () => {
              setLoading(true)
              const signer = provider.getSigner(account)
              const contract = contracts[`Mock${asset}`]
              const address = contract.address
              const decimals = (await contract.decimals()).toNumber()

              const amountEth = ethers.utils.parseUnits(amount, decimals)
              console.log({ address, amountEth })
              contracts.Vault.connect(signer)
                .mint(address, amountEth)
                .then(() => {
                  setOpen(false)
                  dispatch({ type: 'reload', target: 'accounts' })
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

export default Mint
