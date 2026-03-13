import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';

export default function TableSelectModal({ isOpen, onClose, onSelect, selectedTableId }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/tables')
      .then((r) => r.json())
      .then((data) => setTables(data.tables || []))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const floors = [...new Set(tables.map((t) => t.floor || 'Main'))].sort();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Table" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">Loading tables...</div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🪑</div>
          <p className="font-medium">No tables found</p>
          <p className="text-sm mt-1">Add tables from Table Management.</p>
        </div>
      ) : (
        <>
          {floors.map((floor) => (
            <div key={floor} className="mb-6">
              {floors.length > 1 && (
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {floor}
                </h3>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {tables
                  .filter((t) => (t.floor || 'Main') === floor)
                  .map((table) => {
                    const isFree     = table.status === 'free';
                    const isSelected = table.id === selectedTableId;
                    const hasOrder   = table.tableOrders?.length > 0;

                    return (
                      <button
                        key={table.id}
                        onClick={() => onSelect(table)}
                        className={`relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : isFree
                            ? 'border-green-400 bg-green-50 hover:border-green-500 hover:bg-green-100'
                            : 'border-amber-400 bg-amber-50 hover:border-amber-500 hover:bg-amber-100'
                        }`}
                      >
                        <div className="text-lg font-bold text-gray-800">
                          T{table.number}
                        </div>
                        {table.name && (
                          <div className="text-xs text-gray-500 truncate">{table.name}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{table.capacity} seats</div>

                        <span
                          className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            isFree
                              ? 'bg-green-200 text-green-800'
                              : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {isFree ? 'Free' : hasOrder ? 'Add Items' : 'Busy'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button onClick={() => onSelect(null)} className="btn btn-secondary w-full">
          No Table (Walk-in)
        </button>
      </div>
    </Modal>
  );
}
