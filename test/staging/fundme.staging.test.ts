import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { expect } from 'chai'
import { developmentChains, LOCK_TIME } from '../../help_hardhat_config'
import { FundMe } from '../../typechain-types'

developmentChains.includes(network.name)
    ? describe.skip
    : describe('staging test fundme contract', async () => {
        let fundme: FundMe
        let firstAccount: string

        beforeEach(async () => {
            await deployments.fixture(['all'])
            firstAccount = (await getNamedAccounts()).firstAccount
            const fundmeDeployment = await deployments.get('FundMe')
            fundme = await ethers.getContractAt('FundMe', fundmeDeployment.address)
        })

        it('fund and getFund successfully', async () => {
            await fundme.fund({ value: ethers.parseEther('0.06') })
            await new Promise(resolve => setTimeout(resolve, (LOCK_TIME + 1) * 1000))
            const getFundTx = await fundme.getFund()
            const getFundReceipt = await getFundTx.wait()
            expect(getFundReceipt).to.be.emit(fundme, 'FundWithdrawByOwner').withArgs(ethers.parseEther('0.06'))
        })

        it('fund and reFund successfully', async () => {
            await fundme.fund({ value: ethers.parseEther('0.01') })
            await new Promise(resolve => setTimeout(resolve, (LOCK_TIME + 1) * 1000))
            const reFundTx = await fundme.reFund()
            const reFundReceipt = await reFundTx.wait()
            expect(reFundReceipt).to.be.emit(fundme, 'RefundByFunder').withArgs(firstAccount, ethers.parseEther('0.01'))
        })
    })

