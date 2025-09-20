"use client";

import { useEffect, useRef } from "react";
import { Medicine } from "@/types/medicine";
import QRCode from "react-qr-code";

interface PrescriptionModalProps {
  medicine: Medicine;
  isOpen: boolean;
  onClose: () => void;
}

export default function PrescriptionModal({
  medicine,
  isOpen,
  onClose,
}: PrescriptionModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const qrData = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${medicine.opaqueId}`;

  const getMealInstruction = () => {
    if (medicine.beforeMeal && !medicine.afterMeal) {
      return "รับประทานก่อนอาหาร";
    } else if (!medicine.beforeMeal && medicine.afterMeal) {
      return "รับประทานหลังอาหาร";
    } else if (medicine.beforeMeal && medicine.afterMeal) {
      return "รับประทานพร้อมอาหาร";
    }
    return "";
  };

  return (
    <>
      {/* Modal Wrapper */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ข้อมูลใบสั่งยา</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div ref={contentRef} className="bg-white p-8 border-2 border-gray-300 rounded" id="modal-prescription">
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
                    <strong>ชื่อ:</strong> {medicine.firstName} {medicine.lastName}
                  </div>
                  <div>
                    <strong>HN:</strong> {medicine.hn}
                  </div>
                </div>
                <div className="mb-2">
                  <strong>วันที่:</strong> {medicine.date}
                </div>
              </div>

              {/* Medicine Info */}
              <div className="border-t pt-4 mb-6">
                <div className="mb-3">
                  <strong>ชื่อยา:</strong> {medicine.medicineName}
                  {medicine.strength && ` (${medicine.strength})`}
                </div>
                <div className="mb-3">
                  <strong>จำนวนยาทั้งหมด:</strong> {medicine.totalAmount} เม็ด
                </div>
                <div className="mb-3">
                  <strong>วิธีการรับประทาน:</strong> {getMealInstruction()}
                </div>
              </div>

              {/* Dosage Schedule  */}
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
                      {medicine.morning > 0 ? `${medicine.morning} เม็ด` : "-"}
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
                      {medicine.noon > 0 ? `${medicine.noon} เม็ด` : "-"}
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
                      {medicine.evening > 0 ? `${medicine.evening} เม็ด` : "-"}
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
                      {medicine.night > 0 ? `${medicine.night} เม็ด` : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom section */}
              <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2">
{getMealInstruction() && (
  <div className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold inline-block">
    {getMealInstruction()}
  </div>
)}
                </div>
                
                <div className="flex-1"></div> {/* Spacer */}
                
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">
                    สแกน QR Code<br />
                    เพื่อรับการแจ้งเตือน<br />
                    ผ่านแอป LINE
                  </p>
                  <div className="border-2 border-black p-2 bg-white">
                    <QRCode value={qrData} size={100} />
                  </div>
                </div>
              </div>

              <div className="text-right mt-4 text-xs text-gray-600">
                พิมพ์ใบนี้จาก Medmind Data System
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                พิมพ์ใบสั่งยา
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Version */}
      <div className="hidden print:block">
        <div className="bg-white p-8" id="prescription-print-version">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">ใบสั่งยา</h2>
            <p className="text-sm text-gray-600 mt-2">
              แสดงรายละเอียดการใช้ยาของผู้ป่วย
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-3">
              <div>
                <strong>ชื่อ:</strong> {medicine.firstName} {medicine.lastName}
              </div>
              <div>
                <strong>HN:</strong> {medicine.hn}
              </div>
            </div>
            <div className="mb-2">
              <strong>วันที่:</strong> {medicine.date}
            </div>
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="mb-3">
              <strong>ชื่อยา:</strong> {medicine.medicineName}
              {medicine.strength && ` (${medicine.strength})`}
            </div>
            <div className="mb-3">
              <strong>จำนวนยาทั้งหมด:</strong> {medicine.totalAmount} เม็ด
            </div>
            <div className="mb-3">
              <strong>วิธีการรับประทาน:</strong> {getMealInstruction()}
            </div>
          </div>

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
                  {medicine.morning > 0 ? `${medicine.morning} เม็ด` : "-"}
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
                  {medicine.noon > 0 ? `${medicine.noon} เม็ด` : "-"}
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
                  {medicine.evening > 0 ? `${medicine.evening} เม็ด` : "-"}
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
                  {medicine.night > 0 ? `${medicine.night} เม็ด` : "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              {getMealInstruction() && (
                <button className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-medium">
                  {getMealInstruction()}
                </button>
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
                <QRCode value={qrData} size={100} />
              </div>
            </div>

            <div className="w-20"></div>
          </div>

          <div className="text-right mt-4 text-xs text-gray-600">
            พิมพ์ใบนี้จาก Medmind Data System
          </div>
        </div>
      </div>
      {/* CSS for print - ใช้แบบเดียวกับ page.tsx */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-print-version, #prescription-print-version * {
            visibility: visible;
          }
          #prescription-print-version {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 20mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}