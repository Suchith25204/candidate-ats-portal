import React, { useState, useEffect } from 'react';
import { APIService } from '../../services/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleDate, setNewRoleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [fetchedRoles, fetchedCandidates] = await Promise.all([
        APIService.getRoles(),
        APIService.getAllCandidates()
      ]);
      setRoles(fetchedRoles || []);
      setCandidates(fetchedCandidates || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle || !newRoleDate) return;
    setIsSubmitting(true);
    try {
      const roleId = 'r-' + Date.now().toString(36);
      await APIService.createRole({
        id: roleId,
        title: newRoleTitle,
        lastDate: newRoleDate
      });
      setIsModalOpen(false);
      setNewRoleTitle('');
      setNewRoleDate('');
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const recruiterRole = localStorage.getItem('recruiterRole') || 'Recruiter';

  return (
    <div className="h-full bg-black p-8 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Roles</h1>
        {recruiterRole === 'Admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
          >
            <span>+</span> Create new role
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Role</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Candidates Applied</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Date Created</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Last Date to Apply</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              roles.map((role) => {
                const appliedCandidates = candidates.filter(c => c.role === role.title || c.roleAppliedToID === role.id);
                
                return (
                  <tr key={role.id} className="border-b border-neutral-800 hover:bg-neutral-900/30 transition-colors">
                    <td className="py-5 px-4 text-base text-white font-medium">{role.title}</td>
                    <td className="py-5 px-4">
                      <span className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded text-sm font-bold">
                        {appliedCandidates.length}
                      </span>
                    </td>
                    <td className="py-5 px-4 text-base text-neutral-300">{formatDate(role.createdAt)}</td>
                    <td className="py-5 px-4 text-base text-neutral-300">{formatDate(role.lastDate)}</td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex justify-end gap-6 items-center">
                        <button className="text-white font-bold hover:underline text-sm transition-all">Edit</button>
                        <button className="text-red-500 font-bold hover:underline text-sm transition-all">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Role</h2>
            <form onSubmit={handleCreateRole}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-neutral-400 mb-2">Role Title</label>
                <input 
                  type="text" 
                  value={newRoleTitle}
                  onChange={e => setNewRoleTitle(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Senior Backend Engineer"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold text-neutral-400 mb-2">Last Date for Applying</label>
                <input 
                  type="date" 
                  value={newRoleDate}
                  onChange={e => setNewRoleDate(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors [color-scheme:dark]"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-neutral-400 hover:text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-black px-6 py-3 rounded font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
