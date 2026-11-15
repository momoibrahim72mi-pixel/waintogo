// I testi del sito in ARABO (arabo standard moderno). Stesse chiavi di it.ts.
// Da far rileggere a una persona di madrelingua prima di andare online (vedi D30).
//
// I plurali in arabo hanno sei forme e cambiano con il numero:
//   0 → "zero", 1 → "one", 2 → "two" (il duale), 3-10 → "few", 11-99 → "many", 100+ → "other".
// Non le calcoliamo a mano: Intl.PluralRules("ar") dice quale forma usare per ogni numero.
import type { Dizionario } from "./it";

type Forme = Record<Intl.LDMLPluralRule, string>;
const regole = new Intl.PluralRules("ar");
/** Sceglie la forma giusta e mette il numero al posto di {n}. */
const conta = (n: number, forme: Forme) => forme[regole.select(n)].replace("{n}", String(n));

export const ar: Dizionario = {
  meta: {
    titolo: "Waintogo · اكتشف رحلتنا القادمة",
    descrizione:
      "رحلات جماعية وعطلات نهاية الأسبوع ورحلات ليوم واحد وخلوات: مجموعات صغيرة وأشخاص جدد ومنسّق معكم دائمًا. اكتشف رحلتنا القادمة.",
  },
  menu: {
    principale: "القائمة الرئيسية",
    piede: "قائمة أسفل الصفحة",
    apri: "افتح القائمة",
    chiudi: "أغلق القائمة",
    lingua: "اللغة",
    voci: {
      prossimo: "الرحلة القادمة",
      cosaFacciamo: "ماذا نفعل",
      passati: "رحلات سابقة",
      chiSiamo: "من نحن",
      faq: "أسئلة شائعة",
      contatti: "تواصل معنا",
    },
  },
  piede: { slogan: "رحلات جماعية وعطلات نهاية الأسبوع ورحلات ليوم واحد وخلوات. رحلة واحدة في كل مرة، بإتقان." },
  home: {
    occhiello: "رحلات · عطلات نهاية الأسبوع · رحلات يومية · خلوات",
    titolo: { prima: "اكتشف ", evidenza: "رحلتنا القادمة", dopo: "" },
    sotto: "مجموعات صغيرة وأشخاص جدد ومنسّق معكم دائمًا. رحلة واحدة في كل مرة، بإتقان.",
    doveAndiamo: (destinazione: string) => `إلى أين نذهب؟ ${destinazione}`,
    scopri: "اكتشف الرحلة القادمة",
    prossimo: "الرحلة القادمة",
    piuAvanti: "لاحقًا",
    cosaFacciamo: {
      occhiello: "ماذا نفعل",
      titolo: "ليست رحلات فقط",
      sotto: "يوم أو عطلة نهاية أسبوع أو أسبوع: تتغير المدة، ولا تتغير الروح.",
      attivita: [
        { nome: "رحلات", durata: "أسبوع أو أكثر", testo: "الرحلة الحقيقية: مكان بعيد، مجموعة صغيرة، ومنسّق يسافر معكم." },
        { nome: "عطلات نهاية الأسبوع", durata: "2–3 أيام", testo: "عطلات قصيرة في إيطاليا وأوروبا: ننطلق يوم الجمعة ونعود مع أصدقاء جدد." },
        { nome: "رحلات يومية", durata: "يوم واحد", testo: "انطلاق في الصباح وعودة في المساء: نزهة أو قرية أو بحيرة. أسهل طريقة للتعرّف علينا." },
        { nome: "خلوات", durata: "بضعة أيام", testo: "لترتاح حقًا: طبيعة، وإيقاع هادئ، وأنشطة جماعية، والهاتف في الجيب." },
      ],
    },
    passati: {
      occhiello: "رحلات سابقة",
      titolo: "أين ذهبنا من قبل",
      vuoto: "رحلتنا الأولى لم تنطلق بعد: ستجد صور رحلاتنا هنا.",
    },
    chiSiamo: {
      occhiello: "من نحن",
      titolo: "مجموعة من الأصدقاء ينظّمون الرحلات",
      paragrafi: [
        "بدأنا بتنظيم رحلات لأنفسنا ولأصدقاء الأصدقاء. نحب السفر بأعداد قليلة، واختيار أماكن نعيشها لا نراها فقط، والعودة إلى البيت بأشخاص جدد في قائمة الأسماء.",
        "لكل رحلة منسّق يسافر مع المجموعة: يهتم بالتنظيم، لتهتموا أنتم بالاستمتاع فقط.",
      ],
    },
    faq: { occhiello: "أسئلة شائعة", titolo: "الأسئلة الشائعة" },
    contatti: {
      occhiello: "تواصل معنا",
      titolo: "راسلنا",
      sotto: "عندك سؤال عن الرحلة أو تريد التعرّف علينا أولًا؟ نحن من يرد عليك، لا روبوت.",
    },
    chiusura: "هل أنت مستعد للانطلاق؟",
    inPreparazione: {
      titolo: "نحضّر الرحلة القادمة",
      testo: "راسلنا لتكون أول من يعرف، أو شاهد أين ذهبنا من قبل.",
      pulsante: "تواصل معنا",
    },
  },
  viaggio: {
    giorni: (n: number) =>
      conta(n, { zero: "{n} أيام", one: "يوم واحد", two: "يومان", few: "{n} أيام", many: "{n} يومًا", other: "{n} يوم" }),
    con: (coordinatore: string) => `مع ${coordinatore}`,
    accontoPerPosto: (acconto: string) => `عربون ${acconto} لحجز مكانك`,
    acconto: (acconto: string) => `عربون ${acconto}`,
    prenota: "احجز مكانك",
    prenotaBreve: "احجز",
    listaAttesa: "سجّل في قائمة الانتظار",
    listaAttesaBreve: "قائمة الانتظار",
    richiedi: "اطلب مكانًا",
    programma: "شاهد البرنامج",
    nonPaghi: "لا تدفع شيئًا الآن: نحجز لك مكانك ونرسل لك بيانات دفع العربون (تحويل بنكي أو Revolut).",
    altreDate: (n: number) =>
      conta(n, {
        zero: "لا توجد مواعيد أخرى",
        one: "يوجد موعد آخر أيضًا",
        two: "يوجد موعدان آخران",
        few: "توجد {n} مواعيد أخرى",
        many: "يوجد {n} موعدًا آخر",
        other: "يوجد {n} موعد آخر",
      }),
    il: "الرحلة",
    puntiForti: "أبرز ما في الرحلة",
    giornoPerGiorno: "يومًا بيوم",
    giorno: (n: number) => `اليوم ${n}`,
    incluso: "ما يشمله السعر",
    nonIncluso: "ما لا يشمله السعر",
    partenze: "المواعيد والأسعار",
    nuoveDate: "مواعيد جديدة قريبًا: عُد لزيارتنا لاحقًا.",
    coordinatore: (nome: string) => `المنسّق: ${nome}`,
    coordinatoreInArrivo: "سيُعلن عن المنسّق قريبًا",
    infoUtili: "معلومات مفيدة",
    inBreve: "باختصار",
    destinazione: "الوجهة",
    durata: "المدة",
    prezzo: "السعر",
    da: (prezzo: string) => `ابتداءً من ${prezzo}`,
    eta: "العمر",
    impegno: "المجهود البدني",
    prossimaPartenza: "الانطلاق القادم",
    inArrivo: "قريبًا",
    scegliData: "اختر الموعد",
    foto: (destinazione: string) => `صورة: ${destinazione}`,
    soloItaliano: "تفاصيل هذه الرحلة متوفرة حاليًا باللغة الإيطالية فقط.",
    livelli: { facile: "سهل", medio: "متوسط", impegnativo: "صعب" },
    stili: { avventura: "مغامرة", natura: "طبيعة", citta: "مدينة", mare: "بحر", cultura: "ثقافة", "on-the-road": "على الطريق" },
  },
  disponibilita: {
    completo: "مكتمل · قائمة الانتظار",
    ultimi: (n: number) =>
      conta(n, {
        zero: "لا أماكن",
        one: "آخر مكان",
        two: "آخر مكانين",
        few: "آخر {n} أماكن",
        many: "آخر {n} مكانًا",
        other: "آخر {n} مكان",
      }),
    garantita: "انطلاق مؤكَّد",
    disponibili: (n: number) =>
      conta(n, {
        zero: "لا أماكن متاحة",
        one: "مكان واحد متاح",
        two: "مكانان متاحان",
        few: "{n} أماكن متاحة",
        many: "{n} مكانًا متاحًا",
        other: "{n} مكان متاح",
      }),
  },
  domande: [
    {
      d: "كيف أحجز؟",
      r: "افتح الرحلة القادمة واضغط \"احجز مكانك\": تترك اسمك وبريدك الإلكتروني ورقم هاتفك، ولا تدفع شيئًا عبر الإنترنت. نحجز لك مكانك وتحصل فورًا على رمز حجز مع بيانات دفع العربون. عندما يصلنا العربون تصبح رسميًا ضمن المجموعة.",
    },
    {
      d: "هل يمكنني السفر وحدي؟",
      r: "بالطبع، وهذا هو الأكثر شيوعًا! معظم الناس يسافرون بمفردهم: والمجموعة تصبح رفقتك في السفر.",
    },
    {
      d: "من هو المنسّق؟",
      r: "مسافر ذو خبرة يرافق المجموعة: ينظّم الأيام ويحل المشكلات الطارئة ويجمع الناس. ليس مرشدًا سياحيًا: حيث يلزم نعتمد على مرشدين محليين.",
    },
    {
      d: "كيف أدفع؟",
      r: "بعد الطلب تحصل على رمز الحجز وبيانات التحويل البنكي أو Revolut. أولًا تدفع العربون لتأكيد مكانك، ثم باقي المبلغ قبل الانطلاق بثلاثين يومًا.",
    },
    {
      d: "ماذا يعني \"انطلاق مؤكَّد\"؟",
      r: "يعني أننا وصلنا إلى الحد الأدنى من المشاركين: الرحلة ستتم بالتأكيد ويمكنك حجز الطيران والإجازة بطمأنينة.",
    },
    {
      d: "وماذا لو كان الموعد مكتملًا؟",
      r: "يمكنك إرسال طلبك مع ذلك: تدخل قائمة الانتظار ونتواصل معك فور توفّر مكان.",
    },
    {
      d: "هل تذكرة الطيران مشمولة؟",
      r: "يعتمد ذلك على الرحلة: في صفحة كل رحلة تجد دائمًا ما يشمله السعر وما لا يشمله.",
    },
  ],
  contatti: {
    whatsapp: "راسلنا على واتساب",
    instagram: (account: string) => `إنستغرام @${account}`,
    segnapostoWhatsapp: "[رقم واتساب]",
    segnapostoInstagram: "[حساب إنستغرام]",
    segnapostoEmail: "[البريد الإلكتروني]",
  },
  iscrizione: {
    titolo: "اطلب مكانك",
    sotto: "لا تدفع شيئًا الآن. نحجز لك مكانك ونعطيك فورًا الرمز وبيانات دفع العربون.",
    nessunaPartenza: "لا توجد مواعيد متاحة لهذه الرحلة حاليًا.",
    opzioneListaAttesa: "قائمة الانتظار",
  },
  modulo: {
    partenza: "الموعد",
    nome: "الاسم",
    cognome: "اسم العائلة",
    email: "البريد الإلكتروني",
    telefono: "الهاتف (يفضَّل مع واتساب)",
    dataNascita: "تاريخ الميلاد",
    note: "ملاحظات (حساسية، مع من تحب أن تتشارك الغرفة...)",
    privacy: "أوافق على معالجة بياناتي لإدارة الحجز.",
    invia: "اطلب مكانًا",
    invioInCorso: "جارٍ الإرسال…",
    controllaCampi: "تحقّق من الحقول المحدَّدة.",
    errori: {
      partenzaId: "اختر موعدًا",
      nome: "اكتب الاسم",
      cognome: "اكتب اسم العائلة",
      email: "بريد إلكتروني غير صالح",
      telefono: "رقم هاتف غير صالح",
      dataNascita: "تاريخ غير صالح",
      note: "النص طويل جدًا",
      privacy: "نحتاج إلى موافقتك لمعالجة طلبك",
    },
    erroreGenerico: "حدث خطأ ما، حاول مرة أخرى",
    inAttesaOcchiello: "أنت في قائمة الانتظار",
    inAttesaTitolo: "سنخبرك فور توفّر مكان",
    ricevutaOcchiello: "تم استلام الطلب",
    ricevutaTitolo: "مكانك محجوز لك!",
    tuoCodice: "رمز حجزك:",
    inAttesaTesto:
      "هذا الموعد مكتمل. لا تحتاج إلى دفع أي شيء الآن: إذا توفّر مكان سنتواصل معك حسب ترتيب الطلبات.",
    versaAcconto: "للتأكيد ادفع العربون وقدره {acconto} (السعر الإجمالي {prezzo}). اكتب الرمز {codice} في سبب التحويل.",
    dopoAcconto: "فور استلامنا العربون يتأكد حجزك. يُدفع باقي المبلغ قبل الانطلاق بثلاثين يومًا.",
    salva: "احفظ هذه الصفحة أو التقط صورة للشاشة: ستحتاج إلى الرمز.",
  },
  nonTrovato: {
    titolo: "الصفحة غير موجودة",
    testo: "ربما لم تعد الرحلة متاحة، أو أن العنوان غير صحيح.",
  },
};
