import * as XLSX from 'xlsx';

export function exportToExcel(
  data: Record<string, any>[],
  columns: { key: string; header: string }[],
  filename: string
) {
  // Prepare data with Arabic headers
  const worksheetData = data.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key] ?? '';
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Set RTL direction and column widths
  worksheet['!cols'] = columns.map(() => ({ wch: 20 }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');

  // Export file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Parse Excel file and return data
export function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData as Record<string, any>[]);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Map Arabic headers to English keys for orphans
export function mapOrphanImportData(data: Record<string, any>[]): Partial<{
  full_name: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  country: string;
  status: 'available' | 'partial' | 'full';
  monthly_amount: number;
  story: string;
}>[] {
  const headerMap: Record<string, string> = {
    'الاسم الكامل': 'full_name',
    'الاسم': 'full_name',
    'العمر': 'age',
    'الجنس': 'gender',
    'المدينة': 'city',
    'البلد': 'country',
    'الحالة': 'status',
    'المبلغ الشهري': 'monthly_amount',
    'القصة': 'story',
  };

  const genderMap: Record<string, 'male' | 'female'> = {
    'ذكر': 'male',
    'أنثى': 'female',
    'male': 'male',
    'female': 'female',
  };

  const statusMap: Record<string, 'available' | 'partial' | 'full'> = {
    'متاح': 'available',
    'جزئي': 'partial',
    'مكفول': 'full',
    'available': 'available',
    'partial': 'partial',
    'full': 'full',
  };

  return data.map((row) => {
    const mappedRow: Record<string, any> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      const englishKey = headerMap[key] || key;
      
      if (englishKey === 'gender' && typeof value === 'string') {
        mappedRow[englishKey] = genderMap[value] || 'male';
      } else if (englishKey === 'status' && typeof value === 'string') {
        mappedRow[englishKey] = statusMap[value] || 'available';
      } else if (englishKey === 'age' || englishKey === 'monthly_amount') {
        mappedRow[englishKey] = Number(value) || 0;
      } else {
        mappedRow[englishKey] = value;
      }
    });
    
    return mappedRow;
  });
}

// Download template Excel file for orphans import
export function downloadOrphansTemplate() {
  const templateData = [
    {
      'الاسم الكامل': 'مثال: أحمد محمد',
      'العمر': 8,
      'الجنس': 'ذكر',
      'المدينة': 'مكة',
      'البلد': 'السعودية',
      'الحالة': 'متاح',
      'المبلغ الشهري': 100,
      'القصة': 'قصة اليتيم...',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب الأيتام');
  XLSX.writeFile(workbook, 'قالب-استيراد-الأيتام.xlsx');
}

// Export functions for each data type
export function exportOrphans(orphans: any[]) {
  const columns = [
    { key: 'full_name', header: 'الاسم الكامل' },
    { key: 'age', header: 'العمر' },
    { key: 'gender', header: 'الجنس' },
    { key: 'city', header: 'المدينة' },
    { key: 'country', header: 'البلد' },
    { key: 'status', header: 'الحالة' },
    { key: 'monthly_amount', header: 'المبلغ الشهري' },
    { key: 'created_at', header: 'تاريخ الإضافة' },
  ];

  const formattedData = orphans.map((o) => ({
    ...o,
    gender: o.gender === 'male' ? 'ذكر' : 'أنثى',
    status: o.status === 'available' ? 'متاح' : o.status === 'partial' ? 'جزئي' : 'مكفول',
    created_at: new Date(o.created_at).toLocaleDateString('ar-SA'),
  }));

  exportToExcel(formattedData, columns, `الأيتام-${new Date().toISOString().slice(0, 10)}`);
}

export function exportSponsors(sponsors: any[]) {
  const columns = [
    { key: 'full_name', header: 'الاسم الكامل' },
    { key: 'email', header: 'البريد الإلكتروني' },
    { key: 'phone', header: 'رقم الهاتف' },
    { key: 'country', header: 'البلد' },
    { key: 'preferred_contact', header: 'طريقة التواصل المفضلة' },
    { key: 'created_at', header: 'تاريخ التسجيل' },
  ];

  const formattedData = sponsors.map((s) => ({
    ...s,
    created_at: new Date(s.created_at).toLocaleDateString('ar-SA'),
  }));

  exportToExcel(formattedData, columns, `الكفلاء-${new Date().toISOString().slice(0, 10)}`);
}

export function exportSponsorships(sponsorships: any[]) {
  const columns = [
    { key: 'orphan_name', header: 'اسم اليتيم' },
    { key: 'sponsor_name', header: 'اسم الكافل' },
    { key: 'type', header: 'نوع الكفالة' },
    { key: 'monthly_amount', header: 'المبلغ الشهري' },
    { key: 'status', header: 'الحالة' },
    { key: 'payment_method', header: 'طريقة الدفع' },
    { key: 'start_date', header: 'تاريخ البداية' },
    { key: 'receipt_number', header: 'رقم الإيصال' },
  ];

  const statusMap: Record<string, string> = {
    active: 'نشط',
    paused: 'متوقف',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  const formattedData = sponsorships.map((s) => ({
    orphan_name: s.orphan?.full_name || '-',
    sponsor_name: s.sponsor?.full_name || '-',
    type: s.type === 'monthly' ? 'شهري' : 'سنوي',
    monthly_amount: s.monthly_amount,
    status: statusMap[s.status] || s.status,
    payment_method: s.payment_method,
    start_date: new Date(s.start_date).toLocaleDateString('ar-SA'),
    receipt_number: s.receipt_number,
  }));

  exportToExcel(formattedData, columns, `الكفالات-${new Date().toISOString().slice(0, 10)}`);
}

export function exportReceipts(receipts: any[]) {
  const columns = [
    { key: 'receipt_number', header: 'رقم الإيصال' },
    { key: 'sponsor_name', header: 'اسم الكافل' },
    { key: 'orphan_name', header: 'اسم اليتيم' },
    { key: 'amount', header: 'المبلغ' },
    { key: 'payment_reference', header: 'مرجع الدفع' },
    { key: 'issue_date', header: 'تاريخ الإصدار' },
  ];

  const formattedData = receipts.map((r) => ({
    receipt_number: r.receipt_number,
    sponsor_name: r.sponsorship?.sponsor?.full_name || '-',
    orphan_name: r.sponsorship?.orphan?.full_name || '-',
    amount: r.amount,
    payment_reference: r.payment_reference || '-',
    issue_date: new Date(r.issue_date).toLocaleDateString('ar-SA'),
  }));

  exportToExcel(formattedData, columns, `الإيصالات-${new Date().toISOString().slice(0, 10)}`);
}
