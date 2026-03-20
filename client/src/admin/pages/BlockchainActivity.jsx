import { useEffect, useMemo, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { getAllBlockchainActivity } from "../../services/api/blockchainApi";
import BlockchainActivityTable from "../components/BlockchainActivityTable";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "users", label: "Users" },
  { key: "batches", label: "Batches" },
  { key: "products", label: "Products" },
];

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const BlockchainActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await getAllBlockchainActivity();
      console.log("Fetch response:", res);

      if (res.success && res.data) {
        let all = [];

        // Handle if data is an array
        if (Array.isArray(res.data)) {
          all = res.data;
        }
        // Handle if data has users, batches, products properties
        else if (res.data.users || res.data.batches || res.data.products) {
          all = [
            ...(res.data.users || []),
            ...(res.data.batches || []),
            ...(res.data.products || []),
          ];
        }

        console.log("Processed activities:", all);
        setActivities(all);
      } else {
        console.error("API returned no data:", res);
        setActivities([]);
      }
    } catch (err) {
      console.error("Failed to fetch blockchain activities", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = useMemo(() => {
    let arr = activities;
    if (filter !== "all") arr = activities.filter((a) => a.type === filter);

    const q = (debouncedQuery || "").trim().toLowerCase();
    if (!q) return arr;

    return arr.filter((a) => {
      const fields = [a.title, a.subTitle, a.txHash, a.status, a.owner]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      return fields.some((s) => s.includes(q));
    });
  }, [activities, filter, debouncedQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Blockchain Activities
        </h1>
        <p className="text-gray-600">
          Track and verify blockchain transactions across your supply chain
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, txHash..."
              className="w-full py-3 pl-12 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="md:w-48">
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-700"
            >
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <BlockchainActivityTable activities={filtered} loading={loading} />
    </div>
  );
};

export default BlockchainActivity;
