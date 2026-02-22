import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Alert from '@/components/ui/Alert';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    shop_name: '', shop_address: '', shop_phone: '', shop_email: '',
    tax_enabled: 'false', tax_rate: '0',
    currency: 'PKR', currency_symbol: 'PKR ',
    receipt_footer: '', low_stock_alert: '10',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setSettings((prev) => ({ ...prev, ...d.settings })));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Settings saved successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error('Failed to save settings'); } finally { setLoading(false); }
  }

  function f(key) { return settings[key] || ''; }
  function s(key, val) { setSettings((prev) => ({ ...prev, [key]: val })); }

  return (
    <Layout>
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {saved && <Alert type="success" message="Settings saved successfully!" onClose={() => setSaved(false)} />}

        {/* Shop Info */}
        <div className="card p-6 space-y-4">
          <h3 className="section-title">Shop Information</h3>
          <div className="form-group">
            <label className="label">Shop Name</label>
            <input value={f('shop_name')} onChange={(e) => s('shop_name', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <textarea value={f('shop_address')} onChange={(e) => s('shop_address', e.target.value)} className="input" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Phone</label>
              <input value={f('shop_phone')} onChange={(e) => s('shop_phone', e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" value={f('shop_email')} onChange={(e) => s('shop_email', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        {/* Tax & Currency */}
        <div className="card p-6 space-y-4">
          <h3 className="section-title">Tax & Currency</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Currency Code</label>
              <input value={f('currency')} onChange={(e) => s('currency', e.target.value)} className="input" placeholder="PKR" />
            </div>
            <div className="form-group">
              <label className="label">Currency Symbol</label>
              <input value={f('currency_symbol')} onChange={(e) => s('currency_symbol', e.target.value)} className="input" placeholder="PKR" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f('tax_enabled') === 'true'}
                onChange={(e) => s('tax_enabled', String(e.target.checked))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Enable Tax</span>
            </label>
            {f('tax_enabled') === 'true' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={f('tax_rate')}
                  onChange={(e) => s('tax_rate', e.target.value)}
                  className="input w-24"
                  min="0"
                  max="100"
                  step="0.5"
                />
                <span className="text-gray-500">%</span>
              </div>
            )}
          </div>
        </div>

        {/* Receipt */}
        <div className="card p-6 space-y-4">
          <h3 className="section-title">Receipt Settings</h3>
          <div className="form-group">
            <label className="label">Receipt Footer Message</label>
            <textarea value={f('receipt_footer')} onChange={(e) => s('receipt_footer', e.target.value)} className="input" rows={2} placeholder="Thank you for your visit!" />
          </div>
        </div>

        {/* Inventory */}
        <div className="card p-6 space-y-4">
          <h3 className="section-title">Inventory Settings</h3>
          <div className="form-group">
            <label className="label">Low Stock Alert Threshold</label>
            <input type="number" value={f('low_stock_alert')} onChange={(e) => s('low_stock_alert', e.target.value)} className="input w-32" min="1" />
            <p className="text-xs text-gray-400 mt-1">Alert when stock falls below this number</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary px-8">
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </Layout>
  );
}

SettingsPage.getLayout = (page) => page;
