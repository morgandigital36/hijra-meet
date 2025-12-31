import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Meeting from '../ui/Meeting';
import { roleManager } from '../core/roleManager';

function Event() {
  const { id } = useParams();

  useEffect(() => {
    // Determine and set role based on URL immediately
    const role = roleManager.setRoleFromUrl();
    console.log(`Role determined: ${role}`);
  }, []);

  return (
    <div className="h-screen w-full bg-gray-900 text-white">
      <Meeting eventId={id} />
    </div>
  );
}

export default Event;
