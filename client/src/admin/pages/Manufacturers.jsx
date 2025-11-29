import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Search, X } from "lucide-react";
import { getAllManufacturers } from "../api/api";
import ManufacturerModal from "../components/ManufacturerModal";
import ManufacturerTable from "../components/ManufacturerTable";


const FILTERS = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
];

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const Manufacturers = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  // Modal
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all manufacturers
  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const data = await getAllManufacturers();
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch manufacturers", err);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  // Derived stats
  const counts = useMemo(() => {
    const all = manufacturers.length;
    const approved = manufacturers.filter((m) => m.isApproved === true).length;
    const pending = manufacturers.filter((m) => m.isApproved === false && !m.isRejected).length;
    return { all, approved, pending };
  }, [manufacturers]);

  // Filtering + searching
  const filtered = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    const byFilter = manufacturers.filter((m) => {
      if (filter === "all") return true;
      if (filter === "approved") return m.isApproved === true;
      if (filter === "pending") return m.isApproved === false && !m.isRejected;
      return true;
    });

    if (!q) return byFilter;

    return byFilter.filter((m) => {
      const fields = [
        m.name,
        m.email,
        m.phone,
        m.country,
        m.state,
        m.city,
        m.address,
        m.website,
        m.manufacturer?.companyName,
        m.manufacturer?.registrationNumber,
        ...(m.manufacturer?.certifications || []),
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return fields.some((s) => s.includes(q));
    });
  }, [manufacturers, filter, debouncedQuery]);

  // Modal controls
  const openModal = (m) => {
    setSelected(m);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelected(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 md:text-3xl">
            Manufacturers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage manufacturer approvals, review licenses and details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="items-center hidden gap-5 px-5 py-2 bg-white border border-gray-200 shadow-sm md:flex rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-green-700">{counts.approved}</span>{" "}
                Approved
              </span>
            </div>
            <div className="h-5 border-l border-gray-200" />
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-yellow-700">{counts.pending}</span>{" "}
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: search + filter */}
      <div className="flex flex-col items-stretch justify-between gap-3 mb-4 md:flex-row md:items-center">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, reg. number, email, country, phone..."
              className="w-full py-3 pl-10 pr-10 transition border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute p-1 -translate-y-1/2 rounded-md right-2 top-1/2 hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="filter" className="sr-only">Filter</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
          >
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table container */}
      <ManufacturerTable 
        manufacturers={filtered} 
        refresh={fetchManufacturers} 
        setFilter={setFilter}
        loading={loading}
      />

      {/* Modal */}
      <ManufacturerModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        manufacturer={selected}
        refresh={fetchManufacturers}
      />
    </div>
  );
};

export default Manufacturers;
