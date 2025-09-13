// app/admin/new/page.tsx
"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function NewPrescriptionPage() {
  const [form, setForm] = useState({
    fullName: "",
    drugName: "",
    strength: "",
    instruction: "",
    startDate: "",
    endDate: "",
    timezone: "Asia/Bangkok",
    times: "",
    notes: "",
  });
  const [link, setLink] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prescriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          times: form.times
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }
    );
    const data = await res.json();
    const url = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${data.opaqueId}`;
    setLink(url);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">สร้างใบยา</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="fullName"
          placeholder="ชื่อผู้ป่วย"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="drugName"
          placeholder="ชื่อยา"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="strength"
          placeholder="ขนาดยา (เช่น 500mg)"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="instruction"
          placeholder="วิธีใช้ (เช่น หลังอาหาร)"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          type="date"
          name="startDate"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          type="date"
          name="endDate"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <input
          name="times"
          placeholder="เวลา (เช่น 08:00,20:00)"
          className="border p-2 w-full"
          onChange={handleChange}
        />
        <textarea
          name="notes"
          placeholder="โน้ตเพิ่มเติม"
          className="border p-2 w-full"
          onChange={handleChange}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          สร้าง
        </button>
      </form>

      {link && (
        <div className="mt-6 text-center">
          <p>ลิงก์สำหรับผู้ป่วย:</p>
          <a href={link} className="text-blue-600 underline">
            {link}
          </a>
          <div className="mt-4 flex justify-center">
            <QRCode value={link} style={{ width: 200, height: 200 }} />
          </div>
        </div>
      )}
    </div>
  );
}
