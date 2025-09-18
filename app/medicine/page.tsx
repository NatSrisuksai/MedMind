"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MedicineForm from "@/components/MedicineForm";
import { MedicineFormData } from "@/types/medicine";
import QRCode from "react-qr-code";

export default function MedicinePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [prescriptionResult, setPrescriptionResult] = useState<any>(null);

  const handleSubmit = async (formData: MedicineFormData) => {
    setIsSubmitting(true);
    
    try {
      // แปลงจำนวนเม็ดแต่ละมื้อเป็น periods array
      const periods = [];
      
      // กำหนดเวลาตามการเลือก ก่อน/หลังอาหาร
      const beforeMeal = formData.beforeMeal && !formData.afterMeal;
      const afterMeal = !formData.beforeMeal && formData.afterMeal;
      
      if (formData.morning > 0) {
        periods.push({
          period: "MORNING" as const,
          hhmm: beforeMeal ? "07:30" : afterMeal ? "08:30" : "08:00",
          pills: formData.morning
        });
      }
      
      if (formData.noon > 0) {
        periods.push({
          period: "NOON" as const,
          hhmm: beforeMeal ? "11:30" : afterMeal ? "12:30" : "12:00",
          pills: formData.noon
        });
      }
      
      if (formData.evening > 0) {
        periods.push({
          period: "EVENING" as const,
          hhmm: beforeMeal ? "17:30" : afterMeal ? "18:30" : "18:00",
          pills: formData.evening
        });
      }
      
      if (formData.night > 0) {
        periods.push({
          period: "BEDTIME" as const,
          hhmm: "20:00", // ก่อนนอนเวลาเดียวเสมอ
          pills: formData.night
        });
      }

      // กำหนด method
      let method: "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "NONE" = "NONE";
      if (formData.beforeMeal && !formData.afterMeal) {
        method = "BEFORE_MEAL";
      } else if (formData.afterMeal && !formData.beforeMeal) {
        method = "AFTER_MEAL";
      } else if (formData.beforeMeal && formData.afterMeal) {
        method = "WITH_MEAL";
      }

      const requestData = {
        // ข้อมูลผู้ป่วย
        patientFirstName: formData.firstName,
        patientLastName: formData.lastName,
        hn: formData.hn || undefined,
        age: formData.age || undefined,
        
        // ข้อมูลใบยา
        issueDate: formData.issueDate,
        drugName: formData.medicineName,
        quantityTotal: formData.totalAmount,
        method: method,
        timezone: "Asia/Bangkok",
        startDate: formData.issueDate,
        // Backend จะคำนวณ endDate ให้อัตโนมัติ
        notes: formData.notes || undefined,
        
        // ตารางมื้อยา
        periods: periods
      };

      console.log('Sending data:', requestData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }

      const result = await response.json();
      console.log('Response:', result);
      
      // เก็บข้อมูลสำหรับแสดง QR
      setPrescriptionResult({
        ...result,
        patient: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          hn: formData.hn,
          age: formData.age
        },
        prescription: {
          drugName: formData.medicineName,
          strength: formData.strength,
          totalAmount: formData.totalAmount,
          morning: formData.morning,
          noon: formData.noon,
          evening: formData.evening,
          night: formData.night,
          beforeMeal: formData.beforeMeal,
          afterMeal: formData.afterMeal,
          issueDate: formData.issueDate,
          notes: formData.notes
        }
      });
      setShowQR(true);
      
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ถ้าบันทึกสำเร็จ แสดงหน้า QR Code
  if (showQR && prescriptionResult) {
    const qrUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${prescriptionResult.opaqueId}`;
    
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
            <div className="border-2 border-gray-300 p-8" id="prescription-print">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">ใบสั่งยา</h2>
              </div>

              {/* ข้อมูลผู้ป่วย */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span><strong>ชื่อ:</strong> {prescriptionResult.patient?.fullName}</span>
                  <span><strong>HN:</strong> {prescriptionResult.patient?.hn || '-'}</span>
                </div>
                {prescriptionResult.patient?.age && (
                  <div>
                    <span><strong>อายุ:</strong> {prescriptionResult.patient.age} ปี</span>
                  </div>
                )}
                <div>
                  <span><strong>วันที่:</strong> {new Date(prescriptionResult.prescription?.issueDate).toLocaleDateString('th-TH')}</span>
                </div>
              </div>

              {/* ข้อมูลยา */}
              <div className="border-t pt-4 mb-6">
                <p><strong>ชื่อยา:</strong> {prescriptionResult.prescription?.drugName} {prescriptionResult.prescription?.strength}</p>
                <p><strong>จำนวนยาทั้งหมด:</strong> {prescriptionResult.prescription?.totalAmount} เม็ด</p>
                <p><strong>วิธีการรับประทาน:</strong> {
                  prescriptionResult.prescription?.beforeMeal && !prescriptionResult.prescription?.afterMeal ? "ก่อนอาหาร" :
                  prescriptionResult.prescription?.afterMeal && !prescriptionResult.prescription?.beforeMeal ? "หลังอาหาร" :
                  prescriptionResult.prescription?.beforeMeal && prescriptionResult.prescription?.afterMeal ? "พร้อมอาหาร" : "-"
                }</p>
                {prescriptionResult.prescription?.notes && (
                  <p><strong>หมายเหตุ:</strong> {prescriptionResult.prescription.notes}</p>
                )}
              </div>

              {/* แสดงเวลาทานยา */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl">
                    🌅
                  </div>
                  <div className="mt-2">เช้า</div>
                  <div className="font-bold">
                    {prescriptionResult.prescription?.morning > 0 
                      ? `${prescriptionResult.prescription.morning} เม็ด` 
                      : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl">
                    ☀️
                  </div>
                  <div className="mt-2">กลางวัน</div>
                  <div className="font-bold">
                    {prescriptionResult.prescription?.noon > 0 
                      ? `${prescriptionResult.prescription.noon} เม็ด` 
                      : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl">
                    🌆
                  </div>
                  <div className="mt-2">เย็น</div>
                  <div className="font-bold">
                    {prescriptionResult.prescription?.evening > 0 
                      ? `${prescriptionResult.prescription.evening} เม็ด` 
                      : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center text-3xl">
                    🌙
                  </div>
                  <div className="mt-2">ก่อนนอน</div>
                  <div className="font-bold">
                    {prescriptionResult.prescription?.night > 0 
                      ? `${prescriptionResult.prescription.night} เม็ด` 
                      : '-'}
                  </div>
                </div>
              </div>

              {/* ส่วนล่าง: QR Code */}
              <div className="flex justify-between items-end">
                <div className="flex gap-2">
                  <button className={`px-4 py-2 rounded ${
                    prescriptionResult.prescription?.beforeMeal ? 'bg-cyan-500 text-white' : 'bg-gray-300'
                  }`}>
                    ก่อน
                  </button>
                  <button className={`px-4 py-2 rounded ${
                    prescriptionResult.prescription?.afterMeal ? 'bg-cyan-500 text-white' : 'bg-gray-300'
                  }`}>
                    หลัง
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-xs mb-2">
                    รายละเอียดยา<br/>
                    สแกน QR Code<br/>
                    เพื่อรับการแจ้งเตือน<br/>
                    ผ่านแอป LINE
                  </p>
                  <div className="border-2 border-black p-2">
                    <QRCode value={qrUrl} size={100} />
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 no-print"
                >
                  Print
                </button>
              </div>

              <div className="text-right mt-4 text-xs text-gray-600">
                พิมพ์ใบนี้จาก Medmind Data System<br/>
                {new Date().toLocaleDateString('th-TH')}
              </div>
            </div>

            {/* ปุ่มด้านล่าง */}
            <div className="mt-6 flex gap-4 no-print">
              <button
                onClick={async () => {
                  // Download PDF
                  const element = document.getElementById('prescription-print');
                  if (element && (window as any).html2canvas && (window as any).jsPDF) {
                    const canvas = await (window as any).html2canvas(element);
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new (window as any).jsPDF();
                    const imgWidth = 210;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    pdf.save(`prescription_${prescriptionResult.patient?.hn || 'patient'}_${Date.now()}.pdf`);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                กลับหน้าหลัก
              </button>
              <button
                onClick={() => {
                  setShowQR(false);
                  setPrescriptionResult(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                สร้างใบสั่งยาใหม่
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // หน้าฟอร์มกรอกข้อมูล
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">ข้อมูลยา</h2>
          <MedicineForm 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </>
  );
}