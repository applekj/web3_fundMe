import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { FundMe } from '../../typechain-types';
import { assert, expect } from 'chai';
import { Deployment } from 'hardhat-deploy/dist/types';
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { LOCK_TIME, developmentChains } from '../../help_hardhat_config';

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('test fundme contract', async () => {
        let fundme: FundMe
        let fundmeSecond: FundMe
        let firstAccount: string
        let secondAccount: string
        let mockV3Aggregator: Deployment

        beforeEach(async () => {
            await deployments.fixture(['all'])
            firstAccount = (await getNamedAccounts()).firstAccount
            secondAccount = (await getNamedAccounts()).secondAccount
            const fundmeDeployment = await deployments.get('FundMe')
            mockV3Aggregator = await deployments.get('MockV3Aggregator')
            fundme = await ethers.getContractAt('FundMe', fundmeDeployment.address)
            fundmeSecond = await ethers.getContract('FundMe', secondAccount)
        })

        it('test if the owner is msg.sender', async () => {
            await fundme.waitForDeployment()
            assert.equal(await fundme.owner(), firstAccount)
        })

        it('test if the datafeed is assigned correctly', async () => {
            await fundme.waitForDeployment()
            assert.equal(await fundme.dataFeed(), mockV3Aggregator.address)
        })

        it('window closed, value is greater than minimum, fund failed', async () => {
            // mine after LOCK_TIME+50 seconds
            await time.increase(LOCK_TIME + 50)
            await expect(fundme.fund({ value: ethers.parseEther('0.1') })).to.be.revertedWith('window is closed')
        })

        it('window open, value is less than minimun, fund failed',
            async () => {
                await expect(fundme.fund({ value: ethers.parseEther('0.001') })).to.be.revertedWith('send more eth!')
            }
        )

        it('window open, value is greater than minimum, fund success',
            async () => {
                await fundme.fund({ value: ethers.parseEther('0.1') })
                const balance = await fundme.fundersToAmount(firstAccount)
                expect(balance).to.equal(ethers.parseEther('0.1'))
            }
        )

        it('not owner, window closed, target reached, getFund failed',
            async () => {
                // make sure the target is reached
                await fundme.fund({ value: ethers.parseEther('1') })
                // make sure the window is closed
                await time.increase(LOCK_TIME + 50)
                await expect(fundmeSecond.getFund()).to.be.revertedWith('this function can only be called by owner')
            }
        )

        it('window open, target reached, getFund failed',
            async () => {
                await fundme.fund({ value: ethers.parseEther('1') })
                await expect(fundme.getFund()).to.be.revertedWith('window is opened')
            }
        )

        it('window closed, target not reached, getFund failed',
            async () => {
                await fundme.fund({ value: ethers.parseEther('0.01') })
                await time.increase(LOCK_TIME + 50)
                await expect(fundme.getFund()).to.be.revertedWith('Target is not reached')
            }
        )

        it('window closed, target reached, owner, getFund success',
            async () => {
                await fundmeSecond.fund({ value: ethers.parseEther('1') })
                await time.increase(LOCK_TIME + 50)
                await expect(fundme.getFund()).to.be.emit(fundme, 'FundWithdrawByOwner').withArgs(ethers.parseEther('1'))
            }
        )

        it('window open, target not reached, funder has balance, reFund failed',
            async () => {
                await fundmeSecond.fund({ value: ethers.parseEther('0.01') })
                await expect(fundmeSecond.reFund()).to.be.revertedWith('window is opened')
            }
        )

        it('window closed, target reached, funder has balance, reFund failed',
            async () => {
                await fundmeSecond.fund({ value: ethers.parseEther('0.1') })
                await time.increase(LOCK_TIME + 50)
                await expect(fundmeSecond.reFund()).to.be.revertedWith('Target is reached')
            }
        )

        it(`window closed, target not reached, funder has't balance, reFund failed`,
            async () => {
                await fundme.fund({ value: ethers.parseEther('0.01') })
                await time.increase(LOCK_TIME + 50)
                await expect(fundmeSecond.reFund()).to.be.revertedWith('there is no fund for you')
            }
        )

        it('window closed, target not reached, funder has balance, reFund success',
            async () => {
                await fundme.fund({ value: ethers.parseEther('0.01') })
                await time.increase(LOCK_TIME + 50)
                await expect(fundme.reFund()).to.be.emit(fundme, 'RefundByFunder').withArgs(firstAccount, ethers.parseEther('0.01'))
            }
        )
    })