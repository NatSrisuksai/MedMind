export interface Medicine {
  id: number | string;
  status: string;
  hn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age?: number;
  date: string; 
  issueDate: string; 
  medicineName: string;
  strength?: string;
  totalAmount: number;
  beforeMeal: boolean;
  afterMeal: boolean;
  morning: number;
  noon: number;
  evening: number;
  night: number;
  instruction?: string;
  notes?: string;
  opaqueId?: string;
}

export interface MedicineFormData {
  firstName: string;
  lastName: string;
  hn: string;
  age?: number;
  issueDate: string;
  medicineName: string;
  strength?: string;
  totalAmount: number;
  beforeMeal: boolean;
  afterMeal: boolean;
  morning: number;
  noon: number;
  evening: number;
  night: number;
  instruction?: string;
  notes?: string;
}