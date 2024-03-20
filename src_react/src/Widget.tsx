// @ts-nocheck
import { wagmiConfig } from './utils/wagmiConfig'
import { WagmiConfig } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { chains } from './utils/chains'
import ConnectWallet from "./components/ConnectWallet"
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient } from 'wagmi'
import fetchCommon from './utils/fetchCommon'
import toFixed from './utils/toFixed'
import formatAmount from './utils/formatAmount'
import BigNumber from 'bignumber.js'
import callFarmContract from './utils/callFarmContract'
import callApproveContract from './utils/callApproveContract'
import Modal from './components/Modal'
import { GET_TX_LINK } from './utils/chains'


function Widget({ widgetOptions }) {
  const {
    networkName,
    farmAddress,
    rewardsAddress,
    stakingAddress,
    rewardsTokenIcon,
    stakingTokenIcon,
  } = widgetOptions
  
  const { isConnecting, isConnected, address, connector } = useAccount()


  const [ farmFetched, setFarmFetched ] = useState(false)
  
  const [ rewardsTokenSymbol, setRewardsTokenSymbol ] = useState(false)
  const [ rewardsDecimals, setRewardsDecimals ] = useState<false | number>(false)
  const [ stakingTokenSymbol, setStakingTokenSymbol ] = useState(false)
  const [ stakingDecimals, setStakingDecimals ] = useState<false | number>(false)
  
  const [ apyValue, setApyValue ] = useState(false)
  const [ aprValue, setAprValue ] = useState(false)
  const [ depositTokenName, setDepositTokenName ] = useState(false)
  const [ tvlTokenName, setTvlTokenName ] = useState(false)
  const [ earnTokenName, setEarnTokenName ] = useState(false)
  const [ earnedAmount, setEarnedAmount ] = useState(false)
  const [ stakedAmount, setStakedAmount ] = useState(false)
  const [ stakedAmountWei, setStakedAmountWei ] = useState(false)
  const [ rewardRate, setRewardRate ] = useState(false)
  const [ userRate, setUserRate ] = useState(false)
  const [ allowanceAmount, setAllowanceAmount ] = useState(false)
  
  const [ totalSupply, setTotalSupply] = useState(false)
  
  const [ farmingFinishDate, setFarmingFinishDate ] = useState(false)
  
  const [ userBalance, setUserBalance ] = useState(false)
  const [ userBalanceWei, setUserBalanceWei ] = useState(false)
  
  const [ needRefresh, setNeedRefresh ] = useState(false)
 
  const _refreshFarmState = () => {
    fetchCommon({
      farmAddress,
      rewardsAddress,
      stakingAddress,
      networkName,
      account: address
    }).then((answer) => {
      setRewardsTokenSymbol(answer.rewardsTokenSymbol)
      setStakingTokenSymbol(answer.stakingTokenSymbol)
      setStakingDecimals(answer.stakingDecimals)
      setRewardsDecimals(answer.rewardsDecimals)
      setRewardRate(answer.rewardRate)
      setTotalSupply(answer.totalSupply)
      setFarmingFinishDate(answer.farmingFinishDate)
      
      setAllowanceAmount(answer.allowance)
      
      if (toFixed(answer.farmingBalance) > 0) {
        try {
          const otherUserSupply = toFixed(answer.totalSupply) - toFixed(answer.farmingBalance)
          const myPercents = 1 - toFixed(otherUserSupply) / toFixed(totalSupply)
          setUserRate(
            toFixed(rewardRate / Math.pow(10, rewardsDecimals as number) * 86400 * myPercents)
          )
        } catch (e) {
          setUserRate(false)
        }
      } else {
        setUserRate(false)
      }
      setEarnedAmount(
        toFixed(answer.earnedTokens / Math.pow(10, answer.rewardsDecimals))
      )
      setStakedAmount(
        toFixed(answer.farmingBalance / Math.pow(10, answer.stakingDecimals))
      )
      setStakedAmountWei(answer.farmingBalance)
      setUserBalanceWei(answer.userBalance)
      setUserBalance(
        toFixed(answer.userBalance / Math.pow(10, answer.stakingDecimals))
      )
    }).catch((err) => {
      console.log('> ERR', err)
    })
  }
  useEffect(() => {
    _refreshFarmState()
  }, [ isConnected, address ])
  
  useEffect(() => {
    if (needRefresh) {
      setNeedRefresh(false)
      _refreshFarmState()
    }
  }, [ needRefresh ])

  /* ========================== TIMER =========================== */
  const [ timeLeft, setTimeLeft ] = useState<boolean | string>(false)
  useEffect(() => {
    if (farmingFinishDate) {
      const finishDate = Number(farmingFinishDate)
      if (finishDate - Date.now() / 1000 > 0) {
        const timer = window.setInterval(() => {
          let delta = Math.floor((finishDate * 1000 - Date.now()) / 1000)
          const days = Math.floor(delta / 86400)
          delta -= days * 86400
          const hours = Math.floor(delta / 3600) % 24
          delta -= hours * 3600
          const minutes = Math.floor(delta / 60) % 60
          delta -= minutes * 60
          const seconds = delta % 60
          setTimeLeft(`${days < 10 ? `0${days}` : days}:${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`)
        }, 1000)
        return () => window.clearInterval(timer)
      }
    }
  }, [ farmingFinishDate ])
  /* =========================================================== */
  
  const [ isHarvest, setIsHarvest ] = useState(false)
  const [ isHarvestError, setIsHarvestError ] = useState(false)
  const [ isHarvestReady, setIsHarvestReady ] = useState(false)
  const [ harvestHash, setHarvestHash ] = useState(false)

  useEffect(() => {
    if (isHarvest) {
      setIsHarvestError(false)
      setIsHarvestReady(false)
      setHarvestHash(false)
    }
  }, [ isHarvest ])
  
  const doHarvest = () => {
    connector.getProvider().then((provider) => {
      setIsHarvest(true)
      callFarmContract({
        provider,
        contractAddress: farmAddress,
        method: 'getReward',
        args: [],
        weiAmount: false,
        onTrx: (hash) => {
          console.log('>>> hash', hash)
          setHarvestHash(hash)
        },
        onError: (error) => {
          console.log('>>> error', error)
          setIsHarvestError(true)
        },
        onFinally: () => {
          setIsHarvestReady(true)
          setNeedRefresh(true)
        }
      }).then((answer) => {
        console.log('>>> ANSWER', answer)
      }).catch((err) => {
        console.log('>>> ERROR', err)
        setIsDepositError(true)
      })
    }).catch((err) => {
      console.log('Fail get provider', err)
    })
  }
  
  const [ isDepositOpened, setIsDepositOpened ] = useState(false)
  const [ depositAmount, setDepositAmount ] = useState('')
  const [ isDepositing, setIsDepositing ] = useState(false)
  const [ isDepositReady, setIsDepositReady ] = useState(false)
  const [ isDepositError, setIsDepositError ] = useState(false)
  const [ depositHash, setDepositHash ] = useState(false)
  
  useEffect(() => {
    if (isDepositOpened) {
      setDepositAmount('')
      setDepositHash(false)
      setIsDepositReady(false)
      setIsDepositError(false)
    }
  }, [ isDepositOpened ])
  
  const [ needApprove, setNeedApprove ] = useState(false)
  const [ isApproving, setIsApproving ] = useState(false)
  const [ approveHash, setApproveHash ] = useState(false)
  
  useEffect(() => {
    let amount = 0
    try {
      amount = Number(depositAmount.replace(',', '.'))
    } catch (err) {}

    if (amount > 0) {
      const value = (depositAmount == userBalance) ? userBalanceWei : formatAmount(depositAmount, stakingDecimals)
      if (new BigNumber(value).isGreaterThan(allowanceAmount)) {
        console.log('>>> need approve')
        setNeedApprove(true)
      } else {
        setNeedApprove(false)
      }
    } else {
      setNeedApprove(false)
    }
  }, [ depositAmount, allowanceAmount ])
  
  const doApprove = () => {
    let amount = 0
    try {
      amount = Number(`${depositAmount}`.replace(',', '.'))
    } catch (err) {}

    if (amount > 0) {
      const value = (depositAmount == userBalance) ? userBalanceWei : formatAmount(depositAmount, stakingDecimals)
      const approveValue = new BigNumber(value).minus(allowanceAmount).toString()
      setIsApproving(true)
      connector.getProvider().then((provider) => {
        callApproveContract({
          provider,
          contractAddress: stakingAddress,
          method: 'approve',
          args: [ farmAddress, value ],
          weiAmount: false,
          onTrx: (hash) => {
            console.log('>>> hash', hash)
            setApproveHash(hash)
          },
          onError: (error) => {
            console.log('>>> error', error)
            setIsApproving(false)
          },
          onFinally: () => {
            setIsApproving(false)
            setApproveHash(false)
            setNeedRefresh(true)
          }
        }).then((answer) => {
          console.log('>>> ANSWER', answer)
        }).catch((err) => {
          console.log('>>> ERROR', err)
          setIsApproving(false)
        })
      }).catch((err) => {
        setIsApproving(false)
        console.log('Fail get provider', err)
      })
    }
  }
  
  const doDeposit = () => {
    let amount = 0
    try {
      amount = Number(`${depositAmount}`.replace(',', '.'))
    } catch (err) {}

    if (amount > 0) {
      setIsDepositing(true)
        
      const value = (depositAmount == userBalance) ? userBalanceWei : formatAmount(depositAmount, stakingDecimals)
      
      connector.getProvider().then((provider) => {
        callFarmContract({
          provider,
          contractAddress: farmAddress,
          method: 'stake',
          args: [ value ],
          weiAmount: false,
          onTrx: (hash) => {
            console.log('>>> hash', hash)
            setDepositHash(hash)
          },
          onError: (error) => {
            console.log('>>> error', error)
            setIsDepositError(true)
            setIsDepositing(false)
          },
          onFinally: () => {
            setIsDepositReady(true)
            setIsDepositing(false)
            setNeedRefresh(true)
          }
        }).then((answer) => {
          console.log('>>> ANSWER', answer)
        }).catch((err) => {
          console.log('>>> ERROR', err)
          setIsDepositError(true)
          setIsDepositing(false)
        })
      }).catch((err) => {
        setIsDepositError(true)
        setIsDepositing(false)
        console.log('Fail get provider', err)
      })
    }
  }
  
  const [ isWithdrawOpened, setIsWithdrawOpened ] = useState(false)
  const [ withdrawAmount, setWithdrawAmount ] = useState('')
  const [ isWithdrawing, setIsWithdrawing ] = useState(false)
  const [ isWithdrawReady, setIsWithdrawReady ] = useState(false)
  const [ isWithdrawError, setIsWithdrawError ] = useState(false)
  const [ withdrawHash, setWithdrawHash ] = useState(false)
  
  useEffect(() => {
    if (isWithdrawOpened) {
      setWithdrawAmount('')
      setWithdrawHash(false)
      setIsWithdrawReady(false)
      setIsWithdrawError(false)
    }
  }, [ isWithdrawOpened ])
  
  const doWithdraw = () => {
    let amount = 0
    try {
      amount = Number(`${withdrawAmount}`.replace(',', '.'))
    } catch (err) {}
    if (amount > 0) {
      setIsWithdrawing(true)
        
      const value = (withdrawAmount == stakedAmount) ? stakedAmountWei : formatAmount(withdrawAmount, stakingDecimals)
      
      connector.getProvider().then((provider) => {
        callFarmContract({
          provider,
          contractAddress: farmAddress,
          method: 'withdraw',
          args: [ value ],
          weiAmount: false,
          onTrx: (hash) => {
            console.log('>>> hash', hash)
            setWithdrawHash(hash)
          },
          onError: (error) => {
            console.log('>>> error', error)
            setIsWithdrawError(true)
            setIsWithdrawing(false)
          },
          onFinally: () => {
            setIsWithdrawReady(true)
            setIsWithdrawing(false)
            setNeedRefresh(true)
          }
        }).then((answer) => {
          console.log('>>> ANSWER', answer)
        }).catch((err) => {
          console.log('>>> ERROR', err)
          setIsWithdrawError(true)
          setIsWithdrawing(false)
        })
      }).catch((err) => {
        setIsWithdrawReady(true)
        setIsWithdrawing(false)
        console.log('Fail get provider', err)
      })
    }
  }

  return (
    <div className="ff-widgets-container">
      <div className="ff-widget">
        <div className="ff-widget-headline">
          <div className="ff-widget-token-icons">
            {rewardsTokenIcon ? (<img className="ff-widget-token-icon" src={rewardsTokenIcon} />) : null}
            {stakingTokenIcon ? (<img className="ff-widget-token-icon" src={stakingTokenIcon} />) : null}
          </div>
          <div className="ff-title-and-timer">
            <div className="ff-widget-title">
              {stakingTokenSymbol && rewardsTokenSymbol ? (
                <>{stakingTokenSymbol}{`-`}{rewardsTokenSymbol}</>
              ) : (
                <span className="ff-skeleton"></span>
              )}
            </div>
            <div className="ff-widget-timer">
              {timeLeft ? (
                <>{timeLeft}</>
              ) : (
                <>{`--:--:--:--`}</>
              )}
            </div>
          </div>
        </div>
        <div className="ff-widget-section ff-widget-stats">
          <div className="ff-widget-row2">
            <div className="ff-widget-label">Deposit:</div>
            <div className="ff-widget-value ff-widget-deposit-token-name">
              {stakingTokenSymbol ? (
                <>{stakingTokenSymbol}</>
              ) : (
                <span className="ff-skeleton"></span>
              )}
            </div>
          </div>  
          <div className="ff-widget-row2">
            <div className="ff-widget-label">Earn:</div>
            <div className="ff-widget-value ff-widget-earn-token-name">
              {rewardsTokenSymbol ? (
                <>{rewardsTokenSymbol}</>
              ) : (
                <span className="ff-skeleton"></span>
              )}
            </div>
          </div>
          <div className="ff-widget-row2">
            <div className="ff-widget-label">APY per token in day:</div>
            <div className="ff-widget-value ff-widget-reward-rate">
              {rewardsDecimals && rewardRate && rewardsTokenSymbol ? (
                <>{toFixed(rewardRate / Math.pow(10, rewardsDecimals) * 86_400)}{' '}{rewardsTokenSymbol}</>
              ) : (
                <span className="ff-skeleton"></span>
              )}
            </div>
          </div>
          {address && userRate && (
            <div className="ff-widget-row2 ff-widget-user-apy-holder">
              <div className="ff-widget-label">Your Reward per token in day:</div>
              <div className="ff-widget-value ff-widget-user-apy">
                {userRate}{` `}{rewardsTokenSymbol}
              </div>
            </div>
          )}
          <div className="ff-widget-row2">
            <div className="ff-widget-label">
              TVL:
              <span>
                <span className="ff-skeleton"></span>
              </span>
            </div>
            <div className="ff-widget-value ff-widget-tvl-token-name">
              {stakingTokenSymbol && totalSupply && stakingDecimals ? (
                <>{toFixed(totalSupply / Math.pow(10, stakingDecimals))}{' '}{stakingTokenSymbol}</>
              ) : (
                <span className="ff-skeleton"></span>
              )}
            </div>
          </div>
        </div>
        {address && (
          <>
            {stakedAmount > 0 && (
              <div className="ff-widget-section ff-widget-earn-section">
                <div className="ff-widget-section-title">
                  <b className="ff-rewards-token-name">
                    {rewardsTokenSymbol ? (
                      <>{rewardsTokenSymbol}</>
                    ) : (
                      <span className="ff-skeleton"></span>
                    )}
                  </b> Earned
                </div>
                <div className="ff-widget-row">
                  <div className="ff-widget-value ff-widget-earned-amount">
                    {earnedAmount !== false ? (
                      <>{earnedAmount}</>
                    ) : (
                      <span className="ff-skeleton"></span>
                    )}
                  </div>
                  <div>
                    <button
                      className="ff-button ff-widget-harvest-button"
                      type="button"
                      disabled={!earnedAmount || isHarvest}
                      onClick={doHarvest}
                    >
                      {isHarvest ? (
                        <div className="ff-loader"></div>
                      ) : (
                        <>{`Harvest`}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="ff-widget-section ff-widget-stake-section">
              <div className="ff-widget-section-title">
                <b className="ff-staking-token-name">
                  {stakingTokenSymbol ? (
                    <>{stakingTokenSymbol}</>
                  ) : (
                    <span className="ff-skeleton"></span>
                  )}
                </b> Staked
              </div>
              <div className="ff-widget-row">
                <div className="ff-widget-value ff-widget-staked-amount">
                  {stakedAmount !== false ? (
                    <>{stakedAmount}</>
                  ) : (
                    <span className="ff-skeleton"></span>
                  )}
                </div>
                <div>
                  <button
                    className="ff-button ff-widget-deposit-button"
                    type="button"
                    onClick={() => { setIsDepositOpened(true) }}
                  >
                    {`Deposit`}
                  </button>
                  <button
                    className="ff-button ff-widget-withdraw-button"
                    type="button"
                    disabled={!(stakedAmount !== false && stakedAmount > 0)}
                    onClick={() => { setIsWithdrawOpened(true) }}
                  >
                    {`Withdraw`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="ff-widget-footer">
          {!isConnected && (
            <ConnectWallet />
          )}
          
          <button className="ff-button ff-widget-approve-button ff-hidden" type="button">Approve contract</button>
        </div>
      </div>

      <div className="ff-modals-holder">
        {isHarvest && (
          <Modal title={`Harvest`} onClose={() => { setIsHarvest(false) }} canClose={isHarvestError || isHarvestReady}>
            {isHarvestError ? (
              <>{`Something went wrong. Try again later.`}</>
            ) : (
              <>
                {isHarvestReady ? (
                  <>{`Tokens have been transferred to your address.`}</>
                ) : (
                  <>
                    {harvestHash ? (
                      <div className="ff-transaction-link">
                        <div>{`Pending transaction: `}</div>
                        <a href={GET_TX_LINK(harvestHash)} target="_blank">{harvestHash}</a>
                      </div>
                    ) : (
                      <>{`Confirm transaction...`}</>
                    )}
                  </>
                )}
              </>
            )}
          </Modal>
        )}
        {isWithdrawOpened && (
          <Modal title={`Withdraw`} onClose={() => { setIsWithdrawOpened(false) }} canClose={!isWithdrawing}>
            {isWithdrawReady ? (
              <div>{`Tokens have been withdrawn to your address.`}</div>
            ) : (
              <>
                {isWithdrawError ? (
                  <div>{`Something went wrong. Try again later.`}</div>
                ) : (
                  <>
                    <div className="ff-text-field-container">
                      <div className="ff-text-field-label">
                        Available to withdraw:{' '}
                        <b>{stakedAmount}{` `}{stakingTokenSymbol}</b>
                        {stakedAmount > 0 && (
                          <>
                            {` `}
                            <a className="ff-max-balance-button" onClick={() => { if (!isWithdrawing) setWithdrawAmount(stakedAmount) }}>
                              <b>{`use max`}</b>
                            </a>
                          </>
                        )}
                      </div>
                      <input
                        className="ff-text-field"
                        type="text"
                        placeholder="0.0"
                        value={withdrawAmount}
                        disabled={isWithdrawing}
                        onChange={(e) => { setWithdrawAmount(e.target.value) }}
                      />
                    </div>
                    {withdrawHash && (
                      <div className="ff-transaction-link">
                        <div>{`Pending transaction: `}</div>
                        <a href={GET_TX_LINK(withdrawHash)} target="_blank">{withdrawHash}</a>
                      </div>
                    )}
                    <div className="ff-modal-buttons">
                      <button
                        className="ff-button"
                        type="button"
                        onClick={doWithdraw}
                        disabled={isWithdrawing}
                      >
                        {isWithdrawing ? (
                          <div className="ff-loader"></div>
                        ) : (
                          <>{`Withdraw`}</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </Modal>
        )}
        {isDepositOpened && (
          <Modal title={`Deposit`} onClose={() => { setIsDepositOpened(false) }} canClose={!(isDepositing || isApproving)}>
            {isDepositReady ? (
              <div>{`Tokens were credited to the contract.`}</div>
            ) : (
              <>
                {isDepositError ? (
                  <div>{`Something went wrong. Try again later.`}</div>
                ) : (
                  <>
                    <div className="ff-text-field-container">
                      <div className="ff-text-field-label">
                        Available to deposit:{' '}
                        <b>{userBalance}{` `}{stakingTokenSymbol}</b>
                        {userBalance > 0 && (
                          <>
                            {` `}
                            <a className="ff-max-balance-button" onClick={() => { if (!isApproving && !isDepositing) setDepositAmount(userBalance) }}>
                              <b>{`use max`}</b>
                            </a>
                          </>
                        )}
                      </div>
                      <input
                        className="ff-text-field"
                        type="text"
                        placeholder="0.0"
                        value={depositAmount}
                        disabled={isApproving || isDepositing}
                        onChange={(e) => { setDepositAmount(e.target.value) }}
                      />
                    </div>
                    {depositHash && (
                      <div className="ff-transaction-link">
                        <div>{`Pending transaction: `}</div>
                        <a href={GET_TX_LINK(depositHash)} target="_blank">{depositHash}</a>
                      </div>
                    )}
                    {approveHash && (
                      <div className="ff-transaction-link">
                        <div>{`Pending approve tx: `}</div>
                        <a href={GET_TX_LINK(approveHash)} target="_blank">{approveHash}</a>
                      </div>
                    )}
                    <div className="ff-modal-buttons">
                      {needApprove ? (
                        <button
                          className="ff-button"
                          type="button"
                          onClick={doApprove}
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <div className="ff-loader"></div>
                          ) : (
                            <>{`Approve contract`}</>
                          )}
                        </button>
                      ) : (
                        <button
                          className="ff-button"
                          type="button"
                          onClick={doDeposit}
                          disabled={isDepositing}
                        >
                          {isDepositing ? (
                            <div className="ff-loader"></div>
                          ) : (
                            <>{`Deposit`}</>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}

export default Widget;
