import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ExportControls from '../components/Export/ExportControls';
import BackupControls from '../components/Export/BackupControls';
import { useState } from 'react';

const ExportPage = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Export & Backup</h2>

        <div className="mb-4">
          <label className="text-sm mr-2">Select month:</label>
          <input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} className="border rounded p-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExportControls month={month} />
          <BackupControls />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportPage;
