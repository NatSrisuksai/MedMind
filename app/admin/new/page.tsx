"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";

type PeriodKey = "MORNING" | "NOON" | "EVENING" | "BEDTIME" | "CUSTOM";
type MethodKey = "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "NONE";

const PERIODS: {
  key: Exclude<PeriodKey, "CUSTOM">;
  label: string;
  defaultHHMM: string;
}[] = [
  { key: "MORNING", label: "เช้า", defaultHHMM: "08:00" },
  { key: "NOON", label: "กลางวัน", defaultHHMM: "12:00" },
  { key: "EVENING", label: "เย็น", defaultHHMM: "18:00" },
  { key: "BEDTIME", label: "ก่อนนอน", defaultHHMM: "22:00" },
];

export default function NewPrescriptionPage() {
  const [form, setForm] = useState({
    // ผู้ป่วย
    patientFirstName: "",
    patientLastName: "",
    age: "" as string | number,
    hn: "",

    // ใบยา
    issueDate: "",
    drugName: "",
    quantityTotal: "" as string | number,
    method: "NONE" as MethodKey,
    timezone: "Asia/Bangkok",
    startDate: "",
    endDate: "",
    notes: "",

    // ช่วงเวลา (มาตรฐาน)
    periodsSelected: {
      MORNING: false,
      NOON: false,
      EVENING: false,
      BEDTIME: false,
    },
    periodHHMM: {
      MORNING: "08:00",
      NOON: "12:00",
      EVENING: "18:00",
      BEDTIME: "22:00",
    } as Record<Exclude<PeriodKey, "CUSTOM">, string>,
    periodPills: {
      MORNING: 0,
      NOON: 0,
      EVENING: 0,
      BEDTIME: 0,
    } as Record<Exclude<PeriodKey, "CUSTOM">, number>,

    // ช่วงเวลาแบบกำหนดเอง (ออปชัน)
    customHHMM: "",
    customPills: "" as string | number,
  });

  const [link, setLink] = useState<string | null>(null);
  const liffLink = useMemo(() => {
    if (!link) return null;
    return link;
  }, [link]);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    // ตัวเลข
    if (["age", "quantityTotal", "customPills"].includes(name)) {
      const num = value === "" ? "" : Number(value);
      setForm((s) => ({ ...s, [name]: Number.isNaN(num) ? "" : num }));
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onTogglePeriod = (key: Exclude<PeriodKey, "CUSTOM">) => {
    setForm((s) => ({
      ...s,
      periodsSelected: { ...s.periodsSelected, [key]: !s.periodsSelected[key] },
    }));
  };

  const onChangePeriodHHMM = (key: Exclude<PeriodKey, "CUSTOM">, v: string) => {
    setForm((s) => ({
      ...s,
      periodHHMM: {
        ...s.periodHHMM,
        [key]: v || PERIODS.find((p) => p.key === key)!.defaultHHMM,
      },
    }));
  };

  const onChangePeriodPills = (
    key: Exclude<PeriodKey, "CUSTOM">,
    v: string
  ) => {
    const n = v === "" ? 0 : Number(v);
    setForm((s) => ({
      ...s,
      periodPills: { ...s.periodPills, [key]: Number.isNaN(n) ? 0 : n },
    }));
  };

  const buildPeriodsPayload = () => {
    const out: { period: PeriodKey; hhmm?: string; pills: number }[] = [];

    // มาตรฐาน
    for (const p of PERIODS) {
      if (!form.periodsSelected[p.key]) continue;
      const pills = form.periodPills[p.key] || 0;
      if (pills <= 0) continue;
      // ใช้ค่า time input ถ้ามี ไม่งั้น default
      const hhmm = (form.periodHHMM[p.key] || p.defaultHHMM).replace(
        /\./g,
        ":"
      );
      out.push({ period: p.key, hhmm, pills });
    }

    // custom
    const customP = Number(form.customPills || 0);
    const cleanedCustomTime = (form.customHHMM || "").replace(/\./g, ":");
    if (customP > 0 && cleanedCustomTime) {
      out.push({ period: "CUSTOM", hhmm: cleanedCustomTime, pills: customP });
    }

    return out;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const periods = buildPeriodsPayload();
    if (periods.length === 0) {
      alert("กรุณาเลือก/กำหนดอย่างน้อย 1 ช่วงเวลา และระบุจำนวนเม็ด (>0)");
      return;
    }
    if (!form.patientFirstName || !form.patientLastName) {
      alert("กรุณากรอกชื่อและนามสกุลผู้ป่วย");
      return;
    }
    if (!form.drugName || !form.issueDate || !form.startDate) {
      alert("กรุณากรอก ชื่อยา / วันที่ออกใบ / วันที่เริ่ม");
      return;
    }

    const payload = {
      // ผู้ป่วย
      patientFirstName: form.patientFirstName.trim(),
      patientLastName: form.patientLastName.trim(),
      age: form.age === "" ? undefined : Number(form.age),
      hn: form.hn.trim() || undefined,

      // ใบยา
      issueDate: form.issueDate, // ISO (from <input type="date">)
      drugName: form.drugName.trim(),
      quantityTotal:
        form.quantityTotal === "" ? undefined : Number(form.quantityTotal),
      method: form.method as MethodKey,
      timezone: form.timezone || "Asia/Bangkok",
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes?.trim() || undefined,

      // ช่วงเวลา -> DoseSchedule
      periods,
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prescriptions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`สร้างใบยาไม่สำเร็จ: ${res.status} ${t}`);
      return;
    }
    const data = await res.json();
    const url = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${data.opaqueId}`;
    setLink(url);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">สร้างใบยา</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ผู้ป่วย */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="patientFirstName"
            placeholder="ชื่อผู้ป่วย"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            name="patientLastName"
            placeholder="นามสกุลผู้ป่วย"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            name="age"
            placeholder="อายุ (ปี)"
            className="border p-2 w-full"
            onChange={onChange}
            inputMode="numeric"
          />
          <input
            name="hn"
            placeholder="เลข HN (ถ้ามี)"
            className="border p-2 w-full"
            onChange={onChange}
          />
        </div>

        {/* ใบยา */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="date"
            name="issueDate"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            type="text"
            name="drugName"
            placeholder="ชื่อยา"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            name="quantityTotal"
            placeholder="จำนวนเม็ด (รวมคอร์ส)"
            className="border p-2 w-full"
            onChange={onChange}
            inputMode="numeric"
          />
          <select
            name="method"
            className="border p-2 w-full"
            value={form.method}
            onChange={onChange}
          >
            <option value="NONE">— วิธีรับประทาน —</option>
            <option value="BEFORE_MEAL">ก่อนอาหาร</option>
            <option value="AFTER_MEAL">หลังอาหาร</option>
            <option value="WITH_MEAL">พร้อมอาหาร</option>
          </select>

          <input
            type="date"
            name="startDate"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            type="date"
            name="endDate"
            className="border p-2 w-full"
            onChange={onChange}
          />
          <input
            name="timezone"
            placeholder="เขตเวลา"
            className="border p-2 w-full"
            defaultValue="Asia/Bangkok"
            onChange={onChange}
          />
        </div>

        {/* ช่วงเวลาทาน (มาตรฐาน) */}
        <div className="space-y-2 border rounded p-3">
          <div className="font-semibold">ช่วงเวลาทาน (เลือกได้หลายช่วง)</div>
          {PERIODS.map((p) => (
            <div key={p.key} className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-12 md:col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.periodsSelected[p.key]}
                  onChange={() => onTogglePeriod(p.key)}
                />
                {p.label}
              </label>
              <div className="col-span-7 md:col-span-5">
                <input
                  type="time"
                  className="border p-2 w-full"
                  disabled={!form.periodsSelected[p.key]}
                  value={form.periodHHMM[p.key]}
                  onChange={(e) => onChangePeriodHHMM(p.key, e.target.value)}
                />
              </div>
              <div className="col-span-5 md:col-span-4">
                <input
                  type="number"
                  min={0}
                  className="border p-2 w-full"
                  placeholder="เม็ด/ครั้ง"
                  disabled={!form.periodsSelected[p.key]}
                  value={form.periodPills[p.key]}
                  onChange={(e) => onChangePeriodPills(p.key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ช่วงเวลาแบบกำหนดเอง */}
        <div className="space-y-2 border rounded p-3">
          <div className="font-semibold">เพิ่มช่วงเวลา (กำหนดเอง)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="time"
              name="customHHMM"
              className="border p-2 w-full"
              onChange={onChange}
            />
            <input
              type="number"
              name="customPills"
              min={0}
              placeholder="เม็ด/ครั้ง"
              className="border p-2 w-full"
              onChange={onChange}
            />
            <div className="text-sm text-gray-500 flex items-center">
              ใส่ได้ถ้าต้องการช่วงเพิ่ม
            </div>
          </div>
        </div>

        {/* โน้ต */}
        <textarea
          name="notes"
          placeholder="ข้อมูลยาเพิ่มเติม"
          className="border p-2 w-full"
          onChange={onChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          สร้างใบยา
        </button>
      </form>

      {liffLink && (
        <div className="mt-6 text-center space-y-3">
          <p>ลิงก์สำหรับผู้ป่วย:</p>
          <a href={liffLink} className="text-blue-600 underline break-all">
            {liffLink}
          </a>
          <div className="mt-3 flex justify-center">
            <QRCode value={liffLink} style={{ width: 200, height: 200 }} />
          </div>
        </div>
      )}
    </div>
  );
}
