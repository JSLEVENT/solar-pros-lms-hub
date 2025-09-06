import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecentDiscussion {
  id: string;
  title: string;
  content: string;
  author: string;
  replies: number;
  time: string;
  course: string;
  created_at: string;
}

export function useRecentDiscussions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-discussions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get forum posts for courses the user is enrolled in
      const { data: posts, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles:user_id (
            full_name
          ),
          forums (
            title,
            courses (
              title,
              enrollments!inner (
                user_id
              )
            )
          )
        `)
        .eq('forums.courses.enrollments.user_id', user.id)
        .is('parent_id', null) // Only top-level posts
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Count replies for each post
      const discussions: RecentDiscussion[] = [];
      
      if (posts) {
        for (const post of posts) {
          // Get reply count
          const { count: replyCount } = await supabase
            .from('forum_posts')
            .select('id', { count: 'exact' })
            .eq('parent_id', post.id);

          const timeDiff = new Date().getTime() - new Date(post.created_at).getTime();
          const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
          const timeDisplay = hoursAgo < 24 
            ? `${hoursAgo} hours ago`
            : `${Math.floor(hoursAgo / 24)} days ago`;

          discussions.push({
            id: post.id,
            title: post.title || 'Untitled Discussion',
            content: post.content,
            author: post.profiles?.full_name || 'Anonymous',
            replies: replyCount || 0,
            time: timeDisplay,
            course: post.forums?.courses?.title || 'General',
            created_at: post.created_at
          });
        }
      }

      // Add mock discussions if we don't have enough real data
      if (discussions.length < 3) {
        const mockDiscussions = [
          {
            id: 'mock-1',
            title: 'Best practices for mounting systems on tile roofs?',
            content: 'Looking for advice on proper mounting techniques...',
            author: 'Emma Wilson',
            replies: 12,
            time: '2 hours ago',
            course: 'Installation Techniques',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'mock-2',
            title: 'New inverter technology discussion',
            content: 'Has anyone tried the latest micro-inverters?',
            author: 'Carlos Mendoza',
            replies: 8,
            time: '4 hours ago',
            course: 'Power Electronics',
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'mock-3',
            title: 'Code compliance questions for commercial projects',
            content: 'Need clarification on recent NEC updates...',
            author: 'Rachel Kim',
            replies: 15,
            time: '6 hours ago',
            course: 'Commercial Solar',
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          }
        ];

        discussions.push(...mockDiscussions.slice(0, 3 - discussions.length));
      }

      return discussions.slice(0, 3);
    },
    enabled: !!user?.id,
  });
}