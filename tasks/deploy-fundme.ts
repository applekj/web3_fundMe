import { task } from 'hardhat/config'
import { LOCK_TIME, networkConfig } from '../help_hardhat_config'

task('deploy-fundme', 'deploy and verify the fundme contract').setAction(async (taskArgs, hre) => {
    const { chainId } = hre.network.config
    if (chainId !== 11155111) {
        console.error('please deploy fundMe contract in sepolia...')
        return
    }
    // 获取合约工厂
    const fundMeFactory = await hre.ethers.getContractFactory('FundMe')
    // 部署合约
    const fundMe = await fundMeFactory.deploy(LOCK_TIME, networkConfig[chainId].ethUsdDataFeed)
    // 等待合约部署成功
    await fundMe.waitForDeployment()
    console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`)
    console.log("it's waitting for 5 confirmations")
    if (!process.env.ETHERSCAN_APIKEY_SEPOLIA) {
        console.log('verification skippek...')
        return
    }
    // 等待合约被5个区块确认
    await fundMe.deploymentTransaction()?.wait(5)
    // 验证合约
    await hre.run("verify:verify", {
        address: fundMe.target,
        constructorArguments: [LOCK_TIME, networkConfig[chainId].ethUsdDataFeed]
    })
})