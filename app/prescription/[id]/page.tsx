"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";

export default function PrescriptionQRPage() {
  const params = useParams();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadPrescription(params.id as string);
    }
  }, [params.id]);

  const loadPrescription = async (opaqueId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/p/${opaqueId}`
      );
      if (!response.ok) throw new Error('Not found');
      
      const data = await response.json();
      setPrescription(data);
    } catch (error) {
      console.error('Error:', error);
      alert('ไม่พบข้อมูลใบสั่งยา');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;
  if (!prescription) return <div>ไม่พบข้อมูล</div>;

  const qrUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?opaqueId=${prescription.opaqueId}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">ใบสั่งยาสำเร็จ</h2>
        
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white border-2 border-gray-300">
            <QRCode value={qrUrl} size={200} />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <p><strong>ผู้ป่วย:</strong> {prescription.patient.fullName}</p>
          <p><strong>HN:</strong> {prescription.patient.hn || '-'}</p>
          <p><strong>ยา:</strong> {prescription.drugName} {prescription.strength}</p>
          <p><strong>จำนวน:</strong> {prescription.totalAmount} เม็ด</p>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-blue-800">
            ให้ผู้ป่วยสแกน QR Code นี้ด้วย LINE เพื่อรับการแจ้งเตือนการทานยา
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            พิมพ์
          </button>
          <a 
            href="/dashboard"
            className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-center"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}