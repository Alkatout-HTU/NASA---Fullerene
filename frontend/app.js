/* Farm Studio web app. Talks to the FastAPI backend under /api. */
(() => {
"use strict";

/* ================= i18n ================= */
const T = {
appName:["Farm Studio","فارم ستوديو"],
tagline:["Plan water, spraying, frost defence and harvest from NASA Earth data, played like a farm game.","خطّط للري ورش المبيدات والحماية من الصقيع والحصاد اعتمادًا على بيانات ناسا لرصد الأرض، بأسلوب لعبة مزرعة."],
langBtn:["عربي","English"],
startBtn:["Add my field","أضف أرضي"],noAccount:["No account needed. Your farms are saved for this phone or browser.","لا حاجة لحساب. تُحفظ مزارعك لهذا الهاتف أو المتصفح."],
haveKey:["Have a farm key from another device?","لديك مفتاح مزرعة من جهاز آخر؟"],keyPh:["Paste your farm key","الصق مفتاح المزرعة"],open:["Open","فتح"],
badKey:["That key is too short. Copy the whole key from More → Your farm key.","المفتاح قصير جدًا. انسخ المفتاح كاملًا من المزيد ← مفتاح مزرعتك."],
farmKey:["Your farm key","مفتاح مزرعتك"],farmKeyHelp:["Your farms are linked to this key, not to an account. Keep a copy: paste it on another phone to see the same farms.","مزارعك مرتبطة بهذا المفتاح وليس بحساب. احتفظ بنسخة منه: الصقه في هاتف آخر لترى نفس المزارع."],
copy:["Copy","نسخ"],copied:["Copied","تم النسخ"],useOtherKey:["Open farms from another key","فتح مزارع بمفتاح آخر"],
squareSizeLbl:["Square size","حجم المربع"],along:["Along the field","بطول الأرض"],across:["Across","بعرضها"],auto:["Auto","تلقائي"],
sizeHelp:["The squares turn to follow your field's edges. Change the size to match your rows, beds or greenhouses.","تدور المربعات لتتبع حواف أرضك. غيّر الحجم ليطابق خطوطك أو أحواضك أو بيوتك البلاستيكية."],
changeSize:["Change square size","تغيير حجم المربع"],apply:["Apply","تطبيق"],resized:["Squares resized. Crops moved to the new squares.","تم تغيير حجم المربعات ونُقلت المحاصيل إليها."],
weeklyWater:["Water you have per week","المياه المتاحة أسبوعيًا"],save:["Save","حفظ"],
wpTitle:["Watering plan · next 7 days","خطة الري · الأيام السبعة القادمة"],
wpEnough:["Your {a} m³ is enough. The crops need {n} m³ this week, so {s} m³ is left over.","الـ {a} م³ تكفي. تحتاج المحاصيل {n} م³ هذا الأسبوع، ويتبقى {s} م³."],
wpShort:["Your {a} m³ covers {p}% of the {n} m³ the crops need. Every crop gets {p}% of its water; expect some stress, so water at dawn and mulch.","الـ {a} م³ تغطي {p}% من {n} م³ تحتاجها المحاصيل. كل محصول يحصل على {p}% من حاجته؛ توقّع بعض الإجهاد، فاسقِ فجرًا واستخدم التغطية."],
wpEstimate:["The weather forecast is not available right now, so this week's plan uses NASA POWER observations and long-term averages. Check again later.","توقعات الطقس غير متاحة الآن، لذلك تعتمد خطة هذا الأسبوع على مشاهدات NASA POWER والمعدلات طويلة المدى. تحقّق لاحقًا."],
wpNone:["Enter how much water you have each week to get a plan.","أدخل كمية المياه المتاحة كل أسبوع للحصول على خطة."],
wpRainfed:["This is a rain-fed field: the plan shows how much water the crops use, but no watering dates.","هذه أرض بعلية: تعرض الخطة استهلاك المحاصيل للمياه دون مواعيد ري."],
wpNoCrops:["Plant a crop to get a watering plan.","ازرع محصولًا للحصول على خطة ري."],
wpCrop:["{n} squares · {a} m² · needs {m} m³, gets {g} m³","{n} مربعات · {a} م² · يحتاج {m} م³، يحصل على {g} م³"],
wpNoDates:["No watering needed this week.","لا حاجة للري هذا الأسبوع."],wpDormant:["Resting for winter: no watering.","في سكون الشتاء: بدون ري."],
wpRain:["Rain is coming, so a watering was skipped.","المطر قادم، لذا تم تخطي ريّة."],
wpEach:["{mm} mm · {m} m³","{mm} ملم · {m} م³"],wpHow:["How this is worked out","كيف تُحسب الخطة"],
wpHowBody:["For every square we run a daily soil-water balance (FAO-56): crop water use = crop factor × reference evaporation (Open-Meteo), minus useful rain. When the root zone dries to the crop's safe limit, the plan waters it back to full. If your weekly water is less than the total, every crop gets the same share.","لكل مربع نحسب يوميًا ميزان ماء التربة (FAO-56): استهلاك المحصول = معامل المحصول × التبخر المرجعي (Open-Meteo) ناقص المطر المفيد. عندما تجف منطقة الجذور إلى الحد الآمن، تعيدها الخطة إلى الامتلاء. إذا كانت مياهك الأسبوعية أقل من المجموع، يحصل كل محصول على نفس النسبة."],
waterTodaySq:["Water this square today: {mm} mm ({m} m³).","اسقِ هذا المربع اليوم: {mm} ملم ({m} م³)."],
thisWeek:["This week","هذا الأسبوع"],openPlan:["Open the watering plan","افتح خطة الري"],
aboutTitle:["About & data","حول التطبيق والبيانات"],

signIn:["Sign in","تسجيل الدخول"],createAccount:["Create account","إنشاء حساب"],yourName:["Your name","اسمك"],
email:["E-mail","البريد الإلكتروني"],password:["Password (8+ characters)","كلمة المرور (8 أحرف أو أكثر)"],
stepOf:["Step {n} of 3","الخطوة {n} من 3"],
ob1Title:["Draw your field","ارسم حدود أرضك"],
ob1Sub:["Find your area, switch to satellite, then tap each corner of your field. Drag a corner to adjust it.","ابحث عن منطقتك، بدّل إلى صور الأقمار الصناعية، ثم اضغط على كل زاوية من أرضك. اسحب أي زاوية لتعديلها."],
searchPh:["Town, village or coordinates (32.47, 35.60)","مدينة أو قرية أو إحداثيات (32.47, 35.60)"],find:["Find","بحث"],
noPlaces:["No place in Jordan matches that. Try another spelling or the nearest town.","لا يوجد مكان في الأردن بهذا الاسم. جرّب كتابة أخرى أو أقرب مدينة."],
useLoc:["My location","موقعي"],undo:["Undo corner","تراجع"],clear:["Clear","مسح"],
area:["Field area","مساحة الأرض"],areaDunum:["Area in dunums","المساحة بالدونم"],
noCorners:["Can't see your field? Make a square from the area instead","لا ترى أرضك؟ أنشئ مربعًا من المساحة بدلًا من ذلك"],
makeSquare:["Make a square around the map centre","أنشئ مربعًا حول مركز الخريطة"],
cornersN:["{n} corners. Add at least 3.","{n} زوايا. أضف 3 على الأقل."],cornersOk:["{n} corners. Tap Next when the shape matches your field.","{n} زوايا. اضغط التالي عندما يطابق الشكل أرضك."],
squaresInfo:["Your field will be split into {n} squares. Each square is about {w} m × {h} m ({a} m²). The numbers on the edges are their lengths.","ستُقسّم أرضك إلى {n} مربعًا. كل مربع حوالي {w} م × {h} م ({a} م²). الأرقام على الأضلاع هي أطوالها."],
locFail:["Location is not available. Search for your town instead.","الموقع غير متاح. ابحث عن مدينتك بدلًا من ذلك."],
satellite:["Satellite","قمر صناعي"],streets:["Map","خريطة"],
dunum:["dunum","دونم"],dunums:["dunums","دونم"],hectare:["ha","هكتار"],
ob2Title:["About your farm","معلومات مزرعتك"],ob2Sub:["Only what we use to judge your field.","فقط ما نحتاجه لتقييم أرضك."],
plotName:["Plot name","اسم القطعة"],required:["required","مطلوب"],choose:["Choose…","اختر…"],soil:["Soil type","نوع التربة"],
soilAuto:["Not sure: look it up (SoilGrids)","لا أعرف: ابحث عنها (SoilGrids)"],soilLoam:["Loam","طميية"],soilClay:["Clay","طينية"],soilSandy:["Sandy","رملية"],soilCalc:["Calcareous","كلسية"],
errName:["Give the plot a name.","أعطِ القطعة اسمًا."],errSoil:["Pick a soil type, or “Not sure”.","اختر نوع التربة، أو «لا أعرف»."],
errWater:["Irrigated farms need the weekly water you have (m³).","المزارع المروية تحتاج كمية المياه الأسبوعية المتاحة (م³)."],errBudget:["Enter a budget above 0 JOD.","أدخل ميزانية أكبر من 0 دينار."],
errWant:["Write at least one crop you want to grow.","اكتب محصولًا واحدًا على الأقل تريد زراعته."],
farmType:["Farm type","نوع الزراعة"],rainfed:["Rain-fed","بعلية"],irrigated:["Irrigated","مروية"],both:["Both","كلاهما"],
waterAvail:["Water available (m³ per week)","المياه المتاحة (م³ أسبوعيًا)"],budget:["Budget per season (JOD)","الميزانية لكل موسم (دينار)"],
prevCrops:["Grown here last season (optional)","زُرع هنا الموسم الماضي (اختياري)"],
prevPh:["e.g. tomatoes","مثلًا: بندورة"],
noSoilHere:["The soil map (SoilGrids) has no data for this spot, which is common next to towns and roads. Please choose your soil type yourself.","خريطة التربة (SoilGrids) لا تحتوي بيانات لهذا الموقع، وهذا شائع قرب المدن والطرق. الرجاء اختيار نوع التربة بنفسك."],
chooseSoil:["Choose soil type","اختر نوع التربة"],dataUsed:["Data used ({n})","البيانات المستخدمة ({n})"],
wantCrops:["What do you want to grow?","ماذا تريد أن تزرع؟"],
wantPh:["Write the crops in your own words, e.g. tomatoes, grapes and olives","اكتب المحاصيل بكلماتك، مثلًا: بندورة، عنب وزيتون"],
priority:["What matters most","الأولوية"],priWater:["Water","المياه"],priSoil:["Soil","التربة"],priCost:["Cost","التكلفة"],
next:["Next","التالي"],back:["Back","رجوع"],analyze:["Check my crops","قيّم محاصيلي"],createPlot:["Create my farm","أنشئ مزرعتي"],
ob3Load:["Checking your crops against your land","نقيّم محاصيلك مقابل أرضك"],ob3LoadSub:["Reading NASA data for your field. This takes up to a minute.","نقرأ بيانات ناسا لأرضك. قد يستغرق ذلك حتى دقيقة."],
ob3Done:["Your land and your crops","أرضك ومحاصيلك"],ob3DoneSub:["Measured for your exact field.","مقاسة لأرضك تحديدًا."],
landProfile:["Land profile","ملف الأرض"],yourCrops:["Your crops","محاصيلك"],youWrote:["You wrote:","كتبت:"],
pickCrops:["Ticked crops go on your farm. Untick any you no longer want. You can add more later.","المحاصيل المختارة ستوضع في مزرعتك. ألغِ اختيار ما لا تريده. يمكنك إضافة المزيد لاحقًا."],
pickOne:["Tick at least one crop we recognised.","اختر محصولًا واحدًا على الأقل تعرّفنا عليه."],
verdict:{good:["Useful","مفيد"],ok:["Can work","ممكن"],poor:["Not recommended","غير منصوح به"],unknown:["Not recognised","غير معروف"]},
showWhy:["Why?","لماذا؟"],
creating:["Building your farm…","نبني مزرعتك…"],retry:["Try again","حاول مجددًا"],
resilience:["Diversity","التنوع"],
tFarm:["Farm","المزرعة"],tPlan:["Plan","الخطة"],tSpray:["Spray","الرش"],tAlerts:["Risks","المخاطر"],tMore:["More","المزيد"],
refresh:["Refresh","تحديث"],loading:["Loading live data…","تحميل البيانات الحية…"],
tapToPlant:["Tap to plant","اضغط للزراعة"],readyN:["Ready","جاهز"],needsWater:["Needs water","يحتاج ري"],harvestOn:["Harvest {d}","الحصاد {d}"],
pickSpot:["Green = best spot. Tap a square to plant {c}.","الأخضر = أفضل مكان. اضغط مربعًا لزراعة {c}."],
water:["Water","ري"],sickle:["Sickle","المنجل"],topo:["Terrain","التضاريس"],addCrop:["+ Crop","+ محصول"],
topoHint:["Blue squares sit lowest in your field: cold air and water collect there.","المربعات الزرقاء هي الأخفض: يتجمع فيها الهواء البارد والماء."],
dragHint:["Drag the sickle over golden squares to harvest them","اسحب المنجل فوق المربعات الذهبية لحصادها"],
squareSize:["Each square ≈ {w} × {h} m","كل مربع ≈ {w} × {h} م"],
outside:["Outside your field boundary","خارج حدود أرضك"],
plantTitle:["Plant {c}","زراعة {c}"],plantedOn:["Planting date","تاريخ الزراعة"],
plantHelpAnnual:["Today if you are planting now, or the real date if it is already in the ground.","اليوم إذا كنت تزرع الآن، أو التاريخ الحقيقي إذا كان مزروعًا."],
plantHelpTree:["For existing trees or vines, enter the year they were planted.","للأشجار أو الكروم الموجودة، أدخل سنة زراعتها."],
plantBtn:["Plant","ازرع"],suit:["Suitability","الملاءمة"],
holdOff:["Hold off! Rain is coming","انتظر! المطر قادم"],
holdOffBody:["{mm} mm of useful rain is forecast in the next 48 hours. Skipping this watering saves about {m} m³.","يتوقع هطول {mm} ملم من المطر المفيد خلال 48 ساعة. تأجيل هذا الري يوفر حوالي {m} م³."],
waitRain:["Wait for rain","انتظر المطر"],waterAnyway:["Water anyway","اسقِ على أي حال"],
waterTitle:["Log watering","تسجيل الري"],waterBody:["Soil water is at {p}%. Apply about {mm} mm ({m} m³ on this square) to refill the root zone.","ماء التربة عند {p}%. أضف حوالي {mm} ملم ({m} م³ لهذا المربع) لملء منطقة الجذور."],
waterDone:["I watered this amount","سقيت هذه الكمية"],mmLabel:["Amount (mm)","الكمية (ملم)"],
noNeed:["No square needs water right now.","لا يوجد مربع يحتاج ري الآن."],
harvestDates:["Harvest dates","مواعيد الحصاد"],
sickleHow:["Drag the sickle from the side bar across golden squares. Each square it touches is harvested.","اسحب المنجل من الشريط الجانبي فوق المربعات الذهبية. كل مربع يلمسه يُحصد."],
readyNow:["Ready now","جاهز الآن"],nothingPlanted:["Nothing planted yet.","لا يوجد شيء مزروع بعد."],
notReady:["Not ready · {d}","غير جاهز · {d}"],harvestedSeason:["Harvested this season","حُصد هذا الموسم"],
squareN:["Square {c}{r}","المربع {c}{r}"],emptySquare:["Empty","فارغ"],
stage:["Stage","المرحلة"],soilWater:["Soil water left","ماء التربة المتبقي"],nextWater:["Next watering","الري القادم"],
squareDims:["Square size","حجم المربع"],squareArea:["Area inside field","المساحة داخل الأرض"],
dormant:["Dormant (no irrigation)","سكون (بدون ري)"],now:["Now","الآن"],
ndvi:["NDVI (MODIS)","NDVI (MODIS)"],elev:["Elevation","الارتفاع"],slope:["Slope","الانحدار"],nightLst:["Night surface temp (ECOSTRESS)","حرارة السطح ليلًا (ECOSTRESS)"],
lowSpot:["Low spot","منطقة منخفضة"],bestFor:["Your crops here","محاصيلك هنا"],clearSquare:["Remove this crop","إزالة هذا المحصول"],
close:["Close","إغلاق"],cancel:["Cancel","إلغاء"],
seeWhat:["What to do","ماذا أفعل"],
rainIn:["Rain in {h} h","مطر خلال {h} س"],noRain:["No rain 48 h","لا مطر 48 س"],
addCropTitle:["Add a crop","إضافة محصول"],addCropBody:["Write the crop in your own words. We will tell you if it suits this field.","اكتب المحصول بكلماتك. سنخبرك إن كان يناسب هذه الأرض."],
check:["Check","تحقّق"],addToFarm:["Add to my farm","أضف إلى مزرعتي"],already:["Already on your farm","موجود في مزرعتك"],
calendar:["Crop calendar","تقويم المحاصيل"],lgPlant:["Plant","زراعة"],lgGrow:["Growing","نمو"],lgHarv:["Harvest","حصاد"],lgNow:["This month","هذا الشهر"],
calFrom:["From NASA POWER climatology {p}.","من مناخ NASA POWER للفترة {p}."],
last30:["Last 30 days vs normal (NASA POWER)","آخر 30 يومًا مقارنة بالمعتاد (NASA POWER)"],
waterWeek:["Water this week","مياه هذا الأسبوع"],need:["Crops need","تحتاج المحاصيل"],avail:["You have","المتاح لديك"],
overBudget:["You are {m} m³ short this week. Prioritise fruiting crops and water at dawn.","ينقصك {m} م³ هذا الأسبوع. أعطِ الأولوية للمحاصيل المثمرة واسقِ فجرًا."],
inBudget:["Within your water, with {m} m³ to spare.","ضمن المياه المتاحة، ويتبقى {m} م³."],
seedBank:["Seed bank","بنك البذور"],gradeWhy:["{n} crop types growing, {d} drought-tolerant.","{n} أنواع محاصيل مزروعة، {d} منها تتحمل الجفاف."],
trendTitle:["Climate trend {y}","اتجاه المناخ {y}"],
trendBody:["Rain {r}% per decade, temperature {t} °C per decade (NASA POWER).","الأمطار {r}% لكل عقد، الحرارة {t} °م لكل عقد (NASA POWER)."],
suggest:["Drought-tolerant crops that suit this field","محاصيل تتحمل الجفاف تناسب هذه الأرض"],
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
dataSources:["Data sources","مصادر البيانات"],satLayers:["NASA satellite layers","طبقات الأقمار الصناعية"],satRefresh:["Request fresh satellite data","اطلب بيانات أقمار جديدة"],
history:["Activity","السجل"],replay:["Replay tutorial","إعادة الشرح"],
fieldInfo:["Field","الأرض"],
about:["Numbers come from live NASA and weather services for your field. Recommendations follow FAO-56 and should be checked with your agricultural extension officer.","الأرقام من خدمات ناسا والطقس الحية لأرضك. التوصيات مبنية على FAO-56 ويُفضّل مراجعتها مع المرشد الزراعي."],
satStatus:{done:["Up to date","محدّثة"],submitted:["Requested from NASA","طُلبت من ناسا"],queued:["Queued at NASA","في الانتظار لدى ناسا"],pending:["Queued at NASA","في الانتظار لدى ناسا"],processing:["NASA is processing","ناسا تعالج الطلب"],error:["Error","خطأ"],not_configured:["Server has no Earthdata login","لا يوجد حساب Earthdata على الخادم"],not_started:["Not requested yet","لم تُطلب بعد"],deleted:["Expired, re-requesting","انتهت، يُعاد الطلب"]},
evKind:{plant:["Planted","زراعة"],irrigate:["Watered","ري"],wait_rain:["Waited for rain","انتظار المطر"],harvest:["Harvested","حصاد"],spray:["Spray booked","حجز رش"],alert_action:["Risk step done","خطوة استعداد"],clear:["Removed","إزالة"]},
c1t:["Your crops","محاصيلك"],c1b:["Tap a crop. The best squares for it light up green, from soil, terrain and climate.","اضغط على محصول. تضيء أفضل المربعات له بالأخضر، حسب التربة والتضاريس والمناخ."],
c2t:["Your field","أرضك"],c2b:["This is the real shape of your field, split into squares (size at the top). A drop means today is a watering day in your weekly plan. Pinch or scroll to zoom, drag to move.","هذا هو الشكل الحقيقي لأرضك مقسّمًا إلى مربعات (الحجم في الأعلى). القطرة تعني أن اليوم يوم ري في خطتك الأسبوعية. قرّب بإصبعين أو بالعجلة، واسحب للتحريك."],
c3t:["The sickle","المنجل"],c3b:["Drag it over golden squares: every square it touches is harvested. Tap it to see harvest dates.","اسحبه فوق المربعات الذهبية: كل مربع يلمسه يُحصد. اضغطه لرؤية مواعيد الحصاد."],
c4t:["Risks","المخاطر"],c4b:["Frost, heavy rain, heat and wind warnings, with what to do in the field.","تحذيرات الصقيع والأمطار والحر والرياح، مع ما يجب فعله في الحقل."],
skip:["Skip","تخطي"],gotIt:["Start farming","ابدأ الزراعة"],
netErr:["Can't reach the server. Check your connection and try again.","تعذّر الوصول إلى الخادم. تحقق من الاتصال وحاول مجددًا."],
months:[["J","F","M","A","M","J","J","A","S","O","N","D"],["ك٢","ش","آذ","ني","أي","حز","تم","آب","أي","ت١","ت٢","ك١"]],
};
let LANG = "en";
const pick2 = e => e ? (e[LANG === "ar" ? 1 : 0] ?? e[0]) : "";
const t = (k, v) => { let s = T[k] ? pick2(T[k]) : k; if (v) for (const x in v) s = String(s).replaceAll("{" + x + "}", v[x]); return s; };
const tx = o => o ? (o[LANG] ?? o.en ?? "") : "";
const loc = () => LANG === "ar" ? "ar-JO-u-nu-latn" : "en-GB";
const fmtDate = s => { if (!s) return "–"; const d = new Date(s.length === 10 ? s + "T12:00:00" : s); return d.toLocaleDateString(loc(), { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }); };
const fmtNum = (n, d = 0) => n == null || Number.isNaN(+n) ? "–" : Number(n).toLocaleString(loc(), { maximumFractionDigits: d });
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const reduceMotion = matchMedia("(prefers-reduced-motion:reduce)").matches;

function applyI18n() {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  $$("[data-t]").forEach(e => e.textContent = t(e.dataset.t));
  $$("[data-tp]").forEach(e => e.placeholder = t(e.dataset.tp));
}

/* ================= API ================= */
function newKey() { const b = new Uint8Array(24); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
let FARM_KEY = store.get("fs_key");
if (!FARM_KEY) { FARM_KEY = newKey(); store.set("fs_key", FARM_KEY); }
class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
async function api(path, { method = "GET", body } = {}) {
  let r;
  try { r = await fetch("/api" + path, { method, headers: { "Content-Type": "application/json", "X-Farm-Key": FARM_KEY }, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new ApiError(t("netErr"), 0); }
  let data = null; try { data = await r.json(); } catch {}
  if (!r.ok) { let d = data?.detail; if (Array.isArray(d)) d = d.map(x => (x.loc ? x.loc.slice(-1)[0] + ": " : "") + x.msg).join("; "); throw new ApiError(d || ("HTTP " + r.status), r.status); }
  return data;
}

/* ================= state ================= */
const S = { user: null, crops: {}, plots: [], plotId: null, state: null, sel: null, topo: false, tab: "farm", plan: null, spray: null, alerts: null, sprayTool: "tractor", pendingY: null };
const P = () => S.state;
const tileById = id => P()?.tiles.find(x => x.id === id);
const cName = id => S.crops[id] ? (LANG === "ar" ? S.crops[id].ar : S.crops[id].en) : id;

/* ================= crop sprites (shaded, cached) ================= */
function shade(col, f) {
  let n; if (col.startsWith("rgb")) { const m = col.match(/\d+/g).map(Number); n = (m[0] << 16) | (m[1] << 8) | m[2]; } else n = parseInt(col.replace("#", ""), 16);
  const k = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `rgb(${k(n >> 16)},${k(n >> 8 & 255)},${k(n & 255)})`;
}
function ball(g, x, y, r, col, outline = true) {
  if (r <= 0.1) return;
  const gr = g.createRadialGradient(x - r * .35, y - r * .45, r * .1, x, y, r);
  gr.addColorStop(0, shade(col, .35)); gr.addColorStop(.6, col); gr.addColorStop(1, shade(col, -.3));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  if (outline) { g.strokeStyle = "rgba(30,40,10,.35)"; g.lineWidth = .8; g.stroke(); }
}
function drawCrop(g, id, stage) { // draws at the origin (ground point), about 52 units wide
  const C = S.crops[id] || { shape: "bush", color: "#4E8E2E" };
  const st = Math.max(0, stage), k = .5 + .5 * Math.min(st, 3) / 3, ripe = st >= 4;
  const leaf = ripe ? "#86B03A" : "#4F9A2E", leaf2 = ripe ? "#B5C94A" : "#72B847";
  const fruit = ripe ? C.color : st >= 3 ? "#C9B04A" : "#9CC35A";
  switch (C.shape) {
    case "vine_trellis":
      g.strokeStyle = "#7A5131"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-14, 2); g.lineTo(-14, -26); g.moveTo(14, 2); g.lineTo(14, -26); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = "#9B7A55"; g.beginPath(); g.moveTo(-16, -21); g.lineTo(16, -21); g.stroke();
      for (let i = -1; i <= 1; i++) { ball(g, i * 10, -21 * k, 7.5 * k, leaf); ball(g, i * 10 + 4, -25 * k, 5.5 * k, leaf2); }
      if (st >= 3) for (let i = -1; i <= 1; i++) for (let j = 0; j < 5; j++) ball(g, i * 10 + (j % 2 ? 2 : -2), -14 + j * 2.3, 2.5, ripe ? C.color : "#A9C25E", false);
      break;
    case "tomato":
      g.strokeStyle = "#8B6A45"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -20 * k); g.stroke();
      ball(g, 0, -11 * k, 11 * k, leaf); ball(g, -7, -15 * k, 7 * k, leaf2); ball(g, 7, -14 * k, 7 * k, leaf2);
      if (st >= 2) { ball(g, -5, -8, 3.8, fruit); ball(g, 6, -11, 3.8, fruit); ball(g, 1, -17, 3.4, fruit); }
      break;
    case "tree": {
      g.fillStyle = "#6B4A2B"; g.fillRect(-2.5, -16 * k, 5, 16 * k);
      const cr = C.id === "olive" ? ["#7C8F55", "#9AAA70", "#687B44"] : ["#4F9A2E", "#78BC4A", "#3E7F25"];
      ball(g, 0, -25 * k, 14 * k, cr[0]); ball(g, -8, -20 * k, 9 * k, cr[1]); ball(g, 8, -21 * k, 9 * k, cr[2]); ball(g, 0, -32 * k, 8 * k, cr[1]);
      if (st >= 3) [[-6, -22], [5, -27], [8, -18], [-2, -30], [-9, -27]].forEach(p => ball(g, p[0] * k, p[1] * k, 2.3, fruit, false));
      break; }
    case "palm":
      g.strokeStyle = "#8A6238"; g.lineWidth = 4.5; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2, -16 * k, 0, -32 * k); g.stroke();
      g.strokeStyle = leaf; g.lineWidth = 3; g.lineCap = "round";
      for (let a = 0; a < 8; a++) { const an = Math.PI + a * Math.PI / 7; g.beginPath(); g.moveTo(0, -32 * k); g.quadraticCurveTo(Math.cos(an) * 12 * k, -40 * k, Math.cos(an) * 21 * k, -24 * k - Math.abs(Math.sin(an)) * 6 * k); g.stroke(); }
      if (st >= 3) { ball(g, -3, -28 * k, 3.2, fruit); ball(g, 3, -27 * k, 3.2, fruit); ball(g, 0, -25 * k, 3, fruit); }
      break;
    case "banana":
      g.strokeStyle = "#6E8A3A"; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -24 * k); g.stroke();
      g.fillStyle = leaf; for (let a = 0; a < 5; a++) { const an = -Math.PI / 2 + (a - 2) * .55; g.save(); g.translate(0, -24 * k); g.rotate(an); g.beginPath(); g.ellipse(9 * k, 0, 11 * k, 4 * k, 0, 0, 7); g.fill(); g.restore(); }
      if (st >= 3) for (let j = 0; j < 4; j++) ball(g, 3, -16 * k + j * 2.5, 2.6, fruit, false);
      break;
    case "vine":
      for (let i = -1; i <= 1; i++) { ball(g, i * 9, -5 * k, 7 * k, leaf); ball(g, i * 9 + 3, -8 * k, 4.5 * k, leaf2); }
      if (st >= 2) { const big = C.id === "watermelon"; g.fillStyle = fruit; g.beginPath(); g.ellipse(-4, -3, 6, big ? 4.8 : 2.6, .3, 0, 7); g.fill(); g.beginPath(); g.ellipse(7, -4, 6, big ? 4.8 : 2.6, -.3, 0, 7); g.fill(); }
      break;
    case "head":
      ball(g, 0, -7 * k, 9 * k, leaf2); ball(g, -6, -5 * k, 6 * k, leaf); ball(g, 6, -5 * k, 6 * k, leaf);
      if (st >= 2) ball(g, 0, -9 * k, 5.5 * k, ripe ? C.color : shade(leaf2, .25));
      break;
    case "leafy":
      g.strokeStyle = leaf; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2, 0); g.quadraticCurveTo(i * 5, -10 * k, i * 6, -16 * k); g.stroke(); }
      if (st >= 3) { g.fillStyle = C.color; g.beginPath(); g.ellipse(0, -1, 4, 2.2, 0, 0, 7); g.fill(); }
      break;
    case "grain": case "stalk": {
      g.strokeStyle = ripe && C.shape === "grain" ? "#C9A23F" : "#5C9A35"; g.lineWidth = 1.7;
      for (let i = -2; i <= 2; i++) { const h = (20 + ((i * 7) & 3) * 2) * k; g.beginPath(); g.moveTo(i * 5, 0); g.quadraticCurveTo(i * 5 + 2, -h / 2, i * 5 + 1, -h); g.stroke();
        g.fillStyle = C.shape === "stalk" ? (st >= 3 ? C.color : "#7DB24A") : (ripe ? C.color : "#93BD4F");
        g.beginPath(); g.ellipse(i * 5 + 1, -h - 3 * k, C.shape === "stalk" ? 2.4 : (C.id === "sorghum" ? 3.4 : 2.3), (C.shape === "stalk" ? 3 : 6) * k, 0, 0, 7); g.fill(); }
      break; }
    default: // bush
      ball(g, -6, -6 * k, 7 * k, leaf); ball(g, 5, -7 * k, 8 * k, leaf2); ball(g, 0, -12 * k, 7 * k, leaf);
      if (st >= 3) { ball(g, -5, -4, 2.5, fruit, false); ball(g, 6, -6, 2.5, fruit, false); ball(g, 0, -11, 2.3, fruit, false); }
  }
}
const spriteCache = new Map();
function sprite(id, stage, px) { // px = on-screen width in device pixels
  const b = Math.max(16, Math.min(256, Math.round(px / 8) * 8)), key = id + "|" + stage + "|" + b;
  let c = spriteCache.get(key); if (c) return c;
  c = document.createElement("canvas"); c.width = b; c.height = Math.round(b * 1.2);
  const g2 = c.getContext("2d"); g2.translate(b / 2, c.height - b * .08); g2.scale(b / 56, b / 56); drawCrop(g2, id, stage);
  if (spriteCache.size > 600) spriteCache.clear(); spriteCache.set(key, c); return c;
}
function cropIcon(cv, id, stage = 3) {
  const d = devicePixelRatio || 1, w = cv.clientWidth || 44; cv.width = w * d; cv.height = w * d;
  const g2 = cv.getContext("2d"); g2.scale(d, d); g2.fillStyle = css("--soil"); g2.beginPath(); g2.ellipse(w / 2, w * .82, w * .36, w * .11, 0, 0, 7); g2.fill();
  g2.translate(w / 2, w * .82); g2.scale(w / 50, w / 50); drawCrop(g2, id, stage);
}
const paintIcons = root => (root || document).querySelectorAll("canvas[data-icon]").forEach(c => cropIcon(c, c.dataset.icon, c.dataset.st ? +c.dataset.st : 3));

/* ================= farm scene ================= */
const cv = $("#farmCanvas"), g = cv.getContext("2d");
const TILE = 64; // world units per square (diamond width)
const cam = { s: 1, x: 0, y: 0, fitted: false };
let W = 0, H = 0, DPR = 1;
const fx = [];
let AX = 1, AY = 1; // square proportions: along / across the field
function setAspect() { const gr = P()?.plot.grid; const k = gr && gr.square_w_m && gr.square_h_m ? Math.sqrt(gr.square_w_m / gr.square_h_m) : 1; AX = Math.max(.4, Math.min(2.5, k)); AY = 1 / AX; }
const isoX = (gx, gy) => (gx * AX - gy * AY) * TILE / 2, isoY = (gx, gy) => (gx * AX + gy * AY) * TILE / 4;
function screenToGrid(sx, sy) { const wx = (sx - cam.x) / cam.s, wy = (sy - cam.y) / cam.s; const X = wx / TILE, Y = wy / TILE; return [(2 * Y + X) / AX, (2 * Y - X) / AY]; }
function sizeFarm() { const r = cv.getBoundingClientRect(); DPR = devicePixelRatio || 1; W = r.width; H = r.height; if (!W || !H) return; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); if (!cam.fitted) fitCam(); }
function grid() { return P()?.plot.grid || { cols: 6, rows: 6, outline: [[0, 0], [6, 0], [6, 6], [0, 6]], square_w_m: 0, square_h_m: 0 }; }
function fitCam() {
  const st = P(); if (!st || !W) return; setAspect(); const gr = grid();
  const pts = gr.outline.concat([[0, 0], [gr.cols, 0], [gr.cols, gr.rows], [0, gr.rows]]);
  const xs = pts.map(p => isoX(p[0], p[1])), ys = pts.map(p => isoY(p[0], p[1]));
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys) - 40, maxY = Math.max(...ys) + 20;
  const sb = 96, availW = Math.max(120, W - sb - 24), availH = Math.max(120, H - 130);
  cam.s = Math.max(.15, Math.min(availW / (maxX - minX), availH / (maxY - minY), 2.2));
  cam.x = (W - sb) / 2 - (minX + maxX) / 2 * cam.s;
  cam.y = 64 + (availH - (maxY - minY) * cam.s) / 2 - minY * cam.s;
  cam.fitted = true;
}
function zoomAt(f, sx, sy) { const ns = Math.max(.15, Math.min(4, cam.s * f)); const k = ns / cam.s; cam.x = sx - (sx - cam.x) * k; cam.y = sy - (sy - cam.y) * k; cam.s = ns; }
function pickTile(sx, sy) { const st = P(); if (!st) return null; const [gx, gy] = screenToGrid(sx, sy); const c = Math.floor(gx), r = Math.floor(gy); return st.tiles.find(x => x.c === c && x.r === r) || null; }
const stageOf = tl => tl.planting ? tl.planting.stage : -1;
const ready = tl => !!(tl.planting && tl.planting.ready);
const thirsty = tl => !!tl.planting?.water?.water_today;
const waiting = tl => !!(tl.planting?.water?.rain_postponed && !tl.planting.water.water_today);
function rnd(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function inOutline(gx, gy, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > gy) !== (yj > gy) && gx < (xj - xi) * (gy - yi) / ((yj - yi) || 1e-9) + xi) ins = !ins; } return ins; }

let decor = null, decorKey = "";
function buildDecor() {
  const gr = grid(), key = P().plot.id + ":" + gr.cols + "x" + gr.rows; if (decorKey === key) return; decorKey = key;
  const R = rnd(P().plot.id * 977 + 13), out = { trees: [], tufts: [] };
  const pad = 3, minX = -pad, maxX = gr.cols + pad, minY = -pad, maxY = gr.rows + pad;
  const nearField = (x, y) => { for (const [dx, dy] of [[0, 0], [.7, 0], [-.7, 0], [0, .7], [0, -.7]]) if (inOutline(x + dx, y + dy, gr.outline)) return true; return false; };
  for (let i = 0; i < 30; i++) { const gx = minX + R() * (maxX - minX), gy = minY + R() * (maxY - minY); if (nearField(gx, gy)) continue; out.trees.push({ gx, gy, s: .8 + R() * .5, kind: R() < .25 ? "pine" : "round" }); }
  for (let i = 0; i < 180; i++) out.tufts.push({ gx: minX - 3 + R() * (maxX - minX + 6), gy: minY - 3 + R() * (maxY - minY + 6), c: R() });
  out.barn = { gx: -1.6, gy: -1.6 }; out.pond = { gx: -2.4, gy: gr.rows * .6 + .5 };
  for (const o of [out.barn, out.pond]) { let n = 0; while (nearField(o.gx, o.gy) && n++ < 20) { o.gx -= .5; o.gy -= .3; } }
  out.trees = out.trees.filter(tr => Math.hypot(tr.gx - out.barn.gx, tr.gy - out.barn.gy) > 1.8 && Math.hypot(tr.gx - out.pond.gx, tr.gy - out.pond.gy) > 1.6);
  decor = out;
}
function polyPath(pts) { g.beginPath(); pts.forEach((p, i) => { const x = isoX(p[0], p[1]), y = isoY(p[0], p[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); }
function bedPath(tl, dy) { // rounded bed inside a square, following its real proportions
  const e = .06, pts = [[tl.c + e, tl.r + e], [tl.c + 1 - e, tl.r + e], [tl.c + 1 - e, tl.r + 1 - e], [tl.c + e, tl.r + 1 - e]].map(p => [isoX(p[0], p[1]), isoY(p[0], p[1]) + dy]);
  const r = .2; g.beginPath();
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4], c = pts[(i + 2) % 4];
    const m1 = [a[0] + (b[0] - a[0]) * (1 - r), a[1] + (b[1] - a[1]) * (1 - r)], m2 = [b[0] + (c[0] - b[0]) * r, b[1] + (c[1] - b[1]) * r];
    i ? g.lineTo(m1[0], m1[1]) : g.moveTo(m1[0], m1[1]); g.quadraticCurveTo(b[0], b[1], m2[0], m2[1]); }
  g.closePath();
}
function roundDiamond(cx, cy, w, h, r) {
  const pts = [[cx, cy - h / 2], [cx + w / 2, cy], [cx, cy + h / 2], [cx - w / 2, cy]];
  g.beginPath();
  for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4], c = pts[(i + 2) % 4];
    const m1 = [a[0] + (b[0] - a[0]) * (1 - r), a[1] + (b[1] - a[1]) * (1 - r)], m2 = [b[0] + (c[0] - b[0]) * r, b[1] + (c[1] - b[1]) * r];
    i ? g.lineTo(m1[0], m1[1]) : g.moveTo(m1[0], m1[1]); g.quadraticCurveTo(b[0], b[1], m2[0], m2[1]); }
  g.closePath();
}
function drawTree(x, y, s, kind) {
  g.fillStyle = "rgba(20,40,10,.22)"; g.beginPath(); g.ellipse(x + 6 * s, y + 2, 16 * s, 6 * s, 0, 0, 7); g.fill();
  g.fillStyle = "#6B4A2B"; g.fillRect(x - 3 * s, y - 16 * s, 6 * s, 16 * s);
  if (kind === "pine") { for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? "#3D7A33" : "#4A8A3C"; g.beginPath(); g.moveTo(x, y - (54 - i * 10) * s); g.lineTo(x + (14 + i * 4) * s, y - (24 - i * 6) * s); g.lineTo(x - (14 + i * 4) * s, y - (24 - i * 6) * s); g.closePath(); g.fill(); } }
  else { ball(g, x, y - 30 * s, 17 * s, "#4E9A35"); ball(g, x - 10 * s, y - 22 * s, 11 * s, "#62B045"); ball(g, x + 10 * s, y - 24 * s, 11 * s, "#3F8A2C"); ball(g, x + 2 * s, y - 40 * s, 9 * s, "#6FBF4E"); }
}
function drawBarn(x, y) {
  g.fillStyle = "rgba(20,40,10,.25)"; g.beginPath(); g.ellipse(x + 8, y + 6, 48, 16, 0, 0, 7); g.fill();
  g.fillStyle = "#C2412B"; g.beginPath(); g.moveTo(x - 34, y - 6); g.lineTo(x, y + 12); g.lineTo(x, y - 30); g.lineTo(x - 34, y - 48); g.fill();
  g.fillStyle = "#9E3320"; g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x + 34, y - 6); g.lineTo(x + 34, y - 48); g.lineTo(x, y - 30); g.fill();
  g.strokeStyle = "#F6EAD0"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 34, y - 6); g.lineTo(x, y + 12); g.lineTo(x + 34, y - 6); g.stroke();
  g.fillStyle = "#6E4A33"; g.beginPath(); g.moveTo(x - 38, y - 46); g.lineTo(x - 4, y - 78); g.lineTo(x + 38, y - 46); g.lineTo(x, y - 28); g.fill();
  g.fillStyle = "#8C5E40"; g.beginPath(); g.moveTo(x - 4, y - 78); g.lineTo(x + 38, y - 46); g.lineTo(x + 34, y - 44); g.lineTo(x - 6, y - 74); g.fill();
  g.fillStyle = "#F6EAD0"; g.fillRect(x + 8, y - 22, 16, 20); g.strokeStyle = "#9E3320"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 8, y - 22); g.lineTo(x + 24, y - 2); g.moveTo(x + 24, y - 22); g.lineTo(x + 8, y - 2); g.stroke();
}
function drawPond(x, y) {
  g.fillStyle = "#8C6A45"; g.beginPath(); g.ellipse(x, y + 2, 50, 22, 0, 0, 7); g.fill();
  const gr = g.createLinearGradient(x, y - 20, x, y + 20); gr.addColorStop(0, "#7CC6EA"); gr.addColorStop(1, "#3E94C9");
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 46, 19, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x - 12, y - 5, 12, 3, 0, 0, Math.PI); g.stroke();
}
function fenceItems(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / .55));
    for (let k = 0; k < n; k++) {
      const p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], q = [a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n];
      const x1 = isoX(...p), y1 = isoY(...p), x2 = isoX(...q), y2 = isoY(...q);
      out.push({ y: (y1 + y2) / 2, draw: () => {
        g.strokeStyle = "#8A5E3B"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x1, y1 - 9); g.lineTo(x2, y2 - 9); g.moveTo(x1, y1 - 4); g.lineTo(x2, y2 - 4); g.stroke();
        g.fillStyle = "#6E4A2E"; g.fillRect(x1 - 1.6, y1 - 13, 3.2, 13); g.fillStyle = "#A87A50"; g.fillRect(x1 - 1.6, y1 - 13, 3.2, 2); } });
    }
  }
  return out;
}
function plantSpots(tl) {
  const shape = (S.crops[tl.planting.crop] || {}).shape;
  if (["tree", "palm", "banana"].includes(shape)) return { pts: [[.5, .55]], sc: 1.25 };
  if (shape === "vine_trellis") return { pts: [[.28, .45], [.72, .6]], sc: .85 };
  return { pts: [[.27, .27], [.73, .27], [.5, .5], [.27, .73], [.73, .73]], sc: .68 };
}
function drawFarm(now) {
  const st = P(); if (!st || !W) return; setAspect(); buildDecor();
  const gr = grid(), poly = gr.outline;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = g.createRadialGradient(W * .45, H * .45, 20, W * .45, H * .5, Math.max(W, H));
  bg.addColorStop(0, css("--grass")); bg.addColorStop(1, css("--grass-dk"));
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.setTransform(DPR * cam.s, 0, 0, DPR * cam.s, DPR * cam.x, DPR * cam.y);
  const sway = reduceMotion ? 0 : now / 900;
  decor.tufts.forEach(tf => { const x = isoX(tf.gx, tf.gy), y = isoY(tf.gx, tf.gy); g.strokeStyle = tf.c > .5 ? "rgba(255,255,255,.16)" : "rgba(30,70,20,.25)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x - 4, y - 5); g.moveTo(x, y); g.lineTo(x, y - 7); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 5); g.stroke(); if (tf.c > .93) ball(g, x + 6, y - 3, 2, tf.c > .965 ? "#F4D03F" : "#F2F2F2", false); });
  drawPond(isoX(decor.pond.gx, decor.pond.gy), isoY(decor.pond.gx, decor.pond.gy));
  // the field: raised earth in its real shape, beds clipped to it
  g.save(); g.translate(0, 5); polyPath(poly); g.fillStyle = "#6B4528"; g.fill(); g.restore();
  polyPath(poly); g.fillStyle = "#9A6B43"; g.fill(); g.strokeStyle = "rgba(60,35,15,.45)"; g.lineWidth = 2; g.stroke();
  g.save(); polyPath(poly); g.clip();
  const soil = css("--soil");
  st.tiles.forEach(tl => {
    if (!tl.inside) return;
    const cx = isoX(tl.c + .5, tl.r + .5), cy = isoY(tl.c + .5, tl.r + .5);
    const w = tl.planting?.water, wet = w ? Math.max(0, Math.min(1, w.available_pct / 100)) : .45;
    const base = shade(soil, .08 - .38 * wet);
    bedPath(tl, 3); g.fillStyle = shade(base, -.35); g.fill();
    bedPath(tl, 0);
    const bgr = g.createLinearGradient(cx, cy - TILE * .22, cx, cy + TILE * .22); bgr.addColorStop(0, shade(base, .18)); bgr.addColorStop(1, shade(base, -.08));
    g.fillStyle = bgr; g.fill();
    g.save(); bedPath(tl, 0); g.clip(); g.strokeStyle = shade(base, .28); g.lineWidth = 1.6;
    for (let i = 1; i <= 4; i++) { const f = i / 5; g.beginPath(); g.moveTo(isoX(tl.c + f, tl.r + .08), isoY(tl.c + f, tl.r + .08)); g.lineTo(isoX(tl.c + f, tl.r + .92), isoY(tl.c + f, tl.r + .92)); g.stroke(); }
    g.restore();
    let overlay = null;
    if (S.topo && tl.low) overlay = "rgba(47,127,181,.5)";
    if (S.sel && !tl.planting) { const s = tl.suitability?.[S.sel] ?? 0; if (s >= 75) overlay = `rgba(90,210,80,${.45 + .15 * Math.sin(now / 250)})`; else if (s >= 55) overlay = "rgba(240,200,60,.45)"; }
    if (overlay) { bedPath(tl, 0); g.fillStyle = overlay; g.fill(); }
    if (ready(tl) && !overlay) { bedPath(tl, 0); g.fillStyle = `rgba(250,200,70,${.22 + .1 * Math.sin(now / 300)})`; g.fill(); }
    if (sickle.active && sickle.hover === tl.id) { bedPath(tl, 0); g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke(); }
  });
  g.restore();
  const items = fenceItems(poly);
  st.tiles.forEach(tl => {
    if (!tl.inside || !tl.planting) return;
    const sp = plantSpots(tl), stg = stageOf(tl), wpx = TILE * sp.sc * cam.s * DPR, crop = tl.planting.crop;
    sp.pts.forEach((p, i) => { const gx = tl.c + p[0], gy = tl.r + p[1], x = isoX(gx, gy), y = isoY(gx, gy), ph = (tl.id * 7 + i) % 10;
      items.push({ y, draw: () => { g.fillStyle = "rgba(40,25,10,.25)"; g.beginPath(); g.ellipse(x, y, TILE * sp.sc * .32, TILE * sp.sc * .1, 0, 0, 7); g.fill();
        const img = sprite(crop, stg, wpx), sw = TILE * sp.sc, sh = sw * 1.2;
        g.save(); g.translate(x, y); g.rotate(Math.sin(sway + ph) * .035); g.drawImage(img, -sw / 2, -sh + sw * .08, sw, sh); g.restore(); } }); });
  });
  decor.trees.forEach(tr => { const x = isoX(tr.gx, tr.gy), y = isoY(tr.gx, tr.gy); items.push({ y, draw: () => drawTree(x, y, tr.s, tr.kind) }); });
  { const x = isoX(decor.barn.gx, decor.barn.gy), y = isoY(decor.barn.gx, decor.barn.gy); items.push({ y, draw: () => drawBarn(x, y) }); }
  items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
  const bob = reduceMotion ? 0 : Math.sin(now / 300) * 2.5;
  st.tiles.forEach(tl => {
    let kind = null; if (thirsty(tl)) kind = "w"; else if (waiting(tl)) kind = "c"; else if (ready(tl)) kind = "h"; if (!kind) return;
    const x = isoX(tl.c + .5, tl.r + .5), y = isoY(tl.c + .5, tl.r + .5) - TILE * .62 + bob, R = 10;
    g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(x, y + R + 8, 6, 2, 0, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.strokeStyle = kind === "w" ? css("--water") : kind === "h" ? "#E0A21F" : "#8AA"; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.moveTo(x - 3, y + R - 1); g.lineTo(x, y + R + 5); g.lineTo(x + 3, y + R - 1); g.fillStyle = "#fff"; g.fill();
    if (kind === "w") { g.fillStyle = css("--water"); g.beginPath(); g.moveTo(x, y - 6); g.quadraticCurveTo(x + 5.5, y + .5, x, y + 5); g.quadraticCurveTo(x - 5.5, y + .5, x, y - 6); g.fill(); }
    else if (kind === "c") { [[-3, 1, 4], [2, -1, 5], [5, 2, 3.5]].forEach(b => ball(g, x + b[0], y + b[1], b[2], "#9DB3C2", false)); }
    else { g.strokeStyle = "#E0A21F"; g.lineWidth = 2.4; g.beginPath(); g.arc(x + 1, y + 1, 5, Math.PI * 1.1, Math.PI * 1.95); g.stroke(); g.strokeStyle = "#7A5131"; g.beginPath(); g.moveTo(x - 3, y + 5); g.lineTo(x - 6, y + 8); g.stroke(); }
  });
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i], a = (now - f.t) / 1300; if (a > 1) { fx.splice(i, 1); continue; }
    g.globalAlpha = 1 - a; g.font = "800 14px " + css("--f-display"); g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,.4)"; g.fillStyle = f.col;
    g.strokeText(f.s, f.x, f.y - a * 34); g.fillText(f.s, f.x, f.y - a * 34); g.globalAlpha = 1;
    if (f.burst) for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2; ball(g, f.x + Math.cos(an) * a * 26, f.y + 10 + Math.sin(an) * a * 14 - a * 10, 3 * (1 - a), f.burst, false); } }
}
function floatAt(tileId, s, col, burst) { const tl = tileById(tileId); if (!tl) return; fx.push({ x: isoX(tl.c + .5, tl.r + .5), y: isoY(tl.c + .5, tl.r + .5) - 18, s, col: col || "#FFE07A", burst, t: performance.now() }); }

/* welcome scene */
const wcv = $("#welcomeCanvas"), wg = wcv.getContext("2d");
function drawWelcome(now) {
  const d = devicePixelRatio || 1, r = wcv.getBoundingClientRect(); if (r.width < 40 || r.height < 60) return;
  if (wcv.width !== Math.round(r.width * d) || wcv.height !== Math.round(r.height * d)) { wcv.width = r.width * d; wcv.height = r.height * d; }
  wg.setTransform(d, 0, 0, d, 0, 0); wg.clearRect(0, 0, r.width, r.height);
  const w = r.width, h = r.height, tw = Math.min(w / 6.5, (h - 30) / 3.6, 76), th = tw / 2, cx = w / 2, cy = Math.max(20, (h - 4 * th * 1.9) / 2 + 16), M = 4;
  const tpt = (c, rr) => ({ x: cx + (c - rr) * tw / 2, y: cy + (c + rr) * th / 2 });
  const T0 = tpt(-.4, -.4), R0 = tpt(M + .4, -.4), B0 = tpt(M + .4, M + .4), L0 = tpt(-.4, M + .4), dd = tw * .22;
  wg.fillStyle = "#6B4528"; wg.beginPath(); wg.moveTo(L0.x, L0.y); wg.lineTo(B0.x, B0.y); wg.lineTo(R0.x, R0.y); wg.lineTo(R0.x, R0.y + dd); wg.lineTo(B0.x, B0.y + dd); wg.lineTo(L0.x, L0.y + dd); wg.fill();
  wg.fillStyle = css("--grass"); wg.beginPath(); wg.moveTo(T0.x, T0.y); wg.lineTo(R0.x, R0.y); wg.lineTo(B0.x, B0.y); wg.lineTo(L0.x, L0.y); wg.fill();
  for (let i = 0; i < 16; i++) { const q = tpt(i % 4, i >> 2); wg.fillStyle = "#9A6B43"; wg.beginPath(); wg.moveTo(q.x, q.y + th * .1); wg.lineTo(q.x + tw * .42, q.y + th / 2); wg.lineTo(q.x, q.y + th * .9); wg.lineTo(q.x - tw * .42, q.y + th / 2); wg.fill(); }
  if (!Object.keys(S.crops).length) return;
  const crops = ["grape", "tomato", "olive", "date", "wheat", "squash", "citrus", "cabbage", "grape", "tomato", "pomegranate", "lettuce", "sorghum", "olive", "strawberry", "banana"];
  for (let s = 0; s <= 6; s++) for (let i = 0; i < 16; i++) { const c = i % 4, rr = i >> 2; if (c + rr !== s) continue; const q = tpt(c, rr);
    const img = sprite(crops[i], i % 3 === 0 ? 4 : Math.max(2, (i * 5 + Math.floor(now / 1600)) % 5), tw * d), sw = tw * .82, sh = sw * 1.2;
    wg.drawImage(img, q.x - sw / 2, q.y + th * .62 - sh + sw * .08, sw, sh); }
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
function busy(on) { $("#farmLoading").hidden = !on; }
async function guard(fn) { try { return await fn(); } catch (e) { toast(e.message || String(e)); console.error(e); } }
const verdictPill = v => `<span class="verdict ${v}">${esc(pick2(T.verdict[v] || T.verdict.unknown))}</span>`;
function whyList(reasons) { return reasons?.length ? `<ul class="why">${reasons.map(r => `<li class="${r.kind === "-" ? "minus" : r.kind === "+" ? "plus" : ""}">${esc(tx(r))}</li>`).join("")}</ul>` : ""; }

/* ================= screens ================= */
function show(id) { ["auth", "onboard", "main"].forEach(k => $("#scr-" + k).hidden = k !== id); }

/* ---- start ---- */
async function afterStart() {
  S.plots = await api("/plots");
  if (!S.plots.length) { show("auth"); return; }
  const last = +store.get("fs_plot"); S.plotId = S.plots.some(p => p.id === last) ? last : S.plots[0].id;
  await enterMain();
}
function useKey(k) {
  k = (k || "").trim(); if (k.length < 24) { toast(t("badKey")); return; }
  FARM_KEY = k; store.set("fs_key", k); store.set("fs_plot", null); location.reload();
}
$("#keyForm").addEventListener("submit", e => { e.preventDefault(); useKey($("#keyIn").value); });

/* ---- onboarding: map ---- */
const REGIONS = [
  ["North Ghor", "الأغوار الشمالية", 32.47, 35.60, 12], ["Central Ghor (Deir Alla)", "الأغوار الوسطى (دير علا)", 32.20, 35.62, 12], ["South Ghor (Safi)", "الأغوار الجنوبية (الصافي)", 31.03, 35.47, 12],
  ["Irbid", "إربد", 32.55, 35.85, 12], ["Ajloun", "عجلون", 32.33, 35.75, 12], ["Jerash", "جرش", 32.28, 35.90, 12], ["Balqa (Salt)", "البلقاء (السلط)", 32.04, 35.73, 12],
  ["Amman", "عمّان", 31.95, 35.93, 11], ["Madaba", "مادبا", 31.72, 35.79, 12], ["Zarqa", "الزرقاء", 32.07, 36.09, 12], ["Mafraq", "المفرق", 32.34, 36.21, 11],
  ["Azraq", "الأزرق", 31.88, 36.83, 12], ["Karak", "الكرك", 31.18, 35.70, 12], ["Tafilah", "الطفيلة", 30.84, 35.60, 12], ["Shoubak", "الشوبك", 30.53, 35.56, 12],
  ["Ma'an", "معان", 30.19, 35.73, 11], ["Disi", "الديسي", 29.80, 35.33, 11], ["Aqaba", "العقبة", 29.53, 35.01, 12],
];
const OB = { step: 1, corners: [], irr: "irr", pri: "water", prev: new Set(), picks: new Set(), analysis: null, loading: false, sq: null, preview: null, previewErr: null };
let map = null, mapLayer = null, gridLayer = null;
function areaM2(poly) { if (poly.length < 3) return 0; const lat0 = poly.reduce((s, p) => s + p[0], 0) / poly.length; const k = 111320 * Math.cos(lat0 * Math.PI / 180); let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; s += (a[1] * k) * (b[0] * 110540) - (b[1] * k) * (a[0] * 110540); } return Math.abs(s) / 2; }
function metres(a, b) { const lat0 = (a[0] + b[0]) / 2, k = 111320 * Math.cos(lat0 * Math.PI / 180); return Math.hypot((a[1] - b[1]) * k, (a[0] - b[0]) * 110540); }
function initMap() {
  if (map || !window.L) return;
  map = window.L.map("leafletMap", { zoomControl: true, maxBounds: [[28.8, 34.6], [33.6, 39.6]], maxBoundsViscosity: .6, minZoom: 7 }).setView([31.3, 36.3], 7);
  const sat = window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" });
  const osm = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" });
  sat.addTo(map);
  window.L.control.layers({ [t("satellite")]: sat, [t("streets")]: osm }, null, { position: "topright" }).addTo(map);
  gridLayer = window.L.layerGroup().addTo(map); mapLayer = window.L.layerGroup().addTo(map);
  map.on("click", e => { OB.corners.push([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]); drawCorners(); });
}
function drawCorners() {
  if (!mapLayer) return; mapLayer.clearLayers(); gridLayer.clearLayers(); const L = window.L, C = OB.corners;
  if (C.length >= 2) L.polygon(C, { color: "#FFB547", weight: 3, fillOpacity: C.length >= 3 ? .12 : 0, interactive: false }).addTo(mapLayer);
  if (C.length >= 2) for (let i = 0; i < C.length; i++) { if (C.length === 2 && i === 1) break; const a = C[i], b = C[(i + 1) % C.length];
    L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { interactive: false, icon: L.divIcon({ className: "", html: `<span class="edge-label">${fmtNum(metres(a, b))} m</span>`, iconSize: null }) }).addTo(mapLayer); }
  C.forEach((c, i) => { const m = L.marker(c, { draggable: true, icon: L.divIcon({ className: "", html: '<div class="corner-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(mapLayer);
    m.on("drag", ev => { const p = ev.target.getLatLng(); OB.corners[i] = [+p.lat.toFixed(6), +p.lng.toFixed(6)]; }); m.on("dragend", () => drawCorners()); });
  const a = areaM2(C), info = $("#squareInfo");
  $("#areaOut").textContent = C.length >= 3 ? `${fmtNum(a / 1000, 1)} ${t("dunums")} · ${fmtNum(a / 10000, 2)} ${t("hectare")}` : "–";
  $("#cornerHint").textContent = C.length >= 3 ? t("cornersOk", { n: C.length }) : t("cornersN", { n: C.length });
  $("#sizeBox").hidden = !(C.length >= 3 && a >= 100);
  if (C.length >= 3 && a >= 100) schedulePreview(); else { info.hidden = true; OB.preview = null; }
  updateObNext();
}
let previewT = null, previewSeq = 0;
function schedulePreview() { clearTimeout(previewT); previewT = setTimeout(runPreview, 250); }
async function runPreview() {
  const C = OB.corners, info = $("#squareInfo"), seq = ++previewSeq; if (C.length < 3) return;
  try {
    const g2 = await api("/grid/preview", { method: "POST", body: { polygon: C, square_w_m: OB.sq?.w ?? null, square_h_m: OB.sq?.h ?? null } });
    if (seq !== previewSeq) return;
    OB.preview = g2; OB.previewErr = null; gridLayer.clearLayers();
    g2.shapes.forEach(sh => window.L.polygon(sh, { color: "#fff", weight: 1, opacity: .75, fillOpacity: 0, interactive: false }).addTo(gridLayer));
    if (!OB.sq) { $("#sqW").value = g2.square_w_m; $("#sqH").value = g2.square_h_m; }
    info.className = "note info"; info.hidden = false;
    info.innerHTML = `<span>${t("squaresInfo", { n: g2.squares, w: fmtNum(g2.square_w_m), h: fmtNum(g2.square_h_m), a: fmtNum(g2.square_area_m2) })}</span>`;
  } catch (e) {
    if (seq !== previewSeq) return;
    OB.preview = null; OB.previewErr = e.message; gridLayer.clearLayers();
    info.className = "note err"; info.hidden = false; info.innerHTML = `<span>${esc(e.message)}</span>`;
  }
  updateObNext();
}
function readSize(wSel, hSel) {
  const w = +$(wSel).value, h = +$(hSel).value || w;
  return w >= 3 ? { w, h: h >= 3 ? h : w } : null;
}
["#sqW", "#sqH"].forEach(sel => $(sel).addEventListener("input", () => { OB.sq = readSize("#sqW", "#sqH"); if (OB.sq) schedulePreview(); }));
let placeResults = [];
async function searchPlace(q) {
  const box = $("#placeResults"); q = q.trim(); if (!q) return;
  const m = q.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (m) { const la = +m[1], lo = +m[2]; if (la > 28 && la < 34 && lo > 34 && lo < 40) { map.setView([la, lo], 17); box.hidden = true; return; } }
  box.hidden = false; box.innerHTML = `<div class="empty"><span class="spinner"></span></div>`;
  try {
    placeResults = await api(`/geo/search?q=${encodeURIComponent(q)}&lang=${LANG}`);
    box.innerHTML = placeResults.length ? placeResults.map((r, i) => `<button type="button" data-place="${i}"><b>${esc(r.name)}</b><small>${esc(r.detail)}</small></button>`).join("") : `<p class="muted" style="margin:8px">${t("noPlaces")}</p>`;
  } catch (e) { box.innerHTML = `<p class="muted" style="margin:8px">${esc(e.message)}</p>`; }
}
function goPlace(r) { if (r.bbox) map.fitBounds([[r.bbox[0], r.bbox[2]], [r.bbox[1], r.bbox[3]]], { maxZoom: 16 }); else map.setView([r.lat, r.lon], 15); $("#placeResults").hidden = true; }
const regionChips = () => REGIONS.map((r, i) => `<button type="button" class="chip" data-region="${i}">${esc(LANG === "ar" ? r[1] : r[0])}</button>`).join("");

/* ---- onboarding: steps ---- */
function startOnboard() {
  Object.assign(OB, { step: 1, corners: [], analysis: null, loading: false, sq: null, preview: null, previewErr: null }); OB.picks.clear(); OB.prev.clear();
  $("#sqW").value = ""; $("#sqH").value = "";
  ["#fName", "#fWater", "#fBudget", "#fWant", "#fPrev"].forEach(s => $(s).value = ""); $("#fSoil").value = ""; $("#wantPreview").innerHTML = ""; $("#prevPreview").innerHTML = "";
  $$("#ob2 .field.bad").forEach(f => { f.classList.remove("bad"); f.querySelector(".err").hidden = true; });
  show("onboard"); closeSheet(); renderOnboard(); $("#regionChips").innerHTML = regionChips();
  setTimeout(() => { initMap(); map?.invalidateSize(); drawCorners(); }, 50);
}
function updateObNext() {
  const b = $("#obNextBtn"); b.textContent = OB.step === 1 ? t("next") : OB.step === 2 ? t("analyze") : t("createPlot");
  b.disabled = OB.loading || (OB.step === 1 && (OB.corners.length < 3 || areaM2(OB.corners) < 100 || !!OB.previewErr)) || (OB.step === 3 && !OB.analysis);
}
function renderOnboard() {
  if (OB.shownStep !== OB.step) { OB.shownStep = OB.step; $("#ob" + OB.step).scrollTop = 0; }
  $("#obStepLabel").textContent = t("stepOf", { n: OB.step });
  [1, 2, 3].forEach(i => { $("#st" + i).classList.toggle("on", i <= OB.step); $("#ob" + i).hidden = i !== OB.step; });
  if (OB.step === 1) { drawCorners(); setTimeout(() => map?.invalidateSize(), 30); }
  if (OB.step === 3) renderAnalysis();
  updateObNext();
}
function livePreview(input, box, onMatch) {
  let timer = null;
  $(input).addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(async () => {
    const txt = $(input).value; if (!txt.trim()) { $(box).innerHTML = ""; onMatch?.([]); return; }
    try { const ms = await api(`/crops/match?text=${encodeURIComponent(txt)}`); onMatch?.(ms);
      $(box).innerHTML = ms.map(m => m.crop ? `<span class="chip">✓ ${esc(cName(m.crop))}</span>` : `<span class="chip unknown">? ${esc(m.text)}</span>`).join(""); } catch {}
  }, 350); });
}
livePreview("#fWant", "#wantPreview");
livePreview("#fPrev", "#prevPreview", ms => { OB.prev = new Set(ms.filter(m => m.crop).map(m => m.crop)); });
["#fName", "#fSoil", "#fWater", "#fBudget", "#fWant"].forEach(sel => $(sel).addEventListener(sel === "#fSoil" ? "change" : "input", () => {
  const w = $(sel).closest(".field"); if (w.classList.contains("bad")) { w.classList.remove("bad"); w.querySelector(".err").hidden = true; } }));
function fieldErr(wrap, bad) { $(wrap).classList.toggle("bad", bad); $(wrap + " .err").hidden = !bad; return !bad; }
function validateStep2() {
  let ok = true;
  ok = fieldErr("#fNameWrap", !$("#fName").value.trim()) && ok;
  ok = fieldErr("#fSoilWrap", !$("#fSoil").value) && ok;
  ok = fieldErr("#fWaterWrap", OB.irr !== "rain" && !(+$("#fWater").value > 0)) && ok;
  ok = fieldErr("#fBudgetWrap", !(+$("#fBudget").value > 0)) && ok;
  ok = fieldErr("#fWantWrap", !$("#fWant").value.trim()) && ok;
  if (!ok) $("#ob2 .field.bad")?.scrollIntoView({ behavior: "smooth", block: "center" });
  return ok;
}
function farmInputs() { return { polygon: OB.corners, soil: $("#fSoil").value, farm_type: OB.irr, water_m3_week: +$("#fWater").value || 0, priority: OB.pri, prev_crops: [...OB.prev], keep_crops: [], wanted: $("#fWant").value.trim(), square_w_m: OB.sq?.w ?? null, square_h_m: OB.sq?.h ?? null, lang: LANG }; }
async function runAnalysis() {
  OB.loading = true; OB.analysis = null; renderOnboard();
  try { OB.analysis = await api("/analyze", { method: "POST", body: farmInputs() }); OB.picks.clear(); OB.analysis.wanted.forEach(x => { if (x.crop && x.verdict !== "poor") OB.picks.add(x.crop); }); $("#ob3Err").hidden = true; }
  catch (e) {
    const soilErr = e.status === 422 || /soil/i.test(e.message);
    $("#ob3Err").innerHTML = soilErr
      ? `${esc(e.status === 422 && /not answering/.test(e.message) ? (LANG === "ar" ? "خدمة خريطة التربة (SoilGrids) لا تستجيب الآن. الرجاء اختيار نوع التربة بنفسك." : e.message) : t("noSoilHere"))} <button class="btn sm" data-act="pickSoil" style="margin-top:8px">${t("chooseSoil")}</button>`
      : `${esc(e.message)} <button class="btn sm ghost" data-act="retryAnalyze" style="margin-top:8px">${t("retry")}</button>`;
    $("#ob3Err").hidden = false; }
  OB.loading = false; renderOnboard();
}
function evalCard(x, checkable) {
  const known = !!x.crop, tag = checkable && known ? "button" : "div";
  const attrs = checkable && known ? ` type="button" data-pick="${x.crop}" aria-pressed="${OB.picks.has(x.crop)}"` : "";
  const named = known && cName(x.crop).toLowerCase() !== x.text.toLowerCase() ? ` <span class="muted" style="font-weight:500">→ ${esc(cName(x.crop))}</span>` : "";
  return `<${tag}${attrs} class="rec${known ? "" : " unknown"}" style="text-align:start;align-items:start">
    ${known ? `<canvas data-icon="${x.crop}"></canvas>` : `<span style="width:44px;height:44px;display:grid;place-items:center;font-size:22px">?</span>`}
    <div style="min-width:0"><div class="row between" style="gap:8px;flex-wrap:wrap"><b>${esc(x.text)}${named}</b>${verdictPill(x.verdict)}</div>
      ${known ? `<div class="bar"><i style="width:${x.score}%;background:${x.score >= 75 ? css("--ok") : x.score >= 55 ? css("--warn") : css("--danger")}"></i></div>` : ""}
      <div style="font-size:13px;margin-top:5px">${esc(tx(x.summary))}</div>
      ${known ? `<details><summary class="muted" style="font-size:12.5px;cursor:pointer">${t("showWhy")} · <span class="mono">${x.score}%</span></summary>${whyList(x.reasons)}</details>` : ""}</div>
    ${checkable && known ? `<span class="check"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" fill="none" stroke="#fff" stroke-width="2.4"/></svg></span>` : "<span></span>"}
  </${tag}>`;
}
function renderAnalysis() {
  const a = OB.analysis;
  $("#ob3Title").textContent = a ? t("ob3Done") : t("ob3Load"); $("#ob3Sub").textContent = a ? t("ob3DoneSub") : t("ob3LoadSub");
  const names = ["NASA POWER climatology", "NASA POWER monthly", "NASA POWER daily", ...($("#fSoil").value === "auto" ? ["ISRIC SoilGrids"] : []), "Elevation"];
  const srcs = a ? a.sources : names.map(n => ({ name: n, loading: OB.loading }));
  $("#srcSummary").textContent = t("dataUsed", { n: srcs.length }); $("#srcWrap").open = !a;
  $("#srcList").innerHTML = srcs.map(s => `<div class="src ${s.loading ? "loading" : s.ok ? "done" : ""}"><span class="dot"></span><div><b>${esc(s.name)}</b><small>${esc(s.detail || s.error || "")}</small></div><span class="mono muted" style="font-size:12px">${s.fetched_at ? new Date(s.fetched_at).toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit" }) : ""}</span></div>`).join("");
  $("#ob3Results").hidden = !a; if (!a) return;
  const p = a.profile, m = (v, lbl) => `<div class="metric"><b class="mono">${v}</b><span>${lbl}</span></div>`;
  $("#profile").innerHTML = [
    m(`${fmtNum(p.area_m2 / 1000, 1)}`, t("dunums")),
    m(`${fmtNum(p.elevation_m)} m`, tx({ en: "elevation", ar: "الارتفاع" })),
    m(`${fmtNum(p.mean_temp_c, 1)} °C`, "NASA POWER · " + tx({ en: "mean temperature", ar: "متوسط الحرارة" })),
    m(`${fmtNum(p.rain_mm_year)} mm`, "NASA POWER · " + tx({ en: "rain per year", ar: "أمطار سنوية" })),
    m(`${fmtNum(p.frost_days_year, 1)}`, "NASA POWER · " + tx({ en: "frost days / year", ar: "أيام صقيع / سنة" })),
    m(esc(p.soil_texture_name[LANG === "ar" ? 1 : 0]), (p.soil_source === "SoilGrids" ? "SoilGrids · " : "") + tx({ en: `soil, holds ${p.awc_mm_per_m} mm/m`, ar: `التربة، تحفظ ${p.awc_mm_per_m} ملم/م` })),
  ].join("");
  const tr = p.trend;
  $("#trendNote").innerHTML = tr ? `<div class="note ${tr.rain_pct_per_decade <= -5 ? "" : "info"}"><span><b>${t("trendTitle", { y: tr.years })}</b><br>${t("trendBody", { r: (tr.rain_pct_per_decade > 0 ? "+" : "") + tr.rain_pct_per_decade, t: (tr.temp_c_per_decade > 0 ? "+" : "") + tr.temp_c_per_decade })}</span></div>` : "";
  const g2 = a.grid; $("#gridNote").innerHTML = `<span>${t("squaresInfo", { n: g2.squares, w: fmtNum(g2.square_w_m), h: fmtNum(g2.square_h_m), a: fmtNum(g2.square_area_m2) }).replace(/ The numbers on the edges are their lengths\.| الأرقام على الأضلاع هي أطوالها\./, "")}</span>`;
  $("#youWrote").innerHTML = `<span class="muted">${t("youWrote")}</span> «${esc($("#fWant").value.trim())}»`;
  $("#recList").innerHTML = a.wanted.map(x => evalCard(x, true)).join("");
  paintIcons($("#recList"));
}
async function createPlot() {
  if (!OB.picks.size) { toast(t("pickOne")); return; }
  OB.loading = true; updateObNext(); $("#obNextBtn").textContent = t("creating");
  try {
    const st = await api("/plots", { method: "POST", body: { ...farmInputs(), name: $("#fName").value.trim(), budget_jod: +$("#fBudget").value, crops: [...OB.picks] } });
    S.plots = await api("/plots"); S.plotId = st.plot.id; S.state = st; store.set("fs_plot", S.plotId); cam.fitted = false;
    await enterMain(true);
  } catch (e) { toast(e.message); } finally { OB.loading = false; updateObNext(); }
}

/* ---- main ---- */
async function loadPlot(refit) {
  busy(true);
  try { const st = await api("/plots/" + S.plotId); S.state = st; if (refit) cam.fitted = false; renderHUD(); renderSidebar(); refreshHint(); sizeFarm();
    if (S.tab === "more") renderMore(); }
  finally { busy(false); }
}
async function enterMain(tutorial) {
  show("main"); switchTab("farm"); applyI18n();
  await guard(() => loadPlot(true));
  if ((tutorial || !store.get("fs_tut")) && S.state) setTimeout(() => coach(0), 400);
}
function applyState(res, quiet) { if (res.state) { S.state = res.state; renderHUD(); renderSidebar(); refreshHint(); } if (res.message && !quiet) toast(tx(res.message)); }
function renderHUD() {
  const st = P(); if (!st) return; const p = st.plot, gr = p.grid;
  $("#plotName").textContent = p.name; $("#plotMeta").textContent = `${p.region} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")} ▾`;
  $("#gradeVal").textContent = st.grade.grade;
  $("#sizeChip").innerHTML = `▢ ${t("squareSize", { w: `<b>${fmtNum(gr.square_w_m)}</b>`, h: `<b>${fmtNum(gr.square_h_m)}</b>` })}`;
  const w = st.weather;
  if (w) { let h = null; if (w.first_rain) h = Math.max(0, Math.round((new Date(w.first_rain) - new Date(w.local_time)) / 36e5)); $("#wxChip").innerHTML = `<span class="mono">${fmtNum(w.temp_c)}°</span> ${h != null ? t("rainIn", { h }) : t("noRain")}`; }
  else $("#wxChip").textContent = "–";
  $("#alertCount").textContent = st.alerts_open; $("#alertCount").hidden = !st.alerts_open;
  const a = st.top_alert; $("#vignette").classList.toggle("on", !!a && a.type === "frost");
  const bn = $("#banner"); bn.hidden = !a;
  if (a) { const col = { frost: "var(--frost)", rain: "var(--water)", heat: "var(--danger)", wind: "var(--warn)" }[a.type];
    bn.innerHTML = `<span class="sev" style="background:${col}"></span><div style="min-width:0"><b>${esc(tx(a.title))} · ${fmtDate(a.date)}</b><small>${esc(a.source)}</small></div><button class="btn sm" data-act="goAlerts">${t("seeWhat")}</button>`; }
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
  sb.insertAdjacentHTML("beforeend", `<button class="sb-add" data-act="addCropSheet">${t("addCrop")}</button><div class="sb-sep"></div>
   <button class="tool" id="toolSickle" data-tool="sickle" aria-pressed="${sickle.active}">${sickleSVG()}${t("sickle")}</button>
   <button class="tool" data-tool="water"><svg viewBox="0 0 32 32"><path d="M6 13h14l-2 12H8Z" fill="${css("--water")}"/><path d="M20 16l8-6" stroke="${css("--water")}" stroke-width="3" stroke-linecap="round"/><path d="M9 13a4 4 0 0 1 8 0" fill="none" stroke="${css("--water")}" stroke-width="2.4"/></svg>${t("water")}</button>
   <button class="tool" data-tool="topo" aria-pressed="${S.topo}"><svg viewBox="0 0 32 32" fill="none" stroke="${css("--olive")}" stroke-width="2.2" stroke-linejoin="round"><path d="M3 24l8-12 6 8 4-5 8 9Z"/><path d="M3 28h26" stroke="${css("--water")}"/></svg>${t("topo")}</button>`);
}
const sickleSVG = () => `<svg viewBox="0 0 32 32"><path d="M8 26l6-7" stroke="#7A5131" stroke-width="4" stroke-linecap="round"/><path d="M13 20C10 10 18 3 27 6c-6 0-11 5-10 13Z" fill="#C9D2D8" stroke="#6D777E" stroke-width="1.2"/></svg>`;
function setHint(s) { const h = $("#hint"); h.hidden = !s; if (s) h.textContent = s; }
function refreshHint() { if (S.sel) setHint(t("pickSpot", { c: cName(S.sel) })); else if (sickle.active) setHint(t("dragHint")); else if (S.topo) setHint(t("topoHint")); else setHint(""); }
function switchTab(tab) {
  S.tab = tab; $$(".tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === tab));
  ["farm", "plan", "spray", "alerts", "more"].forEach(k => $("#tab-" + k).hidden = k !== tab);
  if (tab === "farm") requestAnimationFrame(sizeFarm); else loadTab(tab);
}
async function loadTab(tab) {
  const el = $("#tab-" + tab);
  if (tab === "more") { renderMore(); return; }
  el.innerHTML = `<div class="empty"><span class="spinner"></span><p>${t("loading")}</p></div>`;
  try {
    if (tab === "plan") { S.plan = await api(`/plots/${S.plotId}/plan`); renderPlan(); }
    if (tab === "spray") { S.spray = await api(`/plots/${S.plotId}/spray-window`); renderSpray(); }
    if (tab === "alerts") { S.alerts = await api(`/plots/${S.plotId}/alerts`); renderAlerts(); }
  } catch (e) { el.innerHTML = `<div class="err-box">${esc(e.message)}</div><button class="btn ghost" style="margin-top:12px" data-act="reloadTab">${t("retry")}</button>`; }
}
function renderTabAgain() { if (S.tab === "plan" && S.plan) renderPlan(); if (S.tab === "spray" && S.spray) renderSpray(); if (S.tab === "alerts" && S.alerts) renderAlerts(); if (S.tab === "more") renderMore(); }

/* ---- farm interactions ---- */
const tileLabel = tl => t("squareN", { c: "ABCDEFGHIJKL"[tl.c] || tl.c + 1, r: tl.r + 1 });
function onTileTap(tl) {
  if (!tl.inside) { toast(t("outside")); return; }
  if (S.sel && !tl.planting) { plantSheet(tl, S.sel); return; }
  infoSheet(tl);
}
function plantSheet(tl, crop) {
  const C = S.crops[crop], today = P().today, s = tl.suitability?.[crop];
  sheet(`<form class="stack" id="plantForm"><div class="row"><canvas data-icon="${crop}" style="width:52px;height:52px"></canvas><div><h2 style="font-size:22px">${t("plantTitle", { c: esc(cName(crop)) })}</h2><span class="muted">${tileLabel(tl)}${s != null ? ` · ${t("suit")} <b class="mono">${s}%</b>` : ""}</span></div></div>
   <div class="field"><label class="label" for="plantDate">${t("plantedOn")}</label><input type="date" id="plantDate" value="${today}" max="${today}" required></div>
   <p class="muted" style="margin:0;font-size:13px">${C.perennial ? t("plantHelpTree") : t("plantHelpAnnual")}</p>
   <button class="btn block" type="submit">${t("plantBtn")}</button><button class="btn ghost block" type="button" data-act="closeSheet">${t("cancel")}</button></form>`);
  $("#plantForm").onsubmit = async e => { e.preventDefault(); const date = $("#plantDate").value || today; closeSheet();
    await guard(async () => { applyState(await api(`/plots/${S.plotId}/plant`, { method: "POST", body: { tile_ids: [tl.id], crop, planted_on: date } })); floatAt(tl.id, "🌱", "#fff", "#7CC473"); }); };
}
function weekDay(d) { return new Date(d + "T12:00:00").toLocaleDateString(loc(), { weekday: "short", day: "numeric" }); }
function waterPlanHTML(wp, compact) {
  const st = { enough: t("wpEnough", { a: fmtNum(wp.available_m3), n: fmtNum(wp.need_m3), s: fmtNum(wp.spare_m3) }),
    short: t("wpShort", { a: fmtNum(wp.available_m3), p: wp.share_pct, n: fmtNum(wp.need_m3) }), no_water: t("wpNone"),
    rainfed: t("wpRainfed"), no_crops: t("wpNoCrops") }[wp.status];
  const cls = wp.status === "enough" ? "ok" : wp.status === "short" || wp.status === "no_water" ? "" : "info";
  const today = P().today;
  return `<div class="wplan">${wp.estimate ? `<div class="note"><span>${t("wpEstimate")}</span></div>` : ""}<div class="note ${cls}"><span>${esc(st)}</span></div>
    ${wp.crops.map(c => `<div class="wcrop"><canvas data-icon="${c.crop}"></canvas><div style="min-width:0"><b>${esc(cName(c.crop))}</b>
      <div class="muted" style="font-size:12.5px">${t("wpCrop", { n: c.squares, a: fmtNum(c.area_m2), m: fmtNum(c.need_m3), g: fmtNum(c.give_m3) })}</div>
      ${c.dormant ? `<div class="muted" style="font-size:13px;margin-top:4px">${t("wpDormant")}</div>` : c.dates.length ? `<div class="wdates">${c.dates.map(d => `<span class="wdate${d.date === today ? " today" : ""}">${esc(weekDay(d.date))} · ${t("wpEach", { mm: fmtNum(d.mm), m: fmtNum(d.m3, 1) })}</span>`).join("")}</div>` : `<div class="muted" style="font-size:13px;margin-top:4px">${t("wpNoDates")}</div>`}
      ${c.rain_postponed ? `<div style="font-size:12.5px;margin-top:4px;color:var(--water)">☁ ${t("wpRain")}</div>` : ""}</div></div>`).join("")}
    ${compact ? "" : `<details><summary class="muted" style="font-size:13px;cursor:pointer">${t("wpHow")}</summary><p class="muted" style="font-size:13px">${t("wpHowBody")}</p></details>`}</div>`;
}
function waterPlanSheet() {
  const wp = P().water_plan;
  sheet(`<div class="stack"><h2 style="font-size:22px">${t("wpTitle")}</h2>${weeklyInput()}${waterPlanHTML(wp, true)}
    <button class="btn ghost block" data-act="goPlan">${t("openPlan")}</button><button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`);
  bindWeekly();
}
function weeklyInput() {
  return `<form class="map-search" id="weeklyForm"><label style="flex:1;display:flex;flex-direction:column;gap:4px;font-size:12px" class="muted">${t("weeklyWater")}<input id="weeklyIn" type="number" min="0" step="1" inputmode="decimal" value="${P().plot.water_m3_week || ""}"></label><span class="muted" style="align-self:end;padding-bottom:10px">m³</span><button class="btn sm" type="submit" style="align-self:end">${t("save")}</button></form>`;
}
function bindWeekly() {
  const f = $("#weeklyForm"); if (!f) return;
  f.onsubmit = async e => { e.preventDefault(); const v = Math.max(0, +$("#weeklyIn").value || 0);
    await guard(async () => { await api(`/plots/${S.plotId}`, { method: "PATCH", body: { water_m3_week: v } }); await loadPlot(); toast(t("save") + " ✓");
      if ($("#layer .sheet")) waterPlanSheet(); if (S.tab === "plan") loadTab("plan"); }); };
}
function infoSheet(tl) {
  const p = tl.planting, gr = grid(), kv = (k, v) => `<span>${k}</span><b>${v}</b>`;
  const terrain = kv(t("squareDims"), `${fmtNum(gr.square_w_m)} × ${fmtNum(gr.square_h_m)} m`) + kv(t("squareArea"), `${fmtNum(tl.area_m2)} m²`)
    + kv(t("elev"), tl.elev != null ? `${fmtNum(tl.elev)} m${tl.low ? " · " + t("lowSpot") : ""}` : "–") + (tl.slope_pct != null ? kv(t("slope"), `${fmtNum(tl.slope_pct, 1)}%`) : "")
    + (tl.ndvi != null ? kv(t("ndvi"), `${fmtNum(tl.ndvi, 2)} · ${fmtDate(tl.ndvi_date)}`) : "") + (tl.lst_night_c != null ? kv(t("nightLst"), `${fmtNum(tl.lst_night_c, 1)} °C`) : "");
  if (!p) {
    const best = Object.entries(tl.suitability || {}).sort((a, b) => b[1] - a[1]);
    sheet(`<div class="stack"><h2 style="font-size:22px">${tileLabel(tl)} · ${t("emptySquare")}</h2><div class="kv">${terrain}</div>
      ${best.length ? `<span class="label">${t("bestFor")}</span>` + best.map(([id, s]) => `<button class="row list-item" data-act="plantHere" data-crop="${id}" data-id="${tl.id}"><canvas data-icon="${id}" style="width:36px;height:36px"></canvas><div style="flex:1"><b>${esc(cName(id))}</b><div class="bar"><i style="width:${s}%;background:${s >= 75 ? css("--ok") : s >= 55 ? css("--warn") : css("--danger")}"></i></div></div><span class="mono">${s}%</span></button>`).join("") : ""}
      <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`); return; }
  const w = p.water;
  sheet(`<div class="stack"><div class="row"><canvas data-icon="${p.crop}" data-st="${p.stage}" style="width:56px;height:56px"></canvas><div><h2 style="font-size:22px">${esc(cName(p.crop))}</h2><span class="muted">${tileLabel(tl)} · ${fmtDate(p.planted_on)}</span></div></div>
    <div class="kv">${kv(t("stage"), p.ready ? t("readyNow") : p.harvested_this_season ? t("harvestedSeason") : `${p.stage + 1}/4`)}${kv(t("harvestDates"), p.harvest_from ? `${fmtDate(p.harvest_from)} – ${fmtDate(p.harvest_to)}` : "–")}
    ${w ? kv(t("soilWater"), w.dormant ? t("dormant") : `${w.available_pct}%`) + kv(t("nextWater"), w.dormant ? "–" : w.events.length ? `${esc(weekDay(w.events[0].date))} · ${fmtNum(w.events[0].mm)} mm (${fmtNum(w.events[0].m3, 1)} m³)` : t("wpNoDates")) + kv(t("thisWeek"), `${fmtNum(w.events.reduce((s2, e) => s2 + e.m3, 0), 1)} m³`) : ""}
    ${terrain}</div><span class="tag">${esc(p.method)} · FAO-56</span>
    ${w && w.water_today ? `<div class="note info"><span>${t("waterTodaySq", { mm: fmtNum(w.today_mm), m: fmtNum(w.events[0].m3, 1) })}</span></div>` : ""}
    ${w ? `<button class="btn water block" data-act="waterPlan">${t("openPlan")}</button>` : ""}
    <button class="btn ghost block" data-act="clearSquare" data-id="${tl.id}">${t("clearSquare")}</button>
    <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`);
}
function addCropSheet() {
  sheet(`<form class="stack" id="addCropForm"><h2 style="font-size:22px">${t("addCropTitle")}</h2><p class="muted" style="margin:0">${t("addCropBody")}</p>
    <textarea id="addCropText" rows="2" maxlength="500" placeholder="${esc(t("wantPh"))}"></textarea><button class="btn block" type="submit">${t("check")}</button><div class="stack" id="addCropRes" style="gap:8px"></div>
    <button class="btn ghost block" type="button" data-act="closeSheet">${t("close")}</button></form>`);
  $("#addCropText").focus();
  $("#addCropForm").onsubmit = async e => { e.preventDefault(); const txt = $("#addCropText").value.trim(); if (!txt) return; const box = $("#addCropRes"); box.innerHTML = `<span class="spinner"></span>`;
    try { const res = await api(`/plots/${S.plotId}/evaluate`, { method: "POST", body: { text: txt } }); const have = P().plot.crops;
      box.innerHTML = `<div class="you-wrote"><span class="muted">${t("youWrote")}</span> «${esc(txt)}»</div>` + res.map(x => evalCard(x, false) + (x.crop ? (have.includes(x.crop) ? `<span class="muted" style="font-size:13px">${t("already")}</span>` : `<button type="button" class="btn sm" data-act="addCrop" data-id="${x.crop}">${t("addToFarm")}: ${esc(cName(x.crop))}</button>`) : "")).join("");
      paintIcons(box); } catch (ex) { box.innerHTML = `<div class="err-box">${esc(ex.message)}</div>`; } };
}

/* farm canvas gestures: tap, drag to pan, pinch / wheel to zoom */
const ptrs = new Map(); let gest = null;
cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) gest = { mode: "tap", x0: e.clientX, y0: e.clientY, cx: cam.x, cy: cam.y };
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gest = { mode: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: cam.s, cx: cam.x, cy: cam.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; } });
cv.addEventListener("pointermove", e => { if (!ptrs.has(e.pointerId) || !gest) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const r = cv.getBoundingClientRect();
  if (gest.mode === "pinch") { if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); cam.x = gest.cx; cam.y = gest.cy; cam.s = gest.s0; zoomAt(d / gest.d0, gest.mx - r.left, gest.my - r.top); } return; }
  if (Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0) > 8) { gest.mode = "pan"; cam.x = gest.cx + e.clientX - gest.x0; cam.y = gest.cy + e.clientY - gest.y0; } });
function endPtr(e) { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if (gest?.mode === "tap" && ptrs.size === 0) { const r = cv.getBoundingClientRect(), tl = pickTile(e.clientX - r.left, e.clientY - r.top); if (tl) onTileTap(tl); else if (S.sel) { S.sel = null; renderSidebar(); refreshHint(); } }
  if (ptrs.size === 0) gest = null; }
cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
cv.addEventListener("wheel", e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });

/* sickle: drag it from the side bar; every ready square it touches is harvested at once */
const sickle = { active: false, pending: null, el: null, hover: null, done: new Set(), warned: new Set(), queue: [], busy: false };
function sickleTiles(cx, cy) { // the blade covers a small area around the finger
  const r = cv.getBoundingClientRect(), out = new Set();
  for (const [dx, dy] of [[0, 0], [-14, -8], [14, -8], [0, -16], [-10, 6], [10, 6]]) { const tl = pickTile(cx - r.left + dx, cy - r.top + dy - 10); if (tl) out.add(tl); }
  return [...out];
}
function sickleMove(e) {
  sickle.el.style.left = e.clientX + "px"; sickle.el.style.top = e.clientY + "px";
  const tiles = sickleTiles(e.clientX, e.clientY); sickle.hover = tiles[0]?.id ?? null;
  for (const tl of tiles) {
    if (!tl.inside || !tl.planting || sickle.done.has(tl.id)) continue;
    if (ready(tl)) { sickle.done.add(tl.id); harvestLocal(tl); sickle.queue.push(tl.id); flushHarvest(); navigator.vibrate?.(10); }
    else if (!sickle.warned.has(tl.id)) { sickle.warned.add(tl.id); floatAt(tl.id, t("notReady", { d: fmtDate(tl.planting.harvest_from) }), "#fff"); }
  }
}
function harvestLocal(tl) { // instant feedback before the server answers
  const C = S.crops[tl.planting.crop] || {};
  floatAt(tl.id, "✓", "#FFE07A", C.color || "#F4D03F");
  if (C.perennial) tl.planting = { ...tl.planting, ready: false, stage: 1, harvested_this_season: true }; else tl.planting = null;
}
async function flushHarvest() {
  if (sickle.busy || !sickle.queue.length) return; sickle.busy = true;
  const ids = sickle.queue.splice(0);
  try { applyState(await api(`/plots/${S.plotId}/harvest`, { method: "POST", body: { tile_ids: ids } }), true); }
  catch (e) { toast(e.message); await guard(() => loadPlot()); }
  finally { sickle.busy = false; if (sickle.queue.length) flushHarvest(); }
}
$("#app").addEventListener("pointerdown", e => { const b = e.target.closest("#toolSickle"); if (!b) return; e.preventDefault(); sickle.pending = { x: e.clientX, y: e.clientY }; });
addEventListener("pointermove", e => {
  if (sickle.pending && !sickle.active && Math.hypot(e.clientX - sickle.pending.x, e.clientY - sickle.pending.y) > 6) {
    sickle.active = true; sickle.done = new Set(); sickle.warned = new Set(); S.sel = null; refreshHint();
    sickle.el = document.createElement("div"); sickle.el.className = "drag-sickle"; sickle.el.innerHTML = sickleSVG(); document.body.appendChild(sickle.el); $("#toolSickle")?.setAttribute("aria-pressed", "true");
  }
  if (sickle.active) { e.preventDefault(); sickleMove(e); }
}, { passive: false });
addEventListener("pointerup", () => {
  if (sickle.active) {
    sickle.active = false; sickle.el?.remove(); sickle.hover = null; suppressClick = true; refreshHint(); renderSidebar();
    toast(sickle.done.size ? tx({ en: `Harvested ${sickle.done.size} square(s)`, ar: `تم حصاد ${sickle.done.size} مربع` }) : t("dragHint"));
  } else if (sickle.pending) { suppressClick = true; showHarvestDates(); }
  sickle.pending = null;
});
let suppressClick = false;
$("#app").addEventListener("contextmenu", e => { if (e.target.closest("#toolSickle,#farmCanvas")) e.preventDefault(); });
function showHarvestDates() {
  const groups = {}; P().tiles.filter(x => x.planting).forEach(tl => (groups[tl.planting.crop] ||= []).push(tl));
  const keys = Object.keys(groups);
  sheet(`<div class="stack"><div class="row">${sickleSVG().replace("<svg", '<svg width="36" height="36"')}<h2 style="font-size:24px">${t("harvestDates")}</h2></div><div class="note info"><span>${t("sickleHow")}</span></div>
    ${keys.length ? keys.map(id => { const ts = groups[id], r = ts.filter(ready).length, nx = ts.filter(x => !ready(x)).map(x => x.planting.harvest_from).filter(Boolean).sort()[0];
      return `<div class="row"><canvas data-icon="${id}" style="width:40px;height:40px"></canvas><div style="flex:1"><b>${esc(cName(id))}</b><div class="muted" style="font-size:13px">${ts.length} · ${esc(ts[0].planting.method)}</div></div><div style="text-align:end">${r ? `<span class="chip" style="background:var(--sun-soft)">${t("readyNow")} · ${r}</span>` : ""}${nx ? `<div class="mono" style="font-size:13px">${fmtDate(nx)}</div>` : ""}</div></div>`; }).join("") : `<p class="muted">${t("nothingPlanted")}</p>`}
    <button class="btn ghost block" data-act="closeSheet">${t("close")}</button></div>`);
}

/* ---- plan ---- */
function bars(series, key, cls, max) { if (!series?.length) return ""; const m = max != null ? max : (Math.max(...series.map(x => x[key])) || 1); return `<div class="spark ${cls || ""}">${series.map(x => `<i title="${esc((x.year || x.date) + ": " + x[key])}" style="height:${Math.max(3, 100 * x[key] / m)}%"></i>`).join("")}</div>`; }
function renderPlan() {
  const p = S.plan, el = $("#tab-plan"), mNow = new Date().getMonth(), months = T.months[LANG === "ar" ? 1 : 0];
  el.innerHTML = `<div class="stack">
  <div class="sec-title"><h2>${t("calendar")}</h2><span class="tag">NASA POWER</span></div>
  ${p.advice.map(a => `<div class="note ${a.type === "cold" ? "info" : ""}"><span>${esc(tx(a))}</span></div>`).join("")}
  ${p.anomaly ? `<div class="muted" style="font-size:13px">${t("last30")}: <b class="mono">${p.anomaly.anomaly_c > 0 ? "+" : ""}${p.anomaly.anomaly_c} °C</b> (${fmtDate(p.anomaly.from)} – ${fmtDate(p.anomaly.to)})</div>` : ""}
  <div class="cal"><table><thead><tr><th></th>${months.map((m, i) => `<th${i === mNow ? ' style="color:var(--danger)"' : ""}>${m}</th>`).join("")}</tr></thead><tbody>
  ${p.calendar.map(r => `<tr><td class="name">${esc(cName(r.crop))}</td>${r.row.map((k, i) => `<td class="${k ? "seg-" + k : ""}${i === mNow ? " now" : ""}" style="${k ? "" : "background:var(--surface-2)"}"></td>`).join("")}</tr>`).join("")}
  </tbody></table></div>
  <div class="legend"><span><i style="background:var(--leaf);opacity:.55"></i>${t("lgPlant")}</span><span><i style="background:var(--leaf)"></i>${t("lgGrow")}</span><span><i style="background:var(--sun)"></i>${t("lgHarv")}</span><span><i style="background:var(--danger);width:3px"></i>${t("lgNow")}</span></div>
  <p class="muted" style="font-size:12px;margin:0">${t("calFrom", { p: p.climatology_period || "" })}</p>
  <div class="sec-title"><h2>${t("wpTitle")}</h2><span class="tag">FAO-56 · Open-Meteo</span></div>
  ${weeklyInput()}${waterPlanHTML(p.water)}
  <div class="sec-title"><h2>${t("seedBank")}</h2></div>
  <div class="card row" style="gap:16px"><div class="grade-big">${p.grade.grade}</div><div><b>${t("resilience")}</b><div class="muted" style="font-size:14px">${t("gradeWhy", { n: p.grade.crop_types, d: p.grade.drought_tolerant })}</div></div></div>
  ${p.trend?.years ? `<div class="card stack" style="gap:6px"><b>${t("trendTitle", { y: p.trend.years })}</b><span class="muted" style="font-size:13px">${t("trendBody", { r: (p.trend.rain_pct_per_decade > 0 ? "+" : "") + p.trend.rain_pct_per_decade, t: (p.trend.temp_c_per_decade > 0 ? "+" : "") + p.trend.temp_c_per_decade })}</span>${bars(p.trend.rain_series, "mm")}</div>` : ""}
  ${p.suggestions.length ? `<span class="label">${t("suggest")}</span>` + p.suggestions.map(s => `<div class="rec"><canvas data-icon="${s.crop}"></canvas><div style="min-width:0"><b>${esc(cName(s.crop))}</b> ${verdictPill(s.verdict)}<div class="muted" style="font-size:12.5px">${esc(tx(s.summary))}</div></div><button class="btn sm" data-act="addCrop" data-id="${s.crop}">${t("addToFarm")}</button></div>`).join("") : ""}
  <div class="sec-title"><h2>${t("ndviTitle")}</h2><span class="tag">NASA AppEEARS</span></div>
  ${p.ndvi_series.length ? `<div class="card">${bars(p.ndvi_series, "v", "ndvi", 1)}<div class="muted mono" style="font-size:12px">${fmtDate(p.ndvi_series[0].date)} – ${fmtDate(p.ndvi_series.at(-1).date)} · ${t("ndvi")} ${fmtNum(p.ndvi_series.at(-1).v, 2)}</div></div>` : `<div class="note info"><span>${t("noSat")}</span></div>`}
  ${p.smap_series.length ? `<div class="sec-title"><h2>${t("smapTitle")}</h2></div><div class="card">${bars(p.smap_series, "v", "", .5)}<div class="muted mono" style="font-size:12px">${fmtNum(p.smap_series.at(-1).v, 3)} m³/m³ · ${fmtDate(p.smap_series.at(-1).date)}</div></div>` : ""}
  </div>`;
  paintIcons(el); bindWeekly();
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
  const b = S.spray.blocks.find(x => x.start === start), msg = $("#sprayMsg");
  if (b.zone === "r") { msg.innerHTML = `<div class="note" style="background:var(--danger-soft)"><span>${t("locked", { why: esc(tx(b.why)) })}</span></div>`; return; }
  if (b.zone === "y" && S.pendingY !== start) { S.pendingY = start; msg.innerHTML = `<div class="note"><span>${t("caution", { why: esc(tx(b.why)) })}</span></div>`; return; }
  S.pendingY = null;
  await guard(async () => { applyState(await api(`/plots/${S.plotId}/spray`, { method: "POST", body: { start, tool: S.sprayTool } })); S.spray = await api(`/plots/${S.plotId}/spray-window`); renderSpray(); });
}

/* ---- alerts ---- */
function renderAlerts() {
  const col = { frost: "var(--frost)", rain: "var(--water)", heat: "var(--danger)", wind: "var(--warn)" };
  $("#tab-alerts").innerHTML = `<div class="stack"><div><h2 style="font-size:22px">${t("alertsTitle")}</h2><p class="muted" style="margin:4px 0 0;font-size:14px">${t("alertsSub")}</p></div>
  ${S.alerts.length ? S.alerts.map(a => `<div class="alert${a.resolved ? " resolved" : ""}"><span class="sev" style="background:${col[a.type]}"></span><div class="stack" style="gap:10px;min-width:0">
    <div class="row between" style="align-items:flex-start"><h3>${esc(tx(a.title))} · ${fmtDate(a.date)}</h3>${a.resolved ? `<span class="chip" style="background:var(--ok-soft)">${t("resolved")}</span>` : `<span class="chip">${a.lead_days ? t("inDays", { n: a.lead_days }) : t("tonight")}</span>`}</div>
    <p style="margin:0;font-size:14px">${esc(tx(a.body))}</p><div class="row" style="flex-wrap:wrap;gap:6px"><span class="tag">${esc(a.source)}</span></div>
    ${a.actions.map((x, i) => { const dn = a.done.includes(i); return `<div class="act${dn ? " done" : ""}"><span>${esc(tx(x))}</span>${dn ? `<span style="color:var(--ok)">✓</span>` : `<button class="btn sm" data-act="alertDo" data-k="${esc(a.key)}" data-i="${i}">${t("done")}</button>`}</div>`; }).join("")}
  </div></div>`).join("") : `<div class="note ok"><span>${t("noAlerts")}</span></div>`}</div>`;
}

/* ---- more ---- */
function renderMore() {
  const st = P(); if (!st) { $("#tab-more").innerHTML = `<div class="empty"><span class="spinner"></span><p>${t("loading")}</p></div>`; return; } const sat = st.satellite, gr = st.plot.grid, satL = T.satStatus[sat.status] || [sat.status, sat.status];
  $("#tab-more").innerHTML = `<div class="stack">
  <div class="sec-title"><h2>${t("language")}</h2></div>
  <div class="seg" id="langSeg"><button data-v="en" aria-pressed="${LANG === "en"}">English</button><button data-v="ar" aria-pressed="${LANG === "ar"}">العربية</button></div>
  <div class="sec-title"><h2>${t("fieldInfo")}</h2></div>
  <div class="card kv"><span>${t("area")}</span><b>${fmtNum(st.plot.area_m2 / 1000, 1)} ${t("dunums")}</b><span>${t("squareDims")}</span><b>${fmtNum(gr.square_w_m)} × ${fmtNum(gr.square_h_m)} m</b><span>${tx({ en: "Squares", ar: "عدد المربعات" })}</span><b>${gr.squares}</b><span>${tx({ en: "Edge lengths", ar: "أطوال الأضلاع" })}</span><b class="mono" style="font-size:12px">${gr.edges_m.map(x => fmtNum(x)).join(" · ")} m</b></div>
  <div class="card stack" style="gap:8px"><span class="label">${t("changeSize")}</span>
    <div class="size-row"><label><span>${t("along")}</span><input id="rgW" type="number" min="3" max="1000" step="1" value="${gr.square_w_m}"></label><span class="muted">×</span>
    <label><span>${t("across")}</span><input id="rgH" type="number" min="3" max="1000" step="1" value="${gr.square_h_m}"></label><span class="muted">m</span>
    <button class="btn sm" data-act="regrid">${t("apply")}</button></div><span class="muted" style="font-size:12.5px">${t("sizeHelp")}</span></div>
  <div class="sec-title"><h2>${t("myPlots")}</h2></div>
  ${S.plots.map(p => `<button class="list-item${p.id === S.plotId ? " on" : ""}" data-act="switchPlot" data-id="${p.id}"><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${esc(p.region)} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")}</div></div></button>`).join("")}
  <button class="btn ghost" data-act="addPlot">+ ${t("addPlot")}</button>
  <div class="sec-title"><h2>${t("satLayers")}</h2><span class="tag">SMAP · MODIS · ECOSTRESS</span></div>
  <div class="card stack" style="gap:8px"><div class="row between"><b>${esc(pick2(satL))}</b>${sat.updated_at ? `<span class="muted mono" style="font-size:12px">${fmtDate(sat.updated_at.slice(0, 10))}</span>` : ""}</div>
   ${sat.smap ? `<span class="muted" style="font-size:13px">SMAP ${fmtNum(sat.smap.rootzone_m3m3, 3)} m³/m³ · ${fmtDate(sat.smap.date)}</span>` : ""}
   ${sat.error ? `<div class="err-box">${esc(sat.error)}</div>` : ""}
   ${sat.status !== "not_configured" ? `<button class="btn sm ghost" data-act="satRefresh">${t("satRefresh")}</button>` : ""}</div>
  <div class="sec-title"><h2>${t("dataSources")}</h2></div>
  <div class="card" style="padding-block:4px">${st.sources.map(s => `<div class="src-row"><b>${s.ok ? "" : "⚠ "}${esc(s.name)}</b><span class="tag">${s.fetched_at ? new Date(s.fetched_at).toLocaleString(loc(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span><span class="muted" style="grid-column:1/-1">${esc(s.detail)}${s.error ? " · " + esc(s.error) : ""}</span></div>`).join("")}</div>
  <div class="sec-title"><h2>${t("history")}</h2></div><div id="eventsBox"><span class="spinner"></span></div>
  <div class="sec-title"><h2>${t("farmKey")}</h2></div>
  <div class="card stack" style="gap:8px"><span class="muted" style="font-size:13px">${t("farmKeyHelp")}</span><div class="keybox" id="keyText">${esc(FARM_KEY)}</div>
    <button class="btn sm ghost" data-act="copyKey">${t("copy")}</button>
    <details><summary class="muted" style="font-size:13px;cursor:pointer">${t("useOtherKey")}</summary><div class="map-search" style="margin-top:8px"><input id="otherKeyIn" autocomplete="off" placeholder="${esc(t("keyPh"))}"><button class="btn sm" data-act="otherKey">${t("open")}</button></div></details></div>
  <div class="sec-title"><h2>${t("aboutTitle")}</h2></div>
  <div class="card about">${aboutHTML()}</div>
  <button class="btn ghost" data-act="tutorial">${t("replay")}</button>
  <button class="btn danger-btn" data-act="deletePlot">${t("deletePlot")}</button>
  <p class="muted" style="font-size:13px;margin:0">${t("about")}</p></div>`;
  api(`/plots/${S.plotId}/events`).then(ev => { const box = $("#eventsBox"); if (!box) return;
    box.innerHTML = ev.length ? `<div class="card" style="padding-block:4px">${ev.slice(0, 30).map(e => { const tl = e.tile_id ? tileById(e.tile_id) : null;
      return `<div class="src-row"><b>${esc(pick2(T.evKind[e.kind] || [e.kind, e.kind]))}${e.data.crop ? " · " + esc(cName(e.data.crop)) : ""}${e.data.mm ? " · " + e.data.mm + " mm" : ""}${e.data.start ? " · " + esc(e.data.start.replace("T", " ")) : ""}</b><span class="muted">${tl ? tileLabel(tl) : ""}</span><span class="muted" style="grid-column:1/-1">${fmtDate(e.date)}</span></div>`; }).join("")}</div>` : `<p class="muted">–</p>`; }).catch(() => {});
}

function aboutHTML() {
  const en = LANG !== "ar";
  const L2 = (a, b) => en ? a : b;
  return `<h3>${L2("What it does", "ماذا يفعل")}</h3>
  <p>${L2("Farm Studio turns NASA Earth data into daily decisions for a real field in Jordan: which crops suit it, when and how much to water from a weekly allowance, when spraying is safe, how to prepare for frost, heat and heavy rain, and when to harvest.", "يحوّل فارم ستوديو بيانات ناسا لرصد الأرض إلى قرارات يومية لأرض حقيقية في الأردن: المحاصيل المناسبة، ومتى وكم نسقي من الكمية الأسبوعية، ومتى يكون الرش آمنًا، والاستعداد للصقيع والحر والأمطار الغزيرة، وموعد الحصاد.")}</p>
  <h3>${L2("NASA data used", "بيانات ناسا المستخدمة")}</h3><ul>
  <li><a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener">NASA POWER</a> — ${L2("25-year climate, climate trends and recent daily weather: drives crop suitability, the planting calendar and harvest timing.", "مناخ 25 عامًا واتجاهاته والطقس اليومي الحديث: أساس ملاءمة المحاصيل وتقويم الزراعة وموعد الحصاد.")}</li>
  <li><a href="https://appeears.earthdatacloud.nasa.gov/" target="_blank" rel="noopener">NASA AppEEARS</a>: SMAP L4 ${L2("soil moisture", "رطوبة التربة")}, MODIS MOD13Q1 NDVI, ECOSTRESS ${L2("land surface temperature (cold spots)", "حرارة سطح الأرض (البقع الباردة)")}.</li>
  <li><a href="https://lpdaac.usgs.gov/products/srtmgl1v003/" target="_blank" rel="noopener">SRTM GL1</a> — ${L2("30 m elevation for low, frost-prone squares.", "ارتفاع بدقة 30 م لتحديد المربعات المنخفضة المعرضة للصقيع.")}</li></ul>
  <h3>${L2("Other sources", "مصادر أخرى")}</h3><ul>
  <li><a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a> — ${L2("10-day forecast and reference evaporation (ET0).", "توقعات 10 أيام والتبخر المرجعي (ET0).")}</li>
  <li><a href="https://soilgrids.org/" target="_blank" rel="noopener">ISRIC SoilGrids</a>, <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, ${L2("Esri World Imagery, FAO-56 (crop water) and FAO ECOCROP (crop climate ranges).", "صور Esri، ودليل FAO-56 (مياه المحاصيل)، وقاعدة FAO ECOCROP (نطاقات المناخ للمحاصيل).")}</li></ul>
  <h3>${L2("Assumptions and limits", "الافتراضات والحدود")}</h3><ul>
  <li>${L2("The watering plan assumes you follow it; it does not measure the soil directly. Satellite soil moisture (SMAP, 9 km) is shown for comparison.", "تفترض خطة الري أنك تتبعها؛ ولا تقيس التربة مباشرة. تُعرض رطوبة التربة من القمر الصناعي (SMAP بدقة 9 كم) للمقارنة.")}</li>
  <li>${L2("Crop values come from FAO references and should be checked by an agricultural engineer for local varieties.", "قيم المحاصيل من مراجع FAO ويجب أن يراجعها مهندس زراعي للأصناف المحلية.")}</li>
  <li>${L2("Forecasts can change; check the plan again before acting.", "قد تتغير التوقعات؛ راجع الخطة قبل التنفيذ.")}</li></ul>
  <h3>${L2("Use of AI", "استخدام الذكاء الاصطناعي")}</h3>
  <p>${L2("Parts of the code and text were written with an AI coding assistant (Claude). The team reviewed and tested the results; no NASA logos or branding were generated.", "كُتبت أجزاء من الكود والنصوص بمساعدة أداة ذكاء اصطناعي للبرمجة (Claude). راجع الفريق النتائج واختبرها؛ ولم يتم توليد أي شعارات أو هوية بصرية لناسا.")}</p>`;
}

/* ---- tutorial ---- */
const COACH = [["#sidebar .sb-crop", "c1t", "c1b"], ["#farmCanvas", "c2t", "c2b"], ["#toolSickle", "c3t", "c3b"], ["#tabAlerts", "c4t", "c4b"]];
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
async function setLang(l) { LANG = l; store.set("fs_lang", l); applyI18n(); if (!$("#scr-onboard").hidden) { renderOnboard(); $("#regionChips").innerHTML = regionChips(); } if (!$("#scr-main").hidden) { renderHUD(); renderSidebar(); refreshHint(); renderTabAgain(); } api("/me", { method: "PATCH", body: { lang: l } }).catch(() => {}); }
$("#placeForm").addEventListener("submit", e => { e.preventDefault(); searchPlace($("#placeQ").value); });
document.addEventListener("click", async e => {
  if (suppressClick) { suppressClick = false; if (e.target.closest("#toolSickle")) return; }
  const a = e.target.closest("[data-act]"), act = a?.dataset.act;
  const crop = e.target.closest(".sb-crop"); if (crop) { const id = crop.dataset.crop; S.sel = S.sel === id ? null : id; renderSidebar(); refreshHint(); return; }
  const tool = e.target.closest(".tool"); if (tool) { const k = tool.dataset.tool; S.sel = null;
    if (k === "topo") S.topo = !S.topo; else if (k === "water") waterPlanSheet();
    renderSidebar(); refreshHint(); return; }
  const tab = e.target.closest(".tab"); if (tab) { switchTab(tab.dataset.tab); return; }
  const pk = e.target.closest("[data-pick]"); if (pk && !e.target.closest("details")) { const id = pk.dataset.pick; OB.picks.has(id) ? OB.picks.delete(id) : OB.picks.add(id); pk.setAttribute("aria-pressed", OB.picks.has(id)); return; }
  const rg = e.target.closest("[data-region]"); if (rg) { const r = REGIONS[+rg.dataset.region]; map?.setView([r[2], r[3]], r[4]); return; }
  const pl = e.target.closest("[data-place]"); if (pl) { goPlace(placeResults[+pl.dataset.place]); return; }
  const slot = e.target.closest(".slot"); if (slot && !slot.disabled) { onSlot(slot.dataset.slot); return; }
  const seg = e.target.closest(".seg button"); if (seg && !act) { const p = seg.parentElement; p.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === seg));
    if (p.id === "segIrr") OB.irr = seg.dataset.v; if (p.id === "segPri") OB.pri = seg.dataset.v; if (p.id === "sprayTool") S.sprayTool = seg.dataset.v; if (p.id === "langSeg") setLang(seg.dataset.v); return; }
  switch (act) {
    case "lang": setLang(LANG === "en" ? "ar" : "en"); break;
    case "locate": if (!navigator.geolocation) { toast(t("locFail")); break; } navigator.geolocation.getCurrentPosition(p => map?.setView([p.coords.latitude, p.coords.longitude], 17), () => toast(t("locFail")), { enableHighAccuracy: true, timeout: 10000 }); break;
    case "undoCorner": OB.corners.pop(); drawCorners(); break;
    case "clearCorners": OB.corners = []; drawCorners(); break;
    case "square": { const du = +$("#sqArea").value; if (!(du > 0) || !map) break; const c = map.getCenter(), half = Math.sqrt(du * 1000) / 2, dlat = half / 110540, dlon = half / (111320 * Math.cos(c.lat * Math.PI / 180));
      OB.corners = [[c.lat + dlat, c.lng - dlon], [c.lat + dlat, c.lng + dlon], [c.lat - dlat, c.lng + dlon], [c.lat - dlat, c.lng - dlon]].map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]); drawCorners(); map.fitBounds(OB.corners, { padding: [30, 30] }); break; }
    case "obBack": if (OB.step === 1) { if (S.plots.length) enterMain(); else show("auth"); } else { OB.step--; renderOnboard(); } break;
    case "obNext": if (OB.step === 1) { OB.step = 2; renderOnboard(); } else if (OB.step === 2) { if (validateStep2()) { OB.step = 3; renderOnboard(); runAnalysis(); } } else createPlot(); break;
    case "retryAnalyze": runAnalysis(); break;
    case "pickSoil": OB.step = 2; $("#fSoil").value = ""; $("#ob3Err").hidden = true; renderOnboard(); fieldErr("#fSoilWrap", true); $("#fSoil").focus(); $("#fSoilWrap").scrollIntoView({ block: "center" }); break;
    case "closeSheet": closeSheet(); break;
    case "plantHere": { const tl = tileById(+a.dataset.id); closeSheet(); if (tl) plantSheet(tl, a.dataset.crop); break; }
    case "clearSquare": closeSheet(); await guard(async () => applyState(await api(`/plots/${S.plotId}/clear`, { method: "POST", body: { tile_ids: [+a.dataset.id] } }))); break;
    case "addCropSheet": addCropSheet(); break;
    case "waterPlan": closeSheet(); waterPlanSheet(); break;
    case "start": startOnboard(); break;
    case "sqAuto": OB.sq = null; schedulePreview(); break;
    case "copyKey": try { await navigator.clipboard.writeText(FARM_KEY); toast(t("copied")); } catch { const r = document.createRange(); r.selectNodeContents($("#keyText")); getSelection().removeAllRanges(); getSelection().addRange(r); } break;
    case "otherKey": { const k = $("#otherKeyIn")?.value; useKey(k); break; }
    case "regrid": { const sz = readSize("#rgW", "#rgH"); if (!sz) break; closeSheet(); await guard(async () => { busy(true); try { S.state = await api(`/plots/${S.plotId}/regrid`, { method: "POST", body: { square_w_m: sz.w, square_h_m: sz.h } }); cam.fitted = false; decorKey = ""; renderHUD(); renderSidebar(); sizeFarm(); renderMore(); toast(t("resized")); } finally { busy(false); } }); break; }
    case "refresh": await guard(() => loadPlot()); break;
    case "zoomIn": zoomAt(1.25, (W - 96) / 2, H / 2); break;
    case "zoomOut": zoomAt(.8, (W - 96) / 2, H / 2); break;
    case "zoomFit": cam.fitted = false; fitCam(); break;
    case "goAlerts": switchTab("alerts"); break;
    case "goPlan": closeSheet(); switchTab("plan"); break;
    case "reloadTab": loadTab(S.tab); break;
    case "alertDo": await guard(async () => { applyState(await api(`/plots/${S.plotId}/alerts/act`, { method: "POST", body: { key: a.dataset.k, idx: +a.dataset.i } })); S.alerts = await api(`/plots/${S.plotId}/alerts`); renderAlerts(); }); break;
    case "addCrop": await guard(async () => { const crops = [...new Set([...P().plot.crops, a.dataset.id])]; await api(`/plots/${S.plotId}`, { method: "PATCH", body: { crops } }); closeSheet(); await loadPlot(); if (S.tab === "plan") loadTab("plan"); toast(cName(a.dataset.id) + " ✓"); }); break;
    case "plots": sheet(`<div class="stack"><h2 style="font-size:22px">${t("myPlots")}</h2>${S.plots.map(p => `<button class="list-item${p.id === S.plotId ? " on" : ""}" data-act="switchPlot" data-id="${p.id}"><div style="flex:1;min-width:0"><b>${esc(p.name)}</b><div class="muted" style="font-size:13px">${esc(p.region)} · ${fmtNum(p.area_m2 / 1000, 1)} ${t("dunums")}</div></div></button>`).join("")}<button class="btn" data-act="addPlot">+ ${t("addPlot")}</button></div>`); break;
    case "switchPlot": S.plotId = +a.dataset.id; store.set("fs_plot", S.plotId); S.sel = null; closeSheet(); switchTab("farm"); await guard(() => loadPlot(true)); break;
    case "addPlot": closeSheet(); startOnboard(); break;
    case "satRefresh": await guard(async () => { const r = await api(`/plots/${S.plotId}/satellite/refresh`, { method: "POST" }); toast(pick2(T.satStatus[r.status] || [r.status, r.status])); await loadPlot(); renderMore(); }); break;
    case "deletePlot": sheet(`<div class="stack"><p>${t("confirmDelete", { n: esc(P().plot.name) })}</p><button class="btn danger-btn block" data-act="deleteYes">${t("yesDelete")}</button><button class="btn ghost block" data-act="closeSheet">${t("cancel")}</button></div>`); break;
    case "deleteYes": closeSheet(); await guard(async () => { await api(`/plots/${S.plotId}`, { method: "DELETE" }); S.plots = await api("/plots"); if (S.plots.length) { S.plotId = S.plots[0].id; store.set("fs_plot", S.plotId); switchTab("farm"); await loadPlot(true); } else startOnboard(); }); break;
    case "tutorial": switchTab("farm"); setTimeout(() => coach(0), 120); break;
    case "coachNext": coach(+a.dataset.i); break;
    case "coachSkip": closeCoach(); store.set("fs_tut", "1"); break;
  }
});
addEventListener("resize", () => { if (!$("#scr-main").hidden) sizeFarm(); });
setInterval(() => { if (!$("#scr-main").hidden && S.tab === "farm" && !document.hidden && !$("#layer .sheet") && !sickle.active) loadPlot().catch(() => {}); }, 10 * 60 * 1000);

/* read-only hook for automated UI tests: screen position of a square's centre */
window.FarmStudioTest = { squareCenter(id) { const tl = tileById(id); if (!tl) return null; const r = cv.getBoundingClientRect();
  return { x: r.left + isoX(tl.c + .5, tl.r + .5) * cam.s + cam.x, y: r.top + isoY(tl.c + .5, tl.r + .5) * cam.s + cam.y }; },
  squares() { return (P()?.tiles || []).filter(x => x.inside).map(x => ({ id: x.id, c: x.c, r: x.r, crop: x.planting?.crop || null, ready: ready(x) })); } };

/* ================= boot ================= */
(async function boot() {
  LANG = store.get("fs_lang") || ((navigator.language || "").startsWith("ar") ? "ar" : "en");
  applyI18n(); requestAnimationFrame(loop);
  try { const list = await api("/crops"); list.forEach(c => S.crops[c.id] = c); } catch (e) { toast(e.message); }
  try { await afterStart(); } catch (e) { show("auth"); toast(e.message); }
})();
})();
