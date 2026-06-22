import React, { useState, useEffect } from 'react';
import { APIService } from '../../services/api';

export default function OrganizationPage() {
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Recruiter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const recruiterRole = localStorage.getItem('recruiterRole') || 'Recruiter';
  const recruiterEmail = localStorage.getItem('recruiterEmail') || '';

  const fetchRecruiters = async () => {
    try {
      const fetchedRecruiters = await APIService.getAllRecruiters();
      setRecruiters(fetchedRecruiters || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsSubmitting(true);
    setError('');
    
    try {
      await APIService.addRecruiter(newEmail, newRole, recruiterEmail);
      setIsModalOpen(false);
      setNewEmail('');
      setNewRole('Recruiter');
      fetchRecruiters(); // Refresh data
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add recruiter');
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

  return (
    <div className="h-full bg-black p-8 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Organization</h1>
        {recruiterRole === 'Admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm"
          >
            <span>+</span> Add Recruiter
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Email Address</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Role</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider">Date Joined</th>
              <th className="py-4 px-4 text-sm font-bold text-white tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recruiters.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-500">
                  No recruiters found.
                </td>
              </tr>
            ) : (
              recruiters.map((recruiter) => (
                <tr key={recruiter.username} className="border-b border-neutral-800 hover:bg-neutral-900/30 transition-colors">
                  <td className="py-5 px-4 text-base text-white font-medium">{recruiter.username}</td>
                  <td className="py-5 px-4">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${recruiter.role === 'Admin' ? 'bg-teal-900/50 text-teal-400' : 'bg-neutral-800 text-neutral-300'}`}>
                      {recruiter.role || 'Recruiter'}
                    </span>
                  </td>
                  <td className="py-5 px-4 text-base text-neutral-300">{formatDate(recruiter.createdAt)}</td>
                  <td className="py-5 px-4 text-right">
                    {recruiterRole === 'Admin' && recruiter.username !== recruiterEmail && (
                      <div className="flex justify-end gap-6 items-center">
                        <button className="text-red-500 font-bold hover:underline text-sm transition-all">Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Recruiter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Invite New Member</h2>
            
            {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}

            <form onSubmit={handleAddRecruiter}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-neutral-400 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold text-neutral-400 mb-2">Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors cursor-pointer"
                >
                  <option value="Recruiter">Recruiter (Can view candidates)</option>
                  <option value="Admin">Admin (Can manage roles & users)</option>
                </select>
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
                  {isSubmitting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
