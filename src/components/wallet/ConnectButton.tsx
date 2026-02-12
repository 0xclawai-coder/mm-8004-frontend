'use client'

import { ConnectButton as RainbowKitConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Wallet, ChevronDown } from 'lucide-react'

export function ConnectButton() {
  return (
    <RainbowKitConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                  >
                    <Wallet className="size-3.5" />
                    Connect
                  </Button>
                )
              }

              return (
                <Button
                  onClick={openAccountModal}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs font-medium"
                >
                  {account.displayBalance && (
                    <span className="hidden text-muted-foreground sm:inline">
                      {account.displayBalance}
                    </span>
                  )}
                  <span>{account.displayName}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              )
            })()}
          </div>
        )
      }}
    </RainbowKitConnectButton.Custom>
  )
}
