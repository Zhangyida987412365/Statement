(function () {
  const STORAGE_KEYS = {
    legacyRules: "familyFinanceRules.v1",
    legacyDaily: "familyFinanceDaily.v1",
    legacyMemories: "familyFinanceMemories.v1",
    selectedMonth: "familyFinanceSelectedMonth.v1",
    guestId: "familyFinanceGuestId.v1",
    locale: "familyFinanceLocale.v1",
  };
  const STORAGE_VERSION = "v2";

  const SUPABASE_URL = "https://hycpfpbetwiubixkhbet.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VCyjYDSE3CCDNu_tGS4wdw_s4xyZ5qZ";
  const SUPABASE_TABLES = {
    userState: "finance_user_state",
    monthlyLedgers: "finance_monthly_ledgers",
    uploadedFiles: "finance_uploaded_files",
  };
  const SUPABASE_STORAGE_BUCKETS = {
    statementFiles: "statement-files",
  };
  const CLOUD_SYNC_DEBOUNCE_MS = 800;
  const SUPPORTED_LOCALES = ["zh-CN", "en"];

  const I18N = {
    "zh-CN": {
      brandName: "家庭账本整理台",
      brandSub: "按月导入 · 统一字段 · 分类分析",
      ledgerMonth: "账本月份",
      googleLogin: "Google 登录",
      signOut: "退出",
      signedIn: "已登录",
      currentUser: "当前用户",
      authNotConfigured: "登录未配置",
      signingOut: "正在退出...",
      redirecting: "正在跳转...",
      reimport: "重新导入",
      export: "导出",
      notImported: "尚未导入",
      ledgerLoaded: "已载入 {month}账本 · {count} 条明细",
      chooseBills: "选择账单",
      chooseFolder: "选择文件夹",
      importAnalyze: "导入并分析",
      wechatBills: "微信账单",
      alipayBills: "支付宝账单",
      bankCsv: "银行卡 CSV",
      creditDetails: "信用卡明细",
      differentFieldsOk: "字段不统一也可以",
      seoTitle: "家庭账本整理台",
      seoDescription: "按月导入支付宝、微信、银行卡和信用卡流水，自动统一字段、分类分析并导出家庭账本。",
      uploadHelper: "当前账本只统计所选月份；AI 只参与训练助手和不确定分类复核。",
      processingTitle: "正在分析账单",
      processingMessage: "正在准备读取账单文件...",
      stepRead: "读取账单文件",
      stepNormalize: "统一字段格式",
      stepClassify: "规则分类",
      stepAi: "AI 复核",
      stepOutput: "生成结果",
      aiProcessNote: "只分析规则拿不准的项目，生成分类建议",
      monthLedger: "{month}账本",
      uploadDescription: "上传 {month} 的支付宝、微信、银行卡或信用卡流水。字段名称不需要一致，系统会先识别表头，再统一成一张交易明细表。",
      dropzoneTitle: "上传 {month}账单文件",
      dropzoneSub: "支持结构化 Excel / CSV，多份账单可一起选择；非本月交易会自动跳过。",
      spendTotalMonth: "消费合计 · {month}",
      spendTotalInitial: "消费合计 · 本月",
      sourceCount: "{count} 个账单来源",
      importedBills: "已导入账单",
      googleNeedsHttp: "Google 登录需要通过本地服务地址打开页面，例如 http://127.0.0.1:8765/index.html，不要直接双击 HTML 文件。",
      googleFailed: "Google 登录发起失败：{message}",
      signOutFailed: "退出失败：{message}",
      loginTitle: "使用 Google 登录",
      signedInTitle: "已登录：{email}",
    },
    en: {
      brandName: "Household Ledger Desk",
      brandSub: "Monthly import · Field mapping · Spending analysis",
      ledgerMonth: "Ledger Month",
      googleLogin: "Google Sign In",
      signOut: "Sign out",
      signedIn: "Signed in",
      currentUser: "Current user",
      authNotConfigured: "Sign-in unavailable",
      signingOut: "Signing out...",
      redirecting: "Redirecting...",
      reimport: "Re-import",
      export: "Export",
      notImported: "Not imported yet",
      ledgerLoaded: "Loaded {month} ledger · {count} transactions",
      chooseBills: "Choose bills",
      chooseFolder: "Choose folder",
      importAnalyze: "Import and analyze",
      wechatBills: "WeChat bills",
      alipayBills: "Alipay bills",
      bankCsv: "Bank CSV",
      creditDetails: "Credit card details",
      differentFieldsOk: "Different headers are OK",
      seoTitle: "Household Ledger Desk",
      seoDescription: "Import Alipay, WeChat, bank, and credit card statements by month, normalize fields, analyze categories, and export your household ledger.",
      uploadHelper: "This ledger only counts the selected month; AI only helps with training and uncertain categories.",
      processingTitle: "Analyzing bills",
      processingMessage: "Preparing to read bill files...",
      stepRead: "Read files",
      stepNormalize: "Normalize fields",
      stepClassify: "Apply rules",
      stepAi: "AI review",
      stepOutput: "Generate results",
      aiProcessNote: "AI only reviews items that rules cannot classify confidently.",
      monthLedger: "{month} ledger",
      uploadDescription: "Upload Alipay, WeChat, bank, or credit card statements for {month}. Headers do not need to match; the system will map them into one transaction table.",
      dropzoneTitle: "Upload {month} bill files",
      dropzoneSub: "Structured Excel / CSV files are supported. Multiple files can be selected; transactions outside this month are skipped.",
      spendTotalMonth: "Total spending · {month}",
      spendTotalInitial: "Total spending · This month",
      sourceCount: "{count} bill sources",
      importedBills: "Bills imported",
      googleNeedsHttp: "Google Sign In must be opened through a local server URL, such as http://127.0.0.1:8765/index.html. Do not open the HTML file directly.",
      googleFailed: "Google Sign In failed: {message}",
      signOutFailed: "Sign out failed: {message}",
      loginTitle: "Sign in with Google",
      signedInTitle: "Signed in: {email}",
    },
  };

  const DETAIL_SCHEMA = [
    { key: "date", label: "交易日期", value: (tx) => tx.date },
    { key: "postDate", label: "记账日期", value: (tx) => tx.postDate },
    { key: "direction", label: "收支方向", value: (tx) => tx.direction },
    { key: "amount", label: "金额", value: (tx) => round2(tx.amountAbs) },
    { key: "category", label: "标准分类", value: (tx) => categoryName(tx.category) },
    { key: "needsReview", label: "是否待确认", value: (tx) => tx.needsReview ? "是" : "否" },
    { key: "confidence", label: "分类置信度", value: (tx) => tx.confidence },
    { key: "merchant", label: "商户/对方", value: (tx) => tx.merchant },
    { key: "summary", label: "交易摘要", value: (tx) => tx.summary },
    { key: "purpose", label: "用途/备注", value: (tx) => tx.purpose || tx.note },
    { key: "channel", label: "支付渠道", value: (tx) => tx.channel },
    { key: "account", label: "账户/卡号", value: (tx) => tx.account },
    { key: "reason", label: "分类依据", value: (tx) => tx.reason },
    { key: "sourceName", label: "来源文件", value: (tx) => tx.sourceName },
    { key: "rowNumber", label: "来源行号", value: (tx) => tx.rowNumber },
  ];

  const STATS_SCHEMA = [
    { key: "category", label: "标准分类", value: (item) => categoryName(item.category) },
    { key: "amount", label: "消费金额", value: (item) => round2(item.amount) },
    { key: "count", label: "笔数", value: (item) => item.count },
    { key: "ratio", label: "占比", value: (item, total) => percent(item.amount, total) },
  ];

  const HEADER_ALIASES = {
    date: ["交易日期", "交易时间", "日期", "交易日", "发生日期", "交易发生时间"],
    postDate: ["记账日期", "记账日", "入账日期", "入账时间", "账务日期"],
    amount: ["交易金额", "金额", "消费金额", "收支金额", "交易额", "人民币金额"],
    expense: ["支出", "支出金额", "借方金额", "付款金额", "转出金额"],
    income: ["收入", "收入金额", "贷方金额", "收款金额", "转入金额"],
    direction: ["方向", "收支", "收/支", "收支类型", "交易方向"],
    summary: ["交易摘要", "摘要", "交易说明", "交易描述", "商品说明", "交易名称"],
    merchant: ["对方户名", "交易对方", "对方名称", "商户", "商户名称", "收款方", "付款方"],
    purpose: ["用途", "备注", "交易用途", "商品", "商品名称", "附言"],
    channel: ["交易渠道", "渠道", "支付方式", "交易类型", "支付机构"],
    account: ["尾号4位", "账号", "账户", "卡号", "银行卡号", "付款账户"],
  };

  const categories = [
    { id: "rigid", name: "刚性支出", color: "#4C6B7A", include: true },
    { id: "social", name: "社交支出", color: "#C07A3E", include: true },
    { id: "child", name: "育儿支出", color: "#5B7BC0", include: true },
    { id: "travelFun", name: "差旅/娱乐", color: "#8466B4", include: true },
    { id: "daily", name: "日常消费", color: "#226A45", include: true },
    { id: "financial", name: "资金往来/还款", color: "#8A8F8A", include: false },
    { id: "refund", name: "退款/收入", color: "#3E9E8A", include: false },
    { id: "uncertain", name: "待确认", color: "#C8632F", include: false },
  ];

  const CATEGORY_ALIASES = {
    rigid: ["刚性支出", "刚性", "水电费", "水电", "房租", "物业费", "贷款", "还款"],
    social: ["社交支出", "社交", "聚餐", "应酬", "请客", "饭局", "朋友吃饭", "吃饭", "餐饮", "餐厅"],
    child: ["育儿支出", "育儿", "孩子", "儿童", "小孩", "宝宝", "幼儿园", "学校"],
    travelFun: ["差旅/娱乐支出", "差旅娱乐", "差旅支出", "娱乐支出", "差旅", "娱乐", "旅游", "旅行"],
    daily: ["日常消费", "日常", "生活支出", "生活", "购物"],
    financial: ["资金往来/还款", "资金往来", "信用卡还款", "转账", "还信用卡"],
  };

  const defaultRules = [
    {
      id: "default-rigid-utilities",
      name: "水电燃气物业通讯",
      category: "rigid",
      keywords: ["水费", "电费", "燃气", "煤气", "物业", "房租", "宽带", "话费", "中国移动", "中国联通", "中国电信"],
      minAmount: null,
      maxAmount: null,
      priority: 90,
      builtIn: true,
    },
    {
      id: "default-rigid-loan",
      name: "贷款还款",
      category: "rigid",
      keywords: ["贷款还款", "房贷", "车贷", "富邦华一银行有限公司（贷款还款）"],
      minAmount: null,
      maxAmount: null,
      priority: 88,
      builtIn: true,
    },
    {
      id: "default-financial-credit",
      name: "信用卡还款与大额转入转出",
      category: "financial",
      keywords: ["信用卡还款", "非信用卡流水", "跨行代付", "银行转账", "还信用卡"],
      minAmount: null,
      maxAmount: null,
      priority: 96,
      builtIn: true,
    },
    {
      id: "default-social-dining",
      name: "餐饮大于100",
      category: "social",
      keywords: ["餐饮", "餐厅", "饭店", "酒楼", "火锅", "烤肉", "烧烤", "料理", "日料", "咖啡", "茶餐厅", "面馆", "面王", "春茗", "小厨", "食府", "美食", "海底捞"],
      minAmount: 100,
      maxAmount: null,
      priority: 86,
      builtIn: true,
    },
    {
      id: "default-child",
      name: "孩子相关",
      category: "child",
      keywords: ["幼儿园", "学校", "托育", "早教", "亲子", "儿童", "孩子", "宝宝", "母婴", "童装", "奶粉", "玩具", "文具", "培训", "辅导", "乐高", "绘本"],
      minAmount: null,
      maxAmount: null,
      priority: 84,
      builtIn: true,
    },
    {
      id: "default-travel-fun",
      name: "差旅娱乐",
      category: "travelFun",
      keywords: ["酒店", "宾馆", "住宿", "机票", "高铁", "火车", "携程", "飞猪", "滴滴", "出租车", "停车", "停车场", "停车库", "门票", "景区", "乐园", "影院", "电影", "演出", "旅游", "度假区", "KTV", "剧院", "哈啰"],
      minAmount: null,
      maxAmount: null,
      priority: 82,
      builtIn: true,
    },
    {
      id: "default-daily-shopping",
      name: "日常购物",
      category: "daily",
      keywords: ["超市", "便利店", "来伊份", "京东", "淘宝", "天猫", "拼多多", "淘天", "美团", "饿了么", "盒马", "叮咚", "山姆", "罗森", "全家", "药房", "药店"],
      minAmount: null,
      maxAmount: null,
      priority: 54,
      builtIn: true,
    },
  ];

  const state = {
    transactions: [],
    rules: [],
    daily: [],
    memories: [],
    fieldAliases: {},
    workspaceFiles: [],
    workspaceFileSeq: 0,
    processing: false,
    filterCategory: "all",
    search: "",
    reviewPage: 1,
    reviewRememberIds: new Set(),
    importStatusMessage: "",
    importStatusAiResult: null,
    currentMonth: "",
    locale: "zh-CN",
    storageOwnerKey: "",
    hasImportNotice: false,
    authReady: false,
    authLoading: false,
    cloudHydrating: false,
    cloudSyncError: "",
    user: null,
  };

  const AI_AUTO_FILTER = "aiAuto";
  const AUTO_APPLY_AI_REVIEW = false;
  const REVIEW_PAGE_SIZE = 40;

  const PROCESS_STEPS = ["read", "normalize", "classify", "ai", "output"];

  const els = {};
  let supabaseClient = null;
  let cloudStateSyncTimer = 0;
  let cloudLedgerSyncTimer = 0;

  document.addEventListener("DOMContentLoaded", () => {
    bindElements();
    hydrateState();
    fillCategorySelects();
    bindEvents();
    setDefaultDailyDate();
    initSupabaseAuth();
    render();
    refreshIcons();
  });

  function bindElements() {
    [
      "fileInput",
      "folderInput",
      "dropzone",
      "uploadStage",
      "processingStage",
      "resultsStage",
      "workspaceFileList",
      "processingMessage",
      "aiProcessNote",
      "importStatus",
      "authTopActions",
      "authButton",
      "authLabel",
      "authDot",
      "authIcon",
      "languageSelect",
      "monthInput",
      "uploadTitle",
      "uploadDescription",
      "dropzoneTitle",
      "dropzoneSub",
      "signOutBtn",
      "loadWorkspaceBtn",
      "startOrganizeBtn",
      "clearTransactionsBtn",
      "coachForm",
      "coachInput",
      "coachResult",
      "coachFallback",
      "coachFallbackForm",
      "coachFallbackType",
      "coachFallbackDate",
      "coachFallbackAmount",
      "coachFallbackCategory",
      "coachFallbackKeyword",
      "dailyForm",
      "dailyDate",
      "dailyAmount",
      "dailyCategory",
      "dailyKeyword",
      "dailyNote",
      "dailyList",
      "fixedForm",
      "fixedKeyword",
      "fixedCategory",
      "fixedList",
      "ruleForm",
      "ruleName",
      "ruleKeywords",
      "ruleCategory",
      "ruleMin",
      "ruleMax",
      "ruleList",
      "transactionTable",
      "categoryFilter",
      "searchInput",
      "statsGrid",
      "reviewList",
      "exportWorkbookBtn",
      "guideExportWorkbookBtn",
      "exportDetailsBtn",
      "exportStatsBtn",
      "autoReviewBtn",
      "totalSpend",
      "transactionCount",
      "reviewCount",
      "memoryCount",
      "detailSchemaText",
      "statsSchemaText",
      "resultTopActions",
      "categoryChips",
      "reviewBadge",
      "tabReviewCount",
      "spendMonthLabel",
      "spendNote",
      "sourceNote",
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function hydrateState() {
    state.locale = detectInitialLocale();
    state.currentMonth = normalizeMonth(readJson(STORAGE_KEYS.selectedMonth, "")) || dateToYm(new Date());
    state.storageOwnerKey = ownerKeyForUser(state.user);
    hydrateScopedCollections();
  }

  function hydrateScopedCollections() {
    state.rules = readScopedJson("rules", null)
      || readJson(STORAGE_KEYS.legacyRules, null)
      || defaultRules.slice();
    state.daily = readScopedJson("daily", null)
      || readJson(STORAGE_KEYS.legacyDaily, []);
    state.memories = readScopedJson("memories", null)
      || readJson(STORAGE_KEYS.legacyMemories, []);
    state.fieldAliases = readScopedJson("fieldAliases", {});
    state.transactions = readScopedJson("transactions", [], { monthScoped: true });
    state.importStatusMessage = "";
    state.importStatusAiResult = null;
    state.reviewRememberIds.clear();
  }

  function bindEvents() {
    if (els.authButton) els.authButton.addEventListener("click", handleAuthButton);
    if (els.signOutBtn) els.signOutBtn.addEventListener("click", signOut);
    if (els.languageSelect) {
      els.languageSelect.addEventListener("change", () => switchLocale(els.languageSelect.value));
    }
    if (els.monthInput) {
      els.monthInput.addEventListener("change", () => switchLedgerMonth(els.monthInput.value));
    }

    els.fileInput.addEventListener("change", (event) => {
      queueSelectedFiles(Array.from(event.target.files || []));
      event.target.value = "";
    });

    els.folderInput.addEventListener("change", (event) => {
      queueSelectedFiles(Array.from(event.target.files || []));
      event.target.value = "";
    });

    els.dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      els.dropzone.classList.add("dragging");
      els.dropzone.classList.add("drag");
    });

    els.dropzone.addEventListener("dragleave", () => {
      els.dropzone.classList.remove("dragging");
      els.dropzone.classList.remove("drag");
    });

    els.dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      els.dropzone.classList.remove("dragging");
      els.dropzone.classList.remove("drag");
      queueSelectedFiles(Array.from(event.dataTransfer.files || []));
    });

    els.loadWorkspaceBtn.addEventListener("click", () => {
      state.transactions = [];
      saveCurrentMonthTransactions();
      setImportStatus(state.workspaceFiles.length
        ? "请确认待导入文件，或删除后重新选择账单"
        : `请上传 ${currentMonthLabel()}账单文件`);
      render();
    });
    els.startOrganizeBtn.addEventListener("click", loadWorkspaceFiles);
    els.clearTransactionsBtn.addEventListener("click", () => {
      state.transactions = [];
      saveCurrentMonthTransactions();
      setImportStatus("已清空明细");
      render();
    });

    els.coachForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleCoachCommand();
    });

    els.coachFallbackForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleCoachFallbackSubmit();
    });

    els.coachFallbackType.addEventListener("change", updateCoachFallbackMode);

    els.dailyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addDailyMemory();
    });

    els.fixedForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addFixedCounterparty();
    });

    els.ruleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addRule();
    });

    els.categoryFilter.addEventListener("change", () => {
      state.filterCategory = els.categoryFilter.value || "all";
      renderTransactions();
    });

    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      renderTransactions();
    });

    els.exportWorkbookBtn.addEventListener("click", exportWorkbook);
    els.guideExportWorkbookBtn.addEventListener("click", exportWorkbook);
    els.exportDetailsBtn.addEventListener("click", exportDetails);
    els.exportStatsBtn.addEventListener("click", exportStats);
    els.autoReviewBtn.addEventListener("click", () => {
      classifyAll();
      render();
    });

    document.querySelectorAll("[data-example-command]").forEach((button) => {
      button.addEventListener("click", () => {
        els.coachInput.value = button.getAttribute("data-example-command") || "";
        handleCoachCommand();
      });
    });

    bindViewTabs();
  }

  function initSupabaseAuth() {
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      state.authReady = false;
      renderAuth();
      return;
    }

    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      state.authReady = true;
      renderAuth();

      supabaseClient.auth.getSession()
        .then(({ data }) => {
          applyAuthSession(data?.session || null);
        })
        .catch((error) => {
          state.authLoading = false;
          console.warn("Supabase session check failed:", error);
          renderAuth();
        });

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        applyAuthSession(session || null);
      });
    } catch (error) {
      state.authReady = false;
      state.authLoading = false;
      console.warn("Supabase init failed:", error);
      renderAuth();
    }
  }

  function applyAuthSession(session) {
    const nextUser = session?.user || null;
    const previousOwner = state.storageOwnerKey;
    const nextOwner = ownerKeyForUser(nextUser);

    if (previousOwner && previousOwner !== nextOwner) {
      saveCurrentMonthTransactions(previousOwner);
    }

    state.user = nextUser;
    state.authLoading = false;

    if (!previousOwner || previousOwner !== nextOwner) {
      state.storageOwnerKey = nextOwner;
      hydrateScopedCollections();
      setDefaultDailyDate(true);
      render();
      loadCloudUserData();
      return;
    }

    renderAuth();
  }

  async function handleAuthButton() {
    if (state.user) return;
    if (!supabaseClient || !state.authReady) {
      window.alert("Supabase 登录还没有配置好，请先检查页面里的公开 URL 和 publishable key。");
      return;
    }
    if (!/^https?:$/i.test(window.location.protocol)) {
      window.alert(t("googleNeedsHttp"));
      return;
    }

    state.authLoading = true;
    renderAuth();

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      state.authLoading = false;
      renderAuth();
      window.alert(t("googleFailed", { message: error.message }));
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    state.authLoading = true;
    renderAuth();
    const { error } = await supabaseClient.auth.signOut();
    state.authLoading = false;
    if (error) {
      window.alert(t("signOutFailed", { message: error.message }));
    } else {
      state.user = null;
    }
    renderAuth();
  }

  function renderAuth() {
    if (!els.authButton || !els.authLabel) return;
    const signedIn = Boolean(state.user);
    const email = state.user?.email || state.user?.user_metadata?.email || "";
    els.authButton.classList.toggle("is-signed-in", signedIn);
    els.authButton.classList.toggle("is-signed-out", !signedIn && state.authReady);
    els.authButton.classList.toggle("is-error", !state.authReady);
    els.authButton.classList.toggle("is-loading", state.authLoading);
    els.authButton.disabled = state.authLoading || !state.authReady;
    els.authButton.title = signedIn
      ? t("signedInTitle", { email: email || t("currentUser") })
      : t("loginTitle");
    if (!state.authReady) {
      els.authLabel.textContent = t("authNotConfigured");
    } else if (state.authLoading) {
      els.authLabel.textContent = signedIn ? t("signingOut") : t("redirecting");
    } else {
      els.authLabel.textContent = signedIn ? (email || t("signedIn")) : t("googleLogin");
    }
    if (els.signOutBtn) els.signOutBtn.hidden = !signedIn;
  }

  function activateView(view) {
    document.querySelectorAll("[data-view-tab]").forEach((tab) => {
      const active = tab.getAttribute("data-view-tab") === view;
      tab.classList.toggle("is-active", active);
      tab.classList.toggle("active", active);
    });
    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      const active = panel.getAttribute("data-view-panel") === view;
      panel.classList.toggle("is-active", active);
      panel.classList.toggle("active", active);
    });
    refreshIcons();
  }

  function bindViewTabs() {
    document.querySelectorAll("[data-view-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        const view = tab.getAttribute("data-view-tab");
        activateView(view);
      });
    });
  }

  function switchLedgerMonth(value) {
    const nextMonth = normalizeMonth(value);
    if (!nextMonth || nextMonth === state.currentMonth) {
      renderLedgerContext();
      return;
    }

    saveCurrentMonthTransactions();
    state.currentMonth = nextMonth;
    writeJson(STORAGE_KEYS.selectedMonth, state.currentMonth);
    state.transactions = readScopedJson("transactions", [], { monthScoped: true });
    state.filterCategory = "all";
    state.search = "";
    state.reviewPage = 1;
    state.reviewRememberIds.clear();
    state.hasImportNotice = false;
    if (els.categoryFilter) els.categoryFilter.value = "all";
    if (els.searchInput) els.searchInput.value = "";
    setDefaultDailyDate(true);
    setImportStatus(`已切换到 ${currentMonthLabel()}账本，请上传这个月的流水文件`);
    render();
    loadCloudUserData();
  }

  function queueSelectedFiles(files) {
    const accepted = files.filter(isSupportedStatementFile);
    if (!accepted.length) {
      setImportStatus("没有可读取的账单文件，请选择 Excel 或 CSV");
      renderStage();
      renderWorkspaceFiles();
      return;
    }

    const existing = new Set(state.workspaceFiles.map((item) => item.key));
    let added = 0;
    accepted.forEach((file) => {
      const key = fileQueueKey(file);
      if (existing.has(key)) return;
      existing.add(key);
      state.workspaceFileSeq += 1;
      state.workspaceFiles.push({
        id: `queued-file-${Date.now()}-${state.workspaceFileSeq}`,
        key,
        file,
        name: file.name,
        path: displayFilePath(file),
        size: file.size || 0,
        lastModified: file.lastModified || 0,
      });
      added += 1;
    });

    const duplicate = accepted.length - added;
    setImportStatus(added
      ? `已选择 ${state.workspaceFiles.length} 个待导入文件${duplicate ? `，跳过重复 ${duplicate} 个` : ""}`
      : "这些账单文件已经在待导入列表里");
    renderWorkspaceFiles();
    renderStage();
    refreshIcons();
  }

  function isSupportedStatementFile(file) {
    return Boolean(file?.name && /\.(xls|xlsx|csv)$/i.test(file.name));
  }

  function fileQueueKey(file) {
    return [displayFilePath(file), file.size || 0, file.lastModified || 0].join("|");
  }

  function displayFilePath(file) {
    return file.webkitRelativePath || file.name;
  }

  function removeQueuedFile(id) {
    state.workspaceFiles = state.workspaceFiles.filter((item) => item.id !== id);
    setImportStatus(state.workspaceFiles.length
      ? `待导入列表还剩 ${state.workspaceFiles.length} 个文件`
      : "已清空待导入文件，请重新选择账单");
    renderWorkspaceFiles();
    renderStage();
    refreshIcons();
  }

  async function loadWorkspaceFiles() {
    let imported = 0;
    let skipped = 0;
    let outOfMonth = 0;
    let failed = 0;
    let savedFiles = 0;
    let saveFailed = 0;
    const saveErrors = [];

    const files = state.workspaceFiles;
    if (!files.length) {
      setImportStatus("请先选择要导入的账单文件");
      renderStage();
      renderWorkspaceFiles();
      return;
    }

    startProcessing(`正在读取 ${files.length} 个待导入账单文件，准备生成 ${currentMonthLabel()}账本...`);
    setProcessStep("read", "active", `正在读取 ${files.length} 个待导入账单文件...`);
    for (const item of files) {
      try {
        const parsed = await readWorkbookFile(item.file, item.path || item.name);
        const result = addTransactions(parsed);
        imported += result.added;
        skipped += result.skipped;
        outOfMonth += result.outOfMonth;
        const saved = await persistUploadedStatementFile(item);
        if (saved === true) savedFiles += 1;
        if (saved === false) {
          saveFailed += 1;
          saveErrors.push({
            name: item.name || fileBaseName(item.path || ""),
            error: item.storageError || "源文件保存失败",
          });
        }
      } catch (error) {
        console.warn(error);
        failed += 1;
      }
    }

    setProcessStep("read", "done");
    setProcessStep("normalize", "active", `已读取 ${imported + skipped + outOfMonth} 条原始明细，保留 ${currentMonthLabel()}交易...`);
    await pauseForProcess();
    setProcessStep("normalize", "done");
    setProcessStep("classify", "active", "正在套用固定对手方、当天金额记忆和基础分类规则...");
    classifyAll();
    await pauseForProcess();
    setProcessStep("classify", "done");
    setProcessStep("ai", "active", "正在让 AI 复核规则拿不准的项目...");
    const aiResult = await runAiReview();
    setProcessStep("ai", aiResult.error ? "error" : "done", aiResult.message);
    setProcessStep("output", "active", "正在生成统一明细和分类统计...");
    await pauseForProcess();
    setProcessStep("output", "done");
    setImportStatus(failed === files.length
      ? "账单读取失败，请检查文件格式后重新选择"
      : buildImportStatus(imported, skipped, failed, aiResult, outOfMonth, { savedFiles, saveFailed, saveErrors }), aiResult);
    saveCurrentMonthTransactions();
    finishProcessing();
    render();
  }

  function renderWorkspaceFiles(files = state.workspaceFiles) {
    if (!els.workspaceFileList) return;
    if (els.startOrganizeBtn) els.startOrganizeBtn.disabled = !files.length || state.processing;
    if (!files.length) {
      els.workspaceFileList.innerHTML = `
        <div class="file-chip">
          <div class="fc-ico" style="background: color-mix(in srgb, var(--warn) 12%, white); color: var(--warn);">
            <i data-lucide="file-question"></i>
          </div>
          <div>
            <div class="fc-name">还没有选择账单文件</div>
            <div class="fc-meta">点击“选择账单”选单个或多个文件；点击“选择文件夹”导入整个文件夹里的 Excel / CSV</div>
          </div>
        </div>
      `;
      return;
    }

    els.workspaceFileList.innerHTML = files.map((item, index) => `
      <div class="file-chip">
        <div class="fc-ico" style="background:${index % 2 ? "color-mix(in srgb, var(--cat-kids) 13%, white)" : "var(--green-50)"}; color:${index % 2 ? "var(--cat-kids)" : "var(--green-700)"};">
          <i data-lucide="file-spreadsheet"></i>
        </div>
        <div class="fc-body">
          <div class="fc-name">${escapeHtml(item.name || fileBaseName(item.path))}</div>
          <div class="fc-meta">${escapeHtml(fileMetaText(item))}</div>
        </div>
        <div class="fc-status"><i data-lucide="check" class="fc-check"></i></div>
        <button class="icon-btn danger fc-remove" data-remove-workspace-file="${escapeHtml(item.id)}" type="button" title="从待导入列表移除" aria-label="从待导入列表移除">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join("");
    els.workspaceFileList.querySelectorAll("[data-remove-workspace-file]").forEach((button) => {
      button.addEventListener("click", () => removeQueuedFile(button.getAttribute("data-remove-workspace-file")));
    });
  }

  function fileBaseName(name) {
    return String(name).split(/[\\/]/).pop() || name;
  }

  function fileMetaText(item) {
    const path = item.path && item.path !== item.name ? item.path : "";
    const size = item.size ? formatFileSize(item.size) : "";
    return [path, size].filter(Boolean).join(" · ") || "已加入待导入列表";
  }

  function formatFileSize(bytes) {
    const value = Number(bytes || 0);
    if (!value) return "";
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  function startProcessing(message) {
    state.processing = true;
    state.hasImportNotice = true;
    if (els.processingMessage) els.processingMessage.textContent = message;
    if (els.aiProcessNote) els.aiProcessNote.textContent = "只分析规则拿不准的项目，生成分类建议";
    PROCESS_STEPS.forEach((step) => {
      const item = document.querySelector(`[data-process-step="${step}"]`);
      if (item) item.classList.remove("is-active", "is-done", "is-error", "active", "done", "error");
    });
    renderStage();
    refreshIcons();
  }

  function finishProcessing() {
    state.processing = false;
  }

  function setProcessStep(step, status = "active", message = "") {
    const index = PROCESS_STEPS.indexOf(step);
    if (els.processingMessage && message) els.processingMessage.textContent = message;
    PROCESS_STEPS.forEach((name, itemIndex) => {
      const item = document.querySelector(`[data-process-step="${name}"]`);
      if (!item) return;
      const done = itemIndex < index || (name === step && status === "done");
      const active = name === step && status === "active";
      const error = name === step && status === "error";
      item.classList.toggle("is-done", done);
      item.classList.toggle("done", done);
      item.classList.toggle("is-active", active);
      item.classList.toggle("active", active);
      item.classList.toggle("is-error", error);
      item.classList.toggle("error", error);
    });
    refreshIcons();
  }

  function pauseForProcess(ms = 420) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function buildImportStatus(imported, skipped, failed, aiResult, outOfMonth = 0, storageResult = {}) {
    const parts = [`已导入 ${imported} 条`, `跳过重复 ${skipped} 条`];
    if (outOfMonth) parts.push(`跳过非${currentMonthLabel()} ${outOfMonth} 条`);
    if (failed) parts.push(`失败 ${failed} 个文件`);
    if (storageResult.savedFiles) parts.push(`原文件已保存 ${storageResult.savedFiles} 个`);
    if (storageResult.saveFailed) {
      const firstError = storageResult.saveErrors?.[0];
      const detail = firstError
        ? `：${firstError.name}${firstError.error ? `（${firstError.error}）` : ""}`
        : "";
      parts.push(`原文件保存失败 ${storageResult.saveFailed} 个${detail}`);
    }
    if (aiResult?.reviewed) {
      parts.push(`AI 复核 ${aiResult.reviewed} 条`);
      if (aiResult.applied) parts.push(`AI 自动归类 ${aiResult.applied} 条`);
      if (aiResult.retryBatches && aiResult.retryBatches > aiResult.failedBatches) {
        parts.push(`AI 重试成功 ${aiResult.retryBatches - aiResult.failedBatches} 批`);
      }
      if (aiResult.failedBatches) {
        parts.push(`AI ${aiResult.failedBatches} 批重试后仍失败`);
      }
    } else if (aiResult?.error) {
      parts.push("AI 复核未完成");
      if (aiResult.retryBatches || aiResult.failedBatches) {
        parts.push(`已重试 ${aiResult.retryBatches || aiResult.failedBatches} 批`);
      }
      if (aiResult.failedBatches) {
        parts.push(`${aiResult.failedBatches} 批仍失败`);
      }
    }
    return parts.join("，");
  }

  function renderImportStatus() {
    if (!els.importStatus) return;
    if (state.importStatusMessage) {
      paintImportStatus(state.importStatusMessage, state.importStatusAiResult);
      return;
    }
    if (state.transactions.length) {
      paintImportStatus(t("ledgerLoaded", { month: currentMonthLabel(), count: state.transactions.length }));
      return;
    }
    els.importStatus.textContent = t("notImported");
  }

  function setImportStatus(message, aiResult = null) {
    if (!els.importStatus) return;
    state.hasImportNotice = true;
    state.importStatusMessage = message;
    state.importStatusAiResult = aiResult;
    paintImportStatus(message, aiResult);
  }

  function paintImportStatus(message, aiResult = null) {
    if (!els.importStatus) return;
    const applied = Number(aiResult?.applied || 0);
    const autoText = applied ? `AI 自动归类 ${applied} 条` : "";
    if (!autoText || !message.includes(autoText)) {
      els.importStatus.textContent = message;
      return;
    }

    els.importStatus.innerHTML = escapeHtml(message).replace(
      escapeHtml(autoText),
      `<button class="status-link" data-ai-auto-filter type="button">${escapeHtml(autoText)}</button>`
    );
    els.importStatus.querySelector("[data-ai-auto-filter]")?.addEventListener("click", showAiAutoClassified);
  }

  function showAiAutoClassified() {
    state.filterCategory = AI_AUTO_FILTER;
    state.search = "";
    if (els.searchInput) els.searchInput.value = "";
    if (els.categoryFilter) els.categoryFilter.value = "all";
    activateView("detail");
    renderTransactions();
  }

  function readWorkbookFile(file, sourceName = file.name) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const workbook = XLSX.read(reader.result, { type: "array", raw: false, cellDates: true });
          resolve(parseWorkbook(workbook, sourceName || file.name));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function parseWorkbook(workbook, sourceName) {
    const records = [];
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
        defval: "",
      });
      records.push(...parseWorkbookRows(rows, sourceName, sheetName));
    });
    return records;
  }

  function parseWorkbookRows(rows, sourceName, sheetName = "") {
    const headerIndex = rows.findIndex((row) => detectSheetType(row));
    if (headerIndex < 0) return [];

    const header = rows[headerIndex].map((cell) => cleanText(cell));
    const type = detectSheetType(header);
    const indexes = buildIndex(header);
    const parsed = [];

    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.every((cell) => cleanText(cell) === "")) continue;
      const tx = type === "credit"
        ? parseCreditRow(row, indexes, sourceName, sheetName, i + 1)
        : parseBankRow(row, indexes, sourceName, sheetName, i + 1);
      if (tx) parsed.push(tx);
    }

    return parsed;
  }

  function detectSheetType(row) {
    const header = (row || []).map((cell) => cleanText(cell));
    const text = header.join("|");
    if (text.includes("交易日期") && text.includes("交易金额") && text.includes("交易摘要")) {
      return "credit";
    }
    if (text.includes("交易时间") && text.includes("支出") && text.includes("收入") && text.includes("摘要")) {
      return "bank";
    }
    const indexes = buildAliasIndex(header);
    const hasDate = indexes.date !== undefined;
    const hasText = indexes.summary !== undefined || indexes.merchant !== undefined || indexes.purpose !== undefined;
    if (hasDate && hasText && (indexes.expense !== undefined || indexes.income !== undefined)) {
      return "bank";
    }
    if (hasDate && hasText && indexes.amount !== undefined) {
      return "credit";
    }
    return "";
  }

  function buildIndex(header) {
    const indexes = {};
    header.forEach((name, index) => {
      indexes[name] = index;
    });
    Object.entries(buildAliasIndex(header)).forEach(([key, index]) => {
      indexes[`$${key}`] = index;
    });
    return indexes;
  }

  function buildAliasIndex(header) {
    const normalizedHeader = header.map(normalizeText);
    return Object.entries(HEADER_ALIASES).reduce((indexes, [key, aliases]) => {
      const aliasSet = aliases.map(normalizeText);
      const index = normalizedHeader.findIndex((name) => aliasSet.includes(name));
      if (index >= 0) indexes[key] = index;
      return indexes;
    }, {});
  }

  function parseCreditRow(row, indexes, sourceName, sheetName, rowNumber) {
    const date = parseDate(readCell(row, indexes, "交易日期", "date"));
    const postDate = parseDate(readCell(row, indexes, "记账日期", "postDate"));
    const amount = parseAmount(readCell(row, indexes, "交易金额", "amount"));
    const summary = cleanText(readCell(row, indexes, "交易摘要", "summary"));
    const purpose = cleanText(readCell(row, indexes, "用途", "purpose"));
    const merchantFromColumn = cleanText(readCell(row, indexes, "对方户名", "merchant"));
    if (!date || amount === null || (!summary && !merchantFromColumn && !purpose)) return null;

    const direction = amount < 0 || summary.includes("退货") || summary.includes("退款") ? "退款" : "支出";
    const merchant = merchantFromColumn || extractMerchant(summary || purpose);
    const account = cleanText(readCell(row, indexes, "尾号4位", "account"));
    return normalizeTransaction({
      sourceName,
      sheetName,
      rowNumber,
      date,
      postDate,
      amountSigned: amount,
      amountAbs: Math.abs(amount),
      direction,
      merchant,
      summary,
      channel: extractChannel(summary),
      account,
      purpose,
      raw: row,
    });
  }

  function parseBankRow(row, indexes, sourceName, sheetName, rowNumber) {
    const date = parseDate(readCell(row, indexes, "交易时间", "date"));
    const postDate = parseDate(readCell(row, indexes, "记账日", "postDate"));
    const expense = parseAmount(readCell(row, indexes, "支出", "expense"));
    const income = parseAmount(readCell(row, indexes, "收入", "income"));
    const amount = parseAmount(readCell(row, indexes, "交易金额", "amount"));
    const directionText = cleanText(readCell(row, indexes, "收支", "direction"));
    const summary = cleanText(readCell(row, indexes, "摘要", "summary"));
    const counterparty = cleanText(readCell(row, indexes, "对方户名", "merchant"));
    const purpose = cleanText(readCell(row, indexes, "用途", "purpose"));
    const channel = cleanText(readCell(row, indexes, "交易渠道", "channel"));
    const note = cleanText(readCell(row, indexes, "备注", "purpose"));
    const merchant = counterparty || extractMerchant(purpose) || summary;

    if (!date || (expense === null && income === null && amount === null)) return null;

    let direction = "支出";
    let amountSigned = expense ?? amount ?? 0;
    if (income && income > 0) {
      direction = summary.includes("退款") || purpose.includes("退款") ? "退款" : "收入";
      amountSigned = -income;
    } else if (amount !== null && amount < 0) {
      direction = "退款";
      amountSigned = amount;
    } else if (directionText.includes("收入") || directionText.includes("入账")) {
      direction = "收入";
      amountSigned = -Math.abs(amountSigned);
    }

    return normalizeTransaction({
      sourceName,
      sheetName,
      rowNumber,
      date,
      postDate,
      amountSigned,
      amountAbs: Math.abs(amountSigned),
      direction,
      merchant,
      summary,
      channel,
      account: "",
      purpose,
      note,
      raw: row,
    });
  }

  function readCell(row, indexes, exactName, aliasKey) {
    const exactIndex = indexes[exactName];
    const aliasIndex = indexes[`$${aliasKey}`];
    const index = exactIndex !== undefined ? exactIndex : aliasIndex;
    return index === undefined ? "" : row[index];
  }

  function normalizeTransaction(tx) {
    const combined = [
      tx.merchant,
      tx.summary,
      tx.purpose,
      tx.note,
      tx.channel,
      tx.account,
    ].filter(Boolean).join(" ");

    return {
      id: hashText(`${tx.sourceName}|${tx.sheetName}|${tx.rowNumber}|${tx.date}|${tx.amountSigned}|${tx.merchant}|${tx.summary}`),
      signature: hashText(`${tx.date}|${round2(tx.amountSigned)}|${normalizeText(tx.merchant)}|${normalizeText(tx.summary)}`),
      sourceName: tx.sourceName,
      sheetName: tx.sheetName,
      rowNumber: tx.rowNumber,
      date: tx.date,
      postDate: tx.postDate || tx.date,
      direction: tx.direction,
      amountSigned: round2(tx.amountSigned),
      amountAbs: round2(tx.amountAbs),
      merchant: tx.merchant || "未识别",
      summary: tx.summary || "",
      channel: tx.channel || "",
      account: tx.account || "",
      purpose: tx.purpose || "",
      note: tx.note || "",
      combinedText: combined,
      category: "uncertain",
      confidence: 0,
      reason: "未分类",
      needsReview: true,
      matchedDailyId: "",
      aiAutoClassified: false,
      aiAutoReason: "",
      rememberCandidate: null,
    };
  }

  function addTransactions(records) {
    const existingIds = new Set(state.transactions.map((tx) => tx.id));
    const existingSignatures = state.transactions.reduce((map, tx) => {
      const key = transactionDedupeKey(tx);
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map());
    let added = 0;
    let skipped = 0;
    let outOfMonth = 0;

    records.forEach((record) => {
      if (!isInCurrentMonth(record.date)) {
        outOfMonth += 1;
        return;
      }
      if (existingIds.has(record.id)) {
        consumeExistingSignature(existingSignatures, record);
        skipped += 1;
        return;
      }
      if (consumeExistingSignature(existingSignatures, record)) {
        skipped += 1;
        return;
      }
      record.ledgerMonth = state.currentMonth;
      state.transactions.push(record);
      existingIds.add(record.id);
      added += 1;
    });

    state.transactions.sort((a, b) => {
      if (a.date === b.date) return b.rowNumber - a.rowNumber;
      return b.date.localeCompare(a.date);
    });

    return { added, skipped, outOfMonth };
  }

  function transactionDedupeKey(tx) {
    return tx.signature || tx.id;
  }

  function consumeExistingSignature(signatureCounts, tx) {
    const key = transactionDedupeKey(tx);
    const count = signatureCounts.get(key) || 0;
    if (!count) return false;
    if (count === 1) {
      signatureCounts.delete(key);
    } else {
      signatureCounts.set(key, count - 1);
    }
    return true;
  }

  function classifyAll() {
    const dailyMatches = buildDailyMatchMap();
    state.transactions.forEach((tx) => classifyTransaction(tx, dailyMatches.get(tx.id)));
    saveCurrentMonthTransactions();
  }

  function classifyTransaction(tx, dailyMatch) {
    tx.matchedDailyId = "";
    tx.aiAutoClassified = false;
    tx.aiAutoReason = "";
    tx.rememberCandidate = null;

    if (tx.direction === "收入" || tx.direction === "退款") {
      tx.category = "refund";
      tx.confidence = 98;
      tx.reason = tx.direction;
      tx.needsReview = false;
      return;
    }

    if (dailyMatch) {
      tx.category = dailyMatch.category;
      tx.confidence = dailyMatch.confidence;
      tx.reason = "当天金额记忆";
      tx.needsReview = false;
      tx.matchedDailyId = dailyMatch.id;
      return;
    }

    const memory = findMemoryMatch(tx);
    if (memory) {
      tx.category = memory.category;
      tx.confidence = 94;
      tx.reason = `记忆：${memory.keyword}`;
      tx.needsReview = false;
      return;
    }

    const rule = findRuleMatch(tx);
    if (rule) {
      tx.category = rule.category;
      tx.confidence = rule.priority || 78;
      tx.reason = `规则：${rule.name}`;
      tx.needsReview = tx.confidence < 65 || tx.category === "uncertain";
      return;
    }

    tx.category = "uncertain";
    tx.confidence = 36;
    tx.reason = "待确认";
    tx.needsReview = true;
  }

  async function runAiReview() {
    const candidates = state.transactions
      .filter((tx) => tx.needsReview && tx.direction === "支出")
      .slice(0, 60);
    const batchSize = 20;

    if (!candidates.length) {
      if (els.aiProcessNote) els.aiProcessNote.textContent = "没有需要 AI 复核的项目";
      await pauseForProcess();
      return { reviewed: 0, applied: 0, message: "没有需要 AI 复核的项目" };
    }

    if (els.aiProcessNote) {
      els.aiProcessNote.textContent = `正在复核 ${candidates.length} 条规则拿不准的交易`;
    }

    const allowedCategories = new Set(categories.map((cat) => cat.id));
    let applied = 0;
    let reviewed = 0;
    let retryBatches = 0;
    let failedBatches = 0;
    const failedBatchNumbers = [];
    const totalBatches = Math.ceil(candidates.length / batchSize);

    try {
      for (let index = 0; index < candidates.length; index += batchSize) {
        const batch = candidates.slice(index, index + batchSize);
        const batchNo = Math.floor(index / batchSize) + 1;

        let data = null;
        let lastError = "";
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          if (els.aiProcessNote) {
            els.aiProcessNote.textContent = attempt === 1
              ? `AI 正在复核第 ${batchNo}/${totalBatches} 批，共 ${candidates.length} 条不确定交易`
              : `第 ${batchNo}/${totalBatches} 批调用失败，正在重试一次...`;
          }
          if (attempt === 2) {
            retryBatches += 1;
            await pauseForProcess(500);
          }

          try {
            data = await requestAiReviewBatch(batch);
            break;
          } catch (error) {
            lastError = error.message || "AI 接口不可用";
            console.warn(`AI 第 ${batchNo}/${totalBatches} 批第 ${attempt} 次失败：${lastError}`);
          }
        }

        if (!data) {
          failedBatches += 1;
          failedBatchNumbers.push(batchNo);
          if (els.aiProcessNote) {
            els.aiProcessNote.textContent = `第 ${batchNo}/${totalBatches} 批重试后仍失败，相关交易保留待确认`;
          }
          await pauseForProcess(600);
          continue;
        }

        (data.reviews || []).forEach((review) => {
          const tx = state.transactions.find((item) => item.id === review.id);
          if (!tx || !allowedCategories.has(review.category)) return;
          const confidence = Math.max(0, Math.min(100, Number(review.confidence || 0)));
          if (confidence < 55) return;

          reviewed += 1;
          tx.aiSuggestion = {
            category: review.category,
            confidence,
            reason: cleanText(review.reason).slice(0, 80),
          };

          if (AUTO_APPLY_AI_REVIEW && review.category !== "uncertain" && confidence >= 82) {
            tx.category = review.category;
            tx.confidence = confidence;
            tx.reason = `AI复核：${tx.aiSuggestion.reason || categoryName(review.category)}`;
            tx.needsReview = confidence < 90;
            tx.aiAutoClassified = true;
            tx.aiAutoReason = tx.reason;
            applied += 1;
          }
        });
      }

      if (!reviewed && failedBatches === totalBatches) {
        throw new Error("AI 批量复核全部失败");
      }

      const messageBase = AUTO_APPLY_AI_REVIEW && applied
        ? `AI 已复核 ${reviewed} 条，其中 ${applied} 条置信度较高，已写入分类`
        : `AI 已复核 ${reviewed} 条，已生成建议，待确认后再写入分类`;
      const retryMessage = failedBatches
        ? `；${failedBatches} 批重试后仍失败，相关交易保留待确认`
        : retryBatches
          ? `；${retryBatches} 批重试后成功`
          : "";
      const message = `${messageBase}${retryMessage}`;
      if (els.aiProcessNote) els.aiProcessNote.textContent = message;
      return { reviewed, applied, retryBatches, failedBatches, failedBatchNumbers, message };
    } catch (error) {
      console.warn(error);
      const retryText = retryBatches || failedBatches
        ? `，已重试 ${retryBatches || failedBatches} 批`
        : "";
      const failedText = failedBatches
        ? `，${failedBatches} 批仍失败`
        : "";
      const message = `AI 复核暂未完成：${error.message || "接口不可用"}${retryText}${failedText}，不确定项目保留待确认`;
      if (els.aiProcessNote) els.aiProcessNote.textContent = message;
      await pauseForProcess(600);
      return { reviewed: 0, applied: 0, retryBatches, failedBatches, failedBatchNumbers, error: true, message };
    }
  }

  async function requestAiReviewBatch(batch) {
    const response = await fetch("/api/review-transactions", {
      method: "POST",
      headers: await apiHeaders(),
      body: JSON.stringify({
        categories,
        transactions: batch.map((tx) => ({
          id: tx.id,
          date: tx.date,
          amount: tx.amountAbs,
          merchant: tx.merchant,
          summary: tx.summary,
          purpose: tx.purpose,
          channel: tx.channel,
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || `AI HTTP ${response.status}`);
    }
    return data;
  }

  function buildDailyMatchMap() {
    const assignments = new Map();
    const usedTransactionIds = new Set();
    const items = state.daily
      .slice()
      .sort((a, b) => {
        const keywordScore = Number(Boolean(b.keyword)) - Number(Boolean(a.keyword));
        if (keywordScore) return keywordScore;
        return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      });

    items.forEach((item) => {
      const keyword = normalizeText(item.keyword);
      const candidates = state.transactions
        .filter((tx) => tx.direction === "支出")
        .filter((tx) => !usedTransactionIds.has(tx.id))
        .filter((tx) => tx.date === item.date)
        .filter((tx) => Math.abs(Number(item.amount) - tx.amountAbs) < 0.01)
        .filter((tx) => !keyword || normalizeText(tx.combinedText).includes(keyword));

      if (!candidates.length) return;
      if (!keyword && candidates.length > 1) return;

      const selected = candidates
        .slice()
        .sort((a, b) => dailyCandidateScore(b, keyword) - dailyCandidateScore(a, keyword))[0];

      usedTransactionIds.add(selected.id);
      assignments.set(selected.id, {
        ...item,
        confidence: keyword ? 99 : 96,
      });
    });

    return assignments;
  }

  function dailyCandidateScore(tx, keyword) {
    const merchantMatch = keyword && normalizeText(tx.merchant).includes(keyword) ? 10 : 0;
    return merchantMatch + Math.max(0, 100000 - tx.rowNumber);
  }

  function findMemoryMatch(tx) {
    const text = normalizeText(tx.combinedText);
    return state.memories.find((memory) => {
      if (!memory.keyword) return false;
      const keywordMatch = text.includes(normalizeText(memory.keyword));
      const amountMatch = memory.amount ? Math.abs(Number(memory.amount) - tx.amountAbs) < 0.01 : true;
      return keywordMatch && amountMatch;
    });
  }

  function findRuleMatch(tx) {
    const text = normalizeText(tx.combinedText);
    const rules = state.rules.slice().sort((a, b) => (b.priority || 50) - (a.priority || 50));

    return rules.find((rule) => {
      const keywords = normalizeKeywords(rule.keywords);
      const keywordMatch = keywords.length ? keywords.some((word) => text.includes(word)) : true;
      const minMatch = rule.minAmount === null || rule.minAmount === "" || tx.amountAbs >= Number(rule.minAmount);
      const maxMatch = rule.maxAmount === null || rule.maxAmount === "" || tx.amountAbs <= Number(rule.maxAmount);
      return keywordMatch && minMatch && maxMatch;
    });
  }

  function addDailyMemory() {
    const added = addDailyMemoryFromValues({
      date: els.dailyDate.value,
      amount: round2(Number(els.dailyAmount.value || 0)),
      category: els.dailyCategory.value,
      keyword: cleanText(els.dailyKeyword.value),
      note: cleanText(els.dailyNote.value),
    });
    if (!added) return;
    els.dailyAmount.value = "";
    els.dailyKeyword.value = "";
    els.dailyNote.value = "";
  }

  function addFixedCounterparty() {
    const keyword = cleanText(els.fixedKeyword.value);
    const category = els.fixedCategory.value;
    const added = addFixedCounterpartyFromValues(keyword, category);
    if (!added) return;
    els.fixedKeyword.value = "";
  }

  async function handleCoachCommand() {
    const command = cleanText(els.coachInput.value);
    if (!command) {
      setCoachResult("error", "先输入一句训练内容");
      return;
    }

    let parsed = parseCoachCommand(command);

    const missing = coachMissingFields(parsed);
    if (missing.length) {
      setCoachResult("pending", "本地规则没听全，正在请 AI 判断");
      const aiParsed = await parseCoachCommandWithAi(command, parsed);
      if (aiParsed) {
        parsed = mergeCoachParses(parsed, aiParsed);
        const stillMissing = coachMissingFields(parsed);
        const message = stillMissing.length
          ? `AI 补了一部分，还缺：${stillMissing.join("、")}`
          : "AI 已给出建议";
        showCoachFallback(parsed, message);
        return;
      }
      const stillMissing = coachMissingFields(parsed);
      if (stillMissing.length) {
        showCoachFallback(parsed, `有些信息没听准：${stillMissing.join("、")}`);
        return;
      }
    }

    if (parsed.type === "fixed") {
      addFixedCounterpartyFromValues(parsed.keyword, parsed.category, false);
      els.coachInput.value = "";
      hideCoachFallback();
      setCoachResult("success", `已固定：${parsed.keyword} -> ${categoryName(parsed.category)}`);
      return;
    }

    addDailyMemoryFromValues({
      date: parsed.date,
      amount: parsed.amount,
      category: parsed.category,
      keyword: parsed.keyword,
      note: command,
    }, false);
    els.coachInput.value = "";
    hideCoachFallback();
    const keywordText = parsed.keyword ? `，关键词：${parsed.keyword}` : "";
    setCoachResult("success", `已记住：${parsed.date} ${money(parsed.amount)} -> ${categoryName(parsed.category)}${keywordText}`);
  }

  function coachMissingFields(parsed) {
    if (parsed.type === "fixed") {
      return [
        !parsed.keyword ? "对手方" : "",
        !parsed.category ? "分类" : "",
      ].filter(Boolean);
    }

    return [
      !parsed.amount ? "金额" : "",
      !parsed.category ? "分类" : "",
    ].filter(Boolean);
  }

  async function parseCoachCommandWithAi(command, localParsed) {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 16000);
      const response = await fetch("/api/parse-training", {
        method: "POST",
        headers: await apiHeaders(),
        body: JSON.stringify({
          text: command,
          today: dateToYmd(new Date()),
          local: localParsed,
          categories: categoryPayloadForAi(),
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.ok || !data.parsed) return null;
      return normalizeAiParse(data.parsed, command);
    } catch (error) {
      console.warn(error);
      return null;
    }
  }

  function categoryPayloadForAi() {
    return categories
      .filter((category) => !["refund", "uncertain"].includes(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        aliases: CATEGORY_ALIASES[category.id] || [],
      }));
  }

  function normalizeAiParse(parsed, command) {
    const amount = parsed.amount === null || parsed.amount === undefined ? 0 : round2(Number(parsed.amount));
    const keyword = cleanText(parsed.keyword);
    const safeKeyword = keyword && normalizeText(command).includes(normalizeText(keyword)) ? keyword : "";
    return {
      type: ["daily", "fixed"].includes(parsed.type) ? parsed.type : (amount ? "daily" : "fixed"),
      date: parseDate(parsed.date) || dateToYmd(new Date()),
      amount,
      category: normalizeCategoryId(parsed.category),
      keyword: safeKeyword,
    };
  }

  function mergeCoachParses(localParsed, aiParsed) {
    return {
      type: aiParsed.type || localParsed.type,
      date: aiParsed.date || localParsed.date,
      amount: aiParsed.amount || localParsed.amount,
      category: aiParsed.category || localParsed.category,
      keyword: aiParsed.keyword || localParsed.keyword,
    };
  }

  function showCoachFallback(parsed, message) {
    els.coachFallback.hidden = false;
    els.coachFallbackType.value = parsed.type || "daily";
    els.coachFallbackDate.value = parsed.date || dateToYmd(new Date());
    els.coachFallbackAmount.value = parsed.amount || "";
    els.coachFallbackCategory.value = parsed.category || "";
    els.coachFallbackKeyword.value = parsed.keyword || "";
    updateCoachFallbackMode();
    const missing = coachMissingFields(parsed);
    setCoachResult("error", `${message}，请${missing.length ? "补全" : "确认"}后保存`);
  }

  function hideCoachFallback() {
    els.coachFallback.hidden = true;
  }

  function updateCoachFallbackMode() {
    const fixed = els.coachFallbackType.value === "fixed";
    els.coachFallbackDate.closest("label").hidden = fixed;
    els.coachFallbackAmount.closest("label").hidden = fixed;
    els.coachFallbackKeyword.placeholder = fixed ? "固定对手方，必填" : "可选，帮助月底匹配";
  }

  function handleCoachFallbackSubmit() {
    const type = els.coachFallbackType.value;
    const category = els.coachFallbackCategory.value;
    const keyword = cleanText(els.coachFallbackKeyword.value);

    if (!category) {
      setCoachResult("error", "请选择分类");
      return;
    }

    if (type === "fixed") {
      if (!keyword) {
        setCoachResult("error", "固定对手方需要填写对手方/关键词");
        return;
      }
      addFixedCounterpartyFromValues(keyword, category, false);
      hideCoachFallback();
      els.coachInput.value = "";
      setCoachResult("success", `已固定：${keyword} -> ${categoryName(category)}`);
      return;
    }

    const amount = round2(Number(els.coachFallbackAmount.value || 0));
    if (!amount) {
      setCoachResult("error", "当天金额记忆需要填写金额");
      return;
    }

    const date = els.coachFallbackDate.value || dateToYmd(new Date());
    addDailyMemoryFromValues({
      date,
      amount,
      category,
      keyword,
      note: cleanText(els.coachInput.value),
    }, false);
    hideCoachFallback();
    els.coachInput.value = "";
    setCoachResult("success", `已记住：${date} ${money(amount)} -> ${categoryName(category)}`);
  }

  function addDailyMemoryFromValues(values, rerender = true) {
    const item = {
      id: cryptoId(),
      date: values.date,
      amount: round2(Number(values.amount || 0)),
      category: values.category,
      keyword: cleanText(values.keyword),
      note: cleanText(values.note),
      createdAt: new Date().toISOString(),
    };

    if (!item.date || !item.amount || !item.category) return false;
    state.daily.unshift(item);
    state.daily = state.daily.slice(0, 120);
    writeScopedJson("daily", state.daily);
    classifyAll();
    render();
    if (rerender) setCoachResult("success", `已记住：${item.date} ${money(item.amount)} -> ${categoryName(item.category)}`);
    return true;
  }

  function addFixedCounterpartyFromValues(keyword, category, rerender = true) {
    const cleanKeyword = cleanText(keyword);
    if (!cleanKeyword || !category) return false;

    const exists = state.memories.some((item) => {
      return normalizeText(item.keyword) === normalizeText(cleanKeyword) && item.category === category && !item.amount;
    });

    if (!exists) {
      state.memories.unshift({
        id: cryptoId(),
        type: "counterparty",
        keyword: cleanKeyword,
        category,
        amount: null,
        createdAt: new Date().toISOString(),
      });
      state.memories = state.memories.slice(0, 240);
      writeScopedJson("memories", state.memories);
    }

    classifyAll();
    render();
    if (rerender) setCoachResult("success", `已固定：${cleanKeyword} -> ${categoryName(category)}`);
    return true;
  }

  function parseCoachCommand(command) {
    const category = inferCommandCategory(command);
    const type = isFixedIntent(command) ? "fixed" : "daily";

    if (type === "fixed") {
      return {
        type,
        category,
        keyword: extractFixedKeyword(command, category),
      };
    }

    return {
      type,
      category,
      date: inferCommandDate(command),
      amount: inferCommandAmount(command),
      keyword: extractDailyKeyword(command, category),
    };
  }

  function inferCommandCategory(command) {
    const text = normalizeText(command);
    const aliases = Object.entries(CATEGORY_ALIASES)
      .flatMap(([category, words]) => words.map((word) => ({ category, word: normalizeText(word) })))
      .sort((a, b) => b.word.length - a.word.length);

    const match = aliases.find((item) => item.word && text.includes(item.word));
    return match ? match.category : "";
  }

  function normalizeCategoryId(value) {
    const text = normalizeText(value);
    const byId = categories.find((category) => normalizeText(category.id) === text);
    if (byId) return byId.id;
    const byName = categories.find((category) => normalizeText(category.name) === text);
    if (byName) return byName.id;
    const aliases = Object.entries(CATEGORY_ALIASES)
      .flatMap(([category, words]) => words.map((word) => ({ category, word: normalizeText(word) })));
    return aliases.find((item) => item.word === text)?.category || "";
  }

  function isFixedIntent(command) {
    return /(固定|以后|之后|长期|对手方|商户|每次|一直|归到|归类)/.test(command) && !inferCommandAmount(command);
  }

  function inferCommandDate(command) {
    const now = new Date();
    if (/前天/.test(command)) return dateToYmd(addDays(now, -2));
    if (/昨天|昨日/.test(command)) return dateToYmd(addDays(now, -1));
    if (/今天|今日|刚刚|刚才/.test(command)) return dateToYmd(now);

    const fullDate = command.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
    if (fullDate) return partsToDate(fullDate[1], fullDate[2], fullDate[3]);

    const chineseDate = command.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*(日|号)?/);
    if (chineseDate) return partsToDate(now.getFullYear(), chineseDate[1], chineseDate[2]);

    const shortDate = command.match(/(^|[^\d])(\d{1,2})[/.](\d{1,2})([^\d]|$)/);
    if (shortDate) return partsToDate(now.getFullYear(), shortDate[2], shortDate[3]);

    return dateToYmd(now);
  }

  function inferCommandAmount(command) {
    const withoutDates = stripDateTokens(command);
    const withUnit = withoutDates.match(/(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)\s*(元|块|块钱)/);
    if (withUnit) return round2(Number(withUnit[1]));

    const withoutCategory = stripCategoryWords(withoutDates);
    const generic = withoutCategory.match(/(^|[^\d.])(\d+(?:\.\d{1,2})?)([^\d.]|$)/);
    return generic ? round2(Number(generic[2])) : 0;
  }

  function extractFixedKeyword(command, category) {
    return stripCommonWords(stripCategoryWords(command, category))
      .replace(/(固定为|固定|以后|之后|长期|每次|一直|对手方|商户|归到|归类|计入|记为|算作|算|把|将|为)/g, " ")
      .replace(/\d+(?:\.\d{1,2})?\s*(元|块|块钱)?/g, " ")
      .replace(/[，,。；;：:]/g, " ")
      .trim();
  }

  function extractDailyKeyword(command, category) {
    const stripped = stripCommonWords(stripCategoryWords(stripDateTokens(command), category))
      .replace(/(?:¥|￥)?\s*\d+(?:\.\d{1,2})?\s*(元|块|块钱)?/g, " ")
      .replace(/(今天|今日|昨天|昨日|前天|刚刚|刚才|消费|花了|花|付了|支付|这笔|这一笔|计入|记为|算作|算|归到|归类|支出|收入|元|块|块钱|了|在)/g, " ")
      .replace(/[，,。；;：:]/g, " ")
      .trim();

    return stripped.length >= 2 ? stripped.slice(0, 28) : "";
  }

  function stripCommonWords(value) {
    return cleanText(value).replace(/\s+/g, " ");
  }

  function stripCategoryWords(value, category = "") {
    const words = category ? CATEGORY_ALIASES[category] || [] : Object.values(CATEGORY_ALIASES).flat();
    return words.reduce((text, word) => {
      return text.replace(new RegExp(escapeRegExp(word), "g"), " ");
    }, cleanText(value));
  }

  function stripDateTokens(value) {
    return cleanText(value)
      .replace(/(今天|今日|昨天|昨日|前天|刚刚|刚才)/g, " ")
      .replace(/20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}(日|号)?/g, " ")
      .replace(/\d{1,2}\s*月\s*\d{1,2}\s*(日|号)?/g, " ")
      .replace(/(^|[^\d])\d{1,2}[/.]\d{1,2}([^\d]|$)/g, " ");
  }

  function partsToDate(year, month, day) {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return dateToYmd(date);
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function setCoachResult(type, message) {
    const className = type === "success" ? "is-success" : type === "pending" ? "is-pending" : "is-error";
    els.coachResult.className = `coach-result ${className}`;
    els.coachResult.textContent = message;
  }

  function addRule() {
    const keywords = splitKeywords(els.ruleKeywords.value);
    if (!keywords.length) return;

    const rule = {
      id: cryptoId(),
      name: cleanText(els.ruleName.value),
      category: els.ruleCategory.value,
      keywords,
      minAmount: parseOptionalAmount(els.ruleMin.value),
      maxAmount: parseOptionalAmount(els.ruleMax.value),
      priority: 92,
      builtIn: false,
    };

    state.rules.unshift(rule);
    writeScopedJson("rules", state.rules);
    els.ruleForm.reset();
    classifyAll();
    render();
  }

  function confirmTransaction(id, category, remember) {
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx || !category) return;

    tx.category = category;
    tx.confidence = 100;
    tx.reason = "人工确认";
    tx.needsReview = false;
    tx.aiAutoClassified = false;
    tx.aiAutoReason = "";
    state.reviewRememberIds.delete(id);
    tx.rememberCandidate = remember && category !== "uncertain" ? {
      keyword: bestMemoryKeyword(tx),
      category,
    } : null;

    saveCurrentMonthTransactions();
    render();
    if (tx.rememberCandidate) {
      showRememberRuleDialog(id, category);
    }
  }

  function rememberRuleFromTransaction(tx, category) {
    const keyword = bestMemoryKeyword(tx);
    if (!keyword || !category) return null;

    const amount = isGenericKeyword(keyword) ? tx.amountAbs : null;
    const normalizedKeyword = normalizeText(keyword);
    const exists = state.memories.some((item) => {
      if (normalizeText(item.keyword) !== normalizedKeyword || item.category !== category) return false;
      if (!amount) return !item.amount;
      return Math.abs(Number(item.amount || 0) - amount) < 0.01;
    });

    if (!exists) {
      state.memories.unshift({
        id: cryptoId(),
        type: "counterparty",
        keyword,
        category,
        amount,
        createdAt: new Date().toISOString(),
      });
      state.memories = state.memories.slice(0, 240);
      writeScopedJson("memories", state.memories);
    }

    return { keyword, category, amount, added: !exists };
  }

  function showRememberRuleDialog(id, category) {
    const tx = state.transactions.find((item) => item.id === id);
    if (!tx || !category || category === "uncertain") return;

    const keyword = bestMemoryKeyword(tx);
    if (!keyword) return;

    document.querySelectorAll("[data-remember-rule-dialog]").forEach((item) => item.remove());

    const amount = isGenericKeyword(keyword) ? tx.amountAbs : null;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop remember-rule-backdrop";
    backdrop.setAttribute("data-remember-rule-dialog", "true");
    backdrop.innerHTML = `
      <div class="modal remember-rule-modal" role="dialog" aria-modal="true" aria-labelledby="rememberRuleTitle">
        <div class="modal-head">
          <div>
            <div class="modal-title" id="rememberRuleTitle">要记住这条分类规则吗？</div>
            <div class="modal-desc">这笔交易已经改为 ${escapeHtml(categoryName(category))}，下面决定是否让系统长期学习。</div>
          </div>
          <button class="icon-btn" data-remember-close type="button" aria-label="关闭">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="remember-rule-preview">
            <div class="rr-label">将保存为当前用户的固定对手方规则</div>
            <div class="rr-main">
              <span>${escapeHtml(keyword)}</span>
              <i data-lucide="arrow-right"></i>
              <b>${escapeHtml(categoryName(category))}</b>
            </div>
            ${amount ? `<div class="rr-note">这个关键词比较泛，系统会同时限定金额 ${money(amount)}，避免误伤其它转账。</div>` : ""}
          </div>
          <div class="remember-explain">
            <div><i data-lucide="repeat"></i><span>以后导入账单时，商户、对方或摘要里出现这个关键词，会自动归到该分类。</span></div>
            <div><i data-lucide="user-check"></i><span>规则只保存在当前用户的训练记忆里，不会影响其他用户。</span></div>
            <div><i data-lucide="sliders-horizontal"></i><span>记错了也可以去「训练规则」里删除或重新调整。</span></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" data-remember-once type="button">只改这笔</button>
          <button class="btn btn-primary" data-remember-confirm type="button">
            <i data-lucide="check"></i>记住规则
          </button>
        </div>
      </div>
    `;

    const close = () => {
      backdrop.remove();
    };
    const clearCandidateAndRender = () => {
      const current = state.transactions.find((item) => item.id === id);
      if (current) current.rememberCandidate = null;
      saveCurrentMonthTransactions();
      close();
      render();
    };

    backdrop.querySelector("[data-remember-close]")?.addEventListener("click", close);
    backdrop.querySelector("[data-remember-once]")?.addEventListener("click", clearCandidateAndRender);
    backdrop.querySelector("[data-remember-confirm]")?.addEventListener("click", () => {
      const current = state.transactions.find((item) => item.id === id);
      if (!current) {
        close();
        return;
      }
      const remembered = rememberRuleFromTransaction(current, category);
      current.rememberCandidate = null;
      classifyAll();
      close();
      if (remembered) {
        setImportStatus(`已记住规则：${remembered.keyword} -> ${categoryName(category)}。以后同类流水会自动归类。`);
      }
      render();
    });

    document.body.appendChild(backdrop);
    refreshIcons();
  }

  function removeDaily(id) {
    state.daily = state.daily.filter((item) => item.id !== id);
    writeScopedJson("daily", state.daily);
    classifyAll();
    render();
  }

  function removeMemory(id) {
    state.memories = state.memories.filter((item) => item.id !== id);
    writeScopedJson("memories", state.memories);
    classifyAll();
    render();
  }

  function removeRule(id) {
    state.rules = state.rules.filter((rule) => rule.id !== id || rule.builtIn);
    writeScopedJson("rules", state.rules);
    classifyAll();
    render();
  }

  function render() {
    applyI18n();
    renderLedgerContext();
    renderAuth();
    renderImportStatus();
    renderStage();
    renderMetrics();
    renderOutputSchema();
    renderTransactions();
    renderStats();
    renderReviews();
    renderDailyList();
    renderFixedList();
    renderRules();
    renderWorkspaceFiles();
    refreshIcons();
  }

  function renderLedgerContext() {
    const month = currentMonthLabel();
    if (els.languageSelect && els.languageSelect.value !== state.locale) {
      els.languageSelect.value = state.locale;
    }
    if (els.monthInput && els.monthInput.value !== state.currentMonth) {
      els.monthInput.value = state.currentMonth;
    }
    if (els.uploadTitle) {
      els.uploadTitle.textContent = t("monthLedger", { month });
    }
    if (els.uploadDescription) {
      els.uploadDescription.textContent = t("uploadDescription", { month });
    }
    if (els.dropzoneTitle) {
      els.dropzoneTitle.textContent = t("dropzoneTitle", { month });
    }
    if (els.dropzoneSub) {
      els.dropzoneSub.textContent = t("dropzoneSub");
    }
  }

  function renderStage() {
    const hasTransactions = state.transactions.length > 0;
    const hasNotice = state.hasImportNotice && Boolean(els.importStatus?.textContent?.trim());
    document.querySelector(".app")?.classList.toggle("has-results", hasTransactions);
    if (els.uploadStage) els.uploadStage.hidden = state.processing || hasTransactions;
    if (els.processingStage) els.processingStage.hidden = !state.processing;
    if (els.resultsStage) els.resultsStage.hidden = state.processing || !hasTransactions;
    if (els.resultTopActions) els.resultTopActions.hidden = !hasTransactions;
    if (els.importStatus) els.importStatus.hidden = !hasTransactions && !state.processing && !hasNotice;
  }

  function renderMetrics() {
    const spend = state.transactions
      .filter((tx) => isConsumption(tx))
      .reduce((sum, tx) => sum + tx.amountAbs, 0);
    const spendCount = state.transactions.filter((tx) => isConsumption(tx)).length;
    const review = state.transactions.filter((tx) => tx.needsReview).length;
    const memory = state.transactions.filter((tx) => tx.matchedDailyId || tx.reason.startsWith("记忆")).length;
    const sourceCount = new Set(state.transactions.map((tx) => tx.sourceName).filter(Boolean)).size;
    const month = currentMonthLabel();

    els.totalSpend.textContent = money0(spend);
    els.transactionCount.textContent = String(state.transactions.length);
    els.reviewCount.textContent = String(review);
    els.memoryCount.textContent = String(memory);
    if (els.spendMonthLabel) els.spendMonthLabel.textContent = t("spendTotalMonth", { month });
    if (els.spendNote) els.spendNote.textContent = `已剔除资金往来与退款 · 共 ${spendCount} 笔`;
    if (els.sourceNote) els.sourceNote.textContent = sourceCount ? t("sourceCount", { count: sourceCount }) : t("importedBills");
    if (els.reviewBadge) els.reviewBadge.hidden = review === 0;
    if (els.tabReviewCount) {
      els.tabReviewCount.textContent = String(review);
      els.tabReviewCount.hidden = review === 0;
    }
  }

  function renderOutputSchema() {
    if (els.detailSchemaText) {
      els.detailSchemaText.textContent = `${DETAIL_SCHEMA.length} 列固定字段：${DETAIL_SCHEMA.map((item) => item.label).join("、")}`;
    }
    if (els.statsSchemaText) {
      els.statsSchemaText.textContent = `${STATS_SCHEMA.length} 列固定字段：${STATS_SCHEMA.map((item) => item.label).join("、")}`;
    }
  }

  function renderTransactions() {
    const rows = filteredTransactions();
    renderCategoryChips();
    if (!rows.length) {
      els.transactionTable.innerHTML = document.getElementById("emptyStateTemplate").innerHTML;
      refreshIcons();
      return;
    }

    els.transactionTable.innerHTML = rows.map((tx) => {
      const amountClass = tx.direction === "收入" || tx.direction === "退款" ? "in" : "out";
      const category = categoryById(tx.category);
      return `
        <tr class="${tx.needsReview || tx.category === "uncertain" ? "pending-row" : ""}">
          <td class="td-date num">${escapeHtml(shortDate(tx.date))}<div class="post">记账 ${escapeHtml(shortDate(tx.postDate || tx.date))}</div></td>
          <td><span style="font-size:12.5px;color:${tx.direction === "收入" || tx.direction === "退款" ? "var(--green-600)" : "var(--ink-3)"}">${escapeHtml(tx.direction)}</span></td>
          <td style="text-align:right;"><span class="amount num ${amountClass}"><span class="cny">¥</span>${formatAmount(tx.amountAbs)}</span></td>
          <td>
            <select class="cat-select" style="${categoryStyle(tx.category)}" data-row-category="${escapeHtml(tx.id)}" aria-label="修改分类">
              ${categoryOptions(tx.category, false, true)}
            </select>
          </td>
          <td>
            <span class="merchant">${escapeHtml(tx.merchant || "未识别")}</span>
            ${tx.rememberCandidate ? rowRememberPrompt(tx) : ""}
          </td>
          <td><span class="summary">${escapeHtml(tx.summary || tx.purpose || tx.note || "")}</span></td>
          <td>${channelPill(tx.channel || tx.sourceName)}</td>
          <td>${confidenceView(tx.confidence, tx.reason || category.name)}</td>
        </tr>
      `;
    }).join("");

    els.transactionTable.querySelectorAll("[data-row-category]").forEach((select) => {
      select.addEventListener("change", () => {
        const tx = state.transactions.find((item) => item.id === select.getAttribute("data-row-category"));
        if (!tx) return;
        tx.category = select.value;
        tx.confidence = 96;
        tx.reason = "用户在明细表修改";
        tx.needsReview = select.value === "uncertain";
        tx.aiAutoClassified = false;
        tx.aiAutoReason = "";
        tx.rememberCandidate = select.value !== "uncertain" ? {
          keyword: bestMemoryKeyword(tx),
          category: select.value,
        } : null;
        saveCurrentMonthTransactions();
        render();
        if (tx.rememberCandidate) {
          showRememberRuleDialog(tx.id, tx.category);
        }
      });
    });

    els.transactionTable.querySelectorAll("[data-row-remember]").forEach((button) => {
      button.addEventListener("click", () => {
        const tx = state.transactions.find((item) => item.id === button.getAttribute("data-row-remember"));
        if (!tx?.rememberCandidate) return;
        const category = tx.rememberCandidate.category;
        showRememberRuleDialog(tx.id, category);
      });
    });
  }

  function rowRememberPrompt(tx) {
    const keyword = tx.rememberCandidate?.keyword;
    const category = tx.rememberCandidate?.category;
    if (!keyword || !category) return "";
    return `
      <div class="row-learn">
        <span>可记住规则：${escapeHtml(keyword)} -> ${escapeHtml(categoryName(category))}</span>
        <button class="row-learn-btn" data-row-remember="${escapeHtml(tx.id)}" type="button">说明</button>
      </div>
    `;
  }

  function renderStats() {
    const stats = computeStats();
    if (!stats.length) {
      els.statsGrid.innerHTML = `
        <div class="empty-mini">
          <div class="em-ico"><i data-lucide="pie-chart"></i></div>
          <div class="em-title">暂无分类统计</div>
          <div class="em-sub">导入账单后会生成消费构成。</div>
        </div>
      `;
      return;
    }

    const total = stats.reduce((sum, item) => sum + item.amount, 0);
    const spendCount = stats.reduce((sum, item) => sum + item.count, 0);
    const excluded = excludedTotals();
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const segments = stats.map((item) => {
      const dash = total ? (item.amount / total) * circumference : 0;
      const segment = `<circle cx="110" cy="110" r="${radius}" fill="none" stroke="${escapeHtml(item.color)}" stroke-width="22" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" />`;
      offset += dash;
      return segment;
    }).join("");

    els.statsGrid.innerHTML = `
      <div class="card donut-card">
        <div class="section-title" style="text-align:left;margin-bottom:4px;">消费构成</div>
        <div class="section-desc" style="text-align:left;margin-bottom:8px;">已剔除资金往来与退款</div>
        <div class="donut-wrap">
          <svg width="220" height="220" viewBox="0 0 220 220" style="transform:rotate(-90deg);">
            <circle cx="110" cy="110" r="${radius}" fill="none" stroke="var(--surface-3)" stroke-width="22"></circle>
            ${segments}
          </svg>
          <div class="donut-center">
            <div class="dc-label">消费合计</div>
            <div class="dc-value num"><span style="font-size:16px;opacity:.5;">¥</span>${money0(total)}</div>
            <div class="dc-sub num">${spendCount} 笔 · ${currentMonthLabel()}</div>
          </div>
        </div>
      </div>

      <div class="card bars-card">
        <div class="section-head" style="margin-bottom:14px;">
          <div class="section-title">分类统计</div>
          <div class="section-desc num">共 ${spendCount} 笔消费</div>
        </div>
        ${stats.map((item) => {
          const pct = total ? Math.round((item.amount / total) * 100) : 0;
          return `
            <div class="bar-row">
              <div class="bar-name"><span class="cat-dot" style="width:9px;height:9px;border-radius:99px;background:${escapeHtml(item.color)};"></span>${escapeHtml(categoryName(item.category))}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.max(pct, item.amount > 0 ? 2 : 0)}%;background:${escapeHtml(item.color)};"></div></div>
              <div class="bar-meta">
                <span class="amt num"><span style="opacity:.45;font-weight:500;">¥</span>${money0(item.amount)}</span>
                <span class="pct num">${pct}%</span>
                <span class="cnt num">${item.count} 笔</span>
              </div>
            </div>
          `;
        }).join("")}
        <div class="excluded-note">
          <i data-lucide="info"></i>
          <div>
            “消费合计”不含 <b>资金往来/还款</b>（¥${money0(excluded.financial.amount)}，${excluded.financial.count} 笔）和 <b>退款/收入</b>（¥${money0(excluded.refund.amount)}，${excluded.refund.count} 笔）。待确认项目确认后再进入统计。
          </div>
        </div>
      </div>
    `;
  }

  function renderReviews() {
    const allReviews = state.transactions.filter((tx) => tx.needsReview);
    const totalPages = Math.max(1, Math.ceil(allReviews.length / REVIEW_PAGE_SIZE));
    state.reviewPage = Math.min(Math.max(1, state.reviewPage), totalPages);
    const start = (state.reviewPage - 1) * REVIEW_PAGE_SIZE;
    const reviews = allReviews.slice(start, start + REVIEW_PAGE_SIZE);
    const reviewIds = new Set(allReviews.map((tx) => tx.id));
    state.reviewRememberIds.forEach((id) => {
      if (!reviewIds.has(id)) state.reviewRememberIds.delete(id);
    });

    if (!allReviews.length) {
      els.reviewList.innerHTML = `
        <div class="empty-mini">
          <div class="em-ico"><i data-lucide="check"></i></div>
          <div class="em-title">没有待确认的交易了</div>
          <div class="em-sub">系统能稳定判断的都归好类了，剩下的就交给你来教它。</div>
        </div>
      `;
      return;
    }

    els.reviewList.innerHTML = `
      <div class="review-pager review-pager-top">
        <div class="pager-info">显示 ${start + 1}-${start + reviews.length} / ${allReviews.length} 条待确认</div>
        ${reviewPagerControls(totalPages)}
      </div>
      ${reviewRememberBulkControls(reviews, allReviews)}
      ${reviews.map((tx) => `
      <div class="confirm-item">
        <div class="confirm-amt">
          <div class="a num"><span class="cny">¥</span>${formatAmount(tx.amountAbs)}</div>
          <div class="d num">${escapeHtml(shortDate(tx.date))}</div>
        </div>
        <div class="confirm-mid">
          <div class="m-merchant">${escapeHtml(tx.merchant || "未识别")}</div>
          <div class="m-summary">${escapeHtml(tx.summary || tx.purpose || "无摘要")} · ${escapeHtml(tx.reason || "待确认")}</div>
          <div class="m-meta">
            ${channelPill(tx.channel || tx.sourceName)}
            ${tx.aiSuggestion ? `<span class="ai-hint"><i data-lucide="sparkles"></i>AI 建议：${escapeHtml(categoryName(tx.aiSuggestion.category))} · ${tx.aiSuggestion.confidence}% · ${escapeHtml(tx.aiSuggestion.reason || "按交易文本判断")}</span>` : ""}
          </div>
        </div>
        <div class="confirm-actions">
          <select class="cat-select" style="${categoryStyle(tx.aiSuggestion?.category || tx.category || "daily")}" data-review-category="${escapeHtml(tx.id)}">
            ${categoryOptions(tx.aiSuggestion?.category || tx.category || "daily", true)}
          </select>
          <button class="remember-toggle ${state.reviewRememberIds.has(tx.id) ? "on" : ""}" data-remember-toggle="${escapeHtml(tx.id)}" data-remember="${state.reviewRememberIds.has(tx.id) ? "true" : "false"}" type="button" title="确认时可选择是否保存成长期分类规则">
            <span class="box"><i data-lucide="check"></i></span>记住规则
          </button>
          <button class="btn btn-primary btn-sm" data-confirm="${escapeHtml(tx.id)}" type="button">
            <i data-lucide="check"></i>确认
          </button>
        </div>
      </div>
    `).join("")}
      <div class="review-pager">
        <div class="pager-info">第 ${state.reviewPage} / ${totalPages} 页</div>
        ${reviewPagerControls(totalPages)}
      </div>
    `;

    els.reviewList.querySelectorAll("[data-remember-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-remember-toggle");
        if (!id) return;
        const enabled = button.getAttribute("data-remember") !== "true";
        button.setAttribute("data-remember", String(enabled));
        button.classList.toggle("on", enabled);
        if (enabled) {
          state.reviewRememberIds.add(id);
        } else {
          state.reviewRememberIds.delete(id);
        }
        updateReviewRememberBulkSummary(allReviews);
      });
    });

    els.reviewList.querySelectorAll("[data-review-remember-bulk]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.getAttribute("data-review-remember-bulk");
        const targets = mode.includes("page") ? reviews : allReviews;
        const enabled = mode.endsWith("on");
        setReviewRememberBulk(targets, enabled);
        renderReviews();
        refreshIcons();
      });
    });

    els.reviewList.querySelectorAll("[data-confirm]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-confirm");
        const select = els.reviewList.querySelector(`[data-review-category="${cssEscape(id)}"]`);
        const rememberButton = els.reviewList.querySelector(`[data-remember-toggle="${cssEscape(id)}"]`);
        const remember = rememberButton?.getAttribute("data-remember") === "true";
        confirmTransaction(id, select.value, remember);
      });
    });

    els.reviewList.querySelectorAll("[data-review-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = Number(button.getAttribute("data-review-page"));
        if (!Number.isFinite(next)) return;
        state.reviewPage = Math.min(Math.max(1, next), totalPages);
        renderReviews();
        refreshIcons();
      });
    });
  }

  function reviewPagerControls(totalPages) {
    if (totalPages <= 1) return "";
    return `
      <div class="pager-actions">
        <button class="btn btn-ghost btn-sm" data-review-page="${state.reviewPage - 1}" type="button" ${state.reviewPage <= 1 ? "disabled" : ""}>
          <i data-lucide="chevron-left"></i>上一页
        </button>
        <span class="pager-page num">${state.reviewPage} / ${totalPages}</span>
        <button class="btn btn-ghost btn-sm" data-review-page="${state.reviewPage + 1}" type="button" ${state.reviewPage >= totalPages ? "disabled" : ""}>
          下一页<i data-lucide="chevron-right"></i>
        </button>
      </div>
    `;
  }

  function reviewRememberBulkControls(pageReviews, allReviews) {
    const selected = countRememberedReviews(allReviews);
    return `
      <div class="review-bulk">
        <div class="review-bulk-info" data-review-remember-summary>
          <i data-lucide="list-checks"></i>
          记住规则已勾选 <span class="num">${selected}</span> / ${allReviews.length}
        </div>
        <div class="review-bulk-actions">
          <button class="btn btn-ghost btn-sm" data-review-remember-bulk="page-on" type="button" ${pageReviews.length ? "" : "disabled"}>
            <i data-lucide="check"></i>本页全选
          </button>
          <button class="btn btn-ghost btn-sm" data-review-remember-bulk="page-off" type="button" ${pageReviews.length ? "" : "disabled"}>
            <i data-lucide="x"></i>本页取消
          </button>
          <button class="btn btn-ghost btn-sm" data-review-remember-bulk="all-on" type="button">
            <i data-lucide="list-checks"></i>全部全选
          </button>
          <button class="btn btn-ghost btn-sm" data-review-remember-bulk="all-off" type="button">
            <i data-lucide="x"></i>全部取消
          </button>
        </div>
      </div>
    `;
  }

  function setReviewRememberBulk(reviews, enabled) {
    reviews.forEach((tx) => {
      if (!tx?.id) return;
      if (enabled) {
        state.reviewRememberIds.add(tx.id);
      } else {
        state.reviewRememberIds.delete(tx.id);
      }
    });
  }

  function countRememberedReviews(reviews) {
    return reviews.reduce((count, tx) => count + (state.reviewRememberIds.has(tx.id) ? 1 : 0), 0);
  }

  function updateReviewRememberBulkSummary(allReviews) {
    const summary = els.reviewList?.querySelector("[data-review-remember-summary]");
    if (!summary) return;
    summary.innerHTML = `
      <i data-lucide="list-checks"></i>
      记住规则已勾选 <span class="num">${countRememberedReviews(allReviews)}</span> / ${allReviews.length}
    `;
    refreshIcons();
  }

  function renderDailyList() {
    if (!state.daily.length) {
      els.dailyList.innerHTML = `<div class="empty-mini"><div class="em-title">暂无当天金额记忆</div><div class="em-sub">告诉它“今天 200 元算社交支出”后会出现在这里。</div></div>`;
      return;
    }

    els.dailyList.innerHTML = state.daily.slice(0, 8).map((item) => `
      <div class="rule-item">
        <div class="rule-key">
          ${escapeHtml(item.date)} · ${money(item.amount)} ${categoryPill(item.category)}
          <div class="sub">${escapeHtml(item.keyword || item.note || "仅按日期和金额匹配")}</div>
        </div>
        <div class="spacer"></div>
        <button class="icon-btn danger" data-remove-daily="${escapeHtml(item.id)}" type="button" title="删除" aria-label="删除">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join("");

    els.dailyList.querySelectorAll("[data-remove-daily]").forEach((button) => {
      button.addEventListener("click", () => removeDaily(button.getAttribute("data-remove-daily")));
    });
  }

  function renderFixedList() {
    const memories = state.memories.filter((item) => item.keyword && !item.amount);
    if (!memories.length) {
      els.fixedList.innerHTML = `<div class="empty-mini"><div class="em-title">暂无固定对手方</div><div class="em-sub">固定商户规则会显示在这里。</div></div>`;
      return;
    }

    els.fixedList.innerHTML = memories.slice(0, 10).map((item) => `
      <div class="rule-item">
        <div class="rule-key">
          ${escapeHtml(item.keyword)} ${categoryPill(item.category)}
          <div class="sub">固定对手方</div>
        </div>
        <div class="spacer"></div>
        <button class="icon-btn danger" data-remove-memory="${escapeHtml(item.id)}" type="button" title="删除" aria-label="删除">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join("");

    els.fixedList.querySelectorAll("[data-remove-memory]").forEach((button) => {
      button.addEventListener("click", () => removeMemory(button.getAttribute("data-remove-memory")));
    });
  }

  function renderRules() {
    els.ruleList.innerHTML = state.rules.map((rule) => `
      <div class="rule-item ${rule.builtIn ? "default-rule" : ""}">
        <div class="rule-key">
          ${escapeHtml(rule.name || "未命名规则")} ${categoryPill(rule.category)}
          <div class="sub">${escapeHtml(normalizeKeywords(rule.keywords).join("，"))}${amountRangeText(rule)}</div>
        </div>
        <div class="spacer"></div>
        ${rule.builtIn ? "" : `
          <button class="icon-btn danger" data-remove-rule="${escapeHtml(rule.id)}" type="button" title="删除规则" aria-label="删除规则">
            <i data-lucide="x"></i>
          </button>
        `}
      </div>
    `).join("");

    els.ruleList.querySelectorAll("[data-remove-rule]").forEach((button) => {
      button.addEventListener("click", () => removeRule(button.getAttribute("data-remove-rule")));
    });
  }

  function renderCategoryChips() {
    if (!els.categoryChips) return;
    const counts = state.transactions.reduce((map, tx) => {
      map[tx.category] = (map[tx.category] || 0) + 1;
      map.all = (map.all || 0) + 1;
      return map;
    }, { all: 0 });
    const aiAutoCount = state.transactions.filter((tx) => tx.aiAutoClassified).length;

    const items = [
      { id: "all", name: "全部", color: "var(--green-900)", count: counts.all || 0 },
      ...(aiAutoCount ? [{ id: AI_AUTO_FILTER, name: "AI自动归类", color: "var(--green-600)", count: aiAutoCount }] : []),
      ...categories.filter((cat) => counts[cat.id]).map((cat) => ({ ...cat, count: counts[cat.id] || 0 })),
    ];

    els.categoryChips.innerHTML = items.map((item) => `
      <button class="chip ${state.filterCategory === item.id ? "active" : ""}" data-chip-category="${escapeHtml(item.id)}" type="button">
        ${item.id === "all" ? "" : `<span class="chip-dot" style="background:${escapeHtml(item.color)}"></span>`}
        ${escapeHtml(item.name)}
        <span class="chip-n num">${item.count}</span>
      </button>
    `).join("");

    els.categoryChips.querySelectorAll("[data-chip-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.filterCategory = button.getAttribute("data-chip-category") || "all";
        if (els.categoryFilter) els.categoryFilter.value = state.filterCategory === AI_AUTO_FILTER ? "all" : state.filterCategory;
        renderTransactions();
      });
    });
  }

  function shortDate(value) {
    const text = cleanText(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.slice(5) : text;
  }

  function formatAmount(value) {
    return Number(value || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function money0(value) {
    return Number(value || 0).toLocaleString("zh-CN", {
      maximumFractionDigits: 0,
    });
  }

  function currentMonthLabel() {
    return monthLabel(state.currentMonth);
  }

  function channelPill(value) {
    const text = cleanText(value) || "未知";
    const color = /微信|财付通/.test(text) ? "#1AAD19" : /支付宝/.test(text) ? "#1677FF" : "var(--ink-4)";
    return `<span class="channel-pill"><span class="ico" style="background:${escapeHtml(color)}"></span>${escapeHtml(text)}</span>`;
  }

  function confidenceView(confidence, label = "") {
    const score = Number(confidence || 0);
    const level = score >= 85 ? "high" : score >= 60 ? "mid" : "low";
    const labelText = score >= 85 ? "高" : score >= 60 ? "中" : "低";
    const bars = [1, 2, 3].map((bar) => `<i class="${bar <= (level === "high" ? 3 : level === "mid" ? 2 : 1) ? "on" : ""}" style="height:${bar * 4 + 3}px"></i>`).join("");
    return `<span class="conf lvl-${level}" title="${escapeHtml(label)}"><span class="conf-bars">${bars}</span>${labelText}</span>`;
  }

  function excludedTotals() {
    return state.transactions.reduce((totals, tx) => {
      if (tx.category === "financial") {
        totals.financial.amount += tx.amountAbs;
        totals.financial.count += 1;
      }
      if (tx.category === "refund" || tx.direction === "退款" || tx.direction === "收入") {
        totals.refund.amount += tx.amountAbs;
        totals.refund.count += 1;
      }
      return totals;
    }, {
      financial: { amount: 0, count: 0 },
      refund: { amount: 0, count: 0 },
    });
  }

  function filteredTransactions() {
    const search = normalizeText(state.search);
    return state.transactions.filter((tx) => {
      const categoryMatch = state.filterCategory === AI_AUTO_FILTER
        ? Boolean(tx.aiAutoClassified)
        : state.filterCategory === "all" || tx.category === state.filterCategory;
      const searchMatch = !search || normalizeText(`${tx.date} ${tx.merchant} ${tx.summary} ${tx.purpose} ${tx.note} ${tx.reason} ${tx.aiAutoReason}`).includes(search);
      return categoryMatch && searchMatch;
    });
  }

  function computeStats() {
    const map = new Map(categories.map((cat) => [cat.id, {
      category: cat.id,
      color: cat.color,
      amount: 0,
      count: 0,
    }]));

    state.transactions.forEach((tx) => {
      if (!isConsumption(tx)) return;
      const item = map.get(tx.category) || map.get("uncertain");
      item.amount += tx.amountAbs;
      item.count += 1;
    });

    return Array.from(map.values())
      .filter((item) => categories.find((cat) => cat.id === item.category)?.include)
      .sort((a, b) => b.amount - a.amount);
  }

  function exportDetails() {
    const rows = state.transactions.map((tx) => rowFromSchema(DETAIL_SCHEMA, tx));
    downloadCsv(`统一交易明细_${state.currentMonth}.csv`, rows, DETAIL_SCHEMA);
  }

  function exportStats() {
    const stats = computeStats();
    const total = stats.reduce((sum, item) => sum + item.amount, 0);
    const rows = stats.map((item) => rowFromSchema(STATS_SCHEMA, item, total));
    downloadCsv(`分类统计_${state.currentMonth}.csv`, rows, STATS_SCHEMA);
  }

  function exportWorkbook() {
    if (!state.transactions.length) {
      setImportStatus("暂无明细可导出");
      return;
    }

    const detailRows = state.transactions.map((tx) => rowFromSchema(DETAIL_SCHEMA, tx));
    const stats = computeStats();
    const total = stats.reduce((sum, item) => sum + item.amount, 0);
    const statRows = stats.map((item) => rowFromSchema(STATS_SCHEMA, item, total));

    const workbook = XLSX.utils.book_new();
    const detailSheet = sheetFromRows(DETAIL_SCHEMA, detailRows);
    const statsSheet = sheetFromRows(STATS_SCHEMA, statRows);
    XLSX.utils.book_append_sheet(workbook, detailSheet, "统一交易明细");
    XLSX.utils.book_append_sheet(workbook, statsSheet, "分类统计");
    XLSX.writeFile(workbook, `家庭账本_${state.currentMonth}_统一输出.xlsx`);
  }

  function sheetFromRows(schema, rows) {
    const headers = schema.map((column) => column.label);
    const values = rows.map((row) => headers.map((header) => row[header] ?? ""));
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...values]);
    sheet["!cols"] = headers.map((header) => ({ wch: excelColumnWidth(header, rows) }));
    if (rows.length) {
      sheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: rows.length, c: headers.length - 1 },
        }),
      };
    }
    return sheet;
  }

  function excelColumnWidth(header, rows) {
    const max = rows.reduce((width, row) => {
      const value = String(row[header] ?? "");
      return Math.max(width, visualLength(value));
    }, visualLength(header));
    return Math.min(Math.max(max + 2, 10), 36);
  }

  function visualLength(value) {
    return Array.from(String(value)).reduce((sum, char) => {
      return sum + (char.charCodeAt(0) > 255 ? 2 : 1);
    }, 0);
  }

  function rowFromSchema(schema, value, extra) {
    return schema.reduce((row, column) => {
      row[column.label] = column.value(value, extra);
      return row;
    }, {});
  }

  function downloadCsv(filename, rows, schema) {
    const headers = schema ? schema.map((column) => column.label) : Object.keys(rows[0] || {});
    if (!headers.length) return;
    const body = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
    ].join("\n");
    const blob = new Blob([`\ufeff${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function fillCategorySelects() {
    const inputCategories = categories.filter((cat) => !["refund", "uncertain"].includes(cat.id));
    const options = inputCategories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");
    els.dailyCategory.innerHTML = options;
    els.fixedCategory.innerHTML = options;
    els.ruleCategory.innerHTML = options;
    els.coachFallbackCategory.innerHTML = `<option value="">选择分类</option>${options}`;
    els.categoryFilter.innerHTML = `<option value="all">全部</option>${categories.map((cat) => `<option value="${cat.id}">${cat.name}</option>`).join("")}`;
  }

  function categoryOptions(selected, forReview, includeSpecial = false) {
    const placeholder = forReview && selected === "uncertain"
      ? `<option value="" disabled selected>选择分类</option>`
      : "";
    return placeholder + categories
      .filter((cat) => includeSpecial || !forReview || !["refund", "uncertain"].includes(cat.id))
      .map((cat) => `<option value="${cat.id}" ${cat.id === selected ? "selected" : ""}>${cat.name}</option>`)
      .join("");
  }

  function categoryName(id) {
    return categories.find((cat) => cat.id === id)?.name || id;
  }

  function categoryById(id) {
    return categories.find((cat) => cat.id === id) || categories.find((cat) => cat.id === "uncertain") || categories[0];
  }

  function categoryPill(id) {
    const category = categoryById(id);
    return `<span class="cat" style="${categoryStyle(category.id)}"><span class="cat-dot"></span>${escapeHtml(category.name)}</span>`;
  }

  function categoryStyle(id) {
    const category = categoryById(id);
    return `--c-fg:${escapeHtml(category.color)};--c-bg:color-mix(in srgb, ${escapeHtml(category.color)} 13%, white);`;
  }

  function isConsumption(tx) {
    return tx.direction === "支出" && !["financial", "refund", "uncertain"].includes(tx.category);
  }

  function setDefaultDailyDate() {
    const firstDay = `${state.currentMonth || dateToYm(new Date())}-01`;
    if (!els.dailyDate.value || !isInCurrentMonth(els.dailyDate.value)) {
      els.dailyDate.value = firstDay;
    }
  }

  function parseDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return dateToYmd(value);
    }
    const text = cleanText(value);
    if (!text) return "";
    const compact = text.replace(/[^\d]/g, "");
    if (/^\d{8}/.test(compact)) {
      return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
    }
    const parsed = new Date(text.replace(/\//g, "-"));
    if (!Number.isNaN(parsed.getTime())) {
      return dateToYmd(parsed);
    }
    return "";
  }

  function dateToYmd(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateToYm(date) {
    return dateToYmd(date).slice(0, 7);
  }

  function normalizeMonth(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(20\d{2})-(\d{1,2})/);
    if (!match) return "";
    const month = Number(match[2]);
    if (month < 1 || month > 12) return "";
    return `${match[1]}-${String(month).padStart(2, "0")}`;
  }

  function monthLabel(value) {
    const month = normalizeMonth(value) || dateToYm(new Date());
    const [year, monthNo] = month.split("-");
    return `${year} 年 ${Number(monthNo)} 月`;
  }

  function isInCurrentMonth(value) {
    return normalizeMonth(value) === state.currentMonth;
  }

  function parseAmount(value) {
    const text = cleanText(value);
    if (!text) return null;
    const normalized = text
      .replace(/[¥￥,\s]/g, "")
      .replace(/[()]/g, "")
      .replace(/元/g, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? round2(number) : null;
  }

  function parseOptionalAmount(value) {
    const parsed = parseAmount(value);
    return parsed === null ? null : parsed;
  }

  function splitKeywords(value) {
    return cleanText(value)
      .split(/[，,、\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeKeywords(keywords) {
    if (Array.isArray(keywords)) return keywords.map(normalizeText).filter(Boolean);
    return splitKeywords(keywords).map(normalizeText).filter(Boolean);
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function normalizeText(value) {
    return cleanText(value).toLowerCase().replace(/\s+/g, "");
  }

  function extractMerchant(summary) {
    return cleanText(summary)
      .replace(/^（特约）/, "")
      .replace(/^支付宝快捷--/, "")
      .replace(/^财付通快捷--/, "")
      .replace(/^支付宝--/, "")
      .replace(/^财付通--/, "")
      .replace(/^微信支付--/, "")
      .replace(/退货\d*$/, "")
      .replace(/退\d*$/, "")
      .trim();
  }

  function extractChannel(summary) {
    const text = cleanText(summary);
    if (text.startsWith("支付宝")) return "支付宝";
    if (text.startsWith("财付通") || text.includes("微信")) return "微信/财付通";
    if (text.includes("美团")) return "美团";
    return "";
  }

  function bestMemoryKeyword(tx) {
    const merchant = cleanText(tx.merchant);
    if (merchant && merchant !== "未识别") return merchant.slice(0, 28);
    const summary = extractMerchant(tx.summary || tx.purpose || "");
    return summary.slice(0, 28);
  }

  function isGenericKeyword(keyword) {
    const text = normalizeText(keyword);
    return ["微信转账", "微信支付", "支付宝", "支付宝-消费", "扫二维码付款", "快捷支付"].some((item) => text.includes(normalizeText(item)));
  }

  function amountRangeText(rule) {
    const parts = [];
    if (rule.minAmount !== null && rule.minAmount !== "") parts.push(`≥${money(rule.minAmount)}`);
    if (rule.maxAmount !== null && rule.maxAmount !== "") parts.push(`≤${money(rule.maxAmount)}`);
    return parts.length ? ` · ${parts.join(" ")}` : "";
  }

  function money(value) {
    return `¥${Number(value || 0).toLocaleString("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function percent(value, total) {
    if (!total) return "0.00%";
    return `${((Number(value) / total) * 100).toFixed(2)}%`;
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `tx-${(hash >>> 0).toString(16)}`;
  }

  function cryptoId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function detectInitialLocale() {
    const fromQuery = normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
    const fromStorage = normalizeLocale(readJson(STORAGE_KEYS.locale, ""));
    const fromBrowser = normalizeLocale(navigator.language);
    return fromQuery || fromStorage || fromBrowser || "zh-CN";
  }

  function normalizeLocale(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (SUPPORTED_LOCALES.includes(text)) return text;
    const lower = text.toLowerCase();
    if (lower.startsWith("zh")) return "zh-CN";
    if (lower.startsWith("en")) return "en";
    return "";
  }

  function switchLocale(value) {
    const locale = normalizeLocale(value) || "zh-CN";
    if (locale === state.locale) return;
    state.locale = locale;
    writeJson(STORAGE_KEYS.locale, state.locale);
    if (state.user) scheduleCloudUserStateSync();
    render();
  }

  function t(key, params = {}) {
    const dict = I18N[state.locale] || I18N["zh-CN"];
    const fallback = I18N["zh-CN"][key] || key;
    return String(dict[key] || fallback).replace(/\{(\w+)\}/g, (_, name) => {
      return params[name] ?? "";
    });
  }

  function applyI18n() {
    document.documentElement.lang = state.locale;
    document.title = t("seoTitle");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("seoDescription"));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("seoTitle"));
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", t("seoDescription"));
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", state.locale === "en" ? "en_US" : "zh_CN");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((node) => {
      const pairs = String(node.getAttribute("data-i18n-attr") || "").split(",");
      pairs.forEach((pair) => {
        const [attr, key] = pair.split(":").map((item) => item.trim());
        if (attr && key) node.setAttribute(attr, t(key));
      });
    });
    if (els.languageSelect && els.languageSelect.value !== state.locale) {
      els.languageSelect.value = state.locale;
    }
  }

  function ownerKeyForUser(user) {
    const id = user?.id || user?.email || user?.user_metadata?.email || "";
    if (id) return `user-${hashText(id)}`;
    return `guest-${guestId()}`;
  }

  function guestId() {
    let id = localStorage.getItem(STORAGE_KEYS.guestId);
    if (!id) {
      id = cryptoId();
      localStorage.setItem(STORAGE_KEYS.guestId, id);
    }
    return id;
  }

  function scopedStorageKey(kind, options = {}) {
    const ownerKey = options.ownerKey || state.storageOwnerKey || ownerKeyForUser(state.user);
    const monthSuffix = options.monthScoped ? `:${state.currentMonth || dateToYm(new Date())}` : "";
    return `familyFinance.${kind}.${STORAGE_VERSION}:${ownerKey}${monthSuffix}`;
  }

  function readScopedJson(kind, fallback, options = {}) {
    return readJson(scopedStorageKey(kind, options), fallback);
  }

  function writeScopedJson(kind, value, options = {}) {
    writeJson(scopedStorageKey(kind, options), value);
    if (state.cloudHydrating || options.ownerKey && options.ownerKey !== state.storageOwnerKey) return;
    if (options.monthScoped) {
      scheduleCloudLedgerSync();
    } else if (["rules", "daily", "memories", "fieldAliases"].includes(kind)) {
      scheduleCloudUserStateSync();
    }
  }

  function saveCurrentMonthTransactions(ownerKey = state.storageOwnerKey) {
    if (!state.currentMonth) return;
    writeScopedJson("transactions", state.transactions, {
      monthScoped: true,
      ownerKey,
    });
  }

  function canUseCloudSync() {
    return Boolean(supabaseClient && state.authReady && state.user?.id);
  }

  async function persistUploadedStatementFile(item) {
    if (!canUseCloudSync() || !item?.file) return null;
    if (item.storagePath) return true;

    const bucket = SUPABASE_STORAGE_BUCKETS.statementFiles;
    const userId = state.user.id;
    const originalName = item.name || item.file.name || "statement";
    const storagePath = `${userId}/${state.currentMonth}/${cryptoId()}-${storageSafeFileName(originalName)}`;
    const contentType = statementContentType(originalName);

    try {
      const uploadResult = await supabaseClient
        .storage
        .from(bucket)
        .upload(storagePath, item.file, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });

      if (uploadResult.error) throw uploadResult.error;

      const metaResult = await supabaseClient
        .from(SUPABASE_TABLES.uploadedFiles)
        .insert({
          user_id: userId,
          ledger_month: state.currentMonth,
          bucket_id: bucket,
          storage_path: storagePath,
          original_name: originalName,
          source_path: item.path || originalName,
          content_type: contentType,
          size_bytes: item.size || item.file.size || 0,
        });

      if (metaResult.error) throw metaResult.error;

      item.storagePath = storagePath;
      return true;
    } catch (error) {
      console.warn("Could not persist uploaded statement file:", error);
      item.storageError = error.message || "源文件保存失败";
      return false;
    }
  }

  function storageSafeFileName(name) {
    const base = fileBaseName(name)
      .normalize("NFKC")
      .replace(/[^\w.\-\u4e00-\u9fa5]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 120);
    return base || "statement";
  }

  function statementContentType(name) {
    const lower = String(name || "").toLowerCase();
    if (lower.endsWith(".csv")) return "text/csv";
    if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
    return "application/octet-stream";
  }

  async function apiHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (!supabaseClient) return headers;
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.warn("Could not attach auth token:", error);
    }
    return headers;
  }

  async function loadCloudUserData() {
    if (!canUseCloudSync()) return;
    const userId = state.user.id;
    const ownerKey = state.storageOwnerKey;
    state.cloudHydrating = true;

    try {
      const [userStateResult, ledgerResult] = await Promise.all([
        supabaseClient
          .from(SUPABASE_TABLES.userState)
          .select("rules,daily,memories,field_aliases,locale,updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseClient
          .from(SUPABASE_TABLES.monthlyLedgers)
          .select("transactions,import_summary,updated_at")
          .eq("user_id", userId)
          .eq("ledger_month", state.currentMonth)
          .maybeSingle(),
      ]);

      if (!canUseCloudSync() || state.user.id !== userId || state.storageOwnerKey !== ownerKey) return;

      if (userStateResult.error) throw userStateResult.error;
      if (ledgerResult.error) throw ledgerResult.error;

      if (userStateResult.data) {
        state.rules = normalizeRemoteArray(userStateResult.data.rules, defaultRules.slice());
        state.daily = normalizeRemoteArray(userStateResult.data.daily, []);
        state.memories = normalizeRemoteArray(userStateResult.data.memories, []);
        state.fieldAliases = isPlainObject(userStateResult.data.field_aliases) ? userStateResult.data.field_aliases : {};
        state.locale = normalizeLocale(userStateResult.data.locale) || state.locale;
        writeJson(STORAGE_KEYS.locale, state.locale);
        writeJson(scopedStorageKey("rules"), state.rules);
        writeJson(scopedStorageKey("daily"), state.daily);
        writeJson(scopedStorageKey("memories"), state.memories);
        writeJson(scopedStorageKey("fieldAliases"), state.fieldAliases);
      } else {
        await persistCloudUserStateNow();
      }

      if (ledgerResult.data) {
        state.transactions = normalizeRemoteArray(ledgerResult.data.transactions, []);
        state.importStatusMessage = "";
        state.importStatusAiResult = null;
        state.hasImportNotice = false;
        writeJson(scopedStorageKey("transactions", { monthScoped: true }), state.transactions);
      } else {
        await persistCloudLedgerNow();
        if (state.transactions.length) {
          state.importStatusMessage = "";
          state.importStatusAiResult = null;
          state.hasImportNotice = false;
        }
      }

      state.cloudSyncError = "";
      setDefaultDailyDate(true);
      render();
    } catch (error) {
      state.cloudSyncError = error.message || "云端同步暂不可用";
      console.warn("Supabase cloud sync failed:", error);
    } finally {
      state.cloudHydrating = false;
    }
  }

  function normalizeRemoteArray(value, fallback) {
    return Array.isArray(value) ? value : fallback;
  }

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function scheduleCloudUserStateSync() {
    if (!canUseCloudSync()) return;
    window.clearTimeout(cloudStateSyncTimer);
    cloudStateSyncTimer = window.setTimeout(() => {
      persistCloudUserStateNow();
    }, CLOUD_SYNC_DEBOUNCE_MS);
  }

  function scheduleCloudLedgerSync() {
    if (!canUseCloudSync()) return;
    window.clearTimeout(cloudLedgerSyncTimer);
    cloudLedgerSyncTimer = window.setTimeout(() => {
      persistCloudLedgerNow();
    }, CLOUD_SYNC_DEBOUNCE_MS);
  }

  async function persistCloudUserStateNow() {
    if (!canUseCloudSync()) return false;
    try {
      const { error } = await supabaseClient
        .from(SUPABASE_TABLES.userState)
        .upsert({
          user_id: state.user.id,
          rules: state.rules,
          daily: state.daily,
          memories: state.memories,
          field_aliases: state.fieldAliases || {},
          locale: document.documentElement.lang || "zh-CN",
        }, { onConflict: "user_id" });
      if (error) throw error;
      state.cloudSyncError = "";
      return true;
    } catch (error) {
      state.cloudSyncError = error.message || "用户规则同步失败";
      console.warn("Supabase user state sync failed:", error);
      return false;
    }
  }

  async function persistCloudLedgerNow() {
    if (!canUseCloudSync() || !state.currentMonth) return false;
    try {
      const { error } = await supabaseClient
        .from(SUPABASE_TABLES.monthlyLedgers)
        .upsert({
          user_id: state.user.id,
          ledger_month: state.currentMonth,
          transactions: state.transactions,
          import_summary: {
            transaction_count: state.transactions.length,
            source_count: new Set(state.transactions.map((tx) => tx.sourceName).filter(Boolean)).size,
            updated_from: "browser",
          },
        }, { onConflict: "user_id,ledger_month" });
      if (error) throw error;
      state.cloudSyncError = "";
      return true;
    } catch (error) {
      state.cloudSyncError = error.message || "月度账本同步失败";
      console.warn("Supabase monthly ledger sync failed:", error);
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { strokeWidth: 2 } });
    }
  }
})();
