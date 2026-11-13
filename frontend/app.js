/* Farm Studio web app. Talks to the FastAPI backend under /api. */
(() => {
"use strict";

/* ================= i18n ================= */
const T = {
appName:["Farm Studio","فارم ستوديو"],
tagline:["Plan water, spraying, frost defence and harvest from NASA Earth data, played like a farm game.","خطّط للري ورش المبيدات والحماية من الصقيع والحصاد اعتمادًا على بيانات ناسا لرصد الأرض، بأسلوب لعبة مزرعة."],
langBtn:["عربي","English"],
signIn:["Sign in","تسجيل الدخول"],createAccount:["Create account","إنشاء حساب"],yourName:["Your name","اسمك"],
email:["E-mail","البريد الإلكتروني"],password:["Password (8+ characters)","كلمة المرور (8 أحرف أو أكثر)"],
stepOf:["Step {n} of 3","الخطوة {n} من 3"],
ob1Title:["Draw your field","ارسم حدود أرضك"],
ob1Sub:["Tap the map at each corner of your field. Zoom in close for accuracy.","اضغط على الخريطة عند كل زاوية من زوايا أرضك. كبّر الخريطة للدقة."],
useLoc:["My location","موقعي"],undo:["Undo corner","تراجع"],clear:["Clear","مسح"],
area:["Field area","مساحة الأرض"],areaDunum:["Area in dunums","المساحة بالدونم"],
noCorners:["Can't see your field? Make a square from the area instead","لا ترى أرضك؟ أنشئ مربعًا من المساحة بدلًا من ذلك"],
makeSquare:["Make a square around the map centre","أنشئ مربعًا حول مركز الخريطة"],
cornersN:["{n} corners. Add at least 3.","{n} زوايا. أضف 3 على الأقل."],cornersOk:["{n} corners. Tap Next when the shape matches your field.","{n} زوايا. اضغط التالي عندما يطابق الشكل أرضك."],
locFail:["Location is not available. Pan the map to your field instead.","الموقع غير متاح. حرّك الخريطة إلى أرضك بدلًا من ذلك."],
dunum:["dunum","دونم"],dunums:["dunums","دونم"],hectare:["ha","هكتار"],
ob2Title:["About your farm","معلومات مزرعتك"],ob2Sub:["Only what we use to build your plan.","فقط ما نحتاجه لبناء خطتك."],
plotName:["Plot name","اسم القطعة"],required:["required","مطلوب"],choose:["Choose…","اختر…"],soil:["Soil type","نوع التربة"],
soilAuto:["Not sure: look it up (SoilGrids)","لا أعرف: ابحث عنها (SoilGrids)"],soilLoam:["Loam","طميية"],soilClay:["Clay","طينية"],soilSandy:["Sandy","رملية"],soilCalc:["Calcareous","كلسية"],
errName:["Give the plot a name.","أعطِ القطعة اسمًا."],errSoil:["Pick a soil type, or “Not sure”.","اختر نوع التربة، أو «لا أعرف»."],
errWater:["Irrigated farms need the weekly water you have (m³).","المزارع المروية تحتاج كمية المياه الأسبوعية المتاحة (م³)."],errBudget:["Enter a budget above 0 JOD.","أدخل ميزانية أكبر من 0 دينار."],
farmType:["Farm type","نوع الزراعة"],rainfed:["Rain-fed","بعلية"],irrigated:["Irrigated","مروية"],both:["Both","كلاهما"],
waterAvail:["Water available (m³ per week)","المياه المتاحة (م³ أسبوعيًا)"],budget:["Budget per season (JOD)","الميزانية لكل موسم (دينار)"],
prevCrops:["Grown here last season (optional)","زُرع هنا الموسم الماضي (اختياري)"],keepCrops:["Crops you must keep","محاصيل يجب الحفاظ عليها"],
priority:["What matters most","الأولوية"],priWater:["Water","المياه"],priSoil:["Soil","التربة"],priCost:["Cost","التكلفة"],
next:["Next","التالي"],back:["Back","رجوع"],analyze:["Analyze my land","حلّل أرضي"],createPlot:["Create my farm","أنشئ مزرعتي"],
ob3Load:["Reading your land from space","نقرأ أرضك من الفضاء"],ob3LoadSub:["This takes up to a minute.","قد يستغرق ذلك حتى دقيقة."],
ob3Done:["Your land, from space","أرضك من الفضاء"],ob3DoneSub:["Measured for your exact field.","مقاسة لأرضك تحديدًا."],
landProfile:["Land profile","ملف الأرض"],recCrops:["Best crops here","أفضل المحاصيل هنا"],
pickCrops:["Tick the crops to put on your farm. You can add more later.","اختر المحاصيل لمزرعتك. يمكنك إضافة المزيد لاحقًا."],
pickOne:["Tick at least one crop.","اختر محصولًا واحدًا على الأقل."],
creating:["Building your farm…","نبني مزرعتك…"],retry:["Try again","حاول مجددًا"],
rp:["RP","نقطة"],resilience:["Grade","التقييم"],
tFarm:["Farm","المزرعة"],tPlan:["Plan","الخطة"],tSpray:["Spray","الرش"],tAlerts:["Risks","المخاطر"],tMore:["More","المزيد"],
refresh:["Refresh","تحديث"],loading:["Loading live data…","تحميل البيانات الحية…"],
tapToPlant:["Tap to plant","اضغط للزراعة"],readyN:["Ready","جاهز"],needsWater:["Needs water","يحتاج ري"],harvestOn:["Harvest {d}","الحصاد {d}"],
pickSpot:["Green = best spot. Tap a square to plant {c}.","الأخضر = أفضل مكان. اضغط مربعًا لزراعة {c}."],
water:["Water","ري"],sickle:["Sickle","المنجل"],topo:["Terrain","التضاريس"],
topoHint:["Blue squares sit lowest in your field: cold air and water collect there.","المربعات الزرقاء هي الأخفض: يتجمع فيها الهواء البارد والماء."],
waterHint:["Tap a square with a drop to log watering.","اضغط مربعًا عليه قطرة لتسجيل الري."],
dragHint:["Drag across golden squares to harvest","اسحب فوق المربعات الذهبية للحصاد"],
outside:["Outside your field boundary","خارج حدود أرضك"],
plantTitle:["Plant {c}","زراعة {c}"],plantedOn:["Planting date","تاريخ الزراعة"],
plantHelpAnnual:["Today if you are planting now, or the real date if it is already in the ground.","اليوم إذا كنت تزرع الآن، أو التاريخ الحقيقي إذا كان مزروعًا."],
plantHelpTree:["For existing trees or vines, enter the year they were planted.","للأشجار أو الكروم الموجودة، أدخل سنة زراعتها."],
plantBtn:["Plant","ازرع"],suit:["Suitability","الملاءمة"],
holdOff:["Hold off! Rain is coming","انتظر! المطر قادم"],
holdOffBody:["{mm} mm of useful rain is forecast in the next 48 hours. Skipping this watering saves about {m} m³.","يتوقع هطول {mm} ملم من المطر المفيد خلال 48 ساعة. تأجيل هذا الري يوفر حوالي {m} م³."],
waitRain:["Wait for rain","انتظر المطر"],waterAnyway:["Water anyway","اسقِ على أي حال"],
waterTitle:["Log watering","تسجيل الري"],waterBody:["Soil water is at {p}%. Apply about {mm} mm ({m} m³) to refill the root zone.","ماء التربة عند {p}%. أضف حوالي {mm} ملم ({m} م³) لملء منطقة الجذور."],
waterDone:["I watered {mm} mm","سقيت {mm} ملم"],mmLabel:["Amount (mm)","الكمية (ملم)"],
noNeed:["No square needs water right now.","لا يوجد مربع يحتاج ري الآن."],
harvestDates:["Harvest dates","مواعيد الحصاد"],
sickleHow:["Press and hold the sickle, then drag it across golden squares to log the harvest.","اضغط مطولًا على المنجل ثم اسحبه فوق المربعات الذهبية لتسجيل الحصاد."],
readyNow:["Ready now","جاهز الآن"],nothingPlanted:["Nothing planted yet.","لا يوجد شيء مزروع بعد."],
squareN:["Square {c}{r}","المربع {c}{r}"],emptySquare:["Empty","فارغ"],
stage:["Stage","المرحلة"],soilWater:["Soil water left","ماء التربة المتبقي"],nextWater:["Next watering","الري القادم"],
dormant:["Dormant (no irrigation)","سكون (بدون ري)"],now:["Now","الآن"],
ndvi:["NDVI (MODIS)","NDVI (MODIS)"],elev:["Elevation","الارتفاع"],slope:["Slope","الانحدار"],nightLst:["Night surface temp (ECOSTRESS)","حرارة السطح ليلًا (ECOSTRESS)"],
lowSpot:["Low spot","منطقة منخفضة"],bestFor:["Best for","الأنسب لـ"],
close:["Close","إغلاق"],cancel:["Cancel","إلغاء"],
seeWhat:["What to do","ماذا أفعل"],
rainIn:["Rain in {h} h","مطر خلال {h} س"],noRain:["No rain 48 h","لا مطر 48 س"],
calendar:["Crop calendar","تقويم المحاصيل"],lgPlant:["Plant","زراعة"],lgGrow:["Growing","نمو"],lgHarv:["Harvest","حصاد"],lgNow:["This month","هذا الشهر"],
calFrom:["From NASA POWER climatology {p}.","من مناخ NASA POWER للفترة {p}."],
last30:["Last 30 days vs normal (NASA POWER)","آخر 30 يومًا مقارنة بالمعتاد (NASA POWER)"],
waterWeek:["Water this week","مياه هذا الأسبوع"],need:["Crops need","تحتاج المحاصيل"],avail:["You have","المتاح لديك"],
overBudget:["You are {m} m³ short this week. Prioritise fruiting crops and water at dawn.","ينقصك {m} م³ هذا الأسبوع. أعطِ الأولوية للمحاصيل المثمرة واسقِ فجرًا."],
inBudget:["Within your water, with {m} m³ to spare.","ضمن المياه المتاحة، ويتبقى {m} م³."],
seedBank:["Seed bank","بنك البذور"],gradeWhy:["{n} crop types growing, {d} drought-tolerant.","{n} أنواع محاصيل مزروعة، {d} منها تتحمل الجفاف."],
trendTitle:["Climate trend {y}","اتجاه المناخ {y}"],
trendBody:["Rain {r}% per decade, temperature {t} °C per decade (NASA POWER).","الأمطار {r}% لكل عقد، الحرارة {t} °م لكل عقد (NASA POWER)."],
suggest:["Suggested for this climate","مقترح لهذا المناخ"],addCrop:["Add to my crops","أضف إلى محاصيلي"],
ndviTitle:["Vegetation (MODIS NDVI)","الغطاء النباتي (MODIS NDVI)"],smapTitle:["Root-zone moisture (SMAP)","رطوبة منطقة الجذور (SMAP)"],
noSat:["Satellite layers are not ready yet. They arrive from NASA AppEEARS within a few hours.","طبقات الأقمار الصناعية غير جاهزة بعد. تصل من NASA AppEEARS خلال ساعات."],
sprayTitle:["Safe-spray window","نافذة الرش الآمن"],spraySub:["Next 3 days, from the hourly forecast. Tap a green slot to book.","الأيام الثلاثة القادمة من التوقعات كل ساعة. اضغط خانة خضراء للحجز."],
drone:["Drone","طائرة مسيّرة"],tractor:["Tractor","جرار"],backpack:["Backpack","رشاشة ظهر"],
lgSafe:["Safe","آمن"],lgCaution:["Caution","حذر"],lgNo:["Do not spray","لا ترش"],
locked:["Locked: {why}.","مقفل: {why}."],caution:["Possible, but {why}. Tap again to book anyway.","ممكن، لكن {why}. اضغط مرة أخرى للحجز."],
booked:["Your bookings","حجوزاتك"],today:["Today","اليوم"],
alertsTitle:["Weather risks","مخاطر الطقس"],alertsSub:["Warnings for the next 7 days. Tick each step as you do it in the field.","تحذيرات للأيام السبعة القادمة. علّم كل خطوة عند تنفيذها في الحقل."],
noAlerts:["No frost, heatwave, heavy rain or strong wind in the next 7 days.","لا صقيع ولا موجة حر ولا أمطار غزيرة ولا رياح قوية خلال 7 أيام."],
done:["Done","تم"],resolved:["Prepared","تم الاستعداد"],inDays:["in {n} days","بعد {n} أيام"],tonight:["today","اليوم"],
language:["Language","اللغة"],myPlots:["My plots","قطعي"],addPlot:["Add a plot","إضافة قطعة"],deletePlot:["Delete this plot","حذف هذه القطعة"],
confirmDelete:["Delete “{n}” and all its history? This cannot be undone.","حذف «{n}» وكل سجله؟ لا يمكن التراجع."],yesDelete:["Delete","حذف"],
dataSources:["Data sources","مصادر البيانات"],satellite:["NASA satellite layers","طبقات الأقمار الصناعية"],satRefresh:["Request fresh satellite data","اطلب بيانات أقمار جديدة"],
history:["Activity","السجل"],signOut:["Sign out","تسجيل الخروج"],replay:["Replay tutorial","إعادة الشرح"],
about:["Numbers come from live NASA and weather services for your field. Recommendations follow FAO-56 and should be checked with your agricultural extension officer.","الأرقام من خدمات ناسا والطقس الحية لأرضك. التوصيات مبنية على FAO-56 ويُفضّل مراجعتها مع المرشد الزراعي."],
satStatus:{done:["Up to date","محدّثة"],submitted:["Requested from NASA","طُلبت من ناسا"],queued:["Queued at NASA","في الانتظار لدى ناسا"],pending:["Queued at NASA","في الانتظار لدى ناسا"],processing:["NASA is processing","ناسا تعالج الطلب"],error:["Error","خطأ"],not_configured:["Server has no Earthdata login","لا يوجد حساب Earthdata على الخادم"],not_started:["Not requested yet","لم تُطلب بعد"],deleted:["Expired, re-requesting","انتهت، يُعاد الطلب"]},
c1t:["Your crops","محاصيلك"],c1b:["Tap a crop. The best squares for it light up green, from soil, terrain and climate.","اضغط على محصول. تضيء أفضل المربعات له بالأخضر، حسب التربة والتضاريس والمناخ."],
c2t:["Your field","أرضك"],c2b:["Each square is a part of your real field. A drop means the soil water model says it needs water today.","كل مربع جزء من أرضك الحقيقية. القطرة تعني أن نموذج ماء التربة يقول إنه يحتاج ري اليوم."],
c3t:["The sickle","المنجل"],c3b:["Tap for harvest dates. Press and hold, then drag over golden squares to log a harvest.","اضغط لمواعيد الحصاد. اضغط مطولًا ثم اسحب فوق المربعات الذهبية لتسجيل الحصاد."],
c4t:["Risks","المخاطر"],c4b:["Frost, heavy rain, heat and wind warnings, with what to do in the field.","تحذيرات الصقيع والأمطار والحر والرياح، مع ما يجب فعله في الحقل."],
c5t:["Resilience Points","نقاط المرونة"],c5b:["Earned for climate-smart choices: waiting for rain, safe spraying, preparing for frost.","تُكسب على القرارات الذكية مناخيًا: انتظار المطر، الرش الآمن، الاستعداد للصقيع."],
skip:["Skip","تخطي"],gotIt:["Start farming","ابدأ الزراعة"],
netErr:["Can't reach the server. Check your connection and try again.","تعذّر الوصول إلى الخادم. تحقق من الاتصال وحاول مجددًا."],
months:[["J","F","M","A","M","J","J","A","S","O","N","D"],["ك٢","ش","آذ","ني","أي","حز","تم","آب","أي","ت١","ت٢","ك١"]],
};
let LANG = "en";
const t = (k, v) => { const e = T[k]; let s = e ? e[LANG === "ar" ? 1 : 0] ?? e[0] : k; if (v) for (const x in v) s = String(s).replaceAll("{" + x + "}", v[x]); return s; };
const L = o => o ? (o[LANG] ?? o.en ?? "") : "";
const loc = () => LANG === "ar" ? "ar-JO-u-nu-latn" : "en-GB";
const fmtDate = s => s ? new Date(s + (s.length === 10 ? "T12:00:00" : "")).toLocaleDateString(loc(), { day: "numeric", month: "short", year: (new Date(s).getFullYear() !== new Date().getFullYear()) ? "numeric" : undefined }) : "–";
const fmtNum = (n, d = 0) => n == null ? "–" : Number(n).toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };

function applyI18n() {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  $$("[data-t]").forEach(e => e.textContent = t(e.dataset.t));
}

/* ================= API ================= */
let TOKEN = store.get("fs_token");
class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
async function api(path, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch("/api" + path, { method, headers: { "Content-Type": "application/json", ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new ApiError(t("netErr"), 0); }
  let data = null; try { data = await r.json(); } catch {}
  if (r.status === 401 && path !== "/auth/login") { signOut(); throw new ApiError(data?.detail || "Signed out", 401); }
  if (!r.ok) {
    let d = data?.detail;
    if (Array.isArray(d)) d = d.map(x => (x.loc ? x.loc.slice(-1)[0] + ": " : "") + x.msg).join("; ");
    throw new ApiError(d || ("HTTP " + r.status), r.status);
  }
  return data;
}

/* ================= state ================= */
const S = { user: null, crops: {}, plots: [], plotId: null, state: null, sel: null, tool: null, topo: false, tab: "farm", plan: null, spray: null, alerts: null, sprayTool: "tractor", pendingY: null };
const P = () => S.state;
const tileById = id => P()?.tiles.find(x => x.id === id);
const cName = id => S.crops[id] ? (LANG === "ar" ? S.crops[id].ar : S.crops[id].en) : id;

/* ================= crop sprites ================= */
function drawCrop(g, id, x, y, s, stage) {
  const C = S.crops[id] || { shape: "bush", color: "#4E8E2E" };
  const st = Math.max(0, stage), k = .45 + .55 * Math.min(st, 3) / 3, ripe = st >= 4;
  const leaf = ripe ? "#8FB33A" : "#4E8E2E", leaf2 = ripe ? "#B9C64A" : "#6DAE3C";
  g.save(); g.translate(x, y); g.scale(s, s);
  const blob = (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, Math.max(.1, r), 0, 7); g.fill(); };
  const fruit = ripe ? C.color : st >= 3 ? "#C9B04A" : "#9CC35A";
  switch (C.shape) {
    case "vine_trellis":
      g.strokeStyle = "#6B4A2B"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-13, 2); g.lineTo(-13, -24); g.moveTo(13, 2); g.lineTo(13, -24); g.stroke();
      g.lineWidth = 1.2; g.beginPath(); g.moveTo(-15, -20); g.lineTo(15, -20); g.stroke();
      for (let i = -1; i <= 1; i++) { blob(i * 10, -21 * k, 7 * k, leaf); blob(i * 10 + 4, -24 * k, 5 * k, leaf2); }
      if (st >= 3) for (let i = -1; i <= 1; i++) for (let j = 0; j < 4; j++) blob(i * 10 + (j % 2 ? 2 : -2), -12 + j * 2.4, 2.6, ripe ? C.color : "#9DBB5A");
      break;
    case "tomato":
      blob(0, -9 * k, 11 * k, leaf); blob(-6, -13 * k, 7 * k, leaf2); blob(6, -12 * k, 7 * k, leaf2);
      if (st >= 2) { blob(-5, -7, 3.6, fruit); blob(5, -10, 3.6, fruit); blob(1, -15, 3.4, fruit); }
      break;
    case "tree":
      g.fillStyle = "#6B4A2B"; g.fillRect(-2, -14 * k, 4, 14 * k);
      blob(0, -22 * k, 13 * k, "#7C8F55"); blob(-7, -18 * k, 8 * k, "#93A46A"); blob(7, -19 * k, 8 * k, "#6E8248");
      if (st >= 3) [[-5, -20], [4, -24], [7, -17], [-2, -27]].forEach(p => blob(p[0] * k, p[1] * k, 2.2, fruit));
      break;
    case "palm":
      g.strokeStyle = "#8A6238"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -30 * k); g.stroke();
      g.strokeStyle = leaf; g.lineWidth = 3; g.lineCap = "round";
      for (let a = 0; a < 7; a++) { const an = Math.PI + a * Math.PI / 6; g.beginPath(); g.moveTo(0, -30 * k); g.quadraticCurveTo(Math.cos(an) * 12 * k, -38 * k, Math.cos(an) * 20 * k, -22 * k - Math.abs(Math.sin(an)) * 6 * k); g.stroke(); }
      if (st >= 3) { blob(-3, -26 * k, 3, fruit); blob(3, -25 * k, 3, fruit); }
      break;
    case "vine":
      for (let i = -1; i <= 1; i++) { blob(i * 9, -5 * k, 7 * k, leaf); blob(i * 9 + 3, -8 * k, 4.5 * k, leaf2); }
      if (st >= 2) { g.fillStyle = fruit; g.beginPath(); g.ellipse(-4, -3, id === "watermelon" ? 6 : 6, id === "watermelon" ? 4.5 : 2.4, .3, 0, 7); g.fill(); g.beginPath(); g.ellipse(7, -4, 6, id === "watermelon" ? 4.5 : 2.4, -.3, 0, 7); g.fill(); }
      break;
    case "grain": case "stalk": {
      g.strokeStyle = ripe && C.shape === "grain" ? "#C9A23F" : "#5C9A35"; g.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) { const h = (20 + ((i * 7) & 3) * 2) * k; g.beginPath(); g.moveTo(i * 5, 0); g.lineTo(i * 5 + 1, -h); g.stroke();
        g.fillStyle = C.shape === "stalk" ? (st >= 3 ? C.color : "#7DB24A") : (ripe ? C.color : "#93BD4F");
        g.beginPath(); g.ellipse(i * 5 + 1, -h - 3 * k, C.shape === "stalk" ? 2.4 : (id === "sorghum" ? 3.4 : 2.2), (C.shape === "stalk" ? 3 : 6) * k, 0, 0, 7); g.fill(); }
      break; }
    default: // bush
      blob(-6, -6 * k, 7 * k, leaf); blob(5, -7 * k, 8 * k, leaf2); blob(0, -11 * k, 7 * k, leaf);
      if (st >= 3) { blob(-5, -4, 2.4, fruit); blob(6, -6, 2.4, fruit); blob(0, -10, 2.2, fruit); }
  }
  g.restore();
}
function cropIcon(cv, id, stage = 3) {
  const d = devicePixelRatio || 1, w = cv.clientWidth || 44; cv.width = w * d; cv.height = w * d;
  const g = cv.getContext("2d"); g.scale(d, d); g.fillStyle = css("--soil"); g.beginPath(); g.ellipse(w / 2, w * .8, w * .36, w * .12, 0, 0, 7); g.fill();
  drawCrop(g, id, w / 2, w * .8, w / 44 * 1.05, stage);
}
const paintIcons = root => (root || document).querySelectorAll("canvas[data-icon]").forEach(c => cropIcon(c, c.dataset.icon, c.dataset.st ? +c.dataset.st : 3));

/* ================= farm canvas ================= */
const cv = $("#farmCanvas"), g = cv.getContext("2d");
let W = 0, H = 0, TW = 60, TH = 30, ox = 0, oy = 0, D = 14, N = 6;
const fx = []; let dragTile = null;
function sizeFarm() {
  const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height; if (!W || !H) return;
  cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
  const sb = 96, avail = Math.max(160, W - sb - 16);
  TW = Math.max(20, Math.min(avail / (N + 1.2), (H - 90) / (N + 1.4) * 2, 92)); TH = TW / 2; D = TW * .28;
  ox = (W - sb) / 2 + 4; oy = Math.max(40, (H - (N + 2) * TH - D) / 2 + TH * .6);
}
const tp = (c, r) => ({ x: ox + (c - r) * TW / 2, y: oy + (c + r) * TH / 2 });
function pick(px, py) { if (!P()) return null; const a = (px - ox) / (TW / 2), b = (py - oy) / (TH / 2); const c = Math.floor((a + b) / 2), r = Math.floor((b - a) / 2); if (c < 0 || r < 0 || c >= N || r >= N) return null; return P().tiles.find(x => x.c === c && x.r === r) || null; }
function diamond(x, y, w, h) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 2, y + h / 2); g.lineTo(x, y + h); g.lineTo(x - w / 2, y + h / 2); g.closePath(); }
function shade(hex, f) { const n = parseInt(hex.replace("#", ""), 16); const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); return `rgb(${m(n >> 16)},${m(n >> 8 & 255)},${m(n & 255)})`; }
const stageOf = tl => tl.planting ? tl.planting.stage : -1;
const ready = tl => !!(tl.planting && tl.planting.ready);
const thirsty = tl => !!(tl.planting?.water?.needs_water && !tl.planting.water.waiting_for_rain);
const waiting = tl => !!tl.planting?.water?.waiting_for_rain;

function drawFarm(now) {
  const st = P(); if (!st || !W) return; g.clearRect(0, 0, W, H);
  const rainSoon = (st.weather?.rain_next48_mm || 0) >= 1;
  if (rainSoon) { [{ x: .1, y: .12, s: 1 }, { x: .6, y: .2, s: .8 }].forEach(cl => { const x = ((cl.x + now * .000012 * cl.s) % 1.3 - .15) * W, y = cl.y * H; g.fillStyle = "rgba(255,255,255,.85)"; [[0, 0, 18], [16, -6, 22], [34, 0, 16], [16, 4, 18]].forEach(b => { g.beginPath(); g.arc(x + b[0] * cl.s, y + b[1] * cl.s, b[2] * cl.s, 0, 7); g.fill(); }); }); }
  const grass = css("--grass"), gdk = css("--grass-dk"), soil = css("--soil"), sdk = css("--soil-dk");
  const T0 = tp(-1, -1), R0 = tp(N + 1, -1), B0 = tp(N + 1, N + 1), L0 = tp(-1, N + 1);
  g.fillStyle = sdk; g.beginPath(); g.moveTo(L0.x, L0.y); g.lineTo(B0.x, B0.y); g.lineTo(B0.x, B0.y + D); g.lineTo(L0.x, L0.y + D); g.fill();
  g.fillStyle = shade(sdk, -.2); g.beginPath(); g.moveTo(B0.x, B0.y); g.lineTo(R0.x, R0.y); g.lineTo(R0.x, R0.y + D); g.lineTo(B0.x, B0.y + D); g.fill();
  g.fillStyle = grass; g.beginPath(); g.moveTo(T0.x, T0.y); g.lineTo(R0.x, R0.y); g.lineTo(B0.x, B0.y); g.lineTo(L0.x, L0.y); g.closePath(); g.fill(); g.strokeStyle = gdk; g.lineWidth = 2; g.stroke();
  { const b = tp(-1, -1), s = TW / 60; g.save(); g.translate(b.x, b.y + TH * .55); g.scale(s, s);
    g.fillStyle = "#B8452F"; g.beginPath(); g.moveTo(-16, 0); g.lineTo(0, 8); g.lineTo(0, -14); g.lineTo(-16, -22); g.fill();
    g.fillStyle = "#97351F"; g.beginPath(); g.moveTo(0, 8); g.lineTo(16, 0); g.lineTo(16, -22); g.lineTo(0, -14); g.fill();
    g.fillStyle = "#5A3A28"; g.beginPath(); g.moveTo(-18, -21); g.lineTo(-2, -38); g.lineTo(18, -21); g.lineTo(0, -13); g.fill();
    g.fillStyle = "#F4E6C8"; g.fillRect(4, -8, 7, 10); g.restore(); }
  const inset = .86, sel = S.sel;
  st.tiles.forEach(tl => {
    const q = tp(tl.c, tl.r), y0 = q.y + TH * (1 - inset) / 2;
    if (!tl.inside) { g.fillStyle = shade(grass, -.06); diamond(q.x, y0, TW * inset, TH * inset); g.fill(); return; }
    const w = tl.planting?.water; const wet = w ? Math.max(0, Math.min(1, w.available_pct / 100)) : .5;
    g.fillStyle = shade(sdk, -.1); diamond(q.x, y0 + 3, TW * inset, TH * inset); g.fill();
    g.fillStyle = tl.planting ? shade(soil, -.35 * wet) : shade(soil, .1); diamond(q.x, y0, TW * inset, TH * inset); g.fill();
    g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 1;
    for (let i = 1; i < 4; i++) { const f = i / 4; g.beginPath(); g.moveTo(q.x - TW * inset / 2 + TW * inset / 2 * f, q.y + TH / 2 - TH * inset / 2 * f); g.lineTo(q.x + TW * inset / 2 * f, q.y + TH / 2 + TH * inset / 2 * (1 - f)); g.stroke(); }
    if (S.topo && tl.low) { g.fillStyle = "rgba(47,127,181,.5)"; diamond(q.x, y0, TW * inset, TH * inset); g.fill(); }
    if (sel && !tl.planting) { const s = tl.suitability?.[sel] ?? 0; if (s >= 55) { g.fillStyle = s >= 75 ? "rgba(80,200,70,.55)" : "rgba(240,200,60,.5)"; diamond(q.x, y0, TW * inset, TH * inset); g.fill(); if (s >= 75) { g.strokeStyle = "rgba(255,255,255," + (.6 + .4 * Math.sin(now / 250)) + ")"; g.lineWidth = 2; g.stroke(); } } }
    if (dragTile === tl) { g.strokeStyle = "#fff"; g.lineWidth = 2.5; diamond(q.x, y0, TW * inset, TH * inset); g.stroke(); }
  });
  [...st.tiles].sort((a, b) => (a.c + a.r) - (b.c + b.r)).forEach(tl => { if (!tl.planting) return; const q = tp(tl.c, tl.r), s = stageOf(tl);
    if (s >= 4) { g.fillStyle = "rgba(233,180,60,.35)"; diamond(q.x, q.y + TH * .07, TW * .86, TH * .86); g.fill(); }
    drawCrop(g, tl.planting.crop, q.x, q.y + TH * .62, TW / 52, s); });
  const bob = matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : Math.sin(now / 300) * 2.5;
  st.tiles.forEach(tl => { const q = tp(tl.c, tl.r), ix = q.x, iy = q.y - TH * .55 + bob, R = Math.max(9, TW * .17);
    let kind = null; if (thirsty(tl)) kind = "w"; else if (waiting(tl)) kind = "c"; else if (ready(tl) && S.tool === "sickle") kind = "h"; if (!kind) return;
    g.fillStyle = css("--surface"); g.beginPath(); g.arc(ix, iy, R, 0, 7); g.fill(); g.strokeStyle = kind === "w" ? css("--water") : kind === "h" ? css("--sun") : "#8AA"; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.moveTo(ix - 3, iy + R - 1); g.lineTo(ix, iy + R + 5); g.lineTo(ix + 3, iy + R - 1); g.fillStyle = css("--surface"); g.fill();
    if (kind === "w") { g.fillStyle = css("--water"); g.beginPath(); g.moveTo(ix, iy - R * .6); g.quadraticCurveTo(ix + R * .55, iy + R * .05, ix, iy + R * .5); g.quadraticCurveTo(ix - R * .55, iy + R * .05, ix, iy - R * .6); g.fill(); }
    else if (kind === "c") { g.fillStyle = "#8FA6B5"; [[-3, 1, 4], [2, -1, 5], [5, 2, 3.5]].forEach(b => { g.beginPath(); g.arc(ix + b[0] * R / 9, iy + b[1] * R / 9, b[2] * R / 9, 0, 7); g.fill(); }); }
    else { g.strokeStyle = css("--sun"); g.lineWidth = 2.4; g.beginPath(); g.arc(ix + 1, iy + 1, R * .5, Math.PI * 1.1, Math.PI * 1.95); g.stroke(); } });
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i], a = (now - f.t) / 1100; if (a > 1) { fx.splice(i, 1); continue; }
    g.globalAlpha = 1 - a; g.font = "800 15px " + css("--f-display"); g.textAlign = "center"; g.fillStyle = f.col; g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 3; g.strokeText(f.s, f.x, f.y - a * 30); g.fillText(f.s, f.x, f.y - a * 30); g.globalAlpha = 1; }
}
function floatAt(tileId, s, col) { const tl = tileById(tileId); if (!tl) return; const q = tp(tl.c, tl.r); fx.push({ x: q.x, y: q.y, s, col: col || "#FFD45A", t: performance.now() }); }

/* welcome sprite scene (decorative) */
const wcv = $("#welcomeCanvas"), wg = wcv.getContext("2d");
function drawWelcome(now) {
  const d = devicePixelRatio || 1, r = wcv.getBoundingClientRect(); if (r.width < 40 || r.height < 60) return;
  if (wcv.width !== Math.round(r.width * d) || wcv.height !== Math.round(r.height * d)) { wcv.width = r.width * d; wcv.height = r.height * d; }
  wg.setTransform(d, 0, 0, d, 0, 0); wg.clearRect(0, 0, r.width, r.height);
  const w = r.width, h = r.height, tw = Math.min(w / 7.5, (h - 30) / 4.2, 70), th = tw / 2, cx = w / 2, cy = Math.max(20, (h - 4 * th * 1.9) / 2 + 10), M = 4;
  const tpt = (c, rr) => ({ x: cx + (c - rr) * tw / 2, y: cy + (c + rr) * th / 2 });
  const T0 = tpt(-.5, -.5), R0 = tpt(M + .5, -.5), B0 = tpt(M + .5, M + .5), L0 = tpt(-.5, M + .5), dd = tw * .3;
  wg.fillStyle = css("--soil-dk"); wg.beginPath(); wg.moveTo(L0.x, L0.y); wg.lineTo(B0.x, B0.y); wg.lineTo(R0.x, R0.y); wg.lineTo(R0.x, R0.y + dd); wg.lineTo(B0.x, B0.y + dd); wg.lineTo(L0.x, L0.y + dd); wg.fill();
  wg.fillStyle = css("--grass"); wg.beginPath(); wg.moveTo(T0.x, T0.y); wg.lineTo(R0.x, R0.y); wg.lineTo(B0.x, B0.y); wg.lineTo(L0.x, L0.y); wg.fill();
  const crops = ["grape", "grape", "tomato", "olive", "grape", "date", "tomato", "wheat", "olive", "grape", "cucumber", "grape", "tomato", "sorghum", "olive", "citrus"];
  for (let i = 0; i < 16; i++) { const q = tpt(i % 4, i >> 2); wg.fillStyle = css("--soil"); wg.beginPath(); wg.moveTo(q.x, q.y + th * .08); wg.lineTo(q.x + tw * .43, q.y + th / 2); wg.lineTo(q.x, q.y + th * .92); wg.lineTo(q.x - tw * .43, q.y + th / 2); wg.fill(); }
  if (!Object.keys(S.crops).length) return;
  for (let s = 0; s <= 6; s++) for (let i = 0; i < 16; i++) { const c = i % 4, rr = i >> 2; if (c + rr !== s) continue; const q = tpt(c, rr); drawCrop(wg, crops[i], q.x, q.y + th * .62, tw / 52, i % 3 === 0 ? 4 : Math.max(2, (i * 5 + Math.floor(now / 1400)) % 5)); }
}
function loop(now) {
  requestAnimationFrame(loop);
  try {
    if (!$("#scr-main").hidden && S.tab === "farm") { if (cv.clientWidth && Math.abs(cv.clientWidth - W) > 1) sizeFarm(); drawFarm(now); }
    if (!$("#scr-auth").hidden) drawWelcome(now);
  } catch (e) { console.error(e); }
}

/* ================= UI helpers ================= */
let toastT; function toast(s) { const l = $("#layer"); l.querySelector(".toast")?.remove(); const d = document.createElement("div"); d.className = "toast"; d.textContent = s; d.setAttribute("role", "status"); l.appendChild(d); clearTimeout(toastT); toastT = setTimeout(() => d.remove(), 3200); }
function sheet(html) { closeSheet(); $("#layer").insertAdjacentHTML("beforeend", `<div class="backdrop" data-act="closeSheet"></div><div class="sheet pad" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`); paintIcons($("#layer .sheet")); }
function closeSheet() { $("#layer .backdrop")?.remove(); $("#layer .sheet")?.remove(); }
function setRP(n) { if (n == null) return; const old = +$("#rpVal").textContent || 0; $("#rpVal").textContent = n; if (S.user) S.user.rp = n; if (n !== old) $("#rpChip").animate?.([{ transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 300 }); }
function busy(on) { $("#farmLoading").hidden = !on; }
async function guard(fn) { try { return await fn(); } catch (e) { toast(e.message || String(e)); console.error(e); } }

/* ================= screens ================= */
function show(id) { ["auth", "onboard", "main"].forEach(k => $("#scr-" + k).hidden = k !== id); }

/* ---- auth ---- */
let authMode = "login";
function renderAuth() { $("#nameField").hidden = authMode !== "register"; $("#authBtn").textContent = authMode === "login" ? t("signIn") : t("createAccount"); $("#aPass").autocomplete = authMode === "login" ? "current-password" : "new-password"; $$("#authMode button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === authMode)); }
$("#authForm").addEventListener("submit", async e => {
  e.preventDefault(); const err = $("#authErr"); err.hidden = true; const btn = $("#authBtn"); btn.disabled = true;
  try {
    const body = { email: $("#aEmail").value.trim(), password: $("#aPass").value };
    const res = authMode === "login" ? await api("/auth/login", { method: "POST", body }) : await api("/auth/register", { method: "POST", body: { ...body, name: $("#aName").value.trim(), lang: LANG } });
    TOKEN = res.token; store.set("fs_token", TOKEN); S.user = res.user; if (res.user.lang && res.user.lang !== LANG) { LANG = res.user.lang; applyI18n(); }
    await afterLogin();
  } catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { btn.disabled = false; }
});
function signOut() { TOKEN = null; store.set("fs_token", null); S.user = null; S.plots = []; S.state = null; show("auth"); renderAuth(); }
async function afterLogin() {
  S.plots = await api("/plots");
  setRP(S.user.rp);
  if (!S.plots.length) { startOnboard(); return; }
  const last = +store.get("fs_plot"); S.plotId = S.plots.some(p => p.id === last) ? last : S.plots[0].id;
  await enterMain();
}

/* ---- onboarding ---- */
const OB = { step: 1, corners: [], irr: "irr", pri: "water", prev: new Set(), keep: new Set(), picks: new Set(), analysis: null, loading: false };
let map = null, mapLayer = null;
function areaM2(poly) { if (poly.length < 3) return 0; const lat0 = poly.reduce((s, p) => s + p[0], 0) / poly.length; const k = 111320 * Math.cos(lat0 * Math.PI / 180); let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s += (a[1] * k) * (b[0] * 110540) - (b[1] * k) * (a[0] * 110540); } return Math.abs(s) / 2; }
function initMap() {
  if (map || !window.L) return;
  map = window.L.map("leafletMap", { zoomControl: true }).setView([31.95, 35.93], 9);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
  mapLayer = window.L.layerGroup().addTo(map);
  map.on("click", e => { OB.corners.push([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]); drawCorners(); });
}
function drawCorners() {
  if (!mapLayer) return; mapLayer.clearLayers();
  OB.corners.forEach(c => window.L.circleMarker(c, { radius: 6, color: "#fff", weight: 2, fillColor: "#D98E1F", fillOpacity: 1 }).addTo(mapLayer));
  if (OB.corners.length >= 2) window.L.polygon(OB.corners, { color: "#D98E1F", weight: 3, fillOpacity: .25 }).addTo(mapLayer);
  const a = areaM2(OB.corners);
  $("#areaOut").textContent = OB.corners.length >= 3 ? `${fmtNum(a / 1000, 1)} ${t("dunums")} · ${fmtNum(a / 10000, 2)} ${t("hectare")}` : "–";
  $("#cornerHint").textContent = OB.corners.length >= 3 ? t("cornersOk", { n: OB.corners.length }) : t("cornersN", { n: OB.corners.length });
  updateObNext();
}
function chipsFor(el, set, ids) { el.innerHTML = ids.map(id => `<button type="button" class="chip toggle" data-id="${id}" aria-pressed="${set.has(id)}">${esc(cName(id))}</button>`).join(""); el.onclick = e => { const b = e.target.closest("button"); if (!b) return; const id = b.dataset.id; set.has(id) ? set.delete(id) : set.add(id); b.setAttribute("aria-pressed", set.has(id)); }; }
function startOnboard() { Object.assign(OB, { step: 1, corners: [], analysis: null, loading: false }); OB.picks.clear(); show("onboard"); closeSheet(); renderOnboard(); setTimeout(() => { initMap(); map?.invalidateSize(); drawCorners(); }, 50); }
function updateObNext() {
  const b = $("#obNextBtn");
  b.textContent = OB.step === 1 ? t("next") : OB.step === 2 ? t("analyze") : t("createPlot");
  b.disabled = OB.loading || (OB.step === 1 && (OB.corners.length < 3 || areaM2(OB.corners) < 100)) || (OB.step === 3 && !OB.analysis);
}
function renderOnboard() {
  $("#obStepLabel").textContent = t("stepOf", { n: OB.step });
  [1, 2, 3].forEach(i => { $("#st" + i).classList.toggle("on", i <= OB.step); $("#ob" + i).hidden = i !== OB.step; });
  if (OB.step === 1) { drawCorners(); setTimeout(() => map?.invalidateSize(), 30); }
  if (OB.step === 2) { const all = Object.keys(S.crops); chipsFor($("#prevChips"), OB.prev, all.filter(c => !S.crops[c].perennial)); chipsFor($("#keepChips"), OB.keep, all); }
  if (OB.step === 3) renderAnalysis();
  updateObNext();
}
function fieldErr(wrap, bad) { $(wrap).classList.toggle("bad", bad); $(wrap + " .err").hidden = !bad; return !bad; }
function validateStep2() {
  let ok = true;
  ok = fieldErr("#fNameWrap", !$("#fName").value.trim()) && ok;
  ok = fieldErr("#fSoilWrap", !$("#fSoil").value) && ok;
  ok = fieldErr("#fWaterWrap", OB.irr !== "rain" && !(+$("#fWater").value > 0)) && ok;
  ok = fieldErr("#fBudgetWrap", !(+$("#fBudget").value > 0)) && ok;
  return ok;
}
function farmInputs() { return { polygon: OB.corners, soil: $("#fSoil").value, farm_type: OB.irr, water_m3_week: +$("#fWater").value || 0, priority: OB.pri, prev_crops: [...OB.prev], keep_crops: [...OB.keep], lang: LANG }; }
async function runAnalysis() {
  OB.loading = true; OB.analysis = null; renderOnboard();
  try { OB.analysis = await api("/analyze", { method: "POST", body: farmInputs() }); const list = OB.analysis.crops; OB.picks.clear(); list.slice(0, 4).forEach(x => OB.picks.add(x.crop)); OB.keep.forEach(c => OB.picks.add(c)); $("#ob3Err").hidden = true; }
  catch (e) { $("#ob3Err").innerHTML = `${esc(e.message)} <button class="btn sm ghost" data-act="retryAnalyze" style="margin-top:8px">${t("retry")}</button>`; $("#ob3Err").hidden = false; }
  OB.loading = false; renderOnboard();
}
function renderAnalysis() {
  const a = OB.analysis;
  $("#ob3Title").textContent = a ? t("ob3Done") : t("ob3Load"); $("#ob3Sub").textContent = a ? t("ob3DoneSub") : t("ob3LoadSub");
  const names = ["NASA POWER climatology", "NASA POWER monthly", "NASA POWER daily", ...($("#fSoil").value === "auto" ? ["ISRIC SoilGrids"] : []), "Elevation"];
  const srcs = a ? a.sources : names.map(n => ({ name: n, loading: OB.loading }));
  $("#srcList").innerHTML = srcs.map(s => `<div class="src ${s.loading ? "loading" : s.ok ? "done" : ""}"><span class="dot"></span><div><b>${esc(s.name)}</b><small>${esc(s.detail || s.error || "")}</small></div><span class="mono muted" style="font-size:12px">${s.fetched_at ? new Date(s.fetched_at).toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" }) : ""}</span></div>`).join("");
  $("#ob3Results").hidden = !a; if (!a) return;
  const p = a.profile;
  const m = (v, lbl) => `<div class="metric"><b class="mono">${v}</b><span>${lbl}</span></div>`;
  $("#profile").innerHTML = [
    m(`${fmtNum(p.area_m2 / 1000, 1)}`, t("dunums")),
    m(`${fmtNum(p.elevation_m)} m`, L({ en: "elevation", ar: "الارتفاع" }) + (p.elevation_range_m != null ? ` · ±${fmtNum(p.elevation_range_m / 2)} m` : "")),
    m(`${fmtNum(p.mean_temp_c, 1)} °C`, "NASA POWER · " + L({ en: "mean temperature", ar: "متوسط الحرارة" })),
    m(`${fmtNum(p.rain_mm_year)} mm`, "NASA POWER · " + L({ en: "rain per year", ar: "أمطار سنوية" })),
    m(`${fmtNum(p.frost_days_year, 1)}`, "NASA POWER · " + L({ en: "frost days / year", ar: "أيام صقيع / سنة" })),
    m(esc(p.soil_texture_name[LANG === "ar" ? 1 : 0]), (p.soil_source === "SoilGrids" ? "SoilGrids · " : "") + L({ en: `soil, holds ${p.awc_mm_per_m} mm/m`, ar: `التربة، تحفظ ${p.awc_mm_per_m} ملم/م` })),
  ].join("");
  const tr = p.trend;
  $("#trendNote").innerHTML = tr ? `<div class="note ${tr.rain_pct_per_decade <= -5 ? "" : "info"}"><span><b>${t("trendTitle", { y: tr.years })}</b><br>${t("trendBody", { r: (tr.rain_pct_per_decade > 0 ? "+" : "") + tr.rain_pct_per_decade, t: (tr.temp_c_per_decade > 0 ? "+" : "") + tr.temp_c_per_decade })}</span></div>` : "";
  const list = a.crops.filter((x, i) => i < 8 || OB.keep.has(x.crop));
  $("#recList").innerHTML = list.map(x => `<button type="button" class="rec" data-pick="${x.crop}" aria-pressed="${OB.picks.has(x.crop)}" style="text-align:start"><canvas data-icon="${x.crop}"></canvas><div style="min-width:0"><div class="row between"><b>${esc(cName(x.crop))}</b><span class="mono" style="font-size:13px">${x.score}%</span></div><div class="bar"><i style="width:${x.score}%;background:${x.score >= 75 ? css("--ok") : x.score >= 55 ? css("--warn") : css("--danger")}"></i></div><div class="muted" style="font-size:12.5px;margin-top:4px">${x.reasons.slice(0, 2).map(r => esc(L(r))).join(" · ")}</div></div><span class="check"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" fill="none" stroke="#fff" stroke-width="2.4"/></svg></span></button>`).join("");
  paintIcons($("#recList"));
}
async function createPlot() {
  if (!OB.picks.size) { toast(t("pickOne")); return; }
  OB.loading = true; updateObNext(); $("#obNextBtn").textContent = t("creating");
  try {
    const st = await api("/plots", { method: "POST", body: { ...farmInputs(), name: $("#fName").value.trim(), budget_jod: +$("#fBudget").value, crops: [...OB.picks] } });
    S.plots = await api("/plots"); S.plotId = st.plot.id; S.state = st; store.set("fs_plot", S.plotId);
    await enterMain(true);
  } catch (e) { toast(e.message); } finally { OB.loading = false; updateObNext(); }
}

/* ---- main ---- */
async function loadPlot() {
  busy(true);
  try { const st = await api("/plots/" + S.plotId); S.state = st; N = Math.round(Math.sqrt(st.tiles.length)) || 6; setRP(st.user_rp); renderHUD(); renderSidebar(); refreshHint(); sizeFarm(); }
  finally { busy(false); }
}
async function enterMain(tutorial) {
  show("main"); switchTab("farm"); applyI18n();
  await guard(loadPlot);
  if ((tutorial || !store.get("fs_tut")) && S.state) setTimeout(() => coach(0), 300);
}
function applyState(res) { if (res.state) { S.state = res.state; setRP(res.user_rp); renderHUD(); renderSidebar(); refreshHint(); } if (res.rp_awarded) toast(`${L(res.message)} · +${res.rp_awarded} ${t("rp")}`); else if (res.message) toast(L(res.message)); }
function renderHUD() {
  const st = P(); if (!st) return; const p = st.plot;
  $("#plotName").textContent = p.name; $("#plotMeta").textContent = `${p.region} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")} ▾`;
  $("#gradeVal").textContent = st.grade.grade;
  const w = st.weather;
  if (w) { let h = null; if (w.first_rain) h = Math.max(0, Math.round((new Date(w.first_rain) - new Date(w.local_time)) / 36e5));
    $("#wxChip").innerHTML = `<span class="mono">${fmtNum(w.temp_c)}°</span> ${h != null ? t("rainIn", { h }) : t("noRain")}`; }
  else $("#wxChip").textContent = "–";
  $("#alertCount").textContent = st.alerts_open; $("#alertCount").hidden = !st.alerts_open;
  const a = st.top_alert; $("#vignette").classList.toggle("on", !!a && a.type === "frost");
  const bn = $("#banner"); bn.hidden = !a;
  if (a) { const col = { frost: "var(--frost)", rain: "var(--water)", heat: "var(--danger)", wind: "var(--warn)" }[a.type];
    bn.innerHTML = `<span class="sev" style="background:${col}"></span><div style="min-width:0"><b>${esc(L(a.title))} · ${fmtDate(a.date)}</b><small>${esc(a.source)}</small></div><button class="btn sm" data-act="goAlerts">${t("seeWhat")}</button>`; }
}
function renderSidebar() {
  const st = P(), sb = $("#sidebar"); if (!st) return; sb.innerHTML = "";
  st.plot.crops.forEach(id => {
    const ts = st.tiles.filter(x => x.planting?.crop === id), nw = ts.filter(thirsty).length, nr = ts.filter(ready).length;
    let s = t("tapToPlant"); if (nr) s = t("readyN"); else if (nw) s = t("needsWater"); else if (ts.length) { const d = ts.map(x => x.planting.harvest_from).filter(Boolean).sort()[0]; s = d ? t("harvestOn", { d: fmtDate(d) }) : ""; }
    const b = document.createElement("button"); b.className = "sb-crop"; b.setAttribute("aria-pressed", S.sel === id); b.dataset.crop = id;
    b.innerHTML = `<canvas></canvas><b>${esc(cName(id))}</b><small>${esc(s)}</small>${nw ? `<span class="badge w">${nw}</span>` : nr ? `<span class="badge h">${nr}</span>` : ""}`;
    sb.appendChild(b); cropIcon(b.querySelector("canvas"), id);
  });
  sb.insertAdjacentHTML("beforeend", `<div class="sb-sep"></div>
   <button class="tool" data-tool="water" aria-pressed="${S.tool === "water"}"><svg viewBox="0 0 32 32"><path d="M6 13h14l-2 12H8Z" fill="${css("--water")}"/><path d="M20 16l8-6" stroke="${css("--water")}" stroke-width="3" stroke-linecap="round"/><path d="M9 13a4 4 0 0 1 8 0" fill="none" stroke="${css("--water")}" stroke-width="2.4"/></svg>${t("water")}</button>
   <button class="tool" id="toolSickle" data-tool="sickle" aria-pressed="${S.tool === "sickle"}">${sickleSVG()}${t("sickle")}</button>
   <button class="tool" data-tool="topo" aria-pressed="${S.topo}"><svg viewBox="0 0 32 32" fill="none" stroke="${css("--olive")}" stroke-width="2.2" stroke-linejoin="round"><path d="M3 24l8-12 6 8 4-5 8 9Z"/><path d="M3 28h26" stroke="${css("--water")}"/></svg>${t("topo")}</button>`);
}
const sickleSVG = () => `<svg viewBox="0 0 32 32"><path d="M8 26l6-7" stroke="#7A5131" stroke-width="4" stroke-linecap="round"/><path d="M13 20C10 10 18 3 27 6c-6 0-11 5-10 13Z" fill="#B9C2C8" stroke="#6D777E" stroke-width="1.2"/></svg>`;
function setHint(s) { const h = $("#hint"); h.hidden = !s; if (s) h.textContent = s; }
function refreshHint() { if (S.sel) setHint(t("pickSpot", { c: cName(S.sel) })); else if (S.tool === "sickle") setHint(t("dragHint")); else if (S.tool === "water") setHint(t("waterHint")); else if (S.topo) setHint(t("topoHint")); else setHint(""); }
function switchTab(tab) {
  S.tab = tab; $$(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === tab));
  ["farm", "plan", "spray", "alerts", "more"].forEach(k => $("#tab-" + k).hidden = k !== tab);
  if (tab === "farm") requestAnimationFrame(sizeFarm); else loadTab(tab);
}
function loadingPane(el) { el.innerHTML = `<div class="empty"><span class="spinner"></span><p>${t("loading")}</p></div>`; }
async function loadTab(tab) {
  const el = $("#tab-" + tab);
  if (tab === "more") { renderMore(); return; }
  loadingPane(el);
  try {
    if (tab === "plan") { S.plan = await api(`/plots/${S.plotId}/plan`); renderPlan(); }
    if (tab === "spray") { S.spray = await api(`/plots/${S.plotId}/spray-window`); renderSpray(); }
    if (tab === "alerts") { S.alerts = await api(`/plots/${S.plotId}/alerts`); renderAlerts(); }
  } catch (e) { el.innerHTML = `<div class="err-box">${esc(e.message)}</div><button class="btn ghost" style="margin-top:12px" data-act="reloadTab">${t("retry")}</button>`; }
}
function renderTabAgain() { if (S.tab === "plan" && S.plan) renderPlan(); if (S.tab === "spray" && S.spray) renderSpray(); if (S.tab === "alerts" && S.alerts) renderAlerts(); if (S.tab === "more") renderMore(); }

/* ---- farm interactions ---- */
const tileLabel = tl => t("squareN", { c: "ABCDEFGHIJ"[tl.c], r: tl.r + 1 });
function onTileTap(tl) {
  if (!tl.inside) { toast(t("outside")); return; }
  if (S.sel && !tl.planting) { plantSheet(tl, S.sel); return; }
  if (thirsty(tl) || (S.tool === "water" && tl.planting)) { waterSheet(tl); return; }
  infoSheet(tl);
}
function plantSheet(tl, crop) {
  const C = S.crops[crop], today = P().today, s = tl.suitability?.[crop] ?? 0;
  sheet(`<form class="stack" id="plantForm"><div class="row"><canvas data-icon="${crop}" style="width:52px;height:52px"></canvas><div><h2 style="font-size:22px">${t("plantTitle", { c: esc(cName(crop)) })}</h2><span class="muted">${tileLabel(tl)} · ${t("suit")} <b class="mono">${s}%</b></span></div></div>
   <div class="field"><label class="label" for="plantDate">${t("plantedOn")}</label><input type="date" id="plantDate" value="${today}" max="${today}" required></div>
   <p class="muted" style="margin:0;font-size:13px">${C.perennial ? t("plantHelpTree") : t("plantHelpAnnual")}</p>
   <button class="btn block" type="submit">${t("plantBtn")}</button><button class="btn ghost block" type="button" data-act="closeSheet">${t("cancel")}</button></form>`);
  $("#plantForm").onsubmit = async e => { e.preventDefault(); const date = $("#plantDate").value || today; closeSheet();
    await guard(async () => { const res = await api(`/plots/${S.plotId}/plant`, { method: "POST", body: { tile_ids: [tl.id], crop, planted_on: date } }); floatAt(tl.id, "+" + res.rp_awarded); applyState(res); }); };
}
function waterSheet(tl) {
  const w = tl.planting.water; if (!w) { toast(t("netErr")); return; }
  if (w.wait_for_rain) {
    sheet(`<div class="stack"><h2 style="font-size:24px">${t("holdOff")}</h2><p style="margin:0">${t("holdOffBody", { mm: fmtNum(w.rain_eff_next48_mm, 1), m: fmtNum(w.refill_m3, 1) })}</p><span class="tag">Open-Meteo · FAO-56</span>
      <button class="btn water block" data-act="waitRain" data-id="${tl.id}">${t("waitRain")} · +15 ${t("rp")}</button><button class="btn ghost block" data-act="waterNow" data-id="${tl.id}" data-mm="${w.refill_mm}">${t("waterAnyway")}</button></div>`); return; }
  const mm = w.needs_water ? w.refill_mm : 10;
  sheet(`<form class="stack" id="waterForm"><h2 style="font-size:22px">${t("waterTitle")} · ${tileLabel(tl)}</h2>
    <p style="margin:0">${t("waterBody", { p: w.available_pct, mm: fmtNum(mm, 1), m: fmtNum(mm * tl.area_m2 / 1000, 1) })}</p>
    <div class="field"><label class="label" for="waterMm">${t("mmLabel")}</label><input id="waterMm" type="number" min="1" max="200" step="0.5" value="${mm}"></div>
    <button class="btn water block" type="submit">${t("waterDone", { mm: "" }).trim()}</button><button class="btn ghost block" type="button" data-act="closeSheet">${t("cancel")}</button></form>`);
  $("#waterForm").onsubmit = e => { e.preventDefault(); irrigate(tl.id, +$("#waterMm").value); };
}
async function irrigate(id, mm) { closeSheet(); await guard(async () => { const res = await api(`/plots/${S.plotId}/irrigate`, { method: "POST", body: { tile_ids: [id], mm } }); if (res.rp_awarded) floatAt(id, "+" + res.rp_awarded, "#7CC8FF"); applyState(res); }); }
function infoSheet(tl) {
  const p = tl.planting, kv = (k, v) => `<span>${k}</span><b>${v}</b>`;
  const terrain = kv(t("elev"), tl.elev != null ? `${fmtNum(tl.elev)} m${tl.low ? " · " + t("lowSpot") : ""}` : "–") + (tl.slope_pct != null ? kv(t("slope"), `${fmtNum(tl.slope_pct, 1)}%`) : "")
    + (tl.ndvi != null ? kv(t("ndvi"), `${fmtNum(tl.ndvi, 2)} · ${fmtDate(tl.ndvi_date)}`) : "") + (tl.lst_night_c != null ? kv(t("nightLst"), `${fmtNum(tl.lst_night_c, 1)} °C`) : "");
  if (!p) {
    const best = Object.entries(tl.suitability || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    sheet(`<div class="stack"><h2 style="font-size:22px">${tileLabel(tl)} · ${t("emptySquare")}</h2><div class="kv">${terrain}</div>
      ${best.length ? `<span class="label">${t("bestFor")}</span>` + best.map(([id, s]) => `<div class="row"><canvas data-icon="${id}" style="width:36px;height:36px"></canvas><div style="flex:1"><b>${esc(cName(id))}</b><div class="bar"><i style="width:${s}%;background:${s >= 75 ? css("--ok") : s >= 55 ? css("--warn") : css("--danger")}"></i></div></div><span class="mono">${s}%</span></div>`).join("") : ""}
      <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`); return; }
  const w = p.water;
  sheet(`<div class="stack"><div class="row"><canvas data-icon="${p.crop}" data-st="${p.stage}" style="width:56px;height:56px"></canvas><div><h2 style="font-size:22px">${esc(cName(p.crop))}</h2><span class="muted">${tileLabel(tl)} · ${fmtDate(p.planted_on)}</span></div></div>
    <div class="kv">${kv(t("stage"), p.ready ? t("readyNow") : `${p.stage + 1}/4`)}${kv(t("harvestDates"), p.harvest_from ? `${fmtDate(p.harvest_from)} – ${fmtDate(p.harvest_to)}` : "–")}
    ${w ? kv(t("soilWater"), w.dormant ? t("dormant") : `${w.available_pct}% · ${fmtNum(w.depletion_mm)} / ${fmtNum(w.taw_mm)} mm`) + kv(t("nextWater"), w.dormant ? "–" : w.needs_water ? t("now") + ` · ${fmtNum(w.refill_mm)} mm` : (w.next_need_date ? fmtDate(w.next_need_date) : "> 9 d")) : ""}
    ${terrain}</div><span class="tag">${esc(p.method)} · FAO-56</span>
    ${w && !w.dormant ? `<button class="btn water block" data-act="openWater" data-id="${tl.id}">${t("waterTitle")}</button>` : ""}
    <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`);
}
let downAt = null;
cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(); downAt = { x: e.clientX - r.left, y: e.clientY - r.top }; });
cv.addEventListener("pointerup", e => { if (!downAt) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (Math.hypot(x - downAt.x, y - downAt.y) < 10) { const tl = pick(x, y); if (tl) onTileTap(tl); else if (S.sel) { S.sel = null; renderSidebar(); refreshHint(); } } downAt = null; });

/* sickle: tap = dates, long-press + drag = harvest */
let lpTimer = null, dragging = false, dragEl = null, harvestSet = new Set(), suppressClick = false;
function showHarvestDates() {
  const groups = {}; P().tiles.filter(x => x.planting).forEach(tl => (groups[tl.planting.crop] ||= []).push(tl));
  const keys = Object.keys(groups);
  sheet(`<div class="stack"><div class="row">${sickleSVG().replace("<svg", '<svg width="36" height="36"')}<h2 style="font-size:24px">${t("harvestDates")}</h2></div><div class="note info"><span>${t("sickleHow")}</span></div>
    ${keys.length ? keys.map(id => { const ts = groups[id], r = ts.filter(ready).length, nx = ts.filter(x => !ready(x)).map(x => x.planting.harvest_from).filter(Boolean).sort()[0];
      return `<div class="row"><canvas data-icon="${id}" style="width:40px;height:40px"></canvas><div style="flex:1"><b>${esc(cName(id))}</b><div class="muted" style="font-size:13px">${ts.length} · ${esc(ts[0].planting.method)}</div></div><div style="text-align:end">${r ? `<span class="chip" style="background:var(--sun-soft)">${t("readyNow")} · ${r}</span>` : ""}${nx ? `<div class="mono" style="font-size:13px">${fmtDate(nx)}</div>` : ""}</div></div>`; }).join("") : `<p class="muted">${t("nothingPlanted")}</p>`}
    <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`);
}
function moveDrag(e) { if (!dragging) return; dragEl.style.left = e.clientX + "px"; dragEl.style.top = e.clientY + "px"; const r = cv.getBoundingClientRect(); const tl = pick(e.clientX - r.left, e.clientY - r.top - 18); dragTile = tl;
  if (tl && ready(tl) && !harvestSet.has(tl.id)) { harvestSet.add(tl.id); floatAt(tl.id, "✓"); } }
async function endDrag() {
  dragging = false; dragEl?.remove(); dragTile = null; const ids = [...harvestSet]; harvestSet = new Set(); S.tool = null; renderSidebar(); refreshHint();
  if (ids.length) await guard(async () => applyState(await api(`/plots/${S.plotId}/harvest`, { method: "POST", body: { tile_ids: ids } })));
}
$("#app").addEventListener("pointerdown", e => { const b = e.target.closest("#toolSickle"); if (!b) return;
  lpTimer = setTimeout(() => { dragging = true; harvestSet = new Set(); S.tool = "sickle"; S.sel = null; b.setAttribute("aria-pressed", "true"); refreshHint();
    dragEl = document.createElement("div"); dragEl.className = "drag-sickle"; dragEl.innerHTML = sickleSVG(); document.body.appendChild(dragEl); moveDrag(e); navigator.vibrate?.(15); }, 380); });
addEventListener("pointermove", e => { if (dragging) { e.preventDefault(); moveDrag(e); } }, { passive: false });
addEventListener("pointerup", () => { clearTimeout(lpTimer); if (dragging) { suppressClick = true; endDrag(); } });
$("#app").addEventListener("contextmenu", e => { if (e.target.closest("#toolSickle,#farmCanvas")) e.preventDefault(); });

/* ---- plan ---- */
function bars(series, key, cls, max) { if (!series?.length) return ""; const m = max != null ? max : (Math.max(...series.map(x => x[key])) || 1); return `<div class="spark ${cls || ""}">${series.map(x => `<i title="${esc((x.year || x.date) + ": " + x[key])}" style="height:${Math.max(3, 100 * x[key] / m)}%"></i>`).join("")}</div>`; }
function renderPlan() {
  const p = S.plan, el = $("#tab-plan"), mNow = new Date().getMonth(), months = T.months[LANG === "ar" ? 1 : 0];
  const w = p.water, over = w.need_next7_m3 > w.available_m3_week && w.available_m3_week > 0, mx = Math.max(w.need_next7_m3, w.available_m3_week, 1) * 1.1;
  el.innerHTML = `<div class="stack">
  <div class="sec-title"><h2>${t("calendar")}</h2><span class="tag">NASA POWER</span></div>
  ${p.advice.map(a => `<div class="note ${a.type === "cold" ? "info" : ""}"><span>${esc(L(a))}</span></div>`).join("")}
  ${p.anomaly ? `<div class="muted" style="font-size:13px">${t("last30")}: <b class="mono">${p.anomaly.anomaly_c > 0 ? "+" : ""}${p.anomaly.anomaly_c} °C</b> (${fmtDate(p.anomaly.from)} – ${fmtDate(p.anomaly.to)})</div>` : ""}
  <div class="cal"><table><thead><tr><th></th>${months.map((m, i) => `<th${i === mNow ? ' style="color:var(--danger)"' : ""}>${m}</th>`).join("")}</tr></thead><tbody>
  ${p.calendar.map(r => `<tr><td class="name">${esc(cName(r.crop))}</td>${r.row.map((k, i) => `<td class="${k ? "seg-" + k : ""}${i === mNow ? " now" : ""}" style="${k ? "" : "background:var(--surface-2)"}"></td>`).join("")}</tr>`).join("")}
  </tbody></table></div>
  <div class="legend"><span><i style="background:var(--leaf);opacity:.55"></i>${t("lgPlant")}</span><span><i style="background:var(--leaf)"></i>${t("lgGrow")}</span><span><i style="background:var(--sun)"></i>${t("lgHarv")}</span><span><i style="background:var(--danger);width:3px"></i>${t("lgNow")}</span></div>
  <p class="muted" style="font-size:12px;margin:0">${t("calFrom", { p: p.climatology_period || "" })}</p>
  <div class="sec-title"><h2>${t("waterWeek")}</h2><span class="tag">Open-Meteo · FAO-56</span></div>
  <div class="card stack" style="gap:10px">
   <div class="wbar"><span>${t("need")}</span><div class="track"><i style="width:${w.need_next7_m3 / mx * 100}%;background:${over ? css("--danger") : css("--water")}"></i></div><b class="mono">${fmtNum(w.need_next7_m3)} m³</b></div>
   <div class="wbar"><span>${t("avail")}</span><div class="track"><i style="width:${w.available_m3_week / mx * 100}%;background:var(--ok)"></i></div><b class="mono">${fmtNum(w.available_m3_week)} m³</b></div>
   ${w.available_m3_week > 0 ? `<div class="note ${over ? "" : "ok"}" style="font-size:13px"><span>${over ? t("overBudget", { m: fmtNum(w.need_next7_m3 - w.available_m3_week) }) : t("inBudget", { m: fmtNum(w.available_m3_week - w.need_next7_m3) })}</span></div>` : ""}
  </div>
  <div class="sec-title"><h2>${t("seedBank")}</h2></div>
  <div class="card row" style="gap:16px"><div class="grade-big">${p.grade.grade}</div><div><b>${t("resilience")}</b><div class="muted" style="font-size:14px">${t("gradeWhy", { n: p.grade.crop_types, d: p.grade.drought_tolerant })}</div></div></div>
  ${p.trend?.years ? `<div class="card stack" style="gap:6px"><b>${t("trendTitle", { y: p.trend.years })}</b><span class="muted" style="font-size:13px">${t("trendBody", { r: (p.trend.rain_pct_per_decade > 0 ? "+" : "") + p.trend.rain_pct_per_decade, t: (p.trend.temp_c_per_decade > 0 ? "+" : "") + p.trend.temp_c_per_decade })}</span>${bars(p.trend.rain_series, "mm")}</div>` : ""}
  ${p.suggestions.length ? `<span class="label">${t("suggest")}</span>` + p.suggestions.map(s => `<div class="rec"><canvas data-icon="${s.crop}"></canvas><div style="min-width:0"><b>${esc(cName(s.crop))}</b> <span class="mono muted">${s.score}%</span><div class="muted" style="font-size:12.5px">${s.reasons.slice(0, 2).map(r => esc(L(r))).join(" · ")}</div></div><button class="btn sm" data-act="addCrop" data-id="${s.crop}">${t("addCrop")}</button></div>`).join("") : ""}
  <div class="sec-title"><h2>${t("ndviTitle")}</h2><span class="tag">NASA AppEEARS</span></div>
  ${p.ndvi_series.length ? `<div class="card">${bars(p.ndvi_series, "v", "ndvi", 1)}<div class="muted mono" style="font-size:12px">${fmtDate(p.ndvi_series[0].date)} – ${fmtDate(p.ndvi_series.at(-1).date)} · ${t("ndvi")} ${fmtNum(p.ndvi_series.at(-1).v, 2)}</div></div>` : `<div class="note info"><span>${t("noSat")}</span></div>`}
  ${p.smap_series.length ? `<div class="sec-title"><h2>${t("smapTitle")}</h2></div><div class="card">${bars(p.smap_series, "v", "", .5)}<div class="muted mono" style="font-size:12px">${fmtNum(p.smap_series.at(-1).v, 3)} m³/m³ · ${fmtDate(p.smap_series.at(-1).date)}</div></div>` : ""}
  </div>`;
  paintIcons(el);
}

/* ---- spray ---- */
function renderSpray() {
  const sp = S.spray, el = $("#tab-spray");
  const days = [0, 1, 2].map(i => { const b = sp.blocks.find(x => x.day === i); return i === 0 ? t("today") : b ? new Date(b.start).toLocaleDateString(loc(), { weekday: "short" }) : ""; });
  const icon = z => z === "g" ? `<svg viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>` : z === "r" ? `<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.4"/></svg>` : `<svg viewBox="0 0 16 16"><path d="M8 3v6M8 12v1" stroke="currentColor" stroke-width="2.4"/></svg>`;
  const booked = new Set(sp.bookings.map(b => b.start));
  el.innerHTML = `<div class="stack"><div class="sec-title"><h2>${t("sprayTitle")}</h2><span class="tag">Open-Meteo</span></div>
  <p class="muted" style="margin:-6px 0 0;font-size:14px">${t("spraySub")}</p>
  <div class="seg" id="sprayTool">${["tractor", "drone", "backpack"].map(k => `<button data-v="${k}" aria-pressed="${S.sprayTool === k}">${t(k)}</button>`).join("")}</div>
  <div style="overflow-x:auto"><div class="spray-grid" style="min-width:340px"><span></span>${[0, 3, 6, 9, 12, 15, 18, 21].map(h => `<span class="h mono">${String(h).padStart(2, "0")}</span>`).join("")}
  ${[0, 1, 2].map(d => `<span class="d">${esc(days[d])}</span>` + [0, 3, 6, 9, 12, 15, 18, 21].map(h => { const b = sp.blocks.find(x => x.day === d && x.hour === h); if (!b) return "<span></span>";
    return `<button class="slot ${b.zone}${booked.has(b.start) ? " sel" : ""}" data-slot="${b.start}" ${b.past ? 'disabled style="opacity:.35"' : ""} aria-label="${esc(days[d])} ${h}:00">${icon(b.zone)}<span class="mono">${b.wind_kmh}</span></button>`; }).join("")).join("")}
  </div></div>
  <div class="legend"><span><i style="background:var(--ok)"></i>${t("lgSafe")}</span><span><i style="background:var(--warn)"></i>${t("lgCaution")}</span><span><i style="background:var(--danger)"></i>${t("lgNo")}</span><span class="mono">km/h</span></div>
  <div id="sprayMsg"></div>
  ${sp.bookings.length ? `<span class="label">${t("booked")}</span>` + sp.bookings.map(b => `<div class="list-item"><b class="mono">${esc(b.start.replace("T", " "))}</b><span class="muted">${esc(t(b.tool))}</span></div>`).join("") : ""}
  </div>`;
}
async function onSlot(start) {
  const b = S.spray.blocks.find(x => x.start === start); const msg = $("#sprayMsg");
  if (b.zone === "r") { msg.innerHTML = `<div class="note" style="background:var(--danger-soft)"><span>${t("locked", { why: esc(L(b.why)) })}</span></div>`; return; }
  if (b.zone === "y" && S.pendingY !== start) { S.pendingY = start; msg.innerHTML = `<div class="note"><span>${t("caution", { why: esc(L(b.why)) })}</span></div>`; return; }
  S.pendingY = null;
  await guard(async () => { const res = await api(`/plots/${S.plotId}/spray`, { method: "POST", body: { start, tool: S.sprayTool } }); applyState(res); S.spray = await api(`/plots/${S.plotId}/spray-window`); renderSpray(); });
}

/* ---- alerts ---- */
function renderAlerts() {
  const col = { frost: "var(--frost)", rain: "var(--water)", heat: "var(--danger)", wind: "var(--warn)" };
  $("#tab-alerts").innerHTML = `<div class="stack"><div><h2 style="font-size:22px">${t("alertsTitle")}</h2><p class="muted" style="margin:4px 0 0;font-size:14px">${t("alertsSub")}</p></div>
  ${S.alerts.length ? S.alerts.map(a => `<div class="alert${a.resolved ? " resolved" : ""}"><span class="sev" style="background:${col[a.type]}"></span><div class="stack" style="gap:10px;min-width:0">
    <div class="row between" style="align-items:flex-start"><h3>${esc(L(a.title))} · ${fmtDate(a.date)}</h3>${a.resolved ? `<span class="chip" style="background:var(--ok-soft)">${t("resolved")}</span>` : `<span class="chip">${a.lead_days ? t("inDays", { n: a.lead_days }) : t("tonight")}</span>`}</div>
    <p style="margin:0;font-size:14px">${esc(L(a.body))}</p><div class="row" style="flex-wrap:wrap;gap:6px"><span class="tag">${esc(a.source)}</span></div>
    ${a.actions.map((x, i) => { const dn = a.done.includes(i); return `<div class="act${dn ? " done" : ""}"><span>${esc(L(x))}</span>${dn ? `<span style="color:var(--ok)">✓</span>` : `<button class="btn sm" data-act="alertDo" data-k="${esc(a.key)}" data-i="${i}">${t("done")} · +20</button>`}</div>`; }).join("")}
  </div></div>`).join("") : `<div class="note ok"><span>${t("noAlerts")}</span></div>`}</div>`;
}

/* ---- more ---- */
function renderMore() {
  const st = P(); if (!st) return; const sat = st.satellite;
  $("#tab-more").innerHTML = `<div class="stack">
  <div class="sec-title"><h2>${t("language")}</h2></div>
  <div class="seg" id="langSeg"><button data-v="en" aria-pressed="${LANG === "en"}">English</button><button data-v="ar" aria-pressed="${LANG === "ar"}">العربية</button></div>
  <div class="sec-title"><h2>${t("myPlots")}</h2></div>
  ${S.plots.map(p => `<button class="list-item${p.id === S.plotId ? " on" : ""}" data-act="switchPlot" data-id="${p.id}"><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${esc(p.region)} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")}</div></div></button>`).join("")}
  <button class="btn ghost" data-act="addPlot">+ ${t("addPlot")}</button>
  <div class="sec-title"><h2>${t("satellite")}</h2><span class="tag">SMAP · MODIS · ECOSTRESS</span></div>
  <div class="card stack" style="gap:8px"><div class="row between"><b>${esc(L({ en: (T.satStatus[sat.status] || [sat.status])[0], ar: (T.satStatus[sat.status] || [sat.status, sat.status])[1] }))}</b>${sat.updated_at ? `<span class="muted mono" style="font-size:12px">${fmtDate(sat.updated_at.slice(0, 10))}</span>` : ""}</div>
   ${sat.smap ? `<span class="muted" style="font-size:13px">SMAP ${fmtNum(sat.smap.rootzone_m3m3, 3)} m³/m³ · ${fmtDate(sat.smap.date)}</span>` : ""}
   ${sat.error ? `<div class="err-box">${esc(sat.error)}</div>` : ""}
   ${sat.status !== "not_configured" ? `<button class="btn sm ghost" data-act="satRefresh">${t("satRefresh")}</button>` : ""}</div>
  <div class="sec-title"><h2>${t("dataSources")}</h2></div>
  <div class="card" style="padding-block:4px">${st.sources.map(s => `<div class="src-row"><b>${s.ok ? "" : "⚠ "}${esc(s.name)}</b><span class="tag">${s.fetched_at ? new Date(s.fetched_at).toLocaleString(loc(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span><span class="muted" style="grid-column:1/-1">${esc(s.detail)}${s.error ? " · " + esc(s.error) : ""}</span></div>`).join("")}</div>
  <div class="sec-title"><h2>${t("history")}</h2></div><div id="eventsBox"><span class="spinner"></span></div>
  <button class="btn ghost" data-act="tutorial">${t("replay")}</button>
  <button class="btn ghost" data-act="signOut">${t("signOut")}</button>
  <button class="btn danger-btn" data-act="deletePlot">${t("deletePlot")}</button>
  <p class="muted" style="font-size:13px;margin:0">${t("about")}</p></div>`;
  api(`/plots/${S.plotId}/events`).then(ev => { const box = $("#eventsBox"); if (!box) return; box.innerHTML = ev.length ? `<div class="card" style="padding-block:4px">${ev.slice(0, 30).map(e => `<div class="src-row"><b>${esc(e.kind.replace("_", " "))}${e.data.crop ? " · " + esc(cName(e.data.crop)) : ""}${e.data.mm ? " · " + e.data.mm + " mm" : ""}${e.data.start ? " · " + esc(e.data.start.replace("T", " ")) : ""}</b><span class="mono muted">${e.rp ? "+" + e.rp : ""}</span><span class="muted" style="grid-column:1/-1">${fmtDate(e.date)}</span></div>`).join("")}</div>` : `<p class="muted">–</p>`; }).catch(() => {});
}

/* ---- tutorial ---- */
const COACH = [["#sidebar .sb-crop", "c1t", "c1b"], ["#farmCanvas", "c2t", "c2b"], ["#toolSickle", "c3t", "c3b"], ["#tabAlerts", "c4t", "c4b"], ["#rpChip", "c5t", "c5b"]];
function coach(i) {
  closeCoach(); if (i >= COACH.length) { store.set("fs_tut", "1"); return; } if (S.tab !== "farm") switchTab("farm");
  const el = $(COACH[i][0]); if (!el) { coach(i + 1); return; }
  const app = $("#app").getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 6, l = $("#layer");
  const ring = document.createElement("div"); ring.className = "coach-ring"; Object.assign(ring.style, { left: r.left - app.left - pad + "px", top: r.top - app.top - pad + "px", width: r.width + pad * 2 + "px", height: (i === 1 ? Math.min(r.height, app.height * .5) : r.height) + pad * 2 + "px" });
  const card = document.createElement("div"); card.className = "coach-card"; const below = r.top - app.top < app.height / 2 && i !== 1;
  if (i === 1) card.style.bottom = "90px"; else card.style[below ? "top" : "bottom"] = below ? (r.bottom - app.top + 16 + "px") : (app.bottom - r.top + 16) + "px";
  card.innerHTML = `<h3>${t(COACH[i][1])}</h3><p>${t(COACH[i][2])}</p><div class="row between"><div class="dots">${COACH.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div><div class="row"><button class="btn sm ghost" data-act="coachSkip">${t("skip")}</button><button class="btn sm" data-act="coachNext" data-i="${i + 1}">${i === COACH.length - 1 ? t("gotIt") : t("next")}</button></div></div>`;
  l.append(ring, card);
}
function closeCoach() { $$("#layer .coach-ring,#layer .coach-card").forEach(e => e.remove()); }

/* ================= events ================= */
async function setLang(l) { LANG = l; store.set("fs_lang", l); applyI18n(); renderAuth(); if (!$("#scr-onboard").hidden) renderOnboard(); if (!$("#scr-main").hidden) { renderHUD(); renderSidebar(); refreshHint(); renderTabAgain(); } if (TOKEN) api("/me", { method: "PATCH", body: { lang: l } }).catch(() => {}); }
document.addEventListener("click", async e => {
  if (suppressClick) { suppressClick = false; if (e.target.closest("#toolSickle")) return; }
  const a = e.target.closest("[data-act]"), act = a?.dataset.act;
  const crop = e.target.closest(".sb-crop"); if (crop) { const id = crop.dataset.crop; S.sel = S.sel === id ? null : id; S.tool = null; renderSidebar(); refreshHint(); return; }
  const tool = e.target.closest(".tool"); if (tool) { const k = tool.dataset.tool; S.sel = null;
    if (k === "topo") S.topo = !S.topo; else if (k === "sickle") { S.tool = null; showHarvestDates(); } else { S.tool = S.tool === k ? null : k; if (k === "water" && S.tool && !P().tiles.some(thirsty)) toast(t("noNeed")); }
    renderSidebar(); refreshHint(); return; }
  const tab = e.target.closest(".tab"); if (tab) { switchTab(tab.dataset.tab); return; }
  const pk = e.target.closest("[data-pick]"); if (pk) { const id = pk.dataset.pick; OB.picks.has(id) ? OB.picks.delete(id) : OB.picks.add(id); pk.setAttribute("aria-pressed", OB.picks.has(id)); return; }
  const slot = e.target.closest(".slot"); if (slot && !slot.disabled) { onSlot(slot.dataset.slot); return; }
  const seg = e.target.closest(".seg button"); if (seg && !act) { const p = seg.parentElement; p.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === seg));
    if (p.id === "authMode") { authMode = seg.dataset.v; renderAuth(); } if (p.id === "segIrr") OB.irr = seg.dataset.v; if (p.id === "segPri") OB.pri = seg.dataset.v; if (p.id === "sprayTool") S.sprayTool = seg.dataset.v; if (p.id === "langSeg") setLang(seg.dataset.v); return; }
  switch (act) {
    case "lang": setLang(LANG === "en" ? "ar" : "en"); break;
    case "locate": if (!navigator.geolocation) { toast(t("locFail")); break; } navigator.geolocation.getCurrentPosition(p => map?.setView([p.coords.latitude, p.coords.longitude], 17), () => toast(t("locFail")), { enableHighAccuracy: true, timeout: 10000 }); break;
    case "undoCorner": OB.corners.pop(); drawCorners(); break;
    case "clearCorners": OB.corners = []; drawCorners(); break;
    case "square": { const du = +$("#sqArea").value; if (!(du > 0) || !map) break; const c = map.getCenter(), half = Math.sqrt(du * 1000) / 2, dlat = half / 110540, dlon = half / (111320 * Math.cos(c.lat * Math.PI / 180));
      OB.corners = [[c.lat + dlat, c.lng - dlon], [c.lat + dlat, c.lng + dlon], [c.lat - dlat, c.lng + dlon], [c.lat - dlat, c.lng - dlon]].map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]); drawCorners(); map.fitBounds(OB.corners, { padding: [30, 30] }); break; }
    case "obBack": if (OB.step === 1) { if (S.plots.length) enterMain(); else signOut(); } else { OB.step--; renderOnboard(); } break;
    case "obNext": if (OB.step === 1) { OB.step = 2; renderOnboard(); } else if (OB.step === 2) { if (validateStep2()) { OB.step = 3; renderOnboard(); runAnalysis(); } } else createPlot(); break;
    case "retryAnalyze": runAnalysis(); break;
    case "closeSheet": closeSheet(); break;
    case "waitRain": closeSheet(); await guard(async () => { const id = +a.dataset.id; const res = await api(`/plots/${S.plotId}/wait-rain`, { method: "POST", body: { tile_ids: [id] } }); if (res.rp_awarded) floatAt(id, "+" + res.rp_awarded, "#7CC8FF"); applyState(res); }); break;
    case "waterNow": irrigate(+a.dataset.id, +a.dataset.mm); break;
    case "openWater": { const tl = tileById(+a.dataset.id); closeSheet(); if (tl) waterSheet(tl); break; }
    case "refresh": await guard(loadPlot); break;
    case "goAlerts": switchTab("alerts"); break;
    case "goPlan": switchTab("plan"); break;
    case "reloadTab": loadTab(S.tab); break;
    case "alertDo": await guard(async () => { applyState(await api(`/plots/${S.plotId}/alerts/act`, { method: "POST", body: { key: a.dataset.k, idx: +a.dataset.i } })); S.alerts = await api(`/plots/${S.plotId}/alerts`); renderAlerts(); }); break;
    case "addCrop": await guard(async () => { const crops = [...P().plot.crops, a.dataset.id]; await api(`/plots/${S.plotId}`, { method: "PATCH", body: { crops } }); await loadPlot(); loadTab("plan"); }); break;
    case "plots": sheet(`<div class="stack"><h2 style="font-size:22px">${t("myPlots")}</h2>${S.plots.map(p => `<button class="list-item${p.id === S.plotId ? " on" : ""}" data-act="switchPlot" data-id="${p.id}"><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${esc(p.region)} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")}</div></div></button>`).join("")}<button class="btn" data-act="addPlot">+ ${t("addPlot")}</button></div>`); break;
    case "switchPlot": S.plotId = +a.dataset.id; store.set("fs_plot", S.plotId); S.sel = null; closeSheet(); switchTab("farm"); await guard(loadPlot); break;
    case "addPlot": closeSheet(); $("#fName").value = ""; startOnboard(); break;
    case "satRefresh": await guard(async () => { const r = await api(`/plots/${S.plotId}/satellite/refresh`, { method: "POST" }); toast(L({ en: (T.satStatus[r.status] || [r.status])[0], ar: (T.satStatus[r.status] || [r.status, r.status])[1] })); await loadPlot(); renderMore(); }); break;
    case "deletePlot": sheet(`<div class="stack"><p>${t("confirmDelete", { n: esc(P().plot.name) })}</p><button class="btn danger-btn block" data-act="deleteYes">${t("yesDelete")}</button><button class="btn ghost block" data-act="closeSheet">${t("cancel")}</button></div>`); break;
    case "deleteYes": closeSheet(); await guard(async () => { await api(`/plots/${S.plotId}`, { method: "DELETE" }); S.plots = await api("/plots"); if (S.plots.length) { S.plotId = S.plots[0].id; switchTab("farm"); await loadPlot(); } else startOnboard(); }); break;
    case "signOut": signOut(); break;
    case "tutorial": switchTab("farm"); setTimeout(() => coach(0), 120); break;
    case "coachNext": coach(+a.dataset.i); break;
    case "coachSkip": closeCoach(); store.set("fs_tut", "1"); break;
  }
});
addEventListener("resize", () => { if (!$("#scr-main").hidden) sizeFarm(); });
setInterval(() => { if (!$("#scr-main").hidden && S.tab === "farm" && !document.hidden && !$("#layer .sheet")) loadPlot().catch(() => {}); }, 10 * 60 * 1000);

/* ================= boot ================= */
(async function boot() {
  LANG = store.get("fs_lang") || ((navigator.language || "").startsWith("ar") ? "ar" : "en");
  applyI18n(); renderAuth(); requestAnimationFrame(loop);
  try { const list = await api("/crops"); list.forEach(c => S.crops[c.id] = c); } catch (e) { toast(e.message); }
  if (!TOKEN) { show("auth"); return; }
  try { S.user = await api("/me"); if (S.user.lang && !store.get("fs_lang")) { LANG = S.user.lang; applyI18n(); } await afterLogin(); }
  catch { show("auth"); }
})();
})();
