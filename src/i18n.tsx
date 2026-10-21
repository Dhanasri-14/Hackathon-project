import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    'app.name': 'UyirThunai',
    'app.tagline': 'A Helping Hand for Every Life',
    'app.subtagline': 'Unified Emergency Blood Coordination & Pharmacy Medicine Delivery Platform',
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.blood_requests': 'Blood Requests',
    'nav.donor_directory': 'Donor Directory',
    'nav.donor_profile': 'Donor Registration',
    'nav.medicines': 'Medicines Catalogue',
    'nav.prescriptions': 'Prescriptions',
    'nav.orders': 'Orders & Tracking',
    'nav.cart': 'Shopping Cart',
    'nav.pharmacy_inventory': 'Pharmacy Inventory',
    'nav.pharmacy_review': 'Prescription Queue',
    'nav.courier_hub': 'Courier Hub',
    'nav.user_management': 'User Management',
    'nav.audit_logs': 'Audit Logs',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.logout': 'Sign Out',
    'nav.switch_role': 'Test Demo Roles',

    // Roles
    'role.patient': 'Patient / Requester',
    'role.donor': 'Blood Donor',
    'role.hospital_staff': 'Hospital Blood Bank Staff',
    'role.pharmacy_staff': 'Licensed Pharmacy Staff',
    'role.courier': 'Delivery Courier Partner',
    'role.admin': 'Administrator',

    // Common Actions
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.submit': 'Submit',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.reset': 'Reset',
    'action.view': 'View Details',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.close': 'Close',
    'action.accept': 'Accept Request',
    'action.decline': 'Decline Request',
    'action.mark_unavailable': 'Mark Unavailable',
    'action.approve': 'Approve',
    'action.reject': 'Reject',
    'action.request_correction': 'Request Correction',
    'action.assign_courier': 'Assign Courier',
    'action.add_to_cart': 'Add to Cart',
    'action.checkout': 'Proceed to Checkout',
    'action.upload_rx': 'Upload Prescription',
    'action.create_blood_request': 'Request Emergency Blood',

    // Statuses
    'status.Submitted': 'Submitted',
    'status.Matching in Progress': 'Matching in Progress',
    'status.Awaiting Donor Response': 'Awaiting Donor Response',
    'status.Under Staff Review': 'Under Staff Review',
    'status.Fulfilled': 'Fulfilled',
    'status.Cancelled': 'Cancelled',
    'status.available': 'Actively Available',
    'status.on_hold': 'Cooldown / On Hold',
    'status.unavailable': 'Unavailable',
    'status.in_stock': 'In Stock',
    'status.low_stock': 'Low Stock Alert',
    'status.out_of_stock': 'Out of Stock',
    'status.Under Review': 'Under Review',
    'status.Approved': 'Approved',
    'status.Rejected': 'Rejected',
    'status.Correction Requested': 'Correction Requested',
    'status.Awaiting Prescription Review': 'Awaiting Rx Review',
    'status.Processing': 'Processing in Pharmacy',
    'status.Ready for Dispatch': 'Ready for Dispatch',
    'status.Courier Assigned': 'Courier Assigned',
    'status.Out for Delivery': 'Out for Delivery',
    'status.Delivered': 'Delivered Successfully',

    // Urgency
    'urgency.critical': 'CRITICAL (Immediate Transfusion)',
    'urgency.urgent': 'URGENT (Within 12-24 Hours)',
    'urgency.standard': 'STANDARD (Elective / Scheduled)',

    // Blood module
    'blood.emergency_header': 'Emergency Blood Coordination',
    'blood.emergency_desc': 'Rapid immunological compatibility matching and instant donor alerting for life-critical cases.',
    'blood.units_required': 'Units Required',
    'blood.units_fulfilled': 'Units Fulfilled',
    'blood.hospital': 'Hospital / Clinic',
    'blood.patient_ref': 'Patient Reference',
    'blood.patient_name': 'Patient Name',
    'blood.blood_group': 'Blood Group',
    'blood.urgency': 'Urgency Level',
    'blood.match_engine': 'Clinical Compatibility Matcher',
    'blood.candidates_found': 'Candidate Donors Identified',
    'blood.comp_score': 'Compatibility Score',
    'blood.safeguard_title': 'Important Clinical Safeguard',
    'blood.safeguard_text': 'Software compatibility rankings indicate algorithmic candidates only. Final serological cross-matching and clinical testing by hospital blood bank officers are mandatory before any transfusion.',

    // Pharmacy module
    'pharma.header': 'Pharmacy & Medicine Delivery',
    'pharma.desc': 'Licensed prescription verification, temperature-safe packaging, and last-mile tracked medical dispatch.',
    'pharma.rx_required': 'Prescription Required (Schedule H/H1)',
    'pharma.rx_not_required': 'Over The Counter (OTC)',
    'pharma.stock': 'Available Units',
    'pharma.dosage': 'Dosage Form',
    'pharma.strength': 'Strength',
    'pharma.mfg': 'Manufacturer',
    'pharma.cart_title': 'Your Medicine Cart',
    'pharma.delivery_address': 'Delivery Address',
    'pharma.attach_rx': 'Attach Valid Prescription',
    'pharma.pay_method': 'Payment Mode',

    // Common
    'common.notifications': 'Notifications',
    'common.mark_all_read': 'Mark all as read',
    'common.no_notifications': 'No new notifications.',
    'common.loading': 'Loading data...',
    'common.error': 'An error occurred',
    'common.empty': 'No records found matching criteria.',
    'common.demo_mode': 'Academic Hackathon Demonstration Mode (Fictional Data Only)',
  },
  ta: {
    // Brand & Header
    'app.name': 'உயிர்த்துணை',
    'app.tagline': 'ஒவ்வொரு உயிருக்கும் ஒரு உதவும் கரம்',
    'app.subtagline': 'அவசர இரத்தத் தேவை & மருந்தக மருந்து விநியோக ஒருங்கிணைப்பு தளம்',
    'nav.home': 'முகப்பு',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.blood_requests': 'இரத்தக் கோரிக்கைகள்',
    'nav.donor_directory': 'கொடையாளர்கள் பட்டியல்',
    'nav.donor_profile': 'கொடையாளர் பதிவு',
    'nav.medicines': 'மருந்துகள் அட்டவணை',
    'nav.prescriptions': 'பரிந்துரைச்சீட்டுகள்',
    'nav.orders': 'ஆர்டர்கள் & கண்காணிப்பு',
    'nav.cart': 'மருந்து கூடை',
    'nav.pharmacy_inventory': 'மருந்தக இருப்பு',
    'nav.pharmacy_review': 'மருத்துவ சீட்டு ஆய்வு',
    'nav.courier_hub': 'டெலிவரி மையம்',
    'nav.user_management': 'பயனர் மேலாண்மை',
    'nav.audit_logs': 'தணிக்கை பதிவுகள்',
    'nav.notifications': 'அறிவிப்புகள்',
    'nav.settings': 'அமைப்புகள்',
    'nav.login': 'உள்நுழைய',
    'nav.register': 'பதிவு செய்ய',
    'nav.logout': 'வெளியேறு',
    'nav.switch_role': 'டெமோ பாத்திரங்கள்',

    // Roles
    'role.patient': 'நோயாளி / கோரிக்கையாளர்',
    'role.donor': 'இரத்தக் கொடையாளர்',
    'role.hospital_staff': 'மருத்துவமனை இரத்த வங்கி அலுவலர்',
    'role.pharmacy_staff': 'அங்கீகரிக்கப்பட்ட மருந்தாளர்',
    'role.courier': 'மருந்து விநியோகஸ்தர்',
    'role.admin': 'நிர்வாகி (அட்மின்)',

    // Common Actions
    'action.save': 'சேமிக்க',
    'action.cancel': 'ரத்து செய்ய',
    'action.confirm': 'உறுதி செய்க',
    'action.submit': 'சமர்ப்பிக்க',
    'action.search': 'தேடுக',
    'action.filter': 'வடிகட்டுக',
    'action.reset': 'மீட்டமைக்க',
    'action.view': 'விவரங்கள்',
    'action.edit': 'திருத்து',
    'action.delete': 'நீக்குக',
    'action.close': 'மூடுக',
    'action.accept': 'கோரிக்கையை ஏற்கிறேன்',
    'action.decline': 'நிராகரிக்கிறேன்',
    'action.mark_unavailable': 'தற்போது இயலாது',
    'action.approve': 'அங்கீகரிக்கவும்',
    'action.reject': 'நிராகரிக்கவும்',
    'action.request_correction': 'திருத்தம் கோருக',
    'action.assign_courier': 'டெலிவரி நபரை ஒதுக்கு',
    'action.add_to_cart': 'கூடையில் சேர்க்க',
    'action.checkout': 'ஆர்டர் செய்க',
    'action.upload_rx': 'பரிந்துரைச்சீட்டு பதிவேற்றுக',
    'action.create_blood_request': 'அவசர இரத்தக் கோரிக்கை',

    // Statuses
    'status.Submitted': 'சமர்ப்பிக்கப்பட்டது',
    'status.Matching in Progress': 'பொருத்தம் தேடப்படுகிறது',
    'status.Awaiting Donor Response': 'கொடையாளர் பதிலுக்காக காத்திருக்கிறது',
    'status.Under Staff Review': 'மருத்துவர் ஆய்வில் உள்ளது',
    'status.Fulfilled': 'நிறைவேற்றப்பட்டது',
    'status.Cancelled': 'ரத்து செய்யப்பட்டது',
    'status.available': 'தானம் செய்ய தயார்',
    'status.on_hold': 'இடைவெளி / நிறுத்திவைப்பு',
    'status.unavailable': 'கிடைக்கப்பெறவில்லை',
    'status.in_stock': 'இருப்பில் உள்ளது',
    'status.low_stock': 'குறைந்த இருப்பு எச்சரிக்கை',
    'status.out_of_stock': 'இருப்பு இல்லை',
    'status.Under Review': 'ஆய்வில் உள்ளது',
    'status.Approved': 'அங்கீகரிக்கப்பட்டது',
    'status.Rejected': 'நிராகரிக்கப்பட்டது',
    'status.Correction Requested': 'திருத்தம் கோரப்பட்டுள்ளது',
    'status.Awaiting Prescription Review': 'சீட்டு ஆய்வில் உள்ளது',
    'status.Processing': 'மருந்தகத்தில் தயார் செய்யப்படுகிறது',
    'status.Ready for Dispatch': 'அனுப்ப தயார்',
    'status.Courier Assigned': 'டெலிவரி நபர் நியமிக்கப்பட்டார்',
    'status.Out for Delivery': 'விநியோகத்திற்கு புறப்பட்டது',
    'status.Delivered': 'வெற்றிகரமாக வழங்கப்பட்டது',

    // Urgency
    'urgency.critical': 'மிக அவசரம் (உடனடி செலுத்துகை)',
    'urgency.urgent': 'அவசரம் (12-24 மணி நேரத்திற்குள்)',
    'urgency.standard': 'வழக்கமான தேவை (திட்டமிடப்பட்டது)',

    // Blood module
    'blood.emergency_header': 'அவசர இரத்தத் தேவை ஒருங்கிணைப்பு',
    'blood.emergency_desc': 'உயிர் காக்கும் நிலைகளில் தானியங்கி இரத்த வகை பொருத்தம் மற்றும் உடனடி கொடையாளர் எச்சரிக்கை.',
    'blood.units_required': 'தேவைப்படும் யூனிட்கள்',
    'blood.units_fulfilled': 'பெறப்பட்ட யூனிட்கள்',
    'blood.hospital': 'மருத்துவமனை',
    'blood.patient_ref': 'நோயாளி குறிப்பு எண்',
    'blood.patient_name': 'நோயாளி பெயர்',
    'blood.blood_group': 'இரத்த வகை',
    'blood.urgency': 'அவசர நிலை',
    'blood.match_engine': 'மருத்துவ இரத்த வகை பொருத்துதல் பொறிமுறை',
    'blood.candidates_found': 'பொருத்தமான கொடையாளர்கள்',
    'blood.comp_score': 'பொருத்த மதிப்பீடு',
    'blood.safeguard_title': 'முக்கிய மருத்துவ பாதுகாப்பு வழிகாட்டுதல்',
    'blood.safeguard_text': 'மென்பொருள் பொருத்தம் சாத்தியமான கொடையாளர்களை மட்டுமே கண்டறிகிறது. இரத்த மாற்று அறுவை சிகிச்சைக்கு முன் இரத்த வங்கி அலுவலர்களின் முறையான ஆய்வக பரிசோதனை மற்றும் குறுக்கு-பொருத்தம் (Cross-match) கட்டாயமானது.',

    // Pharmacy module
    'pharma.header': 'மருந்தகம் & மருந்து விநியோகம்',
    'pharma.desc': 'மருத்துவ சீட்டு சரிபார்ப்பு மற்றும் தகுதியான மருந்து விநியோக சேவை.',
    'pharma.rx_required': 'மருத்துவர் சீட்டு கட்டாயம் (Schedule H)',
    'pharma.rx_not_required': 'நேரடி விற்பனை (OTC)',
    'pharma.stock': 'கையிருப்பு யூனிட்கள்',
    'pharma.dosage': 'மருந்தின் வடிவம்',
    'pharma.strength': 'அளவு வீரியம்',
    'pharma.mfg': 'தயாரிப்பாளர்',
    'pharma.cart_title': 'உங்கள் மருந்து கூடை',
    'pharma.delivery_address': 'டெலிவரி முகவரி',
    'pharma.attach_rx': 'மருத்துவர் சீட்டை இணைக்கவும்',
    'pharma.pay_method': 'பணம் செலுத்தும் முறை',

    // Common
    'common.notifications': 'அறிவிப்புகள்',
    'common.mark_all_read': 'அனைத்தையும் படித்ததாகக் குறி',
    'common.no_notifications': 'புதிய அறிவிப்புகள் இல்லை.',
    'common.loading': 'தரவு ஏற்றப்படுகிறது...',
    'common.error': 'பிழை ஏற்பட்டது',
    'common.empty': 'பொருத்தமான பதிவுகள் எதுவும் இல்லை.',
    'common.demo_mode': 'கல்வி ஹேக்கத்தான் மாதிரி திட்டம் (மாதிரித் தரவு மட்டுமே)',
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('uyirthunai_lang') as Language) || 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('uyirthunai_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
