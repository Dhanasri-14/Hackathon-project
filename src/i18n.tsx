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
    'nav.switch_role': 'Logins',
    'nav.logins': 'Logins',
    'nav.admission_tracking': 'Admission & Order Tracking',

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
    'blood.safeguard_title': 'Hospital Blood Bank Standards',
    'blood.safeguard_text': 'All blood units and donor matches undergo clinical testing and blood bank verification before transfusion.',

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

    // Emergency Broadcast Ticker
    'broadcast.title': 'EMERGENCY BROADCAST',
    'broadcast.live': 'ACTIVE',
    'broadcast.critical_alert': 'CRITICAL BLOOD ALERT',
    'broadcast.urgent_alert': 'URGENT BLOOD REQUIREMENT',
    'broadcast.immediate_transfusion': 'Immediate transfusion required',
    'broadcast.needed': 'Units Needed',
    'broadcast.respond': 'Respond / Coordinate',
    'broadcast.view_all': 'View All Critical',
    'broadcast.all_clear': 'Hospital Network Standby • No Unfulfilled Critical Emergencies',
    'broadcast.network_active': 'Hospital Network Broadcast Active',
    'broadcast.audio_on': 'Alert chime enabled',
    'broadcast.audio_off': 'Alert chime muted',
    'broadcast.paused': 'Ticker paused on hover',

    // Blood Inventory Bar Chart
    'inventory.title': 'Blood Inventory Levels',
    'inventory.desc': 'Real-time hospital blood bank reserves across all 8 major ABO/Rh blood groups',
    'inventory.units_view': 'Units View',
    'inventory.percent_view': 'Percentage View',
    'inventory.optimal': 'Optimal Reserve',
    'inventory.moderate': 'Moderate Reserve',
    'inventory.critical_low': 'Critically Low',
    'inventory.manage': 'Manage Requests',

    // Inpatient Admission & Courier Delivery Tracking
    'admission.badge': 'Hospital Inpatient & Dispatch Command',
    'admission.sub': 'Tracked Medicine Couriers & Real-Time Delivery Corridor',
    'admission.title': 'Inpatient Admission & Order Tracking Dashboard',
    'admission.desc': 'Monitor hospital inpatient admissions, linked pharmacy prescription orders, and active courier cold-chain delivery telemetry in real-time.',
    'admission.live_gps': 'Live Courier Transit Telemetry',
    'admission.open_google_maps': 'View External Hospital Route',
    'admission.speed': 'Transit Speed',
    'admission.eta': 'Estimated Arrival',
    'admission.cold_chain': 'Cold Chain Sensor',
    'admission.courier_partner': 'Dispatched Courier',
    'admission.inpatient_list': 'Hospital Inpatient Admission Directory',

    // Settings
    'settings.header_desc': 'Personnel credentials, emergency alert preferences, big fonts, and localization settings.',
    'settings.saved': 'Settings saved successfully',
    'settings.tab_profile': 'Account & Profile',
    'settings.tab_notifications': 'Emergency Audio Alerts',
    'settings.tab_display': 'Display & Language',
    'settings.tab_security': 'Security & Authorization',
    'settings.phone': 'Contact Phone Number',
    'settings.city': 'City',
    'settings.locality': 'Locality / Area',
    'settings.alert_prefs': 'Emergency Siren & Ticker Settings',
    'settings.enable_critical_ticker': 'Enable Critical Emergency Ticker',
    'settings.chime_volume': 'Audio Pager Chime Volume',
    'settings.test_chime': 'Test Sound Chime',
    'settings.language_preference': 'Language Preference',
    'settings.language_desc': 'Select your preferred language interface for all modules.',
    'settings.typography_size': 'Typography & Font Readability',
    'settings.security_title': 'Hospital Security & Audit Credentials',

    // Common
    'common.notifications': 'Notifications',
    'common.mark_all_read': 'Mark all as read',
    'common.no_notifications': 'No new notifications.',
    'common.loading': 'Loading data...',
    'common.error': 'An error occurred',
    'common.empty': 'No records found matching criteria.',
    'common.demo_mode': 'Hospital Operations Network (Active Operations)',
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
    'nav.switch_role': 'உள்நுழைவுகள்',
    'nav.logins': 'உள்நுழைவுகள்',
    'nav.admission_tracking': 'சேர்க்கை & நேரலை கண்காணிப்பு',

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
    'blood.safeguard_title': 'மருத்துவமனை இரத்த வங்கி வழிகாட்டுதல்',
    'blood.safeguard_text': 'அனைத்து இரத்த அலகுகளும் மருத்துவமனை இரத்த வங்கியின் முறையான ஆய்வக பரிசோதனைக்கு பின்னரே வழங்கப்படுகின்றன.',

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

    // Emergency Broadcast Ticker
    'broadcast.title': 'அவசர ஒளிபரப்பு',
    'broadcast.live': 'செயலில்',
    'broadcast.critical_alert': 'உயிர் காக்கும் இரத்த எச்சரிக்கை',
    'broadcast.urgent_alert': 'அவசர இரத்தத் தேவை',
    'broadcast.immediate_transfusion': 'உடனடி இரத்த செலுத்துகை தேவைப்படுகிறது',
    'broadcast.needed': 'தேவைப்படும் யூனிட்கள்',
    'broadcast.respond': 'உடனடி நடவடிக்கை',
    'broadcast.view_all': 'அனைத்து அவசர நிலைகள்',
    'broadcast.all_clear': 'மருத்துவமனை வலையமைப்பு தயார்நிலை • பூர்த்தி செய்யப்படாத அவசர நிலைகள் ஏதுமில்லை',
    'broadcast.network_active': 'மருத்துவமனை நெட்வொர்க் தயார்நிலையில் உள்ளது',
    'broadcast.audio_on': 'எச்சரிக்கை ஒலி இயக்கப்பட்டது',
    'broadcast.audio_off': 'எச்சரிக்கை ஒலி முடக்கப்பட்டது',
    'broadcast.paused': 'சுட்டி நகர்த்தப்பட்டதால் இடைநிறுத்தப்பட்டது',

    // Blood Inventory Bar Chart
    'inventory.title': 'இரத்தக் கையிருப்பு நிலைகள்',
    'inventory.desc': 'அனைத்து 8 இரத்த வகைகளுக்கான மருத்துவமனை இரத்த சேமிப்பு இருப்பு விபரம்',
    'inventory.units_view': 'யூனிட்கள் வாரியாக',
    'inventory.percent_view': 'சதவீதம் வாரியாக',
    'inventory.optimal': 'போதுமான சேமிப்பு',
    'inventory.moderate': 'மிதமான இருப்பு',
    'inventory.critical_low': 'மிகக் குறைந்த இருப்பு எச்சரிக்கை',
    'inventory.manage': 'கோரிக்கைகளை நிர்வகிக்க',

    // Inpatient Admission & Courier Delivery Tracking
    'admission.badge': 'மருத்துவமனை உள்நோயாளி & விநியோகக் கட்டளை',
    'admission.sub': 'மருந்து விநியோகப் பாதை கண்காணிப்பு',
    'admission.title': 'உள்நோயாளி சேர்க்கை & ஆர்டர் கண்காணிப்பு',
    'admission.desc': 'மருத்துவமனை உள்நோயாளிகள் சேர்க்கை, அவர்களின் மருந்து ஆர்டர்கள் மற்றும் கூரியர் பயணத்தை கண்காணிக்கவும்.',
    'admission.live_gps': 'கூரியர் பயணக் கண்காணிப்பு',
    'admission.open_google_maps': 'மருத்துவமனை வழியைப் பார்க்க',
    'admission.speed': 'பயண வேகம்',
    'admission.eta': 'வந்து சேரும் நேரம்',
    'admission.cold_chain': 'குளிர்பதன வெப்பநிலை',
    'admission.courier_partner': 'விநியோகஸ்தர்',
    'admission.inpatient_list': 'மருத்துவமனை உள்நோயாளிகள் பட்டியல்',

    // Settings
    'settings.header_desc': 'பயனர் விவரங்கள், அவசர எச்சரிக்கை ஒலி, பெரிய எழுத்து அளவு மற்றும் மொழி அமைப்புகள்.',
    'settings.saved': 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன',
    'settings.tab_profile': 'சுயவிவரம் & பணிச்சான்று',
    'settings.tab_notifications': 'அவசர எச்சரிக்கை ஒலி',
    'settings.tab_display': 'தோற்றம் & மொழித் தேர்வு',
    'settings.tab_security': 'பாதுகாப்பு & தணிக்கை',
    'settings.phone': 'தொடர்பு தொலைபேசி எண்',
    'settings.city': 'நகரம்',
    'settings.locality': 'பகுதி / இருப்பிடம்',
    'settings.alert_prefs': 'அவசர சைரன் & விழிப்பூட்டல் அமைப்புகள்',
    'settings.enable_critical_ticker': 'அவசர விழிப்பூட்டல் பட்டியை இயக்குக',
    'settings.chime_volume': 'எச்சரிக்கை ஒலி அளவு',
    'settings.test_chime': 'ஒலியை சோதிக்க',
    'settings.language_preference': 'மொழித் தேர்வு (Language Preference)',
    'settings.language_desc': 'அனைத்து பக்கங்களுக்கும் முழுமையான தமிழ் அல்லது ஆங்கிலத்தைத் தேர்ந்தெடுக்கவும்.',
    'settings.typography_size': 'எழுத்து அளவு & வாசிப்பு எளிமை',
    'settings.security_title': 'மருத்துவமனை பாதுகாப்பு & தணிக்கை சான்றுகள்',

    // Common
    'common.notifications': 'அறிவிப்புகள்',
    'common.mark_all_read': 'அனைத்தையும் படித்ததாகக் குறி',
    'common.no_notifications': 'புதிய அறிவிப்புகள் இல்லை.',
    'common.loading': 'தரவு ஏற்றப்படுகிறது...',
    'common.error': 'பிழை ஏற்பட்டது',
    'common.empty': 'பொருத்தமான பதிவுகள் எதுவும் இல்லை.',
    'common.demo_mode': 'மருத்துவமனை நேரடி செயல்பாட்டு வலையமைப்பு (நேரலை நிலை)',
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
