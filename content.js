// =====================
// 配置与全局状态
// =====================
let globalConfig = {
  bilibiliEnabled: true,
  neteaseMusicEnabled: true,
};
const processedCards = new Set();

// =====================
// 配置相关
// =====================
async function loadConfig() {
  try {
    const config = await chrome.storage.sync.get([
      "bilibiliEnabled",
      "neteaseMusicEnabled",
    ]);
    globalConfig.bilibiliEnabled = config.bilibiliEnabled !== false;
    globalConfig.neteaseMusicEnabled = config.neteaseMusicEnabled !== false;
    console.log("配置加载完成:", globalConfig);
  } catch (error) {
    console.error("加载配置失败:", error);
  }
}

// 监听配置更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "configUpdated") {
    globalConfig.bilibiliEnabled = request.config.bilibiliEnabled;
    globalConfig.neteaseMusicEnabled = request.config.neteaseMusicEnabled;
    console.log("配置已更新:", globalConfig);
    init();
  }
});

// =====================
// 页面初始化与入口
// =====================
async function init() {
  await loadConfig();
  const siteType = getCurrentSiteType();
  console.log("检测到网站类型:", siteType);
  if (siteType === "bilibili" && !globalConfig.bilibiliEnabled) {
    console.log("B站功能已禁用，跳过处理");
    return;
  } else if (siteType === "netease" && !globalConfig.neteaseMusicEnabled) {
    console.log("网易云音乐功能已禁用，跳过处理");
    return;
  }
  if (siteType === "bilibili") {
    processVideoCards();
    observeBilibiliDOM();
  } else if (siteType === "netease") {
    processNeteaseMusic();
    observeNeteaseDOM();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// =====================
// 站点类型与DOM监听
// =====================
function getCurrentSiteType() {
  const hostname = window.location.hostname;
  console.log("当前网站:", hostname);
  if (hostname.includes("bilibili.com")) {
    return "bilibili";
  } else if (hostname.includes("music.163.com")) {
    return "netease";
  }
  return "unknown";
}

function observeBilibiliDOM() {
  const observer = new MutationObserver((mutations) => {
    if (!globalConfig.bilibiliEnabled) return;
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const cards = node.querySelectorAll
              ? node.querySelectorAll(".bili-video-card")
              : [];
            if (cards.length > 0) {
              processVideoCards();
            } else if (
              node.classList &&
              node.classList.contains("bili-video-card")
            ) {
              processVideoCard(node);
            }
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeNeteaseDOM() {
  window.addEventListener("load", () => {
    setTimeout(() => {
      if (!globalConfig.neteaseMusicEnabled) return;
      processNeteaseMusic();
    }, 500);
  });
}

// =====================
// B站相关处理
// =====================
function processVideoCards() {
  const cards = document.querySelectorAll(".bili-video-card");
  cards.forEach((card) => processVideoCard(card));
}

function processVideoCard(card) {
  const cardId = getCardId(card);
  if (processedCards.has(cardId)) return;
  const bvId = extractBvId(card);
  if (!bvId) return;
  const songButton = createSongButton(bvId);
  const insertPosition = findInsertPosition(card);
  if (insertPosition) {
    insertPosition.appendChild(songButton);
    processedCards.add(cardId);
  }
}

function getCardId(card) {
  const link = card.querySelector('a[href*="/video/"]');
  return link ? link.href : Math.random().toString(36);
}

function extractBvId(card) {
  const link = card.querySelector('a[href*="/video/"]');
  if (!link) return null;
  const href = link.getAttribute("href");
  const match = href.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function createSongButton(bvId) {
  const button = document.createElement("button");
  button.className = "song-request-btn";
  button.textContent = "🎶";
  button.setAttribute("data-bv-id", bvId);
  button.setAttribute("title", "点歌");
  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleSongRequest(button, { name: bvId, source: "db" }, "custom");
  });
  return button;
}

function findInsertPosition(card) {
  return card;
}

// =====================
// 网易云相关处理
// =====================
function processNeteaseMusic() {
  const currentUrl = window.location.href;
  if (currentUrl.includes("/song")) {
    processSongDetailPage();
  } else {
    processSongPlaylist();
  }
}

function processSongPlaylist() {
  if (window === window.parent) return;
  console.log("处理网易云音乐歌曲列表");
  let songRows = document.querySelectorAll("table.m-table tbody tr");
  if (songRows.length === 0) {
    // 搜索页面
    // https://music.163.com/#/search/m/?s=mushroom&type=1
    songRows = document.querySelectorAll(
      "div#m-search div.srchsongst div.item"
    );
  }
  console.log("找到", songRows.length, "首歌曲");
  songRows.forEach((row) => processSongPlaylistRow(row));
}

function processSongPlaylistRow(row) {
  const rowId = getSongRowId(row);
  if (processedCards.has(rowId)) return;
  shareButton = row.querySelector(".icn-share");
  if (!shareButton) {
    console.log("未找到分享按钮，跳过此行");
    return;
  }
  const songId = extractSongId(row);
  if (!songId) return;
  const success = replaceShareButtonWithSongButton(shareButton, songId);
  if (success) processedCards.add(rowId);
}

function processSongDetailPage() {
  console.log("处理网易云音乐歌曲详情页面");
  const shareButton = document.querySelector(
    "#content-operation > a.u-btni.u-btni-share"
  );
  if (!shareButton) {
    console.log("未找到分享按钮");
    return;
  }
  const songId = shareButton.getAttribute("data-res-id");
  if (!songId) {
    console.log("未找到歌曲ID");
    return;
  }
  console.log("找到歌曲详情页面，歌曲ID:", songId);
  const detailPageId = `detail-${songId}`;
  if (processedCards.has(detailPageId)) return;
  const success = replaceShareButtonWithSongButton(shareButton, songId);
  if (success) processedCards.add(detailPageId);
}

function getSongRowId(row) {
  const songLink = row.querySelector('a[href*="/song?id="]');
  return songLink ? songLink.href : row.id || Math.random().toString(36);
}

function extractSongId(row) {
  const songLink = row.querySelector('a[href*="/song?id="]');
  if (!songLink) return null;
  const href = songLink.getAttribute("href");
  const match = href.match(/\/song\?id=(\d+)/);
  return match ? match[1] : null;
}

function replaceShareButtonWithSongButton(shareButton, songId) {
  const iconElement = shareButton.querySelector("i");
  if (iconElement) {
    iconElement.textContent = "点歌";
  } else {
    shareButton.textContent = "点歌";
  }
  shareButton.setAttribute("title", "点歌");
  shareButton.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleSongRequest(shareButton, { id: songId, source: "wy" });
  });
  return true;
}

// =====================
// 通用UI与请求处理
// =====================
function showToast(message, type = "info") {
  // 获取合适的目标文档
  const targetDocument = getTargetDocument();
  const targetBody = targetDocument.body;

  // 如果无法获取有效的 body，使用备用方案
  if (!targetBody) {
    showToastFallback(message, type);
    return;
  }

  const existingToast = targetDocument.querySelector(".alisten-toast");
  if (existingToast) existingToast.remove();

  const toast = targetDocument.createElement("div");
  toast.className = `alisten-toast alisten-toast-${type}`;
  toast.textContent = message;

  try {
    targetBody.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  } catch (e) {
    console.error("显示 Toast 失败:", e);
    // 如果添加到 DOM 失败，使用备用方案
    showToastFallback(message, type);
  }
}

function getTargetDocument() {
  // 如果在 iframe 中，尝试使用父窗口的文档
  if (window !== window.parent) {
    try {
      // 检查是否可以访问父窗口（同源）
      if (window.parent.document) {
        return window.parent.document;
      }
    } catch (e) {
      // 跨域访问被阻止，使用当前文档
      console.log("无法访问父窗口文档，使用当前iframe文档");
    }
  }
  return document;
}

// 添加一个备用的消息显示方案
function showToastFallback(message, type = "info") {
  // 如果在跨域 iframe 中，尝试通过 postMessage 通知父窗口
  if (window !== window.parent) {
    try {
      window.parent.postMessage(
        {
          type: "ALISTEN_SHOW_TOAST",
          message: message,
          toastType: type,
        },
        "*"
      );
    } catch (e) {
      console.log("无法向父窗口发送消息");
    }
  }

  // 同时在当前窗口也显示一个简单的提示
  console.log(`[AListen] ${type.toUpperCase()}: ${message}`);

  // 可以考虑使用浏览器原生的通知
  if (window.Notification && Notification.permission === "granted") {
    new Notification("AListen", {
      body: message,
      icon: chrome.runtime.getURL("icon48.png"),
    });
  }
}

async function handleSongRequest(button, requestData, buttonType = "default") {
  try {
    if (buttonType === "custom") {
      button.disabled = true;
      button.textContent = "⏳";
      button.classList.remove("success", "error");
    } else {
      button.style.pointerEvents = "none";
    }
    const response = await chrome.runtime.sendMessage({
      action: "requestSong",
      ...requestData,
    });
    if (response.success) {
      showToast("点歌成功！", "success");
      if (buttonType === "custom") {
        button.textContent = "✅";
        button.classList.add("success");
        button.setAttribute("title", response.message || "点歌成功！");
        setTimeout(() => {
          button.textContent = "🎶";
          button.classList.remove("success");
          button.setAttribute("title", "点歌");
          button.disabled = false;
        }, 2000);
      }
    } else {
      throw new Error(response.error || "发送失败");
    }
  } catch (error) {
    console.error("点歌请求失败:", error);
    showToast(error.message || "点歌失败，请重试", "error");
    if (buttonType === "custom") {
      button.textContent = "❌";
      button.classList.add("error");
      button.setAttribute("title", error.message || "点歌失败");
      setTimeout(() => {
        button.textContent = "🎶";
        button.classList.remove("error");
        button.setAttribute("title", "点歌");
        button.disabled = false;
      }, 2000);
    }
  } finally {
    if (buttonType !== "custom") {
      button.style.pointerEvents = "auto";
    }
  }
}
