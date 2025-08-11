import { task } from 'hardhat/config'
import { FundMe } from '../typechain-types'
import { LOCK_TIME } from '../help_hardhat_config'

task('interact-fundme', 'interact with fundme contract')
    .addParam('addr', 'fundme contract of describe: fundme contract address')
    .setAction(async (taskArgs, hre) => {
        const { ethers } = hre
        const fundMeFactory = await ethers.getContractFactory('FundMe')
        const fundMe = fundMeFactory.attach(taskArgs.addr) as FundMe

        //初始化两个账户，一个owner，一个参与者
        const [firstAccount, secondAccount] = await ethers.getSigners()

        //账号1给合约集资
        const fundTx = await fundMe.fund({ value: ethers.parseEther("0.02") })
        await fundTx.wait()

        //查看合约余额
        const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
        console.log(`Balance of the contract is ${balanceOfContract}`)

        //账户2给合约集资
        const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.02") })
        await fundTxWithSecondAccount.wait()

        //查看合约余额
        const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
        console.log(`Balance of the contract is ${balanceOfContractAfterSecondFund}`)

        //检查合约
        const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
        const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
        console.log(`Balance of first account ${firstAccount} is ${firstAccountBalanceInFundMe}`)
        console.log(`Balance of second account ${secondAccount} is ${secondAccountBalanceInFundMe}`)

        //提取合约中余额
        await new Promise(resolve => setTimeout(resolve, (LOCK_TIME + 1) * 1000))
        const getFundTx = await fundMe.getFund()
        await getFundTx.wait()
        const lastBalanceOfFundMe = await ethers.provider.getBalance(fundMe.target)
        console.log(`Balance of fundme contract is ${lastBalanceOfFundMe}`)
    })