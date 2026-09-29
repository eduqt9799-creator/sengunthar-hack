import React, { useState, useEffect } from 'react';
import { Layers, Plus, QrCode, ShieldCheck, Search, Filter } from 'lucide-react';
import BatchTable from '../components/BatchTable';
import { BatchService, ProductService } from '../services/api';

export default function BatchManagementPage() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const [formData, setFormData] = useState({
    product_id: '',
    batch_name: '',
    quantity: 150,
    inspector_name: 'Senior QA Inspector',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, pRes] = await Promise.all([
        BatchService.getAll(),
        ProductService.getAll()
      ]);
      setBatches(bRes.data);
      setProducts(pRes.data);
      if (pRes.data.length > 0 && !formData.product_id) {
        setFormData((prev) => ({ ...prev, product_id: pRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!formData.product_id) return;
    try {
      await BatchService.create({
        product_id: parseInt(formData.product_id),
        batch_name: formData.batch_name,
        quantity: parseInt(formData.quantity),
        inspector_name: formData.inspector_name,
        notes: formData.notes
      });
      setIsModalOpen(false);
      setFormData({
        product_id: products[0]?.id || '',
        batch_name: '',
        quantity: 150,
        inspector_name: 'Senior QA Inspector',
        notes: ''
      });
      fetchData();
      alert('Production Batch and Digital QR Traceability code generated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate batch.');
    }
  };

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.batch_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.product?.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">MODULE 03</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Traceability & QR Generation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Batch Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create production lots, assign unique Batch IDs, generate digital QR labels, and track inspection progress.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Batch & QR</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search batches by ID, Product, or Batch Run..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          Showing <b className="text-white">{filteredBatches.length}</b> of {batches.length} batches
        </span>
      </div>

      {/* Batch Table */}
      <BatchTable batches={filteredBatches} onRefresh={fetchData} />

      {/* Create Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Create Production Batch & QR</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Product Category *
                </label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.category}] {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Batch Run Name / Shift Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Shift Turbine Flange Run #12"
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lot Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Inspector Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inspector_name}
                    onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Production Line Notes / Client Specs
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Priority order for automotive client. High surface finish required."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <p>
                  System will automatically generate a unique Batch ID (e.g. <span className="text-cyan-400 font-mono font-bold">WG-MET-2026-XXX</span>) and compile a digital QR tracking record.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20"
                >
                  Generate Batch & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
