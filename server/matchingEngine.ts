/**
 * UyirThunai Blood Donor Matching Engine
 * 
 * Clinical Compatibility Evaluation Protocol:
 * Calculates donor candidate ranking based on:
 * 1. ABO / Rh immunological matrix (Red blood cell antigen compatibility)
 * 2. Locality and geographic proximity within municipal limits
 * 3. Verified donor availability and donation cooldown periods (90 days)
 */

export interface CompatibilityResult {
  isCompatible: boolean;
  isExactMatch: boolean;
  score: number;
  reasons: string[];
  reasonsTa: string[];
  eligibilityNotes?: string;
}

// ABO / Rh compatibility rules: recipient -> eligible donor blood groups
export const RECIPIENT_COMPATIBILITY_MAP: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

export function evaluateCompatibility(
  recipientBloodGroup: string,
  donorBloodGroup: string,
  donorAvailability: string,
  donorCity: string,
  hospitalCity: string,
  donorLocality?: string,
  hospitalLocality?: string,
  lastDonationDate?: string | null,
  donorAge?: number | null,
  urgencyLevel: string = 'urgent'
): CompatibilityResult {
  const allowedDonors = RECIPIENT_COMPATIBILITY_MAP[recipientBloodGroup] || [];
  const isCompatible = allowedDonors.includes(donorBloodGroup);
  const isExactMatch = recipientBloodGroup === donorBloodGroup;

  const reasons: string[] = [];
  const reasonsTa: string[] = [];
  let score = 0;

  if (!isCompatible) {
    return {
      isCompatible: false,
      isExactMatch: false,
      score: 0,
      reasons: ['Blood group incompatible according to ABO/Rh rules'],
      reasonsTa: ['ABO/Rh விதிகளின்படி இரத்த வகை பொருந்தவில்லை'],
    };
  }

  // 1. Blood compatibility points
  score += 50;
  if (isExactMatch) {
    score += 15;
    reasons.push(`Exact blood group match (${donorBloodGroup})`);
    reasonsTa.push(`துல்லியமான இரத்த வகை பொருத்தம் (${donorBloodGroup})`);
  } else {
    reasons.push(`Clinically compatible blood group (${donorBloodGroup} for recipient ${recipientBloodGroup})`);
    reasonsTa.push(`மருத்துவ ரீதியாக பொருந்தக்கூடிய இரத்த வகை (${donorBloodGroup} - பெறுநர் ${recipientBloodGroup})`);
  }

  // 2. Location proximity
  const cleanDonorCity = (donorCity || '').trim().toLowerCase();
  const cleanHospCity = (hospitalCity || '').trim().toLowerCase();

  if (cleanDonorCity && cleanDonorCity === cleanHospCity) {
    score += 20;
    reasons.push(`Located in the same city (${donorCity})`);
    reasonsTa.push(`அதே நகரத்தில் உள்ளார் (${donorCity})`);

    const cleanDonorLoc = (donorLocality || '').trim().toLowerCase();
    const cleanHospLoc = (hospitalLocality || '').trim().toLowerCase();
    if (cleanDonorLoc && cleanHospLoc && (cleanDonorLoc === cleanHospLoc || cleanDonorLoc.includes(cleanHospLoc) || cleanHospLoc.includes(cleanDonorLoc))) {
      score += 10;
      reasons.push(`Immediate locality match (${donorLocality})`);
      reasonsTa.push(`அருகிலுள்ள பகுதி பொருத்தம் (${donorLocality})`);
    }
  } else {
    reasons.push(`Different city (${donorCity || 'Unknown'} vs ${hospitalCity})`);
    reasonsTa.push(`வேறு நகரம் (${donorCity || 'தெரியவில்லை'} - ${hospitalCity})`);
  }

  // 3. Stated Availability
  if (donorAvailability === 'available') {
    score += 15;
    reasons.push('Donor status is actively Available');
    reasonsTa.push('தானம் செய்ய தயாராக உள்ளார்');
  } else if (donorAvailability === 'on_hold') {
    score += 5;
    reasons.push('Donor status is temporarily On-Hold');
    reasonsTa.push('தானம் தற்காலிக நிறுத்திவைப்பில் உள்ளது');
  } else {
    score -= 20;
    reasons.push('Donor currently marked Unavailable');
    reasonsTa.push('தற்போது கிடைக்கப்பெறவில்லை என குறிப்பிடப்பட்டுள்ளது');
  }

  // 4. Donation Eligibility (90-day cooldown period)
  let eligibilityNotes = 'Eligible for donation';
  if (lastDonationDate) {
    const lastDate = new Date(lastDonationDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 90) {
      score += 10;
      reasons.push(`Cooldown satisfied (${diffDays} days since last donation)`);
      reasonsTa.push(`தான கால இடைவெளி நிறைவுற்றது (${diffDays} நாட்கள்)`);
    } else {
      score -= 25;
      const daysRemaining = 90 - diffDays;
      eligibilityNotes = `Cooldown in progress (${daysRemaining} days remaining)`;
      reasons.push(`Medical cooldown active: ${daysRemaining} days remaining until next eligible donation`);
      reasonsTa.push(`மருத்துவ இடைவெளி நிலுவை: அடுத்த தானத்திற்கு ${daysRemaining} நாட்கள் எஞ்சியுள்ளன`);
    }
  } else {
    score += 5;
    reasons.push('First-time or unrecorded prior donation history');
    reasonsTa.push('முதல்முறை அல்லது முந்தைய பதிவு இல்லாத கொடையாளர்');
  }

  // 5. Age compliance (18 - 65)
  if (donorAge) {
    if (donorAge >= 18 && donorAge <= 65) {
      score += 5;
      reasons.push(`Age eligibility verified (${donorAge} yrs)`);
      reasonsTa.push(`வயது தகுதி சரிபார்க்கப்பட்டது (${donorAge} வயது)`);
    } else {
      score -= 30;
      reasons.push(`Age ${donorAge} outside recommended 18-65 range`);
      reasonsTa.push(`வயது ${donorAge} பரிந்துரைக்கப்பட்ட 18-65 வரம்பிற்கு வெளியே உள்ளது`);
    }
  }

  // 6. Urgency boost
  if (urgencyLevel === 'critical') {
    score += 10;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    isCompatible: true,
    isExactMatch,
    score,
    reasons,
    reasonsTa,
    eligibilityNotes,
  };
}
