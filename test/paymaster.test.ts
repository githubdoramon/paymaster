import { expect } from 'chai';
import { Wallet, Contract, utils } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as zk from 'zksync-web3'
import { deployToken } from './token.test';
import { ethers } from 'ethers';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

const RICH_WALLET_PK_3 =
  '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e';

async function deployPaymaster(deployer: Deployer, buildBuxxAddress: string): Promise<Contract> {
  const artifact = await deployer.loadArtifact('BuildBuxxPaymaster');
  const contract = await deployer.deploy(artifact,[buildBuxxAddress]);
  // fund paymaster
  await (await deployer.zkWallet.transfer({
    to: contract.address,
    amount: ethers.utils.parseEther("1"),
  })).wait()
  return contract
}

describe('BUIDLBUXX Paymaster', function () {
  it("Account with BuidlBuxx shoudn't pay transaction", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);
    const paymaster = await deployPaymaster(deployer, buidlBuxx.address);

    const currentBalance = await wallet.getBalance();

    const paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: 'General',
      innerInput: new Uint8Array(),
    });

    await (await buidlBuxx.transferWithMessage(wallet3.address, 100, "Order 3RZD", {
      // paymaster info
      customData: {
        paymasterParams,
        ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
      },
    })).wait()

    const newBalance = await wallet.getBalance();

    expect(currentBalance).to.eq(newBalance);
    expect(await buidlBuxx.balanceOf(wallet3.address)).to.eq(100);
  });

  it("Account can transfer BuidlBuxx without paymaster", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);

    const currentBalance = await wallet.getBalance();

    const gasPrice = await provider.getGasPrice()
    const gasLimit = await buidlBuxx.estimateGas.transferWithMessage(wallet3.address, 100, "Order 3RZD")

    await (await buidlBuxx.transferWithMessage(wallet3.address, 100, "Order 3RZD")).wait()

    const newBalance = await wallet.getBalance();

    expect(currentBalance.sub(gasLimit.mul(gasPrice))).to.eq(newBalance);
    expect(await buidlBuxx.balanceOf(wallet3.address)).to.eq(100);
  });

  it("Account without BuidlBuxx shoudn't be able to use paymaster", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2);
    const wallet3 = new Wallet(RICH_WALLET_PK_3, provider);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);
    const paymaster = await deployPaymaster(deployer, buidlBuxx.address);

    const currentBalance = await wallet.getBalance();

    const paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: 'General',
      innerInput: new Uint8Array(),
    });

    // await expect(buidlBuxx.connect(wallet3).transferWithMessage(wallet2.address, 0, "Order 3RZD", {
    //   // paymaster info
    //   customData: {
    //     paymasterParams,
    //     ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
    //   },
    // })).to.be.revertedWith("Failed to validate the transaction. Reason: Validation revert: Paymaster validation error: Account do not hold BUIDL BUCKS");
    // await expect(buidlBuxx.connect(wallet2).mint(wallet2.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");

  });


  it("Shouldn't be able to use paymaster if targetting another contract that not BuidlBuxx", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2);
    const wallet3 = new Wallet(RICH_WALLET_PK_3, provider);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);
    const buidlBuxxFake = await deployToken(deployer);

    const paymaster = await deployPaymaster(deployer, buidlBuxx.address);

    const paymasterParams = utils.getPaymasterParams(paymaster.address, {
      type: 'General',
      innerInput: new Uint8Array(),
    });

    const tx = buidlBuxxFake.transferWithMessage(wallet2.address, 0, "Order 3RZD", {
      // paymaster info
      customData: {
        paymasterParams,
        ergsPerPubdata: utils.DEFAULT_ERGS_PER_PUBDATA_LIMIT,
      },
    })


    // expect(tx).to.be.revertedWith("Failed to validateddd the transaction. Reason: Validation revert: Paymaster validation error: Account do not hold BUIDL BUCKS");
    

  });

});
