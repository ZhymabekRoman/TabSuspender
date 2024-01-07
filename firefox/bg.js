let tabs = {}
let timeoutCount = 300000
let suspendApp = 'false'
let audible = 'false'
let pinned = 'false'
let whitelisted = ''
let maxTabs = 50
let useTimer = 'false'

async function loadScript() {
  //var themeInfo = await browser.theme.getCurrent();
  //console.log('themeInfo', themeInfo)
  //let activeTab = await getCurrentTabId();
  //console.log('activeTab', activeTab)
  let currentWindow = await browser.windows.getLastFocused()
  /*
		browser.theme.update({
			colors: {
				frame: '#fff',
				backgroundtext: '#000',
			}
		});
	*/

  browser.storage.onChanged.addListener(function (i) {
    if (i.timeoutCount) {
      console.log('Timecount changed to ', i.timeoutCount.newValue);
      timeoutCount = Number(i.timeoutCount.newValue)
    } else if (i.suspendApp) {
      console.log('i.suspendApp', i.suspendApp)
      suspendApp = i.suspendApp.newValue == 'true' ? 'true' : 'false'
      console.log('suspendApp', suspendApp);
    } else if (i.audible) {
      audible = i.audible.newValue == 'true' ? 'true' : 'false'
    } else if (i.pinned) {
      pinned = i.pinned.newValue == 'true' ? 'true' : 'false'
    } else if (i.whitelisted) {
      whitelisted = i.whitelisted.newValue
      console.log('whitelisted list updated', whitelisted)
    } else if (i.maxTabs) {
      console.log('maxTabs changed to ', i.maxTabs.newValue);
      maxTabs = Number(i.maxTabs.newValue)
    } else if (i.suspendTimerRadio) {
      console.log('suspendTimerRadio changed to ', i.suspendTimerRadio.newValue);
      useTimer = i.suspendTimerRadio.newValue == 'true' ? 'false' : 'true'
      console.log('useTimer value is: ', useTimer);
    } else if (i.suspendTabsRadio) {
      console.log('suspendTabsRadio changed to ', i.suspendTabsRadio.newValue);
      useTimer = i.suspendTabsRadio.newValue == 'true' ? 'true' : 'false'
      console.log('useTimer value is: ', useTimer);
    }
  })

  browser.storage.local.get('whitelisted').then(function (i) {
    if (i && i.whitelisted) {
      whitelisted = i.whitelisted
      console.log('whiteliested', whitelisted)
    }
  })

  browser.storage.local.get('timeoutCount').then(async function (i) {
    if (i && i.timeoutCount) {
      console.log('timecount changed');
      timeoutCount = Number(i.timeoutCount)
    }
    var tabs = await browser.tabs.query({})
    tabs.forEach(async (tab) => {
      console.log('tab.id', tab.id)
      if (!tabs[tab.id]) {
        tabs[tab.id] = {}
      }
      tabs[tab.id].tab = {
        id: tab.id,
        pinned: tab.pinned,
        audible: tab.audible
      }
      if (tab.active == true) {
        return true
      }
      console.log('tabs[tab.id].tab', tabs[tab.id].tab)
      setDiscardTimer(tab.id, tab.id)
    })
  })

  browser.storage.local.get('suspendApp').then(function (i) {
    if (i && i.suspendApp) {
      console.log('timecount changed');
      suspendApp = i.suspendApp == 'true' ? 'true' : 'false'
    }
  })

  browser.storage.local.get('audible').then(function (i) {
    if (i && i.audible) {
      console.log('timecount changed');
      audible = i.audible == 'true' ? 'true' : 'false'
    }
  })

  browser.storage.local.get('pinned').then(function (i) {
    if (i && i.pinned) {
      pinned = i.pinned == 'true' ? 'true' : 'false'
    }
  })

  browser.storage.local.get('maxTabs').then(function (i) {
    if (i && i.maxTabs) {
      maxTabs = Number(i.maxTabs)
    }
  })

  browser.storage.local.get('useTimer').then(function (i) {
    if (i && i.maxTabs) {
      useTimer = i.useTimer == 'true' ? 'true' : 'false'
    }
  })

  browser.tabs.onCreated.addListener(function (tab) {
    console.log('added tab', tab.id);
    if (!tabs[tab.id]) {
      tabs[tab.id] = {}
    }
    tabs[tab.id].tab = tab;
    tabDiscardByLimits()
  })

  browser.tabs.onRemoved.addListener(function (tabId) {
    if (tabs[tabId] && tabs[tabId].timeout) {
      try {
        clearTimeout(tabs[tabId].timeout)
      } catch (e) {}
    }
    tabs[tabId] = {}
    console.log('removed tabId', tabId)
  })

  browser.tabs.onActivated.addListener(async function (tab) {
    //tabs[i] = null;
    console.log('activated tab', tab.tabId);
    setDiscardTimer(tab.tabId, tab.previousTabId)
    tabDiscardByLimits()
  })
}

async function setDiscardTimer(tabId, previousTabId) {
  if (useTimer == 'false') {
    console.log('useTimer is false so not setting timer');
    return true
  }

  if (tabs[tabId]) {
    if (tabs[tabId].timeout) {
      try {
        clearTimeout(tabs[tabId].timeout)
      } catch (e) {}
      tabs[tabId].timeout = null
    }
    
    tabs[tabId].timeout = setTimeout(
      async function (tId) {
        if (suspendApp == 'true') {
          return true
        }
        await discardTab(previousTabId)
      },
      timeoutCount,
      tabId
    )
  } else {
    console.log(`Tab with id ${tabId} does not exist in tabs object.`);
  }
}

async function tabDiscardByLimits() {
  console.log("tabDiscardByLimits was called");
  browser.tabs.query({}).then((allTabs) => {
    console.log('onCreated listener - allTabs', allTabs.length)
    if (useTimer == 'true') {
      console.log('Ignoring, since useTimer is true')
      return true
    }
    if (allTabs.length > maxTabs) {
      let tabsToDiscard = allTabs
        .sort((a, b) => a.id - b.id)
        .slice(0, allTabs.length - maxTabs)
      tabsToDiscard.forEach(async (oldestTab) => {
        console.log('onCreated listener - discarding tab', oldestTab)
        await discardTab(oldestTab.id) // Call discardTab function instead of browser.tabs.discard
      })
    }
  })
}

async function discardTab(tabId) {
  if (suspendApp == 'true') {
    return true
  }

  if (!tabId) {
    return false
  }

  let isLive = await getTabValue(tabId, 'live')
  if (isLive == '1') {
    return true
  }

  let tabInfo = await browser.tabs.get(tabId)
  // console.log('tabId', tabId)
  // console.log('tabInfo', tabInfo)
  // console.log('pinned', pinned, tabInfo.pinned);
  // console.log('audible', audible, tabInfo.audible);

  if (audible == 'true' && tabInfo && tabInfo.audible) {
    // console.log('tab is audible so cannot be discarded');
    return true
  }
  if (pinned == 'true' && tabInfo && tabInfo.pinned) {
    // console.log('tab is pinned so cannot be discarded');
    return true
  }

  let url = tabInfo.url
  // console.log('url', url);
  let host = String(new URL(url).host)
  // console.log('thisHost', host,whitelisted);
  if (whitelisted && whitelisted.includes(host)) {
    console.log('tab is whitelisted so cannot be discarded');
    return true
  }

  if (!tabs[tabId]) {
    tabs[tabId] = {}
  }

  console.log('Suspened tab: ', tabId);
  browser.tabs.discard(tabId)
}

async function getCurrentTabId() {
  let tabArray = await browser.tabs.query({
    currentWindow: true,
    active: true
  })
  return tabArray[0].id
}

async function getTabValue(tabId, key) {
  return await browser.sessions.getTabValue(tabId, key)
}

loadScript()
