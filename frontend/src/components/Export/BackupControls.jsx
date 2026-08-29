import React, { useState, useContext } from 'react';
import axios from '../../api/axios';
import { ToastContext } from '../../context/ToastContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

const BackupControls = () => {
  const [busy, setBusy] = useState(false);

  const createBackupBlob = async () => {
    // fetch transactions, categories, profile and bundle into JSON
    const [txRes, catRes, profileRes] = await Promise.all([
      axios.get('/transactions/list').catch(()=>({data:[]})),
      axios.get('/categories/list').catch(()=>({data:[]})),
      axios.get('/profile/me').catch(()=>({data:{}})),
    ]);
    const payload = {
      timestamp: new Date().toISOString(),
      profile: profileRes.data || {},
      categories: catRes.data || [],
      transactions: txRes.data || [],
    };
    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  };

  const downloadBackup = async () => {
    setBusy(true);
    try {
      const blob = await createBackupBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetpilot_backup_${new Date().toISOString().slice(0,19).replaceAll(':','-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup failed', err);
      addToast('Backup failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const { addToast } = useContext(ToastContext);

  const uploadToProvider = async (provider) => {
    if (!confirm(`Upload backup to ${provider}? This requires an OAuth token configured on the server.`)) return;
    setBusy(true);
    try {
      const blob = await createBackupBlob();
      const form = new FormData();
      form.append('file', new File([blob], `backup_${Date.now()}.json`));
      form.append('provider', provider);
      // For now we don't have an oauth token flow in UI; server will respond with not-implemented
      const res = await axios.post('/api/backup/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast(res.data?.message || 'Backup uploaded', 'success');
    } catch (err) {
      console.error('Upload failed', err);
      addToast('Upload failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4 text-slate-900">Backup & Cloud</h4>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={downloadBackup} disabled={busy} variant="success">
          {busy ? 'Preparing...' : 'Download Backup (JSON)'}
        </Button>
        <Button onClick={()=>alert('Google Drive backup requires OAuth setup. See README.')} variant="secondary">
          Backup to Google Drive
        </Button>
        <Button onClick={()=>alert('Dropbox backup requires OAuth setup. See README.')} variant="secondary">
          Backup to Dropbox
        </Button>
      </div>
    </Card>
  );
};

export default BackupControls;
