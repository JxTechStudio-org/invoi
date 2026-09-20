import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Tag, theme } from 'antd';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import PageHeader from '../../shared/components/PageHeader';
import MainButton from '../../shared/components/MainButton';
import MainAlert from '../../shared/components/MainAlert';
import { apiClient } from '../../../services/api/client';
import { getErrorMessage } from '../../../errors/errorMassages';
import MobileDataCard from '../../shared/components/MobileDataCard';
import { FileTextOutlined } from '@ant-design/icons';

const STATUS_LABELS: Record<string, string> = {
  processing: 'قيد المعالجة',
  completed: 'مكتملة',
  needs_review: 'تحتاج مراجعة'
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = theme.useToken();

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
            const msg = 'الفاتورة غير موجودة';
            setErrorMsg(msg);
            setAlerts((prev) => [...prev, { id: Date.now(), message: msg, type: 'error' }]);
          } else {
            errorCode = err.response?.data?.error_code || 'SERVER_ERROR';
            const msg = getErrorMessage(errorCode);
            setErrorMsg(msg);
            setAlerts((prev) => [...prev, { id: Date.now(), message: msg, type: 'error' }]);
          }
        } else if (err.request) {
          errorCode = 'NETWORK_ERROR';
          const msg = getErrorMessage(errorCode);
          setErrorMsg(msg);
          setAlerts((prev) => [...prev, { id: Date.now(), message: msg, type: 'error' }]);
        }
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

  // invoice detail fields

  const vendorColumns = [
    {
      title: 'بيانات البائع',
      dataIndex: 'header',
      key: 'header',
      render: () => null
    },
    {
      title: 'اسم البائع',
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (val: string) => val || '-'
    },
    {
      title: 'الرقم الضريبي للبائع',
      dataIndex: 'taxNumber',
      key: 'taxNumber',
      render: (val: string) => val || '-'
    },
    {
      title: 'رقم السجل التجاري',
      dataIndex: 'crNumber',
      key: 'crNumber',
      render: (val: string) => val || '-'
    },
  ];

  const invoiceInfoColumns = [
    {
      title: 'بيانات الفاتورة',
      dataIndex: 'header',
      key: 'header',
      render: () => null
    },
    {
      title: 'رقم الفاتورة',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val: string) => val || '-'
    },
    {
      title: 'طريقة الدفع',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (val: string) => val || '-'
    },
    {
      title: 'تاريخ الفاتورة',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: 'تاريخ الاستحقاق',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
    },
    {
      title: 'اسم العميل',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (val: string) => (
        <span>
          {val || '-'}
          {invoice?.needsReviewReason?.includes('customer_name_mismatch') && (
            <span
              className="conf-tag"
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: token.colorWarningText || '#B45309',
                background: token.colorWarningBg || '#FEF0CD',
                borderRadius: token.borderRadiusSM,
                padding: '1.5px 6px',
                marginInlineStart: '7px',
                display: 'inline-block',
                verticalAlign: 'middle'
              }}
            >
              يحتاج مراجعة
            </span>
          )}
        </span>
      )
    },
    {
      title: 'الملف',
      dataIndex: 'fileUrl',
      key: 'fileUrl',
      render: (value: string) => (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: token.colorPrimary, textDecoration: 'underline' }}>
          <FileTextOutlined /> عرض الملف
        </a>
      )
    },
  ];

  const amountColumns = [
    {
      title: 'المبالغ',
      dataIndex: 'header',
      key: 'header',
      render: () => null,
    },
    {
      title: 'المبلغ قبل الضريبة',
      dataIndex: 'subTotal',
      key: 'subTotal',
      render: (_val: any, record: any) => {
        const sub = record.totalAmount != null && record.taxAmount != null
          ? Number(record.totalAmount) - Number(record.taxAmount)
          : (record.amount || 0);
        return `${Number(sub).toFixed(2)} ${record.currency || 'SAR'}`;
      },
    },
    {
      title: 'قيمة الضريبة 15%',
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      render: (val: any) => `${Number(val ?? 0).toFixed(2)} SAR`,
    },
    {
      title: 'الإجمالي',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: any) => `${Number(val ?? 0).toFixed(2)} SAR`,
    },
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
        <div>
          <div>
            {alerts.map((alert) => (
              <MainAlert
                key={alert.id}
                alertMessage={alert.message}
                alertType={alert.type}
                closeAction={() => removeAlert(alert.id)}
              />
            ))}

            <div dir="ltr" className="flex items-start justify-between mb-6 w-full">
              <div dir="rtl" className="text-right">
                <h1 className="text-2xl font-bold mb-1" style={{ color: token.colorTextHeading }}>
                  فاتورة {invoice?.invoiceNumber || `#${id}`}
                </h1>
                <div className="text-sm opacity-65" style={{ color: token.colorTextSecondary }}>
                  تم الرفع بتاريخ {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString('ar-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) + ' - ' + new Date(invoice.createdAt).toLocaleTimeString('ar-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }) : '-'}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <MainButton type="primary" text="اعتماد الفاتورة" onClick={() => { }} />
                  <MainButton type="default" text="تعديل يدوي" onClick={() => { }} />
                </div>

                {/* andtd status tag */}
                {(() => {
                  const status = invoice?.status || 'needs_review';
                  const colorMap: Record<string, string> = {
                    completed: 'success',
                    processing: 'processing',
                    needs_review: 'warning',
                  };

                  return (
                    <Tag
                      color={colorMap[status] || 'warning'}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold m-0"
                    >
                      {STATUS_LABELS[status] || status}
                    </Tag>
                  );
                })()}
              </div>
            </div>

            {/* بيانات المورد */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                بيانات المورد
              </h3>
              <MobileDataCard
                columns={vendorColumns}
                dataSource={dataSource}
                loading={loading}
              />
            </div>

            {/* بيانات الفاتورة */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                بيانات الفاتورة
              </h3>
              <MobileDataCard
                columns={invoiceInfoColumns}
                dataSource={dataSource}
                loading={loading}
              />
            </div>

            {/* المبالغ */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                المبالغ
              </h3>
              <MobileDataCard
                columns={amountColumns}
                dataSource={dataSource}
                loading={loading}
              />
            </div>

            <div className="flex items-center gap-4 mt-6">
              <MainButton type="primary" text="اعتماد كل الحقول" onClick={() => { }} />
              <MainButton type="default" text="رفض / إبلاغ عن خطأ" onClick={() => { }} />
              <MainButton type="default" text="الرجوع للقائمة" onClick={() => navigate('/invoices')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}