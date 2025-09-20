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
      const periods = [];
      const beforeMeal = formData.beforeMeal && !formData.afterMeal;
      const afterMeal = !formData.beforeMeal && formData.afterMeal;
      
      if (formData.morning > 0) {
        periods.push({
          period: "MORNING" as const,
          hhmm: "08:00", 
          pills: formData.morning
        });
      }

      if (formData.noon > 0) {
        periods.push({
          period: "NOON" as const,
          hhmm: "12:00",  
          pills: formData.noon
        });
      }

      if (formData.evening > 0) {
        periods.push({
          period: "EVENING" as const,
          hhmm: "18:00",  
          pills: formData.evening
        });
      }

      if (formData.night > 0) {
        periods.push({
          period: "BEDTIME" as const,
          hhmm: "20:00",  
          pills: formData.night
        });
      }

      let method: "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "NONE" = "NONE";
      if (formData.beforeMeal && !formData.afterMeal) {
        method = "BEFORE_MEAL";
      } else if (formData.afterMeal && !formData.beforeMeal) {
        method = "AFTER_MEAL";
      } else if (formData.beforeMeal && formData.afterMeal) {
        method = "WITH_MEAL";
      }

      const requestData = {
        patientFirstName: formData.firstName,
        patientLastName: formData.lastName,
        hn: formData.hn || undefined,
        age: formData.age || undefined,
        issueDate: formData.issueDate,
        drugName: formData.medicineName,
        quantityTotal: formData.totalAmount,
        method: method,
        timezone: "Asia/Bangkok",
        startDate: formData.issueDate,
        notes: formData.notes || undefined,
        periods: periods
      };

      // console.log('Sending data:', requestData);

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
      // console.log('Response:', result);
      
      setPrescriptionResult({
        ...result,
        patient: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
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

  if (showQR && prescriptionResult) {
    const qrUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${prescriptionResult.opaqueId}`;
    
    const getMealInstruction = () => {
      if (prescriptionResult.prescription?.beforeMeal && !prescriptionResult.prescription?.afterMeal) {
        return "รับประทานก่อนอาหาร";
      } else if (!prescriptionResult.prescription?.beforeMeal && prescriptionResult.prescription?.afterMeal) {
        return "รับประทานหลังอาหาร";
      } else if (prescriptionResult.prescription?.beforeMeal && prescriptionResult.prescription?.afterMeal) {
        return "รับประทานพร้อมอาหาร";
      }
      return "";
    };

    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
            {/* export เป็น PDF */}
            <div className="border-2 border-gray-300 p-8 bg-white" id="prescription-print">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">ใบสั่งยา</h2>
                <p className="text-sm text-gray-600 mt-2">
                  แสดงรายละเอียดการใช้ยาของผู้ป่วย
                </p>
              </div>

              {/* Patient Info */}
              <div className="mb-6">
                <div className="flex justify-between mb-3">
                  <div>
                    <strong>ชื่อ:</strong> {prescriptionResult.patient?.firstName} {prescriptionResult.patient?.lastName}
                  </div>
                  <div>
                    <strong>HN:</strong> {prescriptionResult.patient?.hn || '-'}
                  </div>
                </div>
                <div className="mb-2">
                  <strong>วันที่:</strong> {new Date(prescriptionResult.prescription?.issueDate).toLocaleDateString('th-TH')}
                </div>
              </div>

              {/* Medicine Info */}
              <div className="border-t pt-4 mb-6">
                <div className="mb-3">
                  <strong>ชื่อยา:</strong> {prescriptionResult.prescription?.drugName}
                  {prescriptionResult.prescription?.strength && ` (${prescriptionResult.prescription.strength})`}
                </div>
                <div className="mb-3">
                  <strong>จำนวนยาทั้งหมด:</strong> {prescriptionResult.prescription?.totalAmount} เม็ด
                </div>
                <div className="mb-3">
                  <strong>วิธีการรับประทาน:</strong> {getMealInstruction()}
                </div>
              </div>

              {/* Dosage Schedule */}
              <div className="mb-6">
                <h3 className="font-bold mb-4">รายละเอียดการรับประทานยา</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="/icons/MORNING.jpg" 
                        alt="เช้า"
                        className="w-18 h-18"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '🌅';
                        }}
                      />
                    </div>
                    <div className="mt-2">เช้า</div>
                    <div className="font-bold">
                      {prescriptionResult.prescription?.morning > 0 
                        ? `${prescriptionResult.prescription.morning} เม็ด` 
                        : '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="/icons/NOON.jpg" 
                        alt="กลางวัน"
                        className="w-18 h-18"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '☀️';
                        }}
                      />
                    </div>
                    <div className="mt-2">กลางวัน</div>
                    <div className="font-bold">
                      {prescriptionResult.prescription?.noon > 0 
                        ? `${prescriptionResult.prescription.noon} เม็ด` 
                        : '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="/icons/EVENING.jpg" 
                        alt="เย็น"
                        className="w-18 h-18"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '🌆';
                        }}
                      />
                    </div>
                    <div className="mt-2">เย็น</div>
                    <div className="font-bold">
                      {prescriptionResult.prescription?.evening > 0 
                        ? `${prescriptionResult.prescription.evening} เม็ด` 
                        : '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="/icons/BEDTIME.jpg" 
                        alt="ก่อนนอน"
                        className="w-18 h-18"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '🌙';
                        }}
                      />
                    </div>
                    <div className="mt-2">ก่อนนอน</div>
                    <div className="font-bold">
                      {prescriptionResult.prescription?.night > 0 
                        ? `${prescriptionResult.prescription.night} เม็ด` 
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* meal instruction and QR */}
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2">
                {getMealInstruction() && (
                  <div className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold inline-block">
                    {getMealInstruction()}
                  </div>
                )}
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">
                    {/* รายละเอียดยา<br /> */}
                    สแกน QR Code<br />
                    เพื่อรับการแจ้งเตือน<br />
                    ผ่านแอป LINE
                  </p>
                  <div className="border-2 border-black p-2 bg-white">
                    <QRCode value={qrUrl} size={100} />
                  </div>
                </div>

                {/* <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 no-print"
                >
                  Print
                </button> */}
              </div>

              <div className="text-right mt-4 text-xs text-gray-600">
                {/* เมื่อหยุดใช้ โปรดแจ้งแพทย์<br /> */}
                พิมพ์ใบนี้จาก Medmind Data System
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์ใบสั่งยา
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
                {/* CSS for print */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #prescription-print, #prescription-print * {
              visibility: visible;
            }
            #prescription-print {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              padding: 20mm !important;
            }
          }
        `}</style>
      </>
    );
  }

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