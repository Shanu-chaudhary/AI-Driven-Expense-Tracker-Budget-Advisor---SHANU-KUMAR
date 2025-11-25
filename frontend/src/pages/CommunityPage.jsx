import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Forum from '../components/Community/Forum';

const CommunityPage = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Community & Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Forum />
          </div>
          <div className="bg-white rounded shadow p-4">
            <h4 className="font-semibold mb-2">Community Guidelines</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              <li>Be respectful and constructive.</li>
              <li>Do not share sensitive personal data.</li>
              <li>Share actionable tips and resources.</li>
              <li>Upvote useful tips to help others.</li>
            </ul>
            <div className="mt-4 text-sm text-gray-500">This forum is stored locally for now. To enable a shared forum, the backend needs forum endpoints and auth. I can add that if you want.</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
