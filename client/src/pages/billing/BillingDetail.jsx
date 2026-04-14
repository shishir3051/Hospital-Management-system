// Billing Detail Page
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi } from '../../services/api';
import { ArrowLeft, DollarSign, CheckCircle, Printer, CreditCard, Banknote } from 'lucide-react';

export default function BillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadBill(); }, [id]);

  const loadBill = async () => {
    try {
      const data = await billingApi.getById(id);
      setBill(data);
    } catch (err) { console.error('Failed to load bill:', err); }
    finally { setLoading(false); }
  };

  const handlePayment = async (method) => {
    setProcessing(true);
    try {
      await billingApi.pay(id, method);
      loadBill();
    } catch (err) { alert(err.message); }
    finally { setProcessing(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  }

  if (!bill) return <div className="text-center p-8">Bill not found</div>;

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: Banknote },
    { id: 'CARD', label: 'Card', icon: CreditCard }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/billing')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" /> Back to Billing
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
              <p className="text-gray-500 font-mono text-sm">#{bill.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {bill.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Patient</p>
              <p className="font-medium">{bill.patient?.firstName} {bill.patient?.lastName}</p>
              <p className="text-sm text-gray-500">{bill.patient?.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Date</p>
              <p className="font-medium">{new Date(bill.createdAt).toLocaleDateString()}</p>
              {bill.dueDate && <p className="text-sm text-gray-500">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Qty</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Unit Price</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(bill.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>${bill.subtotal.toFixed(2)}</span></div>
              {bill.discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600">-${bill.discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (8%)</span><span>${bill.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-primary">${bill.total.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Payment Info */}
          {bill.status === 'PAID' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Payment Complete</p>
                <p className="text-sm text-green-600">
                  Paid via {bill.paymentMethod} on {bill.paymentDate && new Date(bill.paymentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {bill.status !== 'PAID' && (
          <div className="p-6 bg-gray-50 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Process Payment</p>
            <div className="flex gap-3">
              {paymentMethods.map(method => (
                <button key={method.id} onClick={() => handlePayment(method.id)} disabled={processing} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50">
                  <method.icon className="w-5 h-5" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}