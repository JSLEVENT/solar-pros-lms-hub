import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Share2, Award, Calendar, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';

interface Certificate {
  id: string;
  certificate_url?: string;
  issued_at: string;
  expires_at?: string;
  verification_code: string;
  courses: {
    title: string;
    category: string;
    level: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function Certificates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          courses (
            title,
            category,
            level,
            profiles:instructor_id (
              full_name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank');
    } else {
      // Generate a certificate download
      const element = document.createElement('a');
      element.href = `data:text/plain;charset=utf-8,Certificate of Completion\n\n${certificate.courses.title}\n\nAwarded to: [User Name]\nIssued: ${new Date(certificate.issued_at).toLocaleDateString()}\nVerification Code: ${certificate.verification_code}`;
      element.download = `certificate-${certificate.courses.title.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: 'Certificate Downloaded',
        description: 'Your certificate has been downloaded successfully.',
      });
    }
  };

  const handleShare = async (certificate: Certificate) => {
    const shareData = {
      title: `Certificate: ${certificate.courses.title}`,
      text: `I've completed the ${certificate.courses.title} course and earned a certificate!`,
      url: `${window.location.origin}/verify/${certificate.verification_code}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(
        `${shareData.text} Verify at: ${shareData.url}`
      );
      toast({
        title: 'Shared!',
        description: 'Certificate link copied to clipboard.',
      });
    }
  };

  const isExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate < thirtyDaysFromNow;
  };

  const filteredCertificates = certificates.filter((certificate) =>
    certificate.courses.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    certificate.courses.category
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const activeCertificates = filteredCertificates.filter(c => !isExpired(c.expires_at));
  const expiredCertificates = filteredCertificates.filter(c => isExpired(c.expires_at));

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
            <h1 className="text-3xl font-bold">My Certificates</h1>
            <p className="text-muted-foreground">
              View, download, and share your course completion certificates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {certificates.length} Total Certificates
            </Badge>
            <Badge className="bg-success text-success-foreground">
              {activeCertificates.length} Active
            </Badge>
            {expiredCertificates.length > 0 && (
              <Badge variant="destructive">
                {expiredCertificates.length} Expired
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
              <p className="text-muted-foreground text-center">
                Complete courses to earn certificates that you can download and share.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Certificates */}
            {activeCertificates.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Active Certificates</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeCertificates.map((certificate) => (
                    <Card key={certificate.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        {/* Certificate Header */}
                        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-t-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                <Award className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">Certificate of Completion</h3>
                                <p className="text-primary-foreground/80 text-sm">
                                  Solar Pros LMS
                                </p>
                              </div>
                            </div>
                            {isExpiringSoon(certificate.expires_at) && (
                              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Certificate Body */}
                        <div className="p-6 space-y-4">
                          <div className="text-center space-y-2">
                            <h4 className="text-xl font-bold">{certificate.courses.title}</h4>
                            <p className="text-muted-foreground">
                              Successfully completed by [User Name]
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Category</p>
                              <p className="font-medium">{certificate.courses.category}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Level</p>
                              <p className="font-medium capitalize">{certificate.courses.level}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Instructor</p>
                              <p className="font-medium">{certificate.courses.profiles?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Issued Date</p>
                              <p className="font-medium">
                                {new Date(certificate.issued_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {certificate.expires_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Expires: {new Date(certificate.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                            <CheckCircle className="h-3 w-3" />
                            <span>Verification Code: {certificate.verification_code}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleDownload(certificate)}
                              className="flex-1"
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              onClick={() => handleShare(certificate)}
                              variant="outline"
                              size="sm"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/verify/${certificate.verification_code}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Expired Certificates */}
            {expiredCertificates.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">Expired Certificates</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {expiredCertificates.map((certificate) => (
                    <Card key={certificate.id} className="opacity-60">
                      <CardContent className="p-0">
                        {/* Certificate Header */}
                        <div className="bg-gradient-to-br from-muted to-muted/80 text-muted-foreground p-6 rounded-t-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                                <Award className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">Certificate of Completion</h3>
                                <p className="text-muted-foreground/80 text-sm">
                                  Solar Pros LMS
                                </p>
                              </div>
                            </div>
                            <Badge variant="destructive">
                              Expired
                            </Badge>
                          </div>
                        </div>

                        {/* Certificate Body */}
                        <div className="p-6 space-y-4">
                          <div className="text-center space-y-2">
                            <h4 className="text-xl font-bold">{certificate.courses.title}</h4>
                            <p className="text-muted-foreground">
                              Successfully completed by [User Name]
                            </p>
                          </div>

                          <div className="text-sm text-center">
                            <p className="text-destructive">
                              Expired on {new Date(certificate.expires_at!).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleDownload(certificate)}
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                            >
                              Renewal Required
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}