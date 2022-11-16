const { ethers } = require('hardhat');

const perpAddress = '0xeEBe00Ac0756308ac4AaBfD76c05c4F3088B8883';

const oracle = async () => {
  [owner] = await ethers.getSigners();
  const Perp = await ethers.getContractFactory("Perp");
  perp = await Perp.attach(perpAddress);

  setInterval(async () => {
    const url = `https://api.binance.com/api/v1/ticker/price?symbol=BTCUSDT`;
    const res = await (await fetch(url)).json();
    const price = res.price;
    console.log(price);
    await perp.priceUpdate(10000);
  }, 5000); // latency would need to be sub 1 sec in production

}
oracle();