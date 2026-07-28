import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Shield } from 'lucide-react';
import api from '../../services/api';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.users || []);
      } catch (err) {
        // Handled
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#242b27] p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-200/80 pb-4">
        <Link to="/admin" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[#242b27]">Registered Users</h1>
          <p className="text-xs text-slate-500">ShopKart customer database</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading user registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-2">Name</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-2 font-bold text-[#242b27]">{u.name}</td>
                    <td className="py-3 px-2 text-slate-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
