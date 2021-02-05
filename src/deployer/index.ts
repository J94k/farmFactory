import json from '../../contracts/Farm.json'


const networks = {
  mainnet: 'https://mainnet.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c',
  ropsten: 'https://ropsten.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c',
  kovan: 'https://kovan.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c',
}

const loadScript = (src) => new Promise((resolve, reject) => {
  const script = document.createElement('script')

  script.onload = resolve
  script.onerror = reject
  script.src = src

  document.head.appendChild(script)
})


type Opts = {
  rewardsAddress: string
  stakingAddress: string
  duration: number
  decimal: number
  onStartLoading: () => void
  onFinishLoading: () => void
  onSuccess: (address: string) => void
  onError: (error: Error) => void
}

type State = {
  opts: Opts
  button: HTMLButtonElement
  web3: any
}

const state: State = {
  opts: null,
  button: null,
  web3: null,
}

const setupWeb3 = () => new Promise((resolve, reject) => {
  const activeNetworkName = ({
    1: 'mainnet',
    3: 'ropsten',
    42: 'kovan',
  })[window.ethereum && window.ethereum.networkVersion]

  const network = networks[activeNetworkName]

  const web3 = new window.Web3(window.ethereum || window.Web3.givenProvider || new window.Web3.providers.HttpProvider(network))

  if (web3) {
    state.web3 = web3
    resolve()
  }
  else {
    reject()
  }
})

const deploy = async () => {
  const { abi, bytecode } = json
  const { rewardsAddress, stakingAddress, duration, decimal } = state.opts

  let contract
  let accounts

  try {
    contract = new state.web3.eth.Contract(abi)
    accounts = await window.ethereum.request({ method: 'eth_accounts' })
  }
  catch (err) {
    if (typeof state.opts.onError === 'function') {
      state.opts.onError(err)
    }

    return
  }

  contract.deploy({
    data: '0x' + bytecode,
    arguments: [ rewardsAddress, stakingAddress, duration, decimal ]
  })
    .send({
      from: accounts[0],
      gas: 3000000,
    }, function(error, transactionHash) {})
    .on('error', function(error) {
      if (typeof state.opts.onError === 'function') {
        state.opts.onError(error)
      }
    })
    .on('receipt', function(receipt) {
      if (typeof state.opts.onSuccess === 'function') {
        state.opts.onSuccess(receipt.contractAddress)
      }
    })
}

const handleError = (err) => {
  if (typeof state.opts.onError === 'function') {
    state.opts.onError(err)
  }

  state.button.disabled = true
}

const init = async (opts: Opts) => {
  state.opts = opts
  state.button = document.getElementById('farmdeployer-button') as HTMLButtonElement

  if (!state.button) {
    alert('button element with id="farmdeployer-button" is missed on page.')
    return
  }

  state.button.disabled = true

  if (typeof state.opts.onStartLoading === 'function') {
    state.opts.onStartLoading()
  }

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/web3/1.3.1/web3.min.js')
    await setupWeb3()

    if (typeof state.opts.onFinishLoading === 'function') {
      state.opts.onFinishLoading()
    }

    state.button.disabled = false

    state.button.addEventListener('click', () => {
      if (!state.button.disabled) {
        deploy()
      }
    })
  }
  catch (err) {
    handleError(err)
  }
}


export default {
  init,
}
