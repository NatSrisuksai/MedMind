"use client";

import { useState, useEffect } from "react";
import SearchFilter from "@/components/SearchFilter";
import MedicineTable from "@/components/MedicineTable";
import PrescriptionModal from "@/components/PrescriptionModal";
import { Medicine } from "@/types/medicine";

export default function DashboardPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/prescriptions`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        ...item,
        id: item.id || item.opaqueId,
      }));
      
      setMedicines(formattedData);
      setFilteredMedicines(formattedData);
    } catch (error) {
      console.error('Error loading medicines:', error);
      setMedicines([]);
      setFilteredMedicines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (filters: { date?: string; hn?: string; name?: string }) => {
    let filtered = medicines;

    if (filters.date) {
      const searchDate = new Date(filters.date);
      filtered = filtered.filter(m => {
        if (m.issueDate) {
          const medicineDate = new Date(m.issueDate);
          return medicineDate.toDateString() === searchDate.toDateString();
        }
        return false;
      });
    }
    
    if (filters.hn) {
      filtered = filtered.filter(m => 
        m.hn && m.hn.toLowerCase().includes(filters.hn!.toLowerCase())
      );
    }
    
    if (filters.name) {
      filtered = filtered.filter(m => 
        m.fullName && m.fullName.toLowerCase().includes(filters.name!.toLowerCase())
      );
    }

    setFilteredMedicines(filtered);
    setCurrentPage(1);
  };

  const handleView = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleDownload = async (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsModalOpen(true);
    
    setTimeout(() => {
      const event = new CustomEvent('downloadPDF');
      window.dispatchEvent(event);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          ใช้ค้นหารายการยาที่เคยลงในระบบได้ด้วยวันที่ HN หรือชื่อผู้ป่วย
        </h2>
        <SearchFilter onSearch={handleSearch} />
      </div>

      <MedicineTable
        medicines={filteredMedicines}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onView={handleView}
        onDownload={handleDownload}
      />

      {isModalOpen && selectedMedicine && (
        <PrescriptionModal
          medicine={selectedMedicine}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}