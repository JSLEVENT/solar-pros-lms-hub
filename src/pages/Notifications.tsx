import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell, Check, Trash2, Filter, Search, Calendar, Award, BookOpen, Users } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string, referenceType?: string) => {
    if (referenceType === 'course') return <BookOpen className="h-5 w-5" />;
    if (referenceType === 'certificate') return <Award className="h-5 w-5" />;
    if (referenceType === 'assessment') return <Calendar className="h-5 w-5" />;
    if (referenceType === 'forum') return <Users className="h-5 w-5" />;
    
    switch (type) {
      case 'success': return <Check className="h-5 w-5" />;
      case 'warning': return <Bell className="h-5 w-5" />;
      case 'error': return <Bell className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success text-success-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      notification.message
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesRead = !showUnreadOnly || !notification.read;
    
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="space-y-8">
        {/* Header */}
        <ModernCard variant="glass">
          <ModernCardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Notifications
                  </h1>
                  <p className="text-muted-foreground text-lg mt-1">
                    Stay updated with your learning progress and platform updates
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <Badge className="text-lg px-4 py-2">
                    {unreadCount} unread
                  </Badge>
                )}
                <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                  Mark All Read
                </Button>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Filters */}
        <ModernCard variant="floating">
          <ModernCardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-0 bg-secondary/50 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-secondary/50 border-0 rounded-xl px-3 py-2"
                  >
                    <option value="all">All Types</option>
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Unread only</span>
                  <Switch
                    checked={showUnreadOnly}
                    onCheckedChange={setShowUnreadOnly}
                  />
                </div>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <ModernCard variant="glass">
            <ModernCardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6">
                <Bell className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">No notifications found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || typeFilter !== 'all' || showUnreadOnly
                  ? 'Try adjusting your filters to see more notifications.'
                  : 'You\'re all caught up! New notifications will appear here when you have updates.'}
              </p>
            </ModernCardContent>
          </ModernCard>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <ModernCard 
                key={notification.id} 
                variant="interactive"
                className={`group transition-all duration-300 ${
                  !notification.read ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <ModernCardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type, notification.reference_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className={`font-semibold text-lg ${!notification.read ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        {notification.reference_type && (
                          <Badge variant="secondary" className="text-xs">
                            {notification.reference_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </ModernCardContent>
              </ModernCard>
            ))}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}