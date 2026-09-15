import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainButton from '../../shared/components/MainButton';
import MainAlert from '../../shared/components/MainAlert';
import MainTable from '../../shared/components/MainTable'; // استيراد الجدول المشترك

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setIsNotFound(true);
            throw new Error('الفاتورة غير موجودة');
          }
          throw new Error('حدث خطأ أثناء جلب بيانات الفاتورة.');
        }
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isNotFound || errorMsg) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <MainAlert alertMessage={errorMsg || "الفاتورة غير موجودة"} alertType="error" />
        <div style={{ marginTop: '20px' }}>
          <MainButton type="primary" onClick={() => navigate(-1)}>
            العودة للخلف
          </MainButton>
        </div>
      </div>
    );
  }

  // تعريف أعمدة الجدول المشترك MainTable
  const columns = [
    { title: 'معرّف الفاتورة', dataIndex: 'id', key: 'id' },
    { title: 'اسم البائع', dataIndex: 'sellerName', key: 'sellerName', render: (val: string) => val || 'قيد المعالجة (processing)' },
    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (val: any) => val ?? 'قيد المعالجة' },
    { title: 'تاريخ الفاتورة', dataIndex: 'invoiceDate', key: 'invoiceDate', render: (val: string) => val || 'قيد المعالجة' },
    { 
      title: 'الحالة', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => status || 'processing' 
    },
    {
      title: 'الملف المرفق',
      dataIndex: 'fileUrl',
      key: 'fileUrl',
      render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">معاينة الملف</a> : 'لا يوجد ملف'
    }
  ];

  // البيانات تكون على شكل مصفوفة تحتوي على الفاتورة الحالية لأن MainTable يتطلب dataSource من نوع مصفوفة
  const dataSource = invoice ? [invoice] : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>تفاصيل الفاتورة #{invoice?.id || id}</h2>
      
      {/* استخدام MainTable المشتركة بدلاً من الـ Card العادية */}
      <MainTable 
        columns={columns} 
        dataSource={dataSource} 
        rowKey="id" 
        loading={loading}
      />

      <div style={{ marginTop: '20px' }}>
        <MainButton type="default" onClick={() => navigate(-1)}>
          الرجوع للقائمة
        </MainButton>
      </div>
    </div>
  );
}