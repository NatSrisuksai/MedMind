// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const api = {
  // Medicine APIs
  async getMedicines() {
    const response = await fetch(`${API_URL}/api/medicines`);
    if (!response.ok) throw new Error('Failed to fetch medicines');
    return response.json();
  },

  async createMedicine(data: any) {
    const response = await fetch(`${API_URL}/api/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create medicine');
    return response.json();
  },

  async getMedicineById(id: string) {
    const response = await fetch(`${API_URL}/api/medicines/${id}`);
    if (!response.ok) throw new Error('Failed to fetch medicine');
    return response.json();
  },

  // Prescription APIs (เชื่อมกับ Backend ที่มีอยู่)
  async createPrescription(data: any) {
    const response = await fetch(`${API_URL}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create prescription');
    }
    return response.json();
  },

  async getPrescriptions() {
    const response = await fetch(`${API_URL}/api/prescriptions`);
    if (!response.ok) throw new Error('Failed to fetch prescriptions');
    return response.json();
  },

  async getPrescriptionByOpaqueId(opaqueId: string) {
    const response = await fetch(`${API_URL}/api/p/${opaqueId}`);
    if (!response.ok) throw new Error('Failed to fetch prescription');
    return response.json();
  },

  async activatePrescription(opaqueId: string, lineUserId: string) {
    const response = await fetch(`${API_URL}/api/p/${opaqueId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineUserId }),
    });
    if (!response.ok) throw new Error('Failed to activate prescription');
    return response.json();
  },
};