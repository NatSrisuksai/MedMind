"use client";

import { useState } from "react";
import { MedicineFormData } from "@/types/medicine";

interface MedicineFormProps {
  onSubmit: (data: MedicineFormData) => void;
  isSubmitting?: boolean;
}

export default function MedicineForm({ onSubmit, isSubmitting }: MedicineFormProps) {
  const [formData, setFormData] = useState<MedicineFormData>({
    firstName: "",
    lastName: "",
    hn: "",
    age: undefined,
    issueDate: new Date().toISOString().split('T')[0], // วันที่ปัจจุบัน
    medicineName: "",
    strength: "",
    totalAmount: 0,
    beforeMeal: false,
    afterMeal: false,
    morning: 0,
    noon: 0,
    evening: 0,
    night: 0,
    instruction: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    
    if (!formData.age) {
      newErrors.age = 'กรุณากรอกอายุ';
    }
    
    if (!formData.strength) {
      newErrors.strength = 'กรุณากรอกขนาดยา';
    }
    
    if (!formData.beforeMeal && !formData.afterMeal) {
      newErrors.mealTime = 'กรุณาเลือกรับประทานก่อนหรือหลังอาหาร';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      hn: "",
      age: undefined,
      issueDate: new Date().toISOString().split('T')[0],
      medicineName: "",
      strength: "",
      totalAmount: 0,
      beforeMeal: false,
      afterMeal: false,
      morning: 0,
      noon: 0,
      evening: 0,
      night: 0,
      instruction: "",
      notes: "",
    });
  };

  // คำนวณเวลาแจ้งเตือนตามการเลือก ก่อน/หลังอาหาร
  // const getMealTimeLabel = () => {
  //   if (formData.beforeMeal && !formData.afterMeal) {
  //     return "เวลา: เช้า (07:30) | เที่ยง (11:30) | เย็น (17:30) | ก่อนนอน (20:00)";
  //   } else if (!formData.beforeMeal && formData.afterMeal) {
  //     return "เวลา: เช้า (08:30) | เที่ยง (12:30) | เย็น (18:30) | ก่อนนอน (20:00)";
  //   } else {
  //     return "เวลา: เช้า (08:00) | เที่ยง (12:00) | เย็น (18:00) | ก่อนนอน (20:00)";
  //   }
  // };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ชื่อ-นามสกุล */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อผู้ป่วย *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            นามสกุล *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* HN และอายุ */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HN *
          </label>
          <input
            type="text"
            name="hn"
            value={formData.hn}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            อายุ *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age || ''}
            onChange={(e) => {
              handleChange(e);
              if (errors.age) setErrors({...errors, age: ''});
            }}
            min="0"
            max="150"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 ${
              errors.age ? 'border-red-500' : ''
            }`}
          />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
        </div>
      </div>

      {/* วันที่ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          วันที่ *
        </label>
        <input
          type="date"
          name="issueDate"
          value={formData.issueDate}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* ชื่อยาและความแรง */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อยา
          </label>
          <input
            type="text"
            name="medicineName"
            value={formData.medicineName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ขนาดยา (เช่น 500 mg)
          </label>
          <input
            type="text"
            name="strength"
            value={formData.strength}
            onChange={(e) => {
              handleChange(e);
              if (errors.strength) setErrors({...errors, strength: ''});
            }}
            placeholder="500 mg"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500 ${
              errors.strength ? 'border-red-500' : ''
            }`}
          />
          {errors.strength && <p className="text-red-500 text-sm mt-1">{errors.strength}</p>}
        </div>
      </div>

      {/* จำนวนยาทั้งหมด */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          จำนวนยาทั้งหมด (เม็ด) *
        </label>
        <input
          type="number"
          name="totalAmount"
          value={formData.totalAmount || ''}
          onChange={handleChange}
          required
          min="1"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* วิธีการรับประทาน */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          วิธีการรับประทาน *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="beforeMeal"
              checked={formData.beforeMeal}
              onChange={(e) => {
                handleChange(e);
                if (errors.mealTime) setErrors({...errors, mealTime: ''});
              }}
              className="mr-2"
            />
            <span>ก่อนอาหาร</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="afterMeal"
              checked={formData.afterMeal}
              onChange={(e) => {
                handleChange(e);
                if (errors.mealTime) setErrors({...errors, mealTime: ''});
              }}
              className="mr-2"
            />
            <span>หลังอาหาร</span>
          </label>
        </div>
        {errors.mealTime && <p className="text-red-500 text-sm mt-1">{errors.mealTime}</p>}
      </div>


      {/* รายละเอียดการรับประทาน */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          รายละเอียดการรับประทานยา
        </label>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600">เช้า</label>
            <input
              type="number"
              name="morning"
              value={formData.morning || ''}
              onChange={handleChange}
              min="0"
              placeholder="จำนวนเม็ด"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">กลางวัน</label>
            <input
              type="number"
              name="noon"
              value={formData.noon || ''}
              onChange={handleChange}
              min="0"
              placeholder="จำนวนเม็ด"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">เย็น</label>
            <input
              type="number"
              name="evening"
              value={formData.evening || ''}
              onChange={handleChange}
              min="0"
              placeholder="จำนวนเม็ด"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">ก่อนนอน</label>
            <input
              type="number"
              name="night"
              value={formData.night || ''}
              onChange={handleChange}
              min="0"
              placeholder="จำนวนเม็ด"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
        {/* <div className="text-xs text-gray-500 mt-2">
          {getMealTimeLabel()}
        </div> */}
      </div>

      {/* หมายเหตุ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          หมายเหตุ
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-cyan-500"
          placeholder="ข้อควรระวัง หรือคำแนะนำเพิ่มเติม"
        />
      </div>

      {/* ปุ่ม */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "กำลังบันทึก..." : "สร้าง"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          ล้างข้อมูล
        </button>
      </div>
    </form>
  );
}