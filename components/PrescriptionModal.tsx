// components/PrescriptionModal.tsx
"use client";

import { useEffect, useRef } from "react";
import { Medicine } from "@/types/medicine";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownloadPDF();
    };
    
    window.addEventListener('downloadPDF', handleDownloadEvent);
    return () => {
      window.removeEventListener('downloadPDF', handleDownloadEvent);
    };
  }, []);

const handleDownloadPDF = async () => {
  if (!contentRef.current) return;

  try {
    // รอให้ libraries โหลดครบ
    if (!(window as any).html2canvas || !(window as any).jsPDF) {
      alert("กำลังโหลด libraries กรุณารอสักครู่แล้วลองใหม่");
      return;
    }

    const canvas = await (window as any).html2canvas(contentRef.current, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff', // กำหนด bg สีขาว
      removeContainer: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new (window as any).jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(`prescription_${medicine.hn}_${Date.now()}.pdf`);
    
    onClose();
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + (error as Error).message);
  }
};

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Generate QR code data
  const qrData = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${medicine.opaqueId}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-6">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-4 no-print">
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

          {/* Prescription Content */}
          <div ref={contentRef} className="bg-white p-8 border-2 border-gray-300 rounded">
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
                <strong>วิธีการรับประทาน:</strong>{" "}
                {medicine.beforeMeal ? "ก่อนอาหาร" : ""}
                {medicine.afterMeal ? "หลังอาหาร" : ""}
                {!medicine.beforeMeal && !medicine.afterMeal ? "-" : ""}
              </div>
            </div>

            {/* Dosage Schedule */}
            <div className="mb-6">
              <h3 className="font-bold mb-4">รายละเอียดการรับประทานยา</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <img 
                      src="icons/MORNING.jpg" 
                      alt="เช้า"
                      className="w-18 h-18"
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
                      src="icons/NOON.jpg" 
                      alt="กลางวัน"
                      className="w-18 h-18"
                    />
                  </div>
                  <div className="mt-2">กลางวัน</div>
                  <div className="font-bold">
                    {medicine.evening > 0 ? `${medicine.evening} เม็ด` : "-"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <img 
                      src="icons/EVENING.jpg" 
                      alt="เย็น"
                      className="w-18 h-18"
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
                      src="icons/BEDTIME.jpg" 
                      alt="กลางวัน"
                      className="w-18 h-18"
                    />
                  </div>
                  <div className="mt-2">ก่อนนอน</div>
                  <div className="font-bold">
                    {medicine.evening > 0 ? `${medicine.evening} เม็ด` : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code and Actions */}
            <div className="flex justify-between items-end">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
                  ก่อน
                </button>
                <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                  หลัง
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  รายละเอียดยา<br />
                  สแกน QR Code<br />
                </p>
                <div className="border-2 border-black p-2">
                  <QRCode value={qrData} size={100} />
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
              >
                Print
              </button>
            </div>

            <div className="text-right mt-4 text-xs text-gray-600">
              {/* เมื่อหยุดใช้ โปรดแจ้งแพทย์<br /> */}
              พิมพ์ใบนี้จาก Medmind Data System
            </div>
          </div>

          {/* Action Buttons */}
          {/* <div className="flex justify-end gap-4 mt-6 no-print">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ปิด
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}