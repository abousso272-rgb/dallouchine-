import React from 'react';
import { GroupageDetailPage } from './GroupageDetailPage';

export const GroupageDetailsPage: React.FC<{ id?: string }> = (props) => {
  return <GroupageDetailPage {...props} />;
};

export default GroupageDetailsPage;
