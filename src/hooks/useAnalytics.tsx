import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsEvent {
  event_type: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: any;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      await supabase
        .from('analytics')
        .insert({
          user_id: user.id,
          event_type: event.event_type,
          reference_id: event.reference_id,
          reference_type: event.reference_type,
          metadata: event.metadata
        });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = (page: string) => {
    trackEvent({
      event_type: 'page_view',
      reference_type: 'page',
      metadata: { page, timestamp: new Date().toISOString() }
    });
  };

  const trackCourseView = (courseId: string) => {
    trackEvent({
      event_type: 'course_view',
      reference_id: courseId,
      reference_type: 'course'
    });
  };

  const trackAssessmentStart = (assessmentId: string) => {
    trackEvent({
      event_type: 'assessment_start',
      reference_id: assessmentId,
      reference_type: 'assessment'
    });
  };

  const trackAssessmentComplete = (assessmentId: string, score: number) => {
    trackEvent({
      event_type: 'assessment_complete',
      reference_id: assessmentId,
      reference_type: 'assessment',
      metadata: { score }
    });
  };

  const trackLogin = () => {
    trackEvent({
      event_type: 'user_login',
      reference_type: 'auth'
    });
  };

  const trackEnrollment = (courseId: string) => {
    trackEvent({
      event_type: 'course_enrollment',
      reference_id: courseId,
      reference_type: 'course'
    });
  };

  const trackModuleComplete = (moduleId: string, courseId: string) => {
    trackEvent({
      event_type: 'module_complete',
      reference_id: moduleId,
      reference_type: 'module',
      metadata: { courseId }
    });
  };

  const trackVideoWatch = (contentId: string, duration: number, position: number) => {
    trackEvent({
      event_type: 'video_watch',
      reference_id: contentId,
      reference_type: 'content',
      metadata: { duration, position, completion_rate: (position / duration) * 100 }
    });
  };

  const trackCertificateDownload = (certificateId: string) => {
    trackEvent({
      event_type: 'certificate_download',
      reference_id: certificateId,
      reference_type: 'certificate'
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackCourseView,
    trackAssessmentStart,
    trackAssessmentComplete,
    trackLogin,
    trackEnrollment,
    trackModuleComplete,
    trackVideoWatch,
    trackCertificateDownload
  };
};

export default useAnalytics;