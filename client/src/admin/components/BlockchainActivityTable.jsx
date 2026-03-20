import { motion } from "framer-motion";
import { Clock, Copy, ExternalLink, Share2 } from "lucide-react";

const TableRowSkeleton = () => (
  <tr className="border-b animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);

const BlockchainActivityTable = ({ activities, loading }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const shareTransaction = (txHash, title) => {
    const text = `Check out this blockchain transaction: ${txHash} - ${title}`;
    if (navigator.share) {
      navigator.share({
        title: "Blockchain Activity",
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("Share text copied!");
    }
  };

  return (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-md rounded-2xl">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead>
          <tr className="text-sm text-left text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 font-semibold">#</th>
            <th className="px-6 py-4 font-semibold">Transaction Hash</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold">Activity Name</th>
            <th className="px-6 py-4 font-semibold">Block Number</th>
            <th className="px-6 py-4 font-semibold">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))
          ) : activities.length > 0 ? (
            activities.map((a, i) => (
              <motion.tr
                key={a._id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-gray-200 hover:bg-indigo-50 transition-all group"
              >
                <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                  {i + 1}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 group/hash">
                    {a.txHash ? (
                      <>
                        <code className="text-sm font-mono font-medium text-indigo-700 hover:text-indigo-900 transition-colors">
                          {a.txHash.slice(0, 10)}...{a.txHash.slice(-8)}
                        </code>
                        <div className="flex items-center gap-1 opacity-0 group-hover/hash:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(a.txHash);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-indigo-600" />
                          </button>
                          {a.explorerUrl && (
                            <a
                              href={a.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
                              title="View on explorer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4 text-indigo-600" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shareTransaction(a.txHash, a.title);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-200 transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4 text-indigo-600" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 capitalize border border-indigo-200">
                    {a.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {a.title || "—"}
                    </div>
                    {a.subTitle && (
                      <div className="text-xs text-gray-500">{a.subTitle}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                  {a.blockNumber || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString()}{" "}
                  <span className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleTimeString()}
                  </span>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Clock className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-600 font-medium">
                    No blockchain activities found
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BlockchainActivityTable;
