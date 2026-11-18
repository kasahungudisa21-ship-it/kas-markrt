import { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Scale, ShieldCheck, X } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';

export type LegalTab = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  lang: Language;
  onClose: () => void;
}

interface PolicyClause {
  number: string;
  title: string;
  body: string;
}

export function LegalModal({
  isOpen,
  initialTab = 'terms',
  lang,
  onClose,
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const t = translations[lang];

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isAm = lang === 'am';

  const sellerCommitments = isAm
    ? [
        'የሚለጠፉ ንብረቶች፣ መኪኖች እና ዕቃዎች ትክክለኛ፣ በእጅ ላይ ያሉ እና የባለቤትነት መብታቸው የተረጋገጠ መሆን አለባቸው።',
        'ትክክለኛ ዋጋ፣ ትክክለኛ ፎቶ/ቪዲዮ፣ የቤት ክፍል ብዛት፣ የመኪና የተመረተበት ዓመተ ምህረት እና የዕቃ ሁኔታ በግልጽ መጻፍ አለበት።',
        'ያለ ፈቃድ የሌላ ሰው ማስታወቂያ መድገም፣ ዋጋ ማሳሳት ወይም ህገወጥ የደላላ ክፍያ መጠየቅ በጥብቅ የተከለከለ ነው።',
        'ንብረቱ ወይም ዕቃው ሲሸጥ ወይም ሲከራይ ሁኔታውን ወዲያውኑ ወደ Reserved ወይም Closed መቀየር ግዴታ ነው።',
      ]
    : [
        'Every posted property, vehicle, or item must be genuine, currently available, and lawfully owned or authorized for sale/rent.',
        'Sellers must disclose accurate pricing, real 6-angle photos/videos, room class, vehicle manufacture year/mileage, and true item condition.',
        'Bait-and-switch pricing, duplicate spam posts, stolen goods, and undisclosed broker markups are strictly prohibited.',
        'Sellers must honor confirmed inquiries and update listing status promptly to Reserved or Closed once transacted.',
      ];

  const buyerCommitments = isAm
    ? [
        'ትዕዛዝ ወይም የኪራይ ጥያቄ ሲያቀርቡ ትክክለኛ ስም፣ የስልክ ቁጥር እና የመገናኛ/ማድረሻ አድራሻ ማስገባት አለብዎት።',
        'ለቤት፣ ለመሬት እና ለመኪና ግዢ ሙሉ ክፍያ ከመፈጸም በፊት በአካል መመልከት እና ህጋዊ ሰነዶችን (ካርታ / ሊብሬ) ማረጋገጥ ግዴታ ነው።',
        'ለከፍተኛ ክፍያዎች የ Inspection Escrow፣ ባንክ ማስተላለፊያ (በደረሰኝ) ወይም ዕቃውን ካዩ በኋላ የሚከፈል ዘዴን መጠቀም ይመከራል።',
        'የውሸት ትዕዛዝ መላክ፣ ሻጮችን ማዋከብ ወይም የስምምነት ቀጠሮን ያለምክንያት ማበላሸት ከመድረኩ ያሳግዳል።',
      ]
    : [
        'Buyers and tenants must submit genuine inquiries and orders using accurate contact name, phone number, and meeting/delivery details.',
        'For properties, land, and vehicles, buyers must inspect physically and verify legal ownership documents (Digital Carta / Libre / ID) before final payment.',
        'Use verified Bank Transfer receipts, Telebirr, Cash on Delivery after inspection, or Inspection Escrow for safe high-value settlement.',
        'Fake reservations, abusive messages, price manipulation, or no-show harassment lead to immediate account suspension.',
      ];

  const termsClauses: PolicyClause[] = isAm
    ? [
        {
          number: '01.',
          title: 'የቀጥታ ግብይት ስምምነት እና የመድረኩ ሚና',
          body: 'Kas Market ሻጮችን (ባለንብረቶችን) እና ገዥዎችን (ተከራዮችን) ያለ ደላላ በቀጥታ የሚያገናኝ መድረክ ነው። ማንኛውም ተጠቃሚ ማስታወቂያ ሲለጥፍ፣ ትዕዛዝ ሲያዝ ወይም መልዕክት ሲልክ በዚህ ሕግ እና ደንብ ላይ ሙሉ ስምምነት እንዳደረገ ይቆጠራል።',
        },
        {
          number: '02.',
          title: 'የተከለከሉ ተግባራት እና ህገወጥ ማስታወቂያዎች',
          body: 'የተሰረቁ ዕቃዎች፣ የውሸት ካርታ/ሰነድ ያላቸው መሬቶች፣ የተጭበረበረ የመኪና ዓመተ ምህረት ወይም ኪሎሜትር፣ አሳሳች ፎቶዎች፣ የአጸያፊ ይዘት ማስታወቂያዎች እና በኢትዮጵያ ሕግ የተከለከሉ ምርቶች በመድረኩ ላይ ሊለጠፉ አይችሉም።',
        },
        {
          number: '03.',
          title: 'የክፍያ ደህንነት እና የሰነድ ማረጋገጫ',
          body: 'ገዥና ሻጭ የክፍያ መንገድ (Cash on Delivery፣ Telebirr፣ የባንክ ዝውውር ወይም Inspection Escrow) በጋራ ይወስናሉ። Kas Market ያልተረጋገጠ የቅድሚያ ጥሬ ገንዘብ ልውውጥን አይመክርም፤ ሁሉም የባንክ ደረሰኞችና ውሎች በሁለቱ ወገኖች መካከል በህጋዊ መንገድ መያዝ አለባቸው።',
        },
        {
          number: '04.',
          title: 'የቤት ኪራይ፣ የመሬት እና የመኪና ልዩ ደንቦች',
          body: 'በአፓርትመንት፣ ኮንዶሚኒየም እና ቤት ኪራይ ላይ የተገለጸው የክፍል ብዛት (Class) እና የተከራይ ሁኔታ (ላጤ / ባለትዳር) ግልጽና እውነተኛ መሆን አለበት። በመኪኖች ላይ ትክክለኛ የመኪና ዓይነት፣ ሞዴል፣ የተመረተበት ዓመተ ምህረት እና የሞተር ሁኔታ መገለጽ አለበት።',
        },
        {
          number: '05.',
          title: 'የመድረኩ ሕግ ማስከበር እና እርምጃዎች',
          body: 'የ Kas Market አስተዳዳሪዎች ደንብ የሚጥሱ ማስታወቂያዎችን ያለ ማስጠንቀቂያ የማጥፋት፣ አጠራጣሪ ትዕዛዞችን የማገድ እና ደንብ የጣሱ ተጠቃሚዎችን ከመድረኩ የማሰናበት ሙሉ መብት አላቸው።',
        },
        {
          number: '06.',
          title: 'የአለመግባባት አፈታት',
          body: 'በሻጭ እና በገዥ መካከል አለመግባባት ቢፈጠር መጀመሪያ በመድረኩ የመልዕክት ክፍል ወይም በስልክ በሰላም ይፈታል። ከባድ የማጭበርበር ጥርጣሬ ካለ ለመድረኩ አስተዳደር (kasahungudisa12@gmail.com) እና ለህግ አካላት ሪፖርት ይደረጋል።',
        },
      ]
    : [
        {
          number: '01.',
          title: 'Direct Marketplace Scope & Binding Consent',
          body: 'Kas Market connects property owners, vehicle sellers, merchants, and buyers directly without unauthorized middlemen. By publishing a listing, placing an order, or sending a buyer request, both parties agree to act in good faith and abide by these binding rules.',
        },
        {
          number: '02.',
          title: 'Zero Tolerance for Fraud & Prohibited Listings',
          body: 'Fake prices, stolen goods, forged title deeds (Carta), falsified vehicle manufacture years or odometer readings, misleading images, duplicate spam, and items banned under Ethiopian law are strictly prohibited and subject to immediate removal.',
        },
        {
          number: '03.',
          title: 'Inspection, Documentation & Payment Safety',
          body: 'Parties choose settlement via Cash on Delivery, Telebirr, Bank Transfer with official receipt, or Inspection Escrow. Buyers must physically inspect items and verify legal documents before releasing irreversible funds for properties, land, or vehicles.',
        },
        {
          number: '04.',
          title: 'Category-Specific Accuracy Rules',
          body: 'Housing listings (Apartments, Condominiums, Houses) must accurately state room class and tenant terms. Vehicle listings must truthfully state body type, model, manufacture year, transmission, and fuel type. Goods listings must declare genuine model and condition.',
        },
        {
          number: '05.',
          title: 'Platform Enforcement & Moderation Authority',
          body: 'Kas Market administrators continuously monitor marketplace integrity and reserve the right to edit, hide, or delete non-compliant listings, cancel fraudulent orders, and permanently suspend violating accounts without prior notice.',
        },
        {
          number: '06.',
          title: 'Dispute Resolution & Governing Compliance',
          body: 'Disputes between buyers and sellers should first be resolved amicably using direct transaction records. Confirmed fraud or unlawful conduct may be escalated to Kas Market administration (kasahungudisa12@gmail.com) and relevant local authorities.',
        },
      ];

  const privacyClauses: PolicyClause[] = isAm
    ? [
        {
          number: '01.',
          title: 'የምንሰበስባቸው መረጃዎች',
          body: 'በ Google Sign-In ሲገቡ ስምዎን እና ኢሜይልዎን እንዲሁም ማስታወቂያ ሲለጥፉ፣ ትዕዛዝ ሲያዙ ወይም መልዕክት ሲልኩ የሚያስገቡትን ስልክ ቁጥር፣ የማድረሻ አድራሻ እና የማስታወቂያ ፎቶ/ድምጽ/ቪዲዮ እንሰበስባለን።',
        },
        {
          number: '02.',
          title: 'የስልክ ቁጥር ጥብቅ ምስጢራዊነት',
          body: 'የእርስዎ ስልክ ቁጥር በሕዝብ መድረክ ላይ ለማንም አይታይም። ስልክ ቁጥሮች በተለየ ደህንነቱ በተጠበቀ የግል መረጃ ቋት (Private Vault) ተቀምጠው ለተፈቀደላቸው የግብይት አካላት እና ለመድረኩ አስተዳደር (ለማረጋገጫ እና ለደህንነት) ብቻ ይውላሉ።',
        },
        {
          number: '03.',
          title: 'መረጃዎን ለምን እንደምንጠቀምበት',
          body: 'መረጃዎን ሻጭና ገዥን በቀጥታ ለማገናኘት፣ የትዕዛዝ ሁኔታን ለማሳወቅ፣ የውሸት ማስታወቂያዎችን እና ማጭበርበርን ለመከላከል እና የመድረኩን ደንብ ለማስከበር ብቻ እንጠቀምበታለን።',
        },
        {
          number: '04.',
          title: 'ለሶስተኛ ወገን አለመሸጥ እና የዳታ ደህንነት',
          body: 'Kas Market የተጠቃሚዎችን ስልክ ቁጥር፣ ኢሜይል ወይም የግል መረጃ ለማስታወቂያ ድርጅቶች ወይም ለሶስተኛ ወገን በፍጹም አይሸጥም፤ አያከራይም። ሁሉም መረጃዎች በጥብቅ የ Firebase Authentication እና Security Rules ይጠበቃሉ።',
        },
        {
          number: '05.',
          title: 'የተጠቃሚ መብቶች (ማስተካከል እና ማጥፋት)',
          body: 'ተጠቃሚዎች የለጠፉትን ማስታወቂያ ወይም የግዢ ጥያቄ በማንኛውም ጊዜ የማስተካከል፣ ሁኔታውን የመቀየር ወይም ሙሉ በሙሉ የማጥፋት መብት አላቸው።',
        },
        {
          number: '06.',
          title: 'የግላዊነት ጥያቄዎች እና አድራሻ',
          body: 'ስለ ግላዊነት ፖሊሲው ወይም ስለ መረጃዎ ጥበቃ ማንኛውም ጥያቄ ካለዎት በቀጥታ ለመድረኩ አስተዳደር በ kasahungudisa12@gmail.com ማሳወቅ ይችላሉ።',
        },
      ]
    : [
        {
          number: '01.',
          title: 'Information We Collect',
          body: 'When you sign in with Google or transact on Kas Market, we collect your display name, email address, private phone number, neighborhood/delivery location, and any listing photos, voice descriptions, or walkthrough videos you upload.',
        },
        {
          number: '02.',
          title: 'Strict Phone Number Confidentiality',
          body: 'Phone numbers are never exposed publicly on marketplace listing pages. All phone numbers are stored in a protected private record accessible only to authorized platform administration and verified transaction coordination workflows.',
        },
        {
          number: '03.',
          title: 'How We Use Your Information',
          body: 'Your information is used strictly to publish your listings, coordinate buyer-seller inquiries and orders, deliver real-time order notifications, detect fraud or duplicate spam, and enforce marketplace safety rules.',
        },
        {
          number: '04.',
          title: 'No Sale of Personal Data & Technical Security',
          body: 'Kas Market never sells, rents, or trades your phone number, email address, or transaction history to third-party marketers or data brokers. Access is strictly governed by authenticated Firebase Security Rules.',
        },
        {
          number: '05.',
          title: 'Your Control, Editing & Deletion Rights',
          body: 'You retain full control over listings and buyer wanted requests you create, with the ability to update details, mark items reserved or closed, or delete your posts directly from your account.',
        },
        {
          number: '06.',
          title: 'Governance & Privacy Contact',
          body: 'Kas Market may update these rules or privacy protections as the platform evolves. For privacy requests, abuse reports, or data inquiries, contact platform administration at kasahungudisa12@gmail.com.',
        },
      ];

  const activeClauses = activeTab === 'terms' ? termsClauses : privacyClauses;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FAF8F4] border border-[#DED8CC] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0B2620] text-[#FBF9F4] px-5 sm:px-7 py-5 flex items-start justify-between gap-4 border-b border-[#1D4E40]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Scale className="w-4 h-4 shrink-0" />
              <span>{t.brand}</span>
              <span aria-hidden="true">·</span>
              <span>{isAm ? 'የተጠቃሚ ስምምነት እና ደህንነት' : 'Marketplace Governance & Safety'}</span>
            </div>
            <h2
              id="legal-modal-title"
              className="text-lg sm:text-xl font-bold tracking-tight text-white [text-wrap:balance]"
            >
              {activeTab === 'terms'
                ? isAm
                  ? 'የ Kas Market ሕግ እና ደንብ (የሻጭና ገዥ ስምምነት)'
                  : 'Kas Market Terms, Rules & Buyer-Seller Agreement'
                : isAm
                ? 'የ Kas Market የግላዊነት እና የመረጃ ጥበቃ ፖሊሲ'
                : 'Kas Market Privacy & Data Protection Policy'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal policy modal"
            className="p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Controls */}
        <div className="px-5 sm:px-7 py-3 bg-[#F2EFE9] border-b border-[#E5E0D6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#DED8CC] rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'terms'
                  ? 'bg-[#0F4C3A] text-white shadow-sm'
                  : 'text-[#2F423B] hover:bg-[#F5F2EC]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{t.termsLink}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'privacy'
                  ? 'bg-[#1E40AF] text-white shadow-sm'
                  : 'text-[#2F423B] hover:bg-[#F5F2EC]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{t.privacyLink}</span>
            </button>
          </div>
          <span className="text-xs text-[#56625E] font-mono tabular-nums">
            {isAm ? 'ተፈጻሚነት፡ 2026 · Kas Market' : 'Effective: 2026 · Kas Market'}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 sm:px-7 py-6 space-y-6">
          {activeTab === 'terms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#D4E3DC] rounded-xl p-5 space-y-3">
                <div className="text-sm font-bold text-[#0F4C3A]">
                  {isAm
                    ? 'የሻጮች እና የአከራዮች ቃል ኪዳን'
                    : 'Seller & Landlord Commitments'}
                </div>
                <ul className="space-y-2 text-xs text-[#2B4039] leading-relaxed">
                  {sellerCommitments.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5E48] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-[#D4E1F5] rounded-xl p-5 space-y-3">
                <div className="text-sm font-bold text-[#1E40AF]">
                  {isAm
                    ? 'የገዥዎች እና የተከራዮች ቃል ኪዳን'
                    : 'Buyer & Tenant Commitments'}
                </div>
                <ul className="space-y-2 text-xs text-[#263859] leading-relaxed">
                  {buyerCommitments.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E5E0D6] rounded-xl divide-y divide-[#EFECE4]">
            {activeClauses.map((clause) => (
              <div key={clause.number} className="p-5 space-y-1.5">
                <h3 className="text-sm font-bold text-[#102620]">
                  <span className="font-mono tabular-nums text-[#B45309] mr-2">
                    {clause.number}
                  </span>
                  {clause.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#3B4E48] leading-relaxed">
                  {clause.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-7 py-4 bg-white border-t border-[#E5E0D6] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#56625E]">
            {isAm
              ? 'ይህን መድረክ በመጠቀም የሻጭ፣ የገዥ እና የመድረኩን ደንቦች ተቀብለዋል።'
              : 'Using Kas Market constitutes binding acceptance of both Marketplace Rules and Privacy Policy.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#0F4C3A] hover:bg-[#0B3B2D] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {isAm ? 'ተረድቻለሁ / ዝጋ' : 'Understood & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
