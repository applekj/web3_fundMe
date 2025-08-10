import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { DECIMAL, INITIAL_ANSWER, developmentChains } from '../help_hardhat_config'

const deployMock: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre
    const { name } = network
    const { deploy } = deployments
    const { firstAccount } = await getNamedAccounts()

    if (!developmentChains.includes(name)) {
        console.log('environment is not local, mock contract deployment is skipped...')
        return
    }

    await deploy('MockV3Aggregator', {
        from: firstAccount,
        args: [DECIMAL, INITIAL_ANSWER],
        log: true
    })

}

deployMock.tags = ['all', 'mock']
export default deployMock