import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Spin, Tag, theme, Grid, Form } from 'antd';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import PageHeader from '../../shared/components/PageHeader';
import MainButton from '../../shared/components/MainButton';
import MainTable from '../../shared/components/MainTable';
import MainAlert from '../../shared/components/MainAlert';
import MainModal from '../../shared/components/MainModal';
import { apiClient } from '../../../services/api/client';
import { getErrorMessage } from '../../../errors/errorMassages';
import { mapAxiosErrorToCode } from '../../../services/api/mapAxiosError';
import InvoiceEditForm, { buildInvoiceUpdate, invoiceToFormValues } from '../components/InvoiceEditForm';
import type { InvoiceFormValues } from '../components/InvoiceEditForm';
import {
  APPROVAL_REQUIRED_FIELDS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  REVIEW_REASON_LABELS
} from '../constants/invoiceLabels';
import { invoiceReviewApi } from '../api/invoiceReviewApi';
import { openInvoiceFile } from '../api/invoiceFileApi';
import { useInvoiceFile } from '../hooks/useInvoiceFile';
import DocumentPreview from '../../shared/components/DocumentPreview';
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

  const { useBreakpoint } = Grid
  const screens = useBreakpoint()
  const isMobileOrTablet = !screens.lg

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'flag' | null>(null);
  const [form] = Form.useForm<InvoiceFormValues>();
  const invoiceFile = useInvoiceFile(id);
  const queryClient = useQueryClient();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/invoices/${id}`);
      setInvoice(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const code = mapAxiosErrorToCode(err);
      if (code === 'NOT_FOUND') setIsNotFound(true);
      const msg = code === 'NOT_FOUND' ? 'الفاتورة غير موجودة' : getErrorMessage(code);
      setErrorMsg(msg);
      setAlerts((prev) => [...prev, { id: Date.now(), message: msg, type: 'error' }]);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchInvoice();
  }, [id]);


  // Edit invoice form
  const handleUpdateInvoice = async (values: InvoiceFormValues) => {
    const changes = buildInvoiceUpdate(invoice, values);
    if (!Object.keys(changes).length) {
      setIsEditModalVisible(false);
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.put(`/invoices/${id}`, changes);
      setAlerts((prev) => [
        ...prev,
        { id: Date.now(), message: 'تم تعديل الفاتورة بنجاح', type: 'success' },
      ]);
      setIsEditModalVisible(false);
      fetchInvoice();
    } catch (error) {
      const msg = getErrorMessage(mapAxiosErrorToCode(error));
      setAlerts((prev) => [
        ...prev,
        { id: Date.now(), message: msg, type: 'error' },
      ]);
    } finally {
      setIsSaving(false);
    }
  };


  const pushAlert = (message: string, type: 'error' | 'success' | 'info' | 'warning') => {
    setAlerts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const handleApprove = async () => {
    const missing = (Object.keys(APPROVAL_REQUIRED_FIELDS) as Array<keyof typeof APPROVAL_REQUIRED_FIELDS>)
      .filter((field) => invoice?.[field] == null || String(invoice[field]).trim() === '')
      .map((field) => APPROVAL_REQUIRED_FIELDS[field]);
    if (missing.length) {
      pushAlert(`لا يمكن اعتماد الفاتورة قبل تعبئة: ${missing.join('، ')}`, 'warning');
      return;
    }
    setReviewAction('approve');
    try {
      const res = await invoiceReviewApi.approve(id!);
      setInvoice(res.data);
      pushAlert('تم اعتماد الفاتورة', 'success');
    } catch (error) {
      pushAlert(getErrorMessage(mapAxiosErrorToCode(error)), 'error');
    } finally {
      setReviewAction(null);
    }
  };

  const handleFlag = async () => {
    setReviewAction('flag');
    try {
      const res = await invoiceReviewApi.flag(id!);
      setInvoice(res.data);
      pushAlert('تم تحويل الفاتورة للمراجعة', 'info');
    } catch (error) {
      pushAlert(getErrorMessage(mapAxiosErrorToCode(error)), 'error');
    } finally {
      setReviewAction(null);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/invoices/${id}`);
      setIsDeleteModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.removeQueries({ queryKey: ['invoice-file', id] });
      pushAlert('تم حذف الفاتورة بنجاح', 'success');
      setTimeout(() => {
        navigate('/invoices');
      }, 1000);
    } catch (error) {
      pushAlert(getErrorMessage(mapAxiosErrorToCode(error)), 'error');
    } finally {
      setIsDeleting(false);
    }
  };


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
      title: 'معرّف الفاتورة',
      dataIndex: 'id',
      key: 'id',
      render: (val: string | number) => val || '-'
    },
    {
      title: 'حالة الدفع',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (val: string) => (val && PAYMENT_STATUS_LABELS[val]) || val || '-'
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
      render: (val: string) => (val && PAYMENT_METHOD_LABELS[val]) || val || '-'
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
      render: () => (
        <a
          onClick={() => openInvoiceFile(id!).catch((error) => pushAlert(getErrorMessage(mapAxiosErrorToCode(error)), 'error'))}
          style={{ color: token.colorPrimary, textDecoration: 'underline', cursor: 'pointer' }}
        >
          <FileTextOutlined /> عرض الملف
        </a>
      )
    },
  ];

  const amountColumns = [
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
      render: (val: any, record: any) => `${Number(val ?? 0).toFixed(2)} ${record.currency || 'SAR'}`,
    },
    {
      title: 'الإجمالي',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: any, record: any) => `${Number(val ?? 0).toFixed(2)} ${record.currency || 'SAR'}`,
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
                  <MainButton
                    type="primary"
                    text="اعتماد الفاتورة"
                    onClick={handleApprove}
                    loading={reviewAction === 'approve'}
                    disabled={invoice?.status === 'completed' || reviewAction !== null}
                  />
                  <MainButton
                    type="default"
                    text="تعديل يدوي"
                    onClick={() => {
                      setIsEditModalVisible(true);
                    }}
                  />
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

            {invoice?.status === 'needs_review' && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
                title="هذه الفاتورة تحتاج مراجعة"
                description={invoice.needsReviewReason
                  ? (
                    <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                      {String(invoice.needsReviewReason).split(',').filter(Boolean).map((reason: string) => (
                        <li key={reason}>{REVIEW_REASON_LABELS[reason] || reason}</li>
                      ))}
                    </ul>
                  )
                  : 'تم تصحيح البيانات، راجعها ثم اعتمد الفاتورة.'}
              />
            )}

            {/* مستند الفاتورة */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                مستند الفاتورة
              </h3>
              {invoiceFile.isLoading && <Spin />}
              {invoiceFile.errorMessage && (
                <Alert type="error" showIcon title={`تعذر تحميل ملف الفاتورة: ${invoiceFile.errorMessage}`} />
              )}
              {invoiceFile.url && (invoiceFile.contentType?.startsWith('image/')
                ? <DocumentPreview src={invoiceFile.url} />
                : (
                  <iframe
                    src={invoiceFile.url}
                    title="مستند الفاتورة"
                    style={{ width: '100%', height: 640, border: `1px solid ${token.colorBorder}`, borderRadius: 12 }}
                  />
                ))}
            </div>

            {/* بيانات المورد */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                بيانات المورد
              </h3>
              {isMobileOrTablet ? (
                <MobileDataCard
                  columns={vendorColumns}
                  dataSource={dataSource}
                  loading={loading}
                />
              ) : (
                <MainTable
                  columns={vendorColumns}
                  dataSource={dataSource}
                  loading={loading}
                  rowKey="key"
                  pagination={false}
                />
              )}
            </div>

            {/* بيانات الفاتورة */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                بيانات الفاتورة
              </h3>
              {isMobileOrTablet ? (
                <MobileDataCard
                  columns={invoiceInfoColumns}
                  dataSource={dataSource}
                  loading={loading}
                />
              ) : (
                <MainTable
                  columns={invoiceInfoColumns}
                  dataSource={dataSource}
                  loading={loading}
                  rowKey="key"
                  pagination={false}
                />
              )}
            </div>

            {/* المبالغ */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-65" style={{ color: token.colorTextSecondary }}>
                المبالغ
              </h3>
              {isMobileOrTablet ? (
                <MobileDataCard
                  columns={amountColumns}
                  dataSource={dataSource}
                  loading={loading}
                />
              ) : (
                <MainTable
                  columns={amountColumns}
                  dataSource={dataSource}
                  loading={loading}
                  rowKey="key"
                  pagination={false}
                />
              )}
            </div>

            <div className="flex items-center justify-between w-full" style={{ marginTop: '32px' }}>
              <div className="flex items-center gap-4">
                <MainButton
                  type="primary"
                  text="اعتماد كل الحقول"
                  onClick={handleApprove}
                  loading={reviewAction === 'approve'}
                  disabled={invoice?.status === 'completed' || reviewAction !== null}
                />
                <MainButton
                  type="default"
                  text="رفض / إبلاغ عن خطأ"
                  onClick={handleFlag}
                  loading={reviewAction === 'flag'}
                  disabled={reviewAction !== null}
                />
                <MainButton type="default" danger text="حذف الفاتورة" onClick={() => setIsDeleteModalVisible(true)} />
              </div>

              <div>
                <MainButton type="default" text="الرجوع للقائمة" onClick={() => navigate('/invoices')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* تأكيد الحذف */}
      <MainModal
        title="حذف الفاتورة"
        open={isDeleteModalVisible}
        onOpenChange={(isOpen) => setIsDeleteModalVisible(isOpen)}
        onConfirm={handleDeleteInvoice}
        okText="حذف"
        confirmLoading={isDeleting}
        keepOpenOnConfirm
        danger
      >
        سيتم حذف الفاتورة وملفها نهائيًا ولا يمكن التراجع عن ذلك. هل تريد المتابعة؟
      </MainModal>

      {/*تعديل الفاتورة */}
      <MainModal
        title="تعديل الفاتورة"
        open={isEditModalVisible}
        onOpenChange={(isOpen) => setIsEditModalVisible(isOpen)}
        onConfirm={() => form.submit()}
        confirmLoading={isSaving}
        keepOpenOnConfirm
      >
        <InvoiceEditForm form={form} initialValues={invoiceToFormValues(invoice)} onFinish={handleUpdateInvoice} />
      </MainModal>

    </div>
  );
}