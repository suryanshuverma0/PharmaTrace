import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Search, X } from "lucide-react";
import { getAllManufacturers } from "../api/api";
import ManufacturerModal from "../components/ManufacturerModal";
import ManufacturerTable from "../components/ManufacturerTable";

/**
 * Enhanced Manufacturers page (Updated)
 * - Removed rejected filter and stat
 * - Clean modern UI header
 * - Debounced search and filtering
 */

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
  const [filter, setFilter] = useState("pending");
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Manufacturers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage manufacturer approvals, review licenses and details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-5 bg-white border border-gray-200 rounded-xl px-5 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-green-700">{counts.approved}</span>{" "}
                Approved
              </span>
            </div>
            <div className="border-l h-5 border-gray-200" />
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-yellow-700">{counts.pending}</span>{" "}
                Pending
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchManufacturers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Controls: search + filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, reg. number, email, country, phone..."
              className="w-full md:w-[560px] pl-10 pr-10 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
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
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
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
      <ManufacturerTable manufacturers={filtered} refresh={fetchManufacturers} />

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
