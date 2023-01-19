import { expect } from 'chai';
import { Wallet, Contract } from 'zksync-web3';
import * as hre from 'hardhat';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as zk from 'zksync-web3'
import { BigNumber } from 'ethers';

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const RICH_WALLET_PK_2 =
  '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';

const RICH_WALLET_PK_3 =
  '0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e';

export async function deployToken(deployer: Deployer): Promise<Contract> {
  const artifact = await deployer.loadArtifact('BuidlBuxx');
  const contract = await deployer.deploy(artifact);
  const wallet3 = new Wallet(RICH_WALLET_PK_3);
  await (await contract.addToAllowList([wallet3.address])).wait()
  return contract
}

describe('BuidlBuxx', function () {
  it("Should deploy token, and premint it", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);

    expect(await buidlBuxx.name()).to.eq('BUIDL BUXX');
    expect(await buidlBuxx.symbol()).to.eq('BUXX');
    expect(await buidlBuxx.decimals()).to.eq(2);

    const decimals = await buidlBuxx.decimals()
    expect((await buidlBuxx.totalSupply()).toNumber()).to.eq(100000 * (10 ** decimals));

    const allowList = await buidlBuxx.allowList(wallet3.address)
    expect(allowList).to.eq(true)
  });

  it("Should be able to mint more - only the owner", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3, provider);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);

    const decimals = await buidlBuxx.decimals()

    expect(await buidlBuxx.totalSupply()).to.eq(BigNumber.from(100000 * (10 ** decimals)));

    const tx = await buidlBuxx.mint(wallet3.address, (20 * (10 ** decimals)))
    await tx.wait()

    expect(await buidlBuxx.totalSupply()).to.eq(BigNumber.from(100020 * (10 ** decimals)));

    await expect(buidlBuxx.connect(wallet2).mint(wallet2.address, 1)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should be able to claim - only allowListed and owner", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3, provider);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);

    const decimals = await buidlBuxx.decimals()

    const tx1 = await buidlBuxx.claim(wallet2.address, 20 * (10 ** await buidlBuxx.decimals()))
    await tx1.wait()

    expect((await buidlBuxx.balanceOf(wallet2.address)).toNumber()).to.eq(20 * (10 ** decimals));

    const tx2 = buidlBuxx.connect(wallet2).transfer(wallet3.address, 5 * (10 ** decimals))

    await expect(tx2).to.emit(buidlBuxx, "Transfer");
    await (await tx2).wait()

    expect(await buidlBuxx.balanceOf(wallet2.address)).to.eq(BigNumber.from(15 * (10 ** decimals)));
    expect(await buidlBuxx.balanceOf(wallet3.address)).to.eq(BigNumber.from(5 * (10 ** decimals)));

    await expect(buidlBuxx.connect(wallet2).claim(wallet.address, 5 * (10 ** decimals))).to.be.revertedWith("Not allowlisted or owner")

    const tx3 = await buidlBuxx.connect(wallet3).claim(wallet3.address, 5 * (10 ** await decimals))
    await tx3.wait()

    expect(await buidlBuxx.balanceOf(wallet2.address)).to.eq(BigNumber.from(15 * (10 ** decimals)));
    expect(await buidlBuxx.balanceOf(wallet3.address)).to.eq(BigNumber.from(10 * (10 ** decimals)));
  });

  it("Should add and remove from allowList - only the owner", async function () {
    const provider = new zk.Provider(hre.config.networks.zkSyncTestnet.url)

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const wallet2 = new Wallet(RICH_WALLET_PK_2, provider);
    const wallet3 = new Wallet(RICH_WALLET_PK_3, provider);

    const deployer = new Deployer(hre, wallet);

    const buidlBuxx = await deployToken(deployer);

    const tx = await buidlBuxx.addToAllowList([wallet2.address])
    await tx.wait()

    expect(await buidlBuxx.allowList(wallet2.address)).to.eq(true);

    const tx2 = await buidlBuxx.removeFromAllowList([wallet3.address, wallet2.address])
    await tx2.wait()

    expect(await buidlBuxx.allowList(wallet3.address)).to.eq(false);
    expect(await buidlBuxx.allowList(wallet2.address)).to.eq(false);

  });
});
