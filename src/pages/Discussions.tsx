import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Plus, Users, Clock, ThumbsUp, MessageCircle, Pin, Bookmark, Filter, Send } from 'lucide-react';

interface ForumPost {
  id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  forums: {
    title: string;
    courses: {
      title: string;
      category: string;
    };
  };
  replies?: ForumPost[];
  reply_count?: number;
}

interface Forum {
  id: string;
  title: string;
  description: string;
  created_at: string;
  courses: {
    title: string;
    category: string;
  };
  post_count?: number;
  latest_post?: ForumPost;
}

export default function Discussions() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [forums, setForums] = useState<Forum[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedForum, setSelectedForum] = useState<string>('');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchForumsAndPosts();
    }
  }, [user]);

  const fetchForumsAndPosts = async () => {
    try {
      // Get forums for courses the user is enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user?.id);

      const courseIds = enrollments?.map(e => e.course_id) || [];

      const { data: forumsData, error: forumsError } = await supabase
        .from('forums')
        .select(`
          *,
          courses (
            title,
            category
          )
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (forumsError) throw forumsError;

      // Get recent posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            role
          ),
          forums (
            title,
            courses (
              title,
              category
            )
          )
        `)
        .is('parent_id', null) // Only top-level posts
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      setForums(forumsData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching forums and posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load discussions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedForum) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          forum_id: selectedForum,
          user_id: user?.id,
          title: newPostTitle,
          content: newPostContent
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your post has been created',
      });

      setNewPostTitle('');
      setNewPostContent('');
      setSelectedForum('');
      setIsCreatePostOpen(false);
      fetchForumsAndPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
      post.forums.courses.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(forums.map(f => f.courses.category))];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'instructor': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Discussions</h1>
            <p className="text-muted-foreground">
              Connect with fellow learners, ask questions, and share knowledge
            </p>
          </div>
          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Forum</label>
                  <Select value={selectedForum} onValueChange={setSelectedForum}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a forum" />
                    </SelectTrigger>
                    <SelectContent>
                      {forums.map((forum) => (
                        <SelectItem key={forum.id} value={forum.id}>
                          {forum.title} - {forum.courses.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="What's your question or topic?"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Provide details, context, or ask your question..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost}>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recent">Recent Posts</TabsTrigger>
            <TabsTrigger value="forums">Forums</TabsTrigger>
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
                  <p className="text-muted-foreground text-center">
                    Be the first to start a discussion in your enrolled courses!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.profiles.avatar_url} />
                          <AvatarFallback>
                            {getInitials(post.profiles.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{post.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{post.profiles.full_name}</span>
                                <Badge className={`${getRoleColor(post.profiles.role)} text-xs`}>
                                  {post.profiles.role}
                                </Badge>
                                <span>•</span>
                                <span>{timeAgo(post.created_at)}</span>
                                <span>•</span>
                                <span>{post.forums.courses.title}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Bookmark className="h-4 w-4" />
                            </Button>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {post.content}
                          </p>

                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>12</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>5 replies</span>
                            </Button>
                            <Badge variant="outline">
                              {post.forums.courses.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="forums" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {forums.map((forum) => (
                <Card key={forum.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{forum.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {forum.courses.title}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {forum.courses.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {forum.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>23 posts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>12 participants</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Forum
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-posts" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start engaging with the community by creating your first post!
                </p>
                <Button onClick={() => setIsCreatePostOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LMSLayout>
  );
}