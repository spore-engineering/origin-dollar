import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import { Card, H4, ButtonGroup, Button } from '@blueprintjs/core'
import ethers from 'ethers'

import Address from 'components/Address'
import { useStateValue } from '../../state'

import Transfer from './_Transfer'

const Token = ({ style }) => {
  const [{ contracts, tokens }, dispatch] = useStateValue()
  const [token, setToken] = useState('OUSD')

  useEffect(() => {
    async function go() {
      const contract = contracts[token] || contracts[`Mock${token}`]
      let decimals = await contract.decimals()
      const name = await contract.name()
      const symbol = await contract.symbol()
      const totalSupply = await contract.totalSupply()
      let priceMin, priceMax
      if (token !== 'OUSD') {
        priceMin = await contracts.OracleView.priceMin(token)
        priceMax = await contracts.OracleView.priceMax(token)
      }

      decimals = typeof decimals === 'number' ? decimals : decimals.toNumber()

      dispatch({
        type: 'set',
        key: `tokens.${token}`,
        value: {
          ...(tokens[token] || {}),
          address: contract.address,
          decimals,
          name,
          symbol,
          totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
          priceMin: priceMin ? ethers.utils.formatUnits(priceMin, 8) : '',
          priceMax: priceMax ? ethers.utils.formatUnits(priceMax, 8) : ''
        }
      })
    }
    if (!tokens[token]) {
      go()
    }
  }, [token])

  return (
    <Card style={style}>
      <H4>Token</H4>
      <ButtonGroup>
        <Button active={token === 'OUSD'} onClick={() => setToken('OUSD')}>
          OUSD
        </Button>
        <Button active={token === 'DAI'} onClick={() => setToken('DAI')}>
          DAI
        </Button>
        <Button active={token === 'USDC'} onClick={() => setToken('USDC')}>
          USDC
        </Button>
        <Button active={token === 'USDT'} onClick={() => setToken('USDT')}>
          USDT
        </Button>
      </ButtonGroup>
      <table style={{ marginBottom: 10, marginTop: 10 }}>
        <tbody>
          <tr>
            <td>Address</td>
            <td>
              <Address>{get(tokens, `${token}.address`, '')}</Address>
            </td>
          </tr>
          <tr>
            <td>Name</td>
            <td>{get(tokens, `${token}.name`, '')}</td>
          </tr>
          <tr>
            <td>Symbol</td>
            <td>{get(tokens, `${token}.symbol`, '')}</td>
          </tr>
          <tr>
            <td>Decimals</td>
            <td>{get(tokens, `${token}.decimals`, '')}</td>
          </tr>
          <tr>
            <td>Total Supply</td>
            <td>{get(tokens, `${token}.totalSupply`, '')}</td>
          </tr>
          <tr>
            <td>Price Min</td>
            <td>{get(tokens, `${token}.priceMin`, '')}</td>
          </tr>
          <tr>
            <td>Price Max</td>
            <td>{get(tokens, `${token}.priceMax`, '')}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <Transfer token={token} />
        {/* <Button style={{ marginLeft: 10 }}>Approve</Button> */}
      </div>
    </Card>
  )
}

export default Token
