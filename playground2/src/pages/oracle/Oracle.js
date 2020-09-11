import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import { Card, H4, ButtonGroup, Button } from '@blueprintjs/core'
import ethers from 'ethers'

import Address from 'components/Address'
import { useStateValue } from '../../state'

import SetPrice from './_SetPrice'

const Oracle = ({ style }) => {
  const [{ contracts, oracles, reload }, dispatch] = useStateValue()
  const [token, setToken] = useState('ETH')

  useEffect(() => {
    async function go() {
      const ethContract = contracts[`MockChainlinkOracleFeedETH`]
      const ethPriceRaw = await ethContract.latestRoundData()
      const ethPrice = ethers.utils.formatUnits(ethPriceRaw.answer, 8)

      const contract = contracts[`MockChainlinkOracleFeed${token}`]
      let decimals = await contract.decimals()
      decimals = typeof decimals === 'number' ? decimals : decimals.toNumber()
      const rawPriceRaw = await contract.latestRoundData()
      const rawPrice = ethers.utils.formatUnits(rawPriceRaw.answer, decimals)

      const usdPrice =
        token === 'ETH' ? Number(ethPrice) : Number(ethPrice) * Number(rawPrice)

      dispatch({
        type: 'set',
        key: `oracles.${token}`,
        value: {
          ...(oracles[token] || {}),
          address: contract.address,
          decimals,
          rawPrice,
          usdPrice
        }
      })
    }
    go()
  }, [token, reload.oracle])

  return (
    <Card style={style}>
      <H4>Chainlink Oracle</H4>
      <ButtonGroup>
        <Button active={token === 'ETH'} onClick={() => setToken('ETH')}>
          ETH
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
              <Address>{get(oracles, `${token}.address`, '')}</Address>
            </td>
          </tr>
          <tr>
            <td>Decimals</td>
            <td>{get(oracles, `${token}.decimals`, '')}</td>
          </tr>
          <tr>
            <td>Raw Price</td>
            <td>{get(oracles, `${token}.rawPrice`, '')}</td>
          </tr>
          <tr>
            <td>USD Price</td>
            <td>{get(oracles, `${token}.usdPrice`, '')}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 20 }}>
        <SetPrice token={token} />
      </div>
    </Card>
  )
}

export default Oracle
