import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Card from '../components/ui/Card';
import Forum from '../components/Community/Forum';

const CommunityPage = () => {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold bp-gradient-text mb-6">Community & Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Forum />
          </div>
          <Card className="p-4">
            <h4 className="font-semibold mb-3 text-slate-900">Community Guidelines</h4>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>Be respectful and constructive.</li>
              <li>Do not share sensitive personal data.</li>
              <li>Share actionable tips and resources.</li>
              <li>Upvote useful tips to help others.</li>
            </ul>
            <div className="mt-4 text-sm text-slate-600">This forum is stored locally for now. To enable a shared forum, the backend needs forum endpoints and auth. I can add that if you want.</div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
