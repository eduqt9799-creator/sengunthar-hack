import React, { useState, useEffect } from 'react';
import { Boxes, Plus, ShieldCheck, Settings2, Sliders, CheckCircle2, AlertOctagon } from 'lucide-react';
import { ProductService } from '../services/api';

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New product form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Metal',
    code: '',
    description: '',
    regions: 'Top Surface, Center Core, Mounting Flange, Edge Seams',
    defect_classes: [
      { name: 'Surface Scratch', code: 'SCRATCH', default_severity: 'MINOR', permitted_limit: 2, description: 'Minor cosmetic flaw' },
      { name: 'Structural Crack', code: 'CRACK', default_severity: 'CRITICAL', permitted_limit: 0, description: 'Severe fissure' },
    ],
    quality_rules: {
      max_minor_defects: 2,
      max_major_defects: 0,
      allow_critical: false,
      min_confidence_threshold: 0.65,
      max_defect_rate_percent: 12.0,
      auto_hold_on_critical: true
    }
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await ProductService.getAll();
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProduct) {
        setSelectedProduct(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddDefectClass = () => {
    setFormData({
      ...formData,
      defect_classes: [
        ...formData.defect_classes,
        { name: '', code: '', default_severity: 'MAJOR', permitted_limit: 0, description: '' }
      ]
    });
  };

  const handleRemoveDefectClass = (index) => {
    setFormData({
      ...formData,
      defect_classes: formData.defect_classes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        code: formData.code,
        description: formData.description,
        regions: formData.regions.split(',').map((r) => r.trim()).filter(Boolean),
        defect_classes: formData.defect_classes.filter((dc) => dc.name.trim()),
        quality_rules: formData.quality_rules
      };
      await ProductService.create(payload);
      setIsCreateModalOpen(false);
      fetchProducts();
      alert('Product category and quality rules created successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create product.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">MODULE 02</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Inspection Standards</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Product Management & Quality Rules</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register product categories, geometry inspection zones, defect classes, and acceptance thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Product</span>
        </button>
      </div>

      {/* Main Grid: Products List & Selected Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Products List */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Registered Products ({products.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedProduct?.id === p.id
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-cyan-400">{p.code}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {p.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{p.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-800/80">
                  <span>{p.defect_classes?.length || 0} Defect Classes</span>
                  <span>{p.regions?.length || 0} Target Regions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 columns: Selected Product Details, Defect Classes & Quality Rules */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <>
              {/* Product Overview Card */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {selectedProduct.category} Industry Standard
                    </span>
                    <h2 className="text-xl font-black text-white mt-2">{selectedProduct.name}</h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
                      {selectedProduct.description}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                    ID: {selectedProduct.code}
                  </span>
                </div>

                {/* Defined Geometry Regions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Spatial Quality Zones / Regions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.regions?.map((reg, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium"
                      >
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quality Acceptance Rules */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Configured Acceptance & Quality Decision Engine
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Max Minor Allowed</p>
                    <p className="text-xl font-black text-cyan-400 font-mono mt-1">
                      {selectedProduct.quality_rules?.max_minor_defects ?? 2}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Max Major Allowed</p>
                    <p className="text-xl font-black text-amber-400 font-mono mt-1">
                      {selectedProduct.quality_rules?.max_major_defects ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Critical Allowed?</p>
                    <p className="text-sm font-black text-rose-400 mt-2">
                      {selectedProduct.quality_rules?.allow_critical ? 'YES' : 'NO (ZERO TOLERANCE)'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Min AI Confidence</p>
                    <p className="text-xl font-black text-emerald-400 font-mono mt-1">
                      {Math.round((selectedProduct.quality_rules?.min_confidence_threshold ?? 0.65) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Defect Classes Matrix */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Defined Defect Classes ({selectedProduct.defect_classes?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Vision Classifier Map</span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {selectedProduct.defect_classes?.map((dc) => (
                    <div key={dc.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{dc.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({dc.code})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{dc.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Inspection Method: <span className="text-slate-400">{dc.inspection_method}</span>
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-black rounded border ${
                            dc.default_severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : dc.default_severity === 'MAJOR'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {dc.default_severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Tolerance: {dc.permitted_limit} allowed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
              Select a product from the list to inspect quality rules and defect classes.
            </div>
          )}
        </div>
      </div>

      {/* Register Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-slate-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Register Manufacturing Product Specification</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white text-xs px-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Precision Transmission Gear"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Code / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUTO-GEAR-09"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Metal">Metal Components</option>
                    <option value="Electronic">Electronic / PCB</option>
                    <option value="Textile">Textile / Weaving Fabric</option>
                    <option value="Automotive">Automotive & Mechanical</option>
                    <option value="Plastic">Injection Molded Plastic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Spatial Regions (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Top Surface, Flange, Bore 1, Edge"
                    value={formData.regions}
                    onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Product functional summary, dimensions, tolerance requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Defect Classes Configuration */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">Defect Classes Definition</label>
                  <button
                    type="button"
                    onClick={handleAddDefectClass}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
                  >
                    + Add Defect Class
                  </button>
                </div>

                {formData.defect_classes.map((dc, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Defect Name"
                        value={dc.name}
                        onChange={(e) => {
                          const updated = [...formData.defect_classes];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, defect_classes: updated });
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Code (e.g. DENT)"
                        value={dc.code}
                        onChange={(e) => {
                          const updated = [...formData.defect_classes];
                          updated[idx].code = e.target.value;
                          setFormData({ ...formData, defect_classes: updated });
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <select
                        value={dc.default_severity}
                        onChange={(e) => {
                          const updated = [...formData.defect_classes];
                          updated[idx].default_severity = e.target.value;
                          setFormData({ ...formData, defect_classes: updated });
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="MINOR">MINOR</option>
                        <option value="MAJOR">MAJOR</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black"
                >
                  Save Product & Quality Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
