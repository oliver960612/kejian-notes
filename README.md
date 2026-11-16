# 課間筆記｜資電學習知識庫

重新整理資電入門概念，讓每篇筆記都能被搜尋、閱讀及延伸。由劉譯棋製作，AI 輔助內容整理與程式開發。

- 公開網站：https://kejian-notes-20261116.oliver960612.chatgpt.site
- GitHub Repository：https://github.com/oliver960612/kejian-notes
- 專案規則：[AGENTS.md](./AGENTS.md)

## 功能與內容
- 6 篇筆記：Python 串列、二分搜尋、歐姆定律、HTML 語意、Git 版本控制、AI 任務交辦。
- 3 個分類：程式基礎、電路觀念、學習方法。
- 關鍵字搜尋與分類交集、結果統計、空結果提示與清除條件。
- 獨立文章頁、章節目錄、參考來源與延伸閱讀。
- localStorage 閱讀標記；資料留在訪客瀏覽器，不上傳。
- 響應式版面、原生互動元素、鍵盤焦點、列印樣式與減少動態設定。

## 執行
需要 Node.js 20 以上，不需要安裝相依套件。在專案根目錄執行：

```text
node src/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

開啟伺服器印出的 `http://127.0.0.1:4173`。也可直接打開 `dist/index.html` 閱讀；以 HTTP 預覽可獲得較一致的瀏覽器儲存行為。

## 新增一篇筆記
先讀 [AGENTS.md](./AGENTS.md)，複製 `templates/note.example.json` 至 `content/notes/<slug>.json`，填好四節、範例、自我檢核答案與來源，再建置及檢查。首頁、文章列表與延伸閱讀由生成器自動更新。請修改來源，不要直接手改 dist。

## GitHub Pages 部署
上傳完整專案到 GitHub Repository 的 main 分支。在 Settings → Pages 將 Source 選為 GitHub Actions，既有 `.github/workflows/pages.yml` 將建置、檢查並部署 dist。網址以部署作業實際回傳為準，不預填未驗證連結。

Sites 另使用 `.openai/hosting.json` 指向 dist。部署設定不包含憑證。

## 資料與內容
所有數字範例均為教學示例，非實測資料。筆記附官方文件或公開教材連結；內容以中文原創改寫，未整段複製教材。主視覺以 CSS 原創繪製，無外部圖片或 CDN 依賴。

## 變更紀錄
- 2026-11-16：建立規則檔、6 篇筆記、8 個頁面、資料驗證、搜尋分類、閱讀標記與部署流程。
