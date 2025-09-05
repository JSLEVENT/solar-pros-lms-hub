import { LearningPlans } from '@/components/admin/LearningPlans';
export function AdminPlans(){
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Learning Plans</h1>
      <LearningPlans />
    </div>
  );
}

