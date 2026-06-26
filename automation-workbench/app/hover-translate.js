(function () {
  const translations = {
    "Local Automation Workbench": "本地自动化工作台",
    "Automation Workbench": "自动化工作台",
    "Codex": "你的自动化执行助手",
    "Office": "微软办公三件套",
    "Word": "文字文档工具",
    "PowerPoint": "演示文稿工具",
    "PPT": "演示文稿",
    "Excel": "电子表格工具",
    "BD": "商务拓展",
    "KOL": "关键意见领袖，通常指有影响力的达人",
    "KOC": "关键意见消费者，通常指更接近日常用户的种草者",
    "UGC": "用户原创内容",
    "AI": "人工智能",
    "IP": "个人品牌或可识别的内容人设",
    "Skill Scout": "技能侦察助手，用来寻找和评估新 skill",
    "GitHub": "代码托管平台",
    "AnySearch": "实时搜索 skill",
    "browser": "浏览器控制能力",
    "documents": "Word 文档处理能力",
    "presentations": "PPT 演示文稿处理能力",
    "spreadsheets": "Excel 表格处理能力",
    "skill-installer": "skill 安装工具",
    "pdf": "PDF 文件处理能力",
    "web search": "网页搜索",
    "finance data": "金融数据",
    "local app launcher": "本地应用启动器",
    "video planning": "视频策划",
    "Feishu": "飞书",
    "WeChat": "微信",
    "Email": "电子邮件",
    "Gmail": "谷歌邮箱",
    "Kalodata": "TikTok 电商数据分析平台",
    "FastMoss": "TikTok 电商数据与达人分析平台",
    "TikTok": "海外短视频平台",
    "TikTok Shop": "TikTok 电商平台",
    "YouTube": "海外视频平台",
    "Instagram": "海外图片与短视频社交平台",
    "Reels": "Instagram 的短视频功能",
    "Douyin": "抖音",
    "WeChat Channels": "微信视频号",
    "Xiaohongshu": "小红书",
    "SEC": "美国证券交易委员会",
    "HKEXnews": "港交所披露易公告平台",
    "Google Scholar": "谷歌学术",
    "Auto": "自动判断",
    "News": "资讯",
    "Trading": "金融交易与市场观察",
    "Ecom": "电商",
    "Inbox": "信息收件箱",
    "Deliver": "交付",
    "Review": "复盘",
    "Creator": "创作者/自媒体",
    "Skills": "技能",
    "outputs": "输出文件夹",
    "inputs": "输入资料文件夹",
    "templates": "模板文件夹",
    "workflows": "工作流文件夹",
    "README": "说明文档",
    "API": "应用程序接口",
    "API Key": "接口密钥",
    "URL": "网址",
    "CSV": "逗号分隔表格文件",
    "PDF": "便携式文档格式",
    "docx": "Word 文档格式",
    "pptx": "PPT 文件格式",
    "xlsx": "Excel 表格格式",
    "csv": "逗号分隔表格格式",
    "dashboard": "数据看板",
    "brief": "简报",
    "drafts": "草稿",
    "email": "电子邮件",
    "reply rate": "回复率",
    "success rate": "成功率",
    "deal probability": "成交概率",
    "conversion rate": "转化率",
    "revenue": "收入",
    "views": "播放量",
    "impressions": "曝光量",
    "clicks": "点击量",
    "engagement rate": "互动率",
    "watch completion rate": "完播率",
    "A/B": "A/B 对照测试",
    "A/B test": "A/B 对照测试",
    "hook": "开头钩子，用来抓住注意力",
    "CTA": "行动号召，例如点击、购买或回复",
    "CRM": "客户关系管理系统",
    "SaaS": "软件即服务",
    "US": "美国",
    "HK": "香港",
    "English": "英文",
    "Chinese": "中文"
  };

  const ignoredTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
  const tooltip = document.createElement("div");
  tooltip.id = "translationTooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);

  const terms = Object.keys(translations).sort((a, b) => b.length - a.length);
  const termMap = new Map(terms.map((term) => [term.toLowerCase(), translations[term]]));
  const escapedTerms = terms.map(escapeRegExp);
  const dictionaryPattern = escapedTerms.join("|");
  const genericPattern = "[A-Za-z][A-Za-z0-9.+#/-]*(?:\\s+[A-Za-z][A-Za-z0-9.+#/-]*)?";
  const foreignRegex = new RegExp(`(^|[^A-Za-z0-9])(${dictionaryPattern}|${genericPattern})(?=$|[^A-Za-z0-9])`, "gi");

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (ignoredTags.has(parent.tagName)) return true;
    if (parent.closest(".foreign-term, #translationTooltip, .no-hover-translate")) return true;
    return !/[A-Za-z]/.test(node.nodeValue || "");
  }

  function meaningFor(term) {
    const normalized = term.trim().toLowerCase();
    if (termMap.has(normalized)) return termMap.get(normalized);
    if (/^https?:\/\//i.test(term) || /^[\w.-]+\.[A-Za-z]{2,}/.test(term)) return "网址或域名";
    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(term)) return "邮箱地址";
    return `外文：${term}。本地词库暂未收录准确释义，可让我补充。`;
  }

  function wrapTextNode(node) {
    if (shouldSkipNode(node)) return;

    const text = node.nodeValue;
    foreignRegex.lastIndex = 0;
    let match;
    let lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let changed = false;

    while ((match = foreignRegex.exec(text)) !== null) {
      const prefix = match[1] || "";
      const term = match[2];
      const matchStart = match.index + prefix.length;
      const matchEnd = matchStart + term.length;

      if (matchStart > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)));
      }

      const span = document.createElement("span");
      span.className = "foreign-term";
      span.dataset.translation = meaningFor(term);
      span.textContent = term;
      fragment.appendChild(span);
      lastIndex = matchEnd;
      changed = true;
    }

    if (!changed) return;
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    node.parentNode.replaceChild(fragment, node);
  }

  function translateTree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapTextNode);
  }

  function showTooltip(target, event) {
    tooltip.textContent = target.dataset.translation;
    tooltip.classList.add("visible");
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const offset = 14;
    const maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    const maxTop = window.innerHeight - tooltip.offsetHeight - 12;
    const left = Math.max(12, Math.min(event.clientX + offset, maxLeft));
    const top = Math.max(12, Math.min(event.clientY + offset, maxTop));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }

  document.addEventListener("mouseover", (event) => {
    const target = event.target.closest?.(".foreign-term");
    if (target) showTooltip(target, event);
  });

  document.addEventListener("mousemove", (event) => {
    if (tooltip.classList.contains("visible")) moveTooltip(event);
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target.closest?.(".foreign-term")) hideTooltip();
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          wrapTextNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE && !node.matches("#translationTooltip")) {
          translateTree(node);
        }
      });
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    translateTree(document.body);
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
