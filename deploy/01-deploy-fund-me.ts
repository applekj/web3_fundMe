import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { developmentChains, LOCK_TIME, networkConfig, CONFIRMATIONS } from '../help_hardhat_config'

const deployFundme: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { network, deployments, getNamedAccounts, run } = hre
    const { config: { chainId }, name } = network
    const { deploy } = deployments
    const { firstAccount } = await getNamedAccounts()

    let dataFeedAddr
    if (developmentChains.includes(name)) {
        dataFeedAddr = (await deployments.get('MockV3Aggregator')).address
    } else {
        if (chainId !== 11155111) {
            console.error('please deploy fundMe contract in sepolia...')
            return
        }
        dataFeedAddr = networkConfig[chainId].ethUsdDataFeed
    }

    const fundMe = await deploy('FundMe', {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: developmentChains.includes(name) ? 0 : CONFIRMATIONS
    })

    if (!process.env.ETHERSCAN_APIKEY_SEPOLIA || chainId !== 11155111) {
        console.log('network is not sepolia, verification skipped...')
        return
    }

    await run('verify:verify', {
        address: fundMe.address,
        constructorArgments: [LOCK_TIME, dataFeedAddr]
    })

}

deployFundme.tags = ['all', 'fundme']
export default deployFundme