import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ExportControls from '../components/Export/ExportControls';
import BackupControls from '../components/Export/BackupControls';
import Card from '../components/ui/Card';
import { useState } from 'react';

const ExportPage = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold bp-gradient-text mb-6">Export & Backup</h2>

        <Card className="mb-6 p-4">
          <label className="text-sm text-slate-600 mr-2">Select month:</label>
          <input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} className="border border-blue-200 rounded p-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-400" />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExportControls month={month} />
          <BackupControls />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportPage;
