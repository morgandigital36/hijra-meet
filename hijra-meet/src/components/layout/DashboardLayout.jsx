import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <Sidebar />
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}
