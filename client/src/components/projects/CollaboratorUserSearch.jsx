import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { FaPlus, FaSearch, FaUser } from "react-icons/fa";
import { searchUsersForCollaborators } from "@redux/index";

const CollaboratorUserSearch = ({ onSelect, disabled = false, existingUserIds = [] }) => {
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await dispatch(searchUsersForCollaborators(query.trim())).unwrap();
        const existing = new Set(existingUserIds.map(String));
        setResults(users.filter((user) => !existing.has(String(user.id))));
        setOpen(true);
      } catch (err) {
        setError(typeof err === "string" ? err : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dispatch, existingUserIds]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    onSelect(user);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white disabled:opacity-50"
        />
      </div>

      {loading && <p className="text-xs text-gray-500 mt-2">Searching...</p>}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-800 transition-colors"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <FaPlus className="w-3 h-3 text-blue-400 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-gray-400">
          No users found
        </p>
      )}
    </div>
  );
};

export default CollaboratorUserSearch;
