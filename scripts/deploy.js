const hre = require("hardhat");

async function main() {
  [owner, user1] = await ethers.getSigners();
  const networkData = await ethers.provider.getNetwork();
  if (networkData.chainId === 31337) { // Move some funds on local testnet
    const sponsor = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', ethers.provider);
    await sponsor.sendTransaction({ to: owner.address, value: ethers.utils.parseEther('2') });
    console.log(`Sent ETH to ${owner.address}`);
  }
  const PerpFactory = await ethers.getContractFactory("PerpFactory");
  perpFactory = await PerpFactory.deploy();
  await perpFactory.deployed();
  console.log(`PerpFactory deployed to ${perpFactory.address}`);
  const tx = await perpFactory.createPerp('BTC10X',10);
  const res = await tx.wait();
  const perpAddress = res.events[0].args.contractAddress;
  const Perp = await ethers.getContractFactory("Perp");
  perp = await Perp.attach(perpAddress);
  console.log(`Perp BTC10X deployed to ${perp.address}`);
  const pUSDAddress = await perpFactory.perpUSD();
  const Token = await ethers.getContractFactory("Token");
  pUSD = await Token.attach(pUSDAddress);
  console.log(`pUSD deployed to ${pUSD.address}`);
  const pGovAddress = await perpFactory.perpGov();
  pGov = await Token.attach(pGovAddress);
  console.log(`pGov deployed to ${pGov.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
