import { Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {

  const wallet = new Wallet(PRIVATE_KEY);

  const deployer = new Deployer(hre, wallet);

  const BuidlBuxxArtifact = await deployer.loadArtifact("BuidlBuxx");
  const buidlBuxx = await deployer.deploy(BuidlBuxxArtifact);

  console.log("BuidlBuxx deployed to:", buidlBuxx.address)

  const PaymasterArtifact = await deployer.loadArtifact("BuidlBuxxPaymaster");
  const paymaster = await deployer.deploy(PaymasterArtifact, [buidlBuxx.address]);

  console.log("Paymaster deployed to:", paymaster.address)

  await hre.run("verify:verify", {
    address: buidlBuxx.address,
    contract: "contracts/BuidlBuxx.sol:BuidlBuxx",
  });

  // Can't flatten due to circular dependency - need to update the plugin to use the new endpoint for multiple files
  // await hre.run("verify:verify", {
  //   address: paymaster.address,
  //   contract: "contracts/BuidlBuxxPaymaster.sol:BuidlBuxxPaymaster",
  //   constructorArguments: [buidlBuxx.address]
  // });

  // Fund all wallets with BuidlBuxx
  const wallets = require("../testWallets/wallets.json") as { address: string, privateKey: string }[]

  const amountToTransfer = 100 * (10 ** (await buidlBuxx.decimals()))
  const promises: Promise<void>[] = []
  wallets.forEach(async (wallet) => {
    const promise = new Promise<void>(async resolve => {
      await (await buidlBuxx.claim(wallet.address, amountToTransfer)).wait()
      resolve()
    })
    promises.push(promise)
  });

  await Promise.all(promises)

  // Last wallet will be in the AllowList for claiming
  await buidlBuxx.addToAllowList([wallets[wallets.length - 1].address])

  // Second last 2 wallets will be "vendors" in the desitnationList to receive transfer paid by the paymaster
  await paymaster.addAllowedDestination([wallets[wallets.length - 2].address, wallets[wallets.length - 3].address])

  // First wallet will be the owner of the token contract
  await buidlBuxx.transferOwnership(wallets[0].address)

}
