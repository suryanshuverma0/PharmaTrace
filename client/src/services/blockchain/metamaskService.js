// services/metamaskService.js
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

class MetaMaskService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.isConnecting = false;
  }

  async isMetaMaskInstalled() {
    const provider = await detectEthereumProvider();
    return !!provider;
  }

  async connect() {
    if (this.isConnecting) {
      return {
        success: false,
        error: 'Already connecting to MetaMask. Please wait.'
      };
    }

    this.isConnecting = true;

    try {
      if (!(await this.isMetaMaskInstalled())) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();

      return {
        success: true,
        account: this.account,
        message: 'Connected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isConnecting = false;
    }
  }

  async getCurrentAccount() {
    try {
      if (!this.provider) await this.connect();
      return this.account;
    } catch (error) {
      console.error('Error getting current account:', error);
      return null;
    }
  }

  async signMessage(message) {
    try {
      if (!this.signer) await this.connect();
      return await this.signer.signMessage(message);
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  onAccountChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  onNetworkChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.account = null;
  }
}

export default new MetaMaskService();
