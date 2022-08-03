import browser from 'webextension-polyfill';

import Controller from './controller';
import KeyringController from './controllers/keyring-controller';
import ProviderController from './controllers/provider-controller';
import NotificationManager from './lib/notification-manager';
import { BackgroundMessages } from './messages';

const notificationManager = new NotificationManager();

/**
 * Opens the browser popup for user confirmation
 */
async function triggerUi() {
  await notificationManager.showPopup();
}

class Background {
  constructor() {
    this.controller = new Controller();
    this.providerController = new ProviderController();
    this.keyringController = new KeyringController();
    this.requests = new Map();
  }

  async receiveHello(sender, data) {
    console.log('BG: receiveHello: ', sender, data);
    return {
      message: 'Hey there!!!',
    };
  }

  async receiveSetAddress(sender, data) {
    console.log('BG: receiveSetAddress: ', sender, data);
    await this.controller.store.set({ address: data.message });
    const res = await this.controller.store.get('address');
    console.log('BG: get store', res);
    return {
      message: res,
    };
  }

  async getLatestBlock() {
    const block = await this.providerController.getLatestBlock();
    return {
      block,
    };
  }

  async getNetworkVersion() {
    const networkVersion = await this.providerController.getNetworkVersion();
    return {
      networkVersion,
    };
  }

  // 니모닉 구문 생성
  async receiveGenerateMnemonic() {
    const mnemonic = await this.keyringController.generateMnemonic();
    return mnemonic;
  }

  // 니모닉 코드 검증
  async receiveValidateMnemonic(sender, { mnemonic }) {
    const validate = await this.keyringController.validateMnemonic(mnemonic);
    return validate;
  }

  // 신규 계정 생성
  async receiveNewAccount(sender, data) {
    const accounts = await this.keyringController.createNewAccount(data);
    return accounts;
  }

  registerMessengerRequests() {
    this.requests.set(
      BackgroundMessages.SAY_HELLO_TO_BG,
      this.receiveHello.bind(this),
    );

    this.requests.set(
      BackgroundMessages.SET_ADDRESS_TO_BG,
      this.receiveSetAddress.bind(this),
    );

    this.requests.set(
      BackgroundMessages.GET_LATEST_BLOCK,
      this.getLatestBlock.bind(this),
    );

    this.requests.set(
      BackgroundMessages.GET_NETWORK_VERSION,
      this.getNetworkVersion.bind(this),
    );

    // 니모닉 생성
    this.requests.set(
      BackgroundMessages.GENERATE_MNEMONIC_BG,
      this.receiveGenerateMnemonic.bind(this),
    );

    // 니모닉 검증
    this.requests.set(
      BackgroundMessages.VALIDATE_MNEMONIC_BG,
      this.receiveValidateMnemonic.bind(this),
    );

    // 신규 계정 생성
    this.requests.set(
      BackgroundMessages.NEW_ACCOUNT_BG,
      this.receiveNewAccount.bind(this),
    );
  }

  listenForMessages() {
    browser.runtime.onMessage.addListener(async (message, sender) => {
      const { type, data } = message;
      if (type === BackgroundMessages.INPAGE_TO_BG) {
        // 팝업 띄우기
        await triggerUi();
        return null;
      } else {
        return this.requests.get(type)?.(sender, data);
      }
    });
  }

  async init() {
    // 1. Create a mapping for message listeners
    this.registerMessengerRequests();

    // 2. Listen for messages from background and run the listener from the map
    this.listenForMessages();

    // Send message to content script of active tab after 10000 ms
    setInterval(() => {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        tabs.forEach((tab) => {
          console.log('tab.id:', tab.id);
        });
      });
    }, 10000);
  }
}

const initApp = async (remotePort) => {
  console.log('remotePort: ', remotePort);
  new Background().init();
};

browser.runtime.onConnect.addListener(initApp);
