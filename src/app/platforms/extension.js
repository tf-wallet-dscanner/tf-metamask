import { checkForError } from 'app/lib/localstore';
import browser from 'webextension-polyfill';

import { ENVIRONMENT_TYPE_BACKGROUND } from '../constants/app';
import { getEnvironmentType } from '../lib/util';

export default class ExtensionPlatform {
  //
  // Public
  //
  reload() {
    browser.runtime.reload();
  }

  openTab(options) {
    return new Promise((resolve, reject) => {
      browser.tabs.create(options).then((newTab) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newTab);
      });
    });
  }

  openWindow(options) {
    return new Promise((resolve, reject) => {
      browser.windows.create(options).then((newWindow) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(newWindow);
      });
    });
  }

  focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      browser.windows.update(windowId, { focused: true }).then(() => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  updateWindowPosition(windowId, left, top) {
    return new Promise((resolve, reject) => {
      browser.windows.update(windowId, { left, top }).then(() => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve();
      });
    });
  }

  getLastFocusedWindow() {
    return new Promise((resolve, reject) => {
      browser.windows.getLastFocused().then((windowObject) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windowObject);
      });
    });
  }

  closeCurrentWindow() {
    return browser.windows.getCurrent().then((windowDetails) => {
      return browser.windows.remove(windowDetails.id);
    });
  }

  getVersion() {
    const { version, version_name: versionName } =
      browser.runtime.getManifest();

    const versionParts = version.split('.');
    if (versionName) {
      if (versionParts.length < 4) {
        throw new Error(`Version missing build number: '${version}'`);
      }
      // On Chrome, a more descriptive representation of the version is stored in the
      // `version_name` field for display purposes. We use this field instead of the `version`
      // field on Chrome for non-main builds (i.e. Flask, Beta) because we want to show the
      // version in the SemVer-compliant format "v[major].[minor].[patch]-[build-type].[build-number]",
      // yet Chrome does not allow letters in the `version` field.
      return versionName;
      // A fourth version part is sometimes present for "rollback" Chrome builds
    }
    if (![3, 4].includes(versionParts.length)) {
      throw new Error(`Invalid version: ${version}`);
    } else if (versionParts[2].match(/[^\d]/u)) {
      // On Firefox, the build type and build version are in the third part of the version.
      const [major, minor, patchAndPrerelease] = versionParts;
      const matches = patchAndPrerelease.match(/^(\d+)([A-Za-z]+)(\d)+$/u);
      if (matches === null) {
        throw new Error(`Version contains invalid prerelease: ${version}`);
      }
      const [, patch, buildType, buildVersion] = matches;
      return `${major}.${minor}.${patch}-${buildType}.${buildVersion}`;
    }

    // If there is no `version_name` and there are only 3 or 4 version parts, then this is not a
    // prerelease and the version requires no modification.
    return version;
  }

  openExtensionInBrowser(
    route = null,
    queryString = null,
    keepWindowOpen = false,
  ) {
    let extensionURL = browser.runtime.getURL('home.html');

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    this.openTab({ url: extensionURL });
    if (
      getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND &&
      !keepWindowOpen
    ) {
      window.close();
    }
  }

  openExtensionNewWindow({
    url = '',
    width,
    height,
    left = 0,
    top = 0,
    route = null,
    queryString = null,
    keepWindowOpen = false,
  }) {
    let extensionURL = browser.runtime.getURL(url);

    if (route) {
      extensionURL += `#${route}`;
    }

    if (queryString) {
      extensionURL += `?${queryString}`;
    }

    this.openWindow({
      url: extensionURL,
      width,
      height,
      left,
      top,
      type: 'popup',
      state: 'normal',
    });
    if (
      getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND &&
      !keepWindowOpen
    ) {
      window.close();
    }
  }

  getPlatformInfo(cb) {
    try {
      const platformInfo = browser.runtime.getPlatformInfo();
      cb(platformInfo);
      return;
    } catch (e) {
      cb(e);
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  addOnRemovedListener(listener) {
    browser.windows.onRemoved.addListener(listener);
  }

  getAllWindows() {
    return new Promise((resolve, reject) => {
      browser.windows.getAll().then((windows) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(windows);
      });
    });
  }

  getActiveTabs() {
    return new Promise((resolve, reject) => {
      browser.tabs.query({ active: true }).then((tabs) => {
        const error = checkForError();
        if (error) {
          return reject(error);
        }
        return resolve(tabs);
      });
    });
  }

  currentTab() {
    return new Promise((resolve, reject) => {
      browser.tabs.getCurrent().then((tab) => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(tab);
        }
      });
    });
  }

  switchToTab(tabId) {
    return new Promise((resolve, reject) => {
      browser.tabs.update(tabId, { highlighted: true }).then((tab) => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve(tab);
        }
      });
    });
  }

  closeTab(tabId) {
    return new Promise((resolve, reject) => {
      browser.tabs.remove(tabId).then(() => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
