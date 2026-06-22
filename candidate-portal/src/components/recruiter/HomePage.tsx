import React, { useState, useEffect } from 'react';
import { APIService } from '../../services/api';

export default function HomePage() {
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

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Active Roles Overview</h1>
      </div>
      
      <div className="space-y-10">
        {roles.length === 0 && (
          <div className="text-neutral-500 text-center py-12 border border-neutral-800 rounded border-dashed">
            No roles created yet. Go to the Roles page to get started.
          </div>
        )}
        
        {roles.map((role) => {
          // Check role field since Candidates table right now stores role title as string
          const appliedCandidates = candidates.filter(c => c.role === role.title || c.roleAppliedToID === role.id);
          
          return (
            <div key={role.id} className="bg-black border border-neutral-800 rounded-lg overflow-hidden shadow-sm">
              {/* Role Header */}
              <div className="bg-neutral-900 border-b border-neutral-800 px-8 py-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">{role.title}</h2>
                  <p className="text-base text-neutral-400 mt-2">
                    Role ID: <span className="font-mono text-neutral-300">{role.id}</span>
                    <span className="mx-3">•</span>
                    Last Date to Apply: <span className="text-white font-semibold">{role.lastDate || 'Not specified'}</span>
                  </p>
                </div>
                <div className="text-base font-bold px-4 py-2 bg-black text-neutral-300 rounded-full border border-neutral-700">
                  {appliedCandidates.length} Applicants
                </div>
              </div>

              {/* Candidates Table */}
              <div className="p-0">
                {appliedCandidates.length > 0 ? (
                  <table className="min-w-full divide-y divide-neutral-800">
                    <thead className="bg-black">
                      <tr>
                        <th className="px-8 py-4 text-left text-sm font-bold text-neutral-500 uppercase tracking-wider">Candidate Name</th>
                        <th className="px-8 py-4 text-left text-sm font-bold text-neutral-500 uppercase tracking-wider">Email</th>
                        <th className="px-8 py-4 text-right text-sm font-bold text-neutral-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {appliedCandidates.map((candidate) => (
                        <tr key={candidate.email} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="px-8 py-5 whitespace-nowrap text-base font-bold text-white">
                            {candidate.name || 'Unnamed'}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-base text-neutral-400 font-mono">
                            {candidate.email}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right text-base font-bold">
                            <button className="text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:bg-neutral-800 px-4 py-2 rounded">
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-neutral-500 text-base">
                    No candidates have applied to this role yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
