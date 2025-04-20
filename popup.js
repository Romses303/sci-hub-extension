const defaultMirrors = [
  "https://sci-hub.ru/",
  "https://sci-hub.se/",
  "https://sci-hub.st/",
  "https://sci-hub.red/",
  "https://sci-hub.box/"
];


document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("mirrorList");
  const inputEl = document.getElementById("addressInput");
  const addBtn = document.getElementById("addButton");
  const openBtn = document.getElementById("openSciHub");
  const selectedEl = document.getElementById("selectedMirror");
  const dropdown = document.getElementById("dropdown");

  // Toggle dropdown
  selectedEl.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
    }
  });

  chrome.storage.local.get(["mirrorList", "selectedAddress"], (result) => {
	const mirrors = (result.mirrorList || defaultMirrors).slice().sort();
    const selected = result.selectedAddress || mirrors[0];
    updateSelectedMirror(selected);
    mirrors.forEach(url => renderMirror(url, url === selected));
  });

  function updateSelectedMirror(url) {
    selectedEl.querySelector("span").textContent = url;
  }

  function renderMirror(url, selected) {
    const row = document.createElement("div");
    row.className = "mirror-row";
    if (selected) row.classList.add("selected");

    const span = document.createElement("span");
    span.textContent = url;

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.title = "Удалить зеркало";

    row.appendChild(span);
    row.appendChild(delBtn);
    listEl.appendChild(row);

    row.addEventListener("click", (e) => {
      if (e.target === delBtn) return;

      chrome.storage.local.set({ selectedAddress: url }, () => {
        [...listEl.children].forEach(child => child.classList.remove("selected"));
        row.classList.add("selected");
        updateSelectedMirror(url);
        dropdown.classList.remove("open");
      });
    });

    delBtn.addEventListener("click", () => {
      chrome.storage.local.get(["mirrorList", "selectedAddress"], (result) => {
        let mirrors = result.mirrorList || defaultMirrors;
        mirrors = mirrors.filter(m => m !== url);
        const newSelected = (result.selectedAddress === url) ? mirrors[0] || "" : result.selectedAddress;
        chrome.storage.local.set({ mirrorList: mirrors, selectedAddress: newSelected }, () => {
          listEl.innerHTML = "";
          updateSelectedMirror(newSelected);
          mirrors.forEach(m => renderMirror(m, m === newSelected));
        });
      });
    });
  }

  addBtn.addEventListener("click", () => {
    let newUrl = inputEl.value.trim();
    if (!/^https?:\/\//.test(newUrl)) newUrl = "https://" + newUrl;
    if (!newUrl.endsWith("/")) newUrl += "/";

    const valid = /^https:\/\/.+\.[a-z]{2,}\/$/.test(newUrl);
    if (!valid) {
      alert("Неверный формат URL. Убедитесь, что адрес содержит домен");
      return;
    }

	chrome.storage.local.get(["mirrorList"], (result) => {
	  let mirrors = result.mirrorList || defaultMirrors;
	  if (!mirrors.includes(newUrl)) {
		mirrors.push(newUrl);
		mirrors.sort(); // 🔽 сортировка после добавления
		chrome.storage.local.set({ mirrorList: mirrors, selectedAddress: newUrl }, () => {
		  listEl.innerHTML = "";
		  updateSelectedMirror(newUrl);
		  mirrors.forEach(m => renderMirror(m, m === newUrl));
		  inputEl.value = "";
		});
	  } else {
		alert("Такое зеркало уже есть в списке.");
	  }
	});
  });

  openBtn.addEventListener("click", () => {
    chrome.storage.local.get(["selectedAddress"], (result) => {
      const url = result.selectedAddress || "https://sci-hub.ru/";
      chrome.tabs.create({ url });
    });
  });
});
