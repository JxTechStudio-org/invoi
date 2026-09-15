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

  const columns = [
    { title: 'معرّف الفاتورة', dataIndex: 'id', key: 'id' },
    { title: 'اسم البائع', dataIndex: 'sellerName', key: 'sellerName', render: (val: string) => val || 'قيد المعالجة' },
    { title: 'المبلغ', dataIndex: 'amount', key: 'amount', render: (val: any) => val ?? 'قيد المعالجة' },
    { title: 'تاريخ الفاتورة', dataIndex: 'invoiceDate', key: 'invoiceDate', render: (val: string) => val ? new Date(val).toLocaleDateString() : 'قيد المعالجة' },
    { title: 'تاريخ الإنشاء', dataIndex: 'createdAt', key: 'createdAt', render: (val: string) => val ? new Date(val).toLocaleString() : '-' },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        switch (status) {
          case 'completed': return 'مكتملة';
          case 'processing': return 'قيد المعالجة';
          case 'needs_review': return 'تحتاج مراجعة';
          default: return status || 'processing';
        }
      }
    },
    {
      title: 'رابط الملف (الملف المرفق)',
      dataIndex: 'fileUrl',
      key: 'fileUrl',
      render: (url: string) => url ? <a href={url} target="_blank" rel="noreferrer">معاينة الملف</a> : 'لا يوجد ملف'
    }
  ];

  const dataSource = invoice ? [invoice] : [];

  return (
    <div>
      <PageHeader
        pageIcon={<LiaFileInvoiceDollarSolid />}
        pagename1='الفواتير'
        pagename2={`تفاصيل الفاتورة #${id}`}
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

        <MainTable
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
        />

        <div style={{ marginTop: '20px' }}>
          <MainButton type="primary" text="الرجوع للقائمة" onClick={() => navigate('/invoices')}>
            الرجوع للقائمة
          </MainButton>
        </div>
      </div>
    </div>
  );
}