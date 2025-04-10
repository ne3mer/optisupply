import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface Supplier {
  id: number;
  name: string;
  score: number;
  date_evaluated: string;
  status: "approved" | "pending" | "rejected";
}

const RecentSuppliersList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers/recent/", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setSuppliers(data);
        } else {
          // If API fails, use mock data
          setSuppliers([
            {
              id: 1,
              name: "Eco Textiles Ltd",
              score: 87.5,
              date_evaluated: "2023-08-15",
              status: "approved",
            },
            {
              id: 2,
              name: "Global Tech Manufacturing",
              score: 72.3,
              date_evaluated: "2023-08-10",
              status: "pending",
            },
            {
              id: 3,
              name: "Sustainable Foods Co",
              score: 91.2,
              date_evaluated: "2023-08-05",
              status: "approved",
            },
            {
              id: 4,
              name: "Northern Apparel",
              score: 63.7,
              date_evaluated: "2023-07-28",
              status: "pending",
            },
          ]);
        }
      } catch (err) {
        // Use mock data on any error
        setSuppliers([
          {
            id: 1,
            name: "Eco Textiles Ltd",
            score: 87.5,
            date_evaluated: "2023-08-15",
            status: "approved",
          },
          {
            id: 2,
            name: "Global Tech Manufacturing",
            score: 72.3,
            date_evaluated: "2023-08-10",
            status: "pending",
          },
          {
            id: 3,
            name: "Sustainable Foods Co",
            score: 91.2,
            date_evaluated: "2023-08-05",
            status: "approved",
          },
          {
            id: 4,
            name: "Northern Apparel",
            score: 63.7,
            date_evaluated: "2023-07-28",
            status: "pending",
          },
        ]);
        setError("Could not fetch recent suppliers. Using demo data.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSuppliers();
  }, []);

  // Function to format date in a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-teal-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  // Function to get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
          text: "Approved",
          textClass: "text-emerald-700",
        };
      case "rejected":
        return {
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
          text: "Rejected",
          textClass: "text-red-700",
        };
      default:
        return {
          icon: <div className="h-5 w-5 bg-amber-400 rounded-full"></div>,
          text: "Pending",
          textClass: "text-amber-700",
        };
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">
          Loading recent suppliers...
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {suppliers.map((supplier) => {
          const statusDisplay = getStatusDisplay(supplier.status);

          return (
            <li
              key={supplier.id}
              className="py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">{statusDisplay.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {supplier.name}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500">
                      <span
                        className={`${statusDisplay.textClass} mr-2 font-medium`}
                      >
                        {statusDisplay.text}
                      </span>
                      <span>
                        Evaluated: {formatDate(supplier.date_evaluated)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`text-base font-bold ${getScoreColorClass(
                    supplier.score
                  )}`}
                >
                  {supplier.score.toFixed(1)}
                </span>
                <Link
                  to={`/suppliers/${supplier.id}`}
                  className="ml-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentSuppliersList;
