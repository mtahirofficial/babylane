import StatCard from "../components/cards/StatCard";
import CardsGrid from "../components/cards/CardsGrid";
import { FiPackage, FiShoppingCart, FiUsers } from "react-icons/fi";
import QuickActions from "../components/QuickActions";
import StockValueSummary from "../components/StockValueSummary";
import StockChart from "../components/StockChart";
import LowStockTable from "../components/LowStockTable";
import RecentProducts from "../components/RecentProducts";
import OutOfStock from "../components/OutOfStock";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";

const Dashboard = () => {
    const navigate = useNavigate()
    const [data, setdata] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const res = await api.get("/stats");
                setdata(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);


    const quickActions = [
        { label: "Add Order", onClick: () => navigate("/orders/add") },
        { label: "Add Product", onClick: () => navigate("/products/add") },
        { label: "Adjust Stock", onClick: () => alert("Adjust Stock clicked") },
    ];
    return (
        <div className="dashboard">
            <h2 className="page-title">Dashboard</h2>

            <CardsGrid>
                <StatCard title="Orders" value={data.orders ?? 0} icon={<FiShoppingCart size={30} />} path="orders" />
                <StatCard title="Products" value={data.products ?? 0} icon={<FiPackage size={30} />} path="products" />
                <StatCard title="Customers" value={data.customers ?? 0} icon={<FiUsers size={30} />} />
            </CardsGrid>

            <QuickActions actions={quickActions} />
            <StockValueSummary cost={data?.totalCosts ?? 0} price={data?.totalSales ?? 0} profit={(data?.totalSales ?? 0) - (data?.totalCosts ?? 0)} />
            <StockChart data={data?.stockChartData ?? []} />

            <div className="cards-grid">
                <LowStockTable products={data?.lowStockProducts ?? []} />
                <RecentProducts products={data?.recentProducts ?? []} />
                <OutOfStock products={data?.outOfStockProducts ?? []} />
            </div>
        </div>
    );
};

export default Dashboard;
