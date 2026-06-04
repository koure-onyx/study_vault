import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/components/SignupForm';

export const metadata: Metadata = { title: 'Sign Up — StudyVault PK' };

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900" style={{ fontFamily: 'var(--font-playfair)' }}>
            Join StudyVault
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create your free account to get started</p>
        </div>
        
        <SignupForm />
        
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
