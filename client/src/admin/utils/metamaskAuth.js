import { ethers } from "ethers";

// Replace this with your admin wallet address (the one that deployed contract)
const ADMIN_WALLET = "0x43B0bF307E308732D638F7E965d0a8f220CB9f4d";

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []); // request user wallet

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return address;
};

export const isAdminWallet = (address) => {
  return address.toLowerCase() === ADMIN_WALLET.toLowerCase();
};
