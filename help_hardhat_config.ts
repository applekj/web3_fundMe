interface NetworkConfig {
    [propname: string]: { [propname: string]: string }
}

const LOCK_TIME = 180
const developmentChains = ['hardhat', 'local']
const DECIMAL = 8
const INITIAL_ANSWER = 300000000000
const CONFIRMATIONS = 5

const networkConfig: NetworkConfig = {
    11155111: {
        ethUsdDataFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
    }
}

export {
    LOCK_TIME, networkConfig, developmentChains, DECIMAL, INITIAL_ANSWER, CONFIRMATIONS
}