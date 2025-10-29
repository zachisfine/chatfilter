const defaultWords = `W
L
facts
fax
tru
true
cap
yo
ong
mid
fr
gg
ggs
muted
scam
me
lol
lmfao
lmao
kek
kekw`;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get({wordsList: defaultWords}, (items) => {
        if (items.wordsList === defaultWords) {
            chrome.storage.sync.set({wordsList: defaultWords});
        }
    });
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    chrome.scripting.executeScript({
      target: {tabId: details.tabId},
      files: ['contentScript.js']
    }).catch(error => console.error('Script injection failed:', error));
  }, {url: [{hostEquals: 'kick.com'}]});
  

