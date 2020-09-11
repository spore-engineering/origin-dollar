import React from 'react'
import { Menu, MenuItem, ContextMenu } from '@blueprintjs/core'

const AddressOpts = ({ address }) => (
  <Menu>
    <MenuItem
      text="Copy Address"
      onClick={() => navigator.clipboard.writeText(address)}
    />
  </Menu>
)

const Address = ({ children }) => {
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        const menu = <AddressOpts address={children} />
        ContextMenu.show(menu, { left: e.clientX, top: e.clientY })
      }}
    >
      {children.substr(0, 8)}
    </div>
  )
}

export default Address
