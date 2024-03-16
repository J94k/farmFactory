// @ts-nocheck
import createContracts from './createContracts'
import { GET_RPC } from './chains'
import Web3 from 'web3'
import BigNumber from 'bignumber.js'

const fetchCommon = (opts) => {
  const {
    farmAddress,
    rewardsAddress,
    stakingAddress,
    networkName,
    account,
  } = opts

  return new Promise(async (resolve, reject) => {
    const web3 = new Web3(GET_RPC(networkName.toLowerCase()))

    const readContracts = await createContracts(web3, {
      farmAddress,
      rewardsAddress,
      stakingAddress,
    })

    const [
      stakingTokenSymbol,
      stakingDecimals,
      rewardsTokenSymbol,
      rewardsDecimals,
      tvlBalance,
      rewardRate,
      totalSupply,
      farmingFinishDate,
      
      farmingBalance,
      earnedTokens,
      allowance,

      userBalance,
    ] = await Promise.all([
      readContracts.staking.methods.symbol().call(),
      readContracts.staking.methods.decimals().call(),
      readContracts.rewards.methods.symbol().call(),
      readContracts.rewards.methods.decimals().call(),
      readContracts.staking.methods.balanceOf(farmAddress).call(),
      readContracts.farm.methods.rewardRate().call(),
      readContracts.farm.methods.totalSupply().call(),
      readContracts.farm.methods.periodFinish().call(),
      (account) ? readContracts.farm.methods.balanceOf(account).call() : new Promise((resolve) => { resolve(0) }),
      (account) ? readContracts.farm.methods.earned(account).call() : new Promise((resolve) => { resolve(0) }),
      (account) ? readContracts.staking.methods.allowance(account, farmAddress).call() : new Promise((resolve) => { resolve(0) }),
      (account) ? readContracts.staking.methods.balanceOf(account).call() : new Promise((resolve) => { resolve(0) }),
    ])
    
    resolve({
      stakingTokenSymbol,
      stakingDecimals: new BigNumber(stakingDecimals).toFixed(),
      rewardsTokenSymbol,
      rewardsDecimals: new BigNumber(rewardsDecimals).toFixed(),
      tvlBalance: new BigNumber(tvlBalance).toFixed(),
      rewardRate: new BigNumber(rewardRate).toFixed(),
      totalSupply: new BigNumber(totalSupply).toFixed(),
      farmingFinishDate: new BigNumber(farmingFinishDate).toFixed(),
      farmingBalance: new BigNumber(farmingBalance).toFixed(),
      earnedTokens: new BigNumber(earnedTokens).toFixed(),
      allowance: new BigNumber(allowance).toFixed(),
      userBalance: new BigNumber(userBalance).toFixed()
    })
  })
}

export default fetchCommon