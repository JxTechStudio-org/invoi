import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import PageHeader from '../../shared/components/PageHeader';
import MainButton from '../../shared/components/MainButton';
import MainAlert from '../../shared/components/MainAlert';
import MainTable from '../../shared/components/MainTable';
import { apiClient } from '../../../services/api/client';
import { getErrorMessage } from '../../../errors/errorMassages';
import MobileDataCard from '../../shared/components/MobileDataCard';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' | 'info' | 'warning' }>>([]);

  const removeAlert = (alertId: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/invoices/${id}`);
        setInvoice(res.data);
        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        let errorCode = 'UNKNOWN_ERROR';

        if (err.response) {
          if (err.response.status === 404) {
            setIsNotFound(true);
            errorCode = 'NOT_FOUND';
          } else {
            errorCode = err.response?.data?.error_code || 'SERVER_ERROR';
          }
        } else if (err.request) {
          errorCode = 'NETWORK_ERROR';
        }

        const msg = getErrorMessage(errorCode);
        setErrorMsg(msg);
        setAlerts((prev) => [...prev, { id: Date.now(), message: msg, type: 'error' }]);
      }
    };

    fetchInvoice();
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
      <div>
        <PageHeader
          pageIcon={<LiaFileInvoiceDollarSolid />}
          pagename1='الفواتير'
          pagename2={`تفاصيل الفاتورة #${id}`}
          page1path=''
        />
        <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
          {alerts.map((alert) => (
            <MainAlert
              key={alert.id}
              alertMessage={alert.message}
              alertType={alert.type}
              closeAction={() => removeAlert(alert.id)}
            />
          ))}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <MainButton type="primary" text="العودة للخلف" onClick={() => navigate(-1)}>
              العودة للخلف
            </MainButton>
          </div>
        </div>
      </div>
    );
  }

  // invoice detsil fields
  const columns = [
    {
      key: 'invoiceNumber',
      title: 'رقم الفاتورة',
      dataIndex: 'invoiceNumber',
    },
    {
      key: 'vendorName',
      title: 'اسم البائع (vendorName)',
      dataIndex: 'vendorName',
    },
    {
      key: 'taxNumber',
      title: 'الرقم الضريبي للبائع (taxNumber)',
      dataIndex: 'taxNumber',
    },
    {
      key: 'crNumber',
      title: 'رقم السجل التجاري (crNumber)',
      dataIndex: 'crNumber',
    },
    {
      key: 'customerName',
      title: 'اسم العميل (customerName)',
      dataIndex: 'customerName',
    },
    {
      key: 'invoiceDate',
      title: 'تاريخ الفاتورة (invoiceDate)',
      dataIndex: 'invoiceDate',
      render: (val: any) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'dueDate',
      title: 'تاريخ الاستحقاق (dueDate)',
      dataIndex: 'dueDate',
      render: (val: any) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
    {
      key: 'paymentMethod',
      title: 'طريقة الدفع (paymentMethod)',
      dataIndex: 'paymentMethod',
    },
    {
      key: 'paymentStatus',
      title: 'حالة الدفع (paymentStatus)',
      dataIndex: 'paymentStatus',
    },
    {
      key: 'taxAmount',
      title: 'قيمة الضريبة (taxAmount)',
      dataIndex: 'taxAmount',
      render: (val: any) => (val != null ? `${val} ر.س` : '-'),
    },
    {
      key: 'totalAmount',
      title: 'المبلغ الإجمالي (totalAmount)',
      dataIndex: 'totalAmount',
      render: (val: any) => (val != null ? `${val} ر.س` : '-'),
    },
  ];
  const dataSource = invoice ? [invoice] : [];

 return (
    <div>
      <PageHeader
        pageIcon={<LiaFileInvoiceDollarSolid />}
        pagename1='الفواتير'
        pagename2={`تفاصيل الفاتورة #${invoice?.invoiceNumber || id}`}
        page1path=''
      />

      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {alerts.map((alert) => (
          <MainAlert
            key={alert.id}
            alertMessage={alert.message}
            alertType={alert.type}
            closeAction={() => removeAlert(alert.id)}
          />
        ))}

        {/* تصميم الشبكة (Grid) لعرض المستند والحقول */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* القسم الأيمن: بيانات الفاتورة باستخدام MobileDataCard الصحيح */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* رأس الصفحة والحالة */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#131C2E', padding: '20px', borderRadius: '12px', border: '1px solid #2A3648' }}>
              <div>
                <h1 style={{ fontSize: '20px', margin: '0 0 4px', color: '#F1F5F9' }}>فاتورة #{invoice?.invoiceNumber || id}</h1>
                <div style={{ color: '#94A3B8', fontSize: '13px' }}>
                  معرّف الفاتورة (id): {id} | تاريخ الإصدار: {invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '-'}
                </div>
              </div>
              <span style={{ 
                fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px',
                background: '#2A2210', color: '#FBBF24', display: 'inline-flex', alignItems: 'center' 
              }}>
                {invoice?.paymentStatus || 'تحتاج مراجعة'}
              </span>
            </div>

            {/* استخدام MobileDataCard المخصص مع الأعمدة والبيانات الكاملة */}
            <MobileDataCard
              dataSource={invoice ? [invoice] : []}
              columns={[
                { title: 'معرّف الفاتورة (id)', dataIndex: 'id', key: 'id' },
                { title: 'رقم الفاتورة (invoiceNumber)', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
                { title: 'اسم البائع (vendorName)', dataIndex: 'vendorName', key: 'vendorName' },
                { title: 'الرقم الضريبي للبائع (taxNumber)', dataIndex: 'taxNumber', key: 'taxNumber' },
                { title: 'رقم السجل التجاري (crNumber)', dataIndex: 'crNumber', key: 'crNumber' },
                { title: 'اسم العميل (customerName)', dataIndex: 'customerName', key: 'customerName' },
                { 
                  title: 'تاريخ الفاتورة (invoiceDate)', 
                  dataIndex: 'invoiceDate', 
                  key: 'invoiceDate',
                  render: (val: any) => (val ? new Date(val).toLocaleDateString() : '-')
                },
                { 
                  title: 'تاريخ الاستحقاق (dueDate)', 
                  dataIndex: 'dueDate', 
                  key: 'dueDate',
                  render: (val: any) => (val ? new Date(val).toLocaleDateString() : '-')
                },
                { 
                  title: 'المبلغ الإجمالي (totalAmount)', 
                  dataIndex: 'totalAmount', 
                  key: 'totalAmount',
                  render: (val: any) => (val != null ? `${val} ر.س` : '-')
                },
                { 
                  title: 'قيمة الضريبة (taxAmount)', 
                  dataIndex: 'taxAmount', 
                  key: 'taxAmount',
                  render: (val: any) => (val != null ? `${val} ر.س` : '-')
                },
                { title: 'حالة الدفع (paymentStatus)', dataIndex: 'paymentStatus', key: 'paymentStatus' },
                { title: 'طريقة الدفع (paymentMethod)', dataIndex: 'paymentMethod', key: 'paymentMethod' },
                { 
                  title: 'رابط الملف (fileUrl)', 
                  dataIndex: 'fileUrl', 
                  key: 'fileUrl',
                  render: (val: any) => (val ? String(val) : 'لا يوجد ملف')
                }
              ]}
            />

            {/* الأزرار بالأسفل باستخدام MainButton */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <MainButton 
                type="primary" 
                text="اعتماد كل الحقول" 
                onClick={() => {}} 
                style={{ flex: 1, backgroundColor: '#10B981', borderColor: '#10B981' }} 
              />
              <MainButton 
                type="default" 
                text="رفض / إبلاغ عن خطأ" 
                onClick={() => {}} 
                style={{ flex: 1, backgroundColor: '#1E293B', color: '#F1F5F9', borderColor: '#334155' }} 
              />
            </div>

          </div>

          {/* القسم الأيسر: معاينة المستند PDF ورابط الملف */}
          <div style={{ background: '#111826', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '500px', border: '1px solid #2A3648' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', color: '#CBD5E1', fontSize: '13px' }}>
              <span>{invoice?.fileUrl ? `رابط الملف: ${invoice.fileUrl}` : 'لا يوجد ملف مرفق (fileUrl)'}</span>
            </div>
            {invoice?.fileUrl ? (
              <iframe 
                src={invoice.fileUrl} 
                title="Invoice Preview" 
                style={{ width: '100%', height: '520px', border: 'none', borderRadius: '8px' }} 
              />
            ) : (
              <div style={{ color: '#94A3B8', marginTop: '200px' }}>عذراً، المستند غير متوفر</div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
