import { useState, useEffect } from 'react';
import { LMSLayout } from '@/components/LMSLayout';
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, ArrowRight, CreditCard, Receipt } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface PaymentSession {
  id: string;
  payment_status: string;
  amount_total: number;
  currency: string;
}

export default function PaymentSuccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId && user) {
      verifyPayment();
    } else if (!sessionId) {
      setVerificationStatus('failed');
      setLoading(false);
    }
  }, [sessionId, user]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentSession(data.session);
        setVerificationStatus('success');
        
        toast({
          title: 'Payment Successful!',
          description: 'Your course enrollment has been activated.',
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: 'Payment Verification Failed',
          description: data.message || 'There was an issue verifying your payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('failed');
      toast({
        title: 'Error',
        description: 'Failed to verify payment. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <LMSLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ModernCard variant="glass" className="max-w-md w-full">
            <ModernCardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
            </ModernCardContent>
          </ModernCard>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout>
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <ModernCard variant="glass" className="max-w-2xl w-full">
          <ModernCardContent className="p-8">
            {verificationStatus === 'success' && paymentSession ? (
              <div className="text-center space-y-6">
                {/* Success Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-success">Payment Successful!</h1>
                  <p className="text-lg text-muted-foreground">
                    Thank you for your purchase. Your course enrollment has been activated.
                  </p>
                </div>

                {/* Payment Details */}
                <ModernCard variant="floating">
                  <ModernCardHeader>
                    <ModernCardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Payment Receipt
                    </ModernCardTitle>
                  </ModernCardHeader>
                  <ModernCardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-sm">{paymentSession.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="font-semibold text-lg">
                        {formatAmount(paymentSession.amount_total, paymentSession.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-success text-success-foreground">
                        {paymentSession.payment_status}
                      </Badge>
                    </div>
                  </ModernCardContent>
                </ModernCard>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/my-courses')}
                    className="group"
                    size="lg"
                  >
                    View My Courses
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/course-catalog')}
                    size="lg"
                  >
                    Browse More Courses
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="bg-primary/5 rounded-lg p-4 text-sm text-muted-foreground">
                  <p>
                    🎉 <strong>What's next?</strong> You can now access your course content, participate in discussions, 
                    and work towards earning your certificate. Check your email for additional course materials.
                  </p>
                </div>
              </div>
            ) : verificationStatus === 'failed' ? (
              <div className="text-center space-y-6">
                {/* Error Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>

                {/* Error Message */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-destructive">Payment Verification Failed</h1>
                  <p className="text-lg text-muted-foreground">
                    We couldn't verify your payment. Please contact support if you believe this is an error.
                  </p>
                </div>

                {/* Error Details */}
                {sessionId && (
                  <ModernCard variant="floating">
                    <ModernCardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Session ID:</span>
                        <span className="font-mono text-sm">{sessionId}</span>
                      </div>
                    </ModernCardContent>
                  </ModernCard>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/course-catalog')}
                    size="lg"
                  >
                    Return to Catalog
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = 'mailto:support@solarpros.hub'}
                    size="lg"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                {/* Pending Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mx-auto">
                  <Clock className="h-10 w-10 text-warning" />
                </div>

                {/* Pending Message */}
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-warning">Payment Pending</h1>
                  <p className="text-lg text-muted-foreground">
                    Your payment is being processed. This may take a few minutes.
                  </p>
                </div>

                {/* Retry Button */}
                <Button onClick={verifyPayment} disabled={loading}>
                  {loading ? 'Checking...' : 'Check Payment Status'}
                </Button>
              </div>
            )}
          </ModernCardContent>
        </ModernCard>
      </div>
    </LMSLayout>
  );
}