chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openWithSciHub",
    title: "Open with Sci-Hub",
    contexts: ["selection", "link"]  // Поддержка как выделенного текста, так и ссылок
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let textToOpen = "";

  // Если клик по выделенному тексту
  if (info.menuItemId === "openWithSciHub" && info.selectionText) {
    textToOpen = info.selectionText;
  }

  // Если клик по ссылке
  if (info.menuItemId === "openWithSciHub" && info.linkUrl) {
    textToOpen = info.linkUrl;

  }

  if (textToOpen) {
    chrome.storage.local.get(['selectedAddress'], function(result) {
      const sciHubBaseUrl = result.selectedAddress || "https://sci-hub.ru/"; 
      // Открываем Sci-Hub с обработанным текстом sci-hub.ru
      chrome.tabs.create({ url: sciHubBaseUrl }, (newTab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === newTab.id && changeInfo.status === 'complete') {
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: insertTextAndSearch,
              args: [textToOpen]
            });
            chrome.tabs.onUpdated.removeListener(listener);  // Удаляем слушатель
          }
        });
      });
    });
  }
});

function insertTextAndSearch(text) {
  try {
    let inputField =
      document.getElementById("request") ||
      document.querySelector("textarea[name='request']") ||
      document.querySelector("textarea") ||  // fallback
      document.querySelector("input[name='request']") ||
      document.querySelector("input[type='text']") ||
      document.querySelector("input");

    if (!inputField) {
      console.warn("Поле ввода не найдено.");
      alert("Не удалось найти поле ввода на странице Sci-Hub.");
      return;
    }

    inputField.focus();
    inputField.value = text;

    // Триггерим событие input (на случай, если сайт слушает его)
    inputField.dispatchEvent(new Event('input', { bubbles: true }));

    let searchButton =
      document.querySelector("button[type='submit']") ||
      document.querySelector("form button") ||
      document.querySelector("button") ||
      document.querySelector("#open");

    if (!searchButton) {
      console.warn("Кнопка поиска не найдена.");
      alert("Не удалось найти кнопку поиска на странице Sci-Hub.");
      return;
    }

    searchButton.click();

  } catch (e) {
    console.error("Ошибка при вставке текста и поиске на Sci-Hub:", e);
    alert("Произошла ошибка при взаимодействии со страницей Sci-Hub.");
  }
}
