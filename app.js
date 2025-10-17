async function connectWallet() {
  try {
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
    } else if (window.web3) {
      // 兼容老版本钱包
      provider = new ethers.BrowserProvider(window.web3.currentProvider);
    } else {
      alert("请使用 MetaMask 或支持 Web3 的钱包浏览器打开 DApp！");
      return;
    }

    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("walletAddress").innerText = userAddress;
    document.getElementById("userAddress").innerText = userAddress;

    loadDashboard();
    listenMiningEvents();
  } catch (err) {
    console.error(err);
    alert("钱包连接失败，请检查钱包环境！");
  }
}
