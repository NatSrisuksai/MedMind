// lib/utils.ts

// Format date from YYYY-MM-DD to DD/MM/YY (Buddhist Era)
export function formatDateToBuddhist(dateStr: string): string {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543 - 2500; // Convert to Buddhist year (last 2 digits)
  
  return `${day}/${month}/${year}`;
}

// Format date for display in Thai format
export function formatDateThai(date: Date): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  
  return `${day} ${month} ${year}`;
}

// Generate time slots based on medicine schedule
export function generateTimeSlots(
  morning: number,
  noon: number,
  evening: number,
  night: number,
  beforeMeal: boolean
): string[] {
  const times = [];
  
  if (morning > 0) {
    times.push(beforeMeal ? '07:30' : '08:30');
  }
  if (noon > 0) {
    times.push(beforeMeal ? '11:30' : '12:30');
  }
  if (evening > 0) {
    times.push(beforeMeal ? '17:30' : '18:30');
  }
  if (night > 0) {
    times.push('20:00');
  }
  
  return times;
}

// Format medicine instruction text
export function formatInstruction(
  beforeMeal: boolean,
  afterMeal: boolean,
  morning: number,
  noon: number,
  evening: number,
  night: number
): string {
  let instruction = '';
  const times = [];
  
  if (beforeMeal) instruction = 'รับประทานก่อนอาหาร ';
  else if (afterMeal) instruction = 'รับประทานหลังอาหาร ';
  
  if (morning > 0) times.push(`เช้า ${morning} เม็ด`);
  if (noon > 0) times.push(`กลางวัน ${noon} เม็ด`);
  if (evening > 0) times.push(`เย็น ${evening} เม็ด`);
  if (night > 0) times.push(`ก่อนนอน ${night} เม็ด`);
  
  return instruction + times.join(' ');
}

// Check if user is logged in (for client components)
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isLoggedIn') === 'true';
}

// Get username from localStorage
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('username');
}