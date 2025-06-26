import { SignInForm } from '@/components/auth/SignInForm';
import { SignInErrorBoundary } from '@/components/error-boundaries';

export default function SignInPage() {
  return (
    <SignInErrorBoundary>
      <SignInForm />
    </SignInErrorBoundary>
  );
}