
import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { UserRole } from '../types';

// Mock System Users
const MOCK_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@logitrak.com', role: UserRole.ADMIN, status: 'Active' },
  { id: 2, name: 'John Dispatcher', email: 'john@logitrak.com', role: UserRole.DISPATCHER, status: 'Active' },
  { id: 3, name: 'Sarah Logistics', email: 'sarah@logitrak.com', role: UserRole.DISPATCHER, status: 'On Leave' },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'security'>('general');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${
              activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe size={18} /> General
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${
              activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={18} /> Users & Roles
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${
              activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">General Preferences</h2>
                <p className="text-sm text-slate-500">Manage display and region settings.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Moon size={20} /></div>
                    <div>
                      <div className="font-medium text-slate-900">Dark Mode</div>
                      <div className="text-sm text-slate-500">Switch between light and dark themes</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Bell size={20} /></div>
                    <div>
                      <div className="font-medium text-slate-900">Notifications</div>
                      <div className="text-sm text-slate-500">Receive email alerts for SOS events</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked readOnly />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                  <p className="text-sm text-slate-500">Manage system access and roles.</p>
                </div>
                <button className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-medium transition-colors">
                  <Plus size={18} /> Add User
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MOCK_USERS.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                <Lock size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
                <p className="text-slate-500 mb-6">Password rotation, 2FA, and API key management are handled here.</p>
                <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors">
                    Manage API Keys
                </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
