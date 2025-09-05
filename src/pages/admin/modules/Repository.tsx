import { ContentRepository } from '@/components/admin/ContentRepository';
export function AdminRepository(){
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Content Repository</h1>
      <ContentRepository />
    </div>
  );
}

