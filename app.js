let provider, signer, userAddress;

// 已部署合约地址
const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
const AIZK_ADDRESS = "0x82a86d27c385e2d31b2e699cea5023168a34b96e";
const MARKETPLACE_ADDRESS = "0x7d61050aad09bae3fd45b65e33d22d3284ba072a";
const MINING_ADDRESS = "0xYourAIZKMiningContractAddress"; // 请替换为实际部署地址

// 合约 ABI
const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function decimals() view returns (uint8)"
];

const marketplaceABI = [
  "function createOrder(uint256 productId,uint256 quantity,address referrer) external"
];

const miningABI = [
  "event MiningRewardUpdated(address indexed user,uint256 totalPower,uint256 totalReward)",
  "function userMiningPower(address user) view returns (uint256)",
  "function userTotalReward(address user) view returns (uint256)"
];

// === 连接钱包 ===
async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("walletAddress").innerText = userAddress;
    document.getElementById("userAddress").innerText = userAddress;

    loadDashboard();
    listenMiningEvents();
  } else {
    alert("请安装 MetaMask 或使用 TokenPocket / OKX Wallet！");
  }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);

// === 仪表盘数据 ===
async function loadDashboard() {
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, provider);
  const aizk = new ethers.Contract(AIZK_ADDRESS, erc20ABI, provider);
  const mining = new ethers.Contract(MINING_ADDRESS, miningABI, provider);

  const usdtBal = await usdt.balanceOf(userAddress);
  const aizkBal = await aizk.balanceOf(userAddress);

  const miningPower = await mining.userMiningPower(userAddress);
  const reward = await mining.userTotalReward(userAddress);

  document.getElementById("usdtBalance").innerText = ethers.formatUnits(usdtBal, 18);
  document.getElementById("aizkBalance").innerText = ethers.formatUnits(aizkBal, 18);
  document.getElementById("miningPower").innerText = ethers.formatUnits(miningPower, 18);
  document.getElementById("reward").innerText = ethers.formatUnits(reward, 18);
}

// === 购买商品 ===
async function buyProduct(productId, quantity) {
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceABI, signer);
  const usdt = new ethers.Contract(USDT_ADDRESS, erc20ABI, signer);

  const price = productId === 1 ? "100" : "500";
  const total = ethers.parseUnits(price, 18);

  try {
    const approveTx = await usdt.approve(MARKETPLACE_ADDRESS, total);
    await approveTx.wait();

    const orderTx = await marketplace.createOrder(productId, quantity, ethers.ZeroAddress);
    await orderTx.wait();

    alert("✅ 购买成功！");
    loadDashboard();
  } catch (e) {
    console.error(e);
    alert("交易失败，请检查控制台");
  }
}

// === 实时监听挖矿事件 ===
async function listenMiningEvents() {
  const mining = new ethers.Contract(MINING_ADDRESS, miningABI, provider);

  mining.on("MiningRewardUpdated", (user, totalPower, totalReward) => {
    if (user.toLowerCase() === userAddress.toLowerCase()) {
      document.getElementById("miningPower").innerText = ethers.formatUnits(totalPower, 18);
      document.getElementById("reward").innerText = ethers.formatUnits(totalReward, 18);
      console.log(`实时更新: 算力=${totalPower}, 收益=${totalReward}`);
    }
  });
}
