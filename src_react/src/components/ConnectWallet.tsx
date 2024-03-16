import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'


export const ConnectWallet: React.FC = () => {
  const { isConnecting } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => (
        <div
          {...(!mounted && {
            'aria-hidden': true,
            style: {
              opacity: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            },
          })}
        >
          {(() => {
            if (!mounted || !account || !chain) {
              return (
                <button
                  className="ff-button ff-widget-unlock-button"
                  disabled={isConnecting}
                  onClick={openConnectModal}
                >
                  Unlock wallet
                </button>
              );
            }

            if (chain.unsupported) {
              return (
                <button
                  onClick={openChainModal}
                  className="ff-button ff-widget-unlock-button"
                >
                  Unsupported network
                </button>
              );
            }

            return (
              <button className="ff-button ff-widget-unlock-button">
                {account.ensName
                  ? account.ensName
                  : account.address
                }
              </button>
            );
          })()}
        </div>
      )}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;
