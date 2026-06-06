'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Shield, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/dashboard');
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <Card variant="elevated" className="w-full max-w-md mx-auto p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-secondary mb-4">
          <Shield className="w-6 h-6 text-text-primary" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-1">Join StudyVault</h1>

        <p className="text-sm text-text-muted">Create your free account to get started</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <Badge variant="secondary" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Free Access
        </Badge>
        <Badge variant="secondary" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Quran Learning
        </Badge>
        <Badge variant="secondary" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          AI Assistance
        </Badge>
      </div>

      {error && (
        <div
          className="mb-4 p-3 bg-bg-tertiary border border-border-strong rounded-lg flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={errors.name}
          icon={<User className="w-4 h-4" aria-hidden="true" />}
          disabled={isLoading}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={errors.email}
          icon={<Mail className="w-4 h-4" aria-hidden="true" />}
          disabled={isLoading}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={errors.password}
          icon={<Lock className="w-4 h-4" aria-hidden="true" />}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          error={errors.confirmPassword}
          icon={<Lock className="w-4 h-4" aria-hidden="true" />}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-6"
          disabled={isLoading}
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-text-primary font-semibold hover:underline">
          Login
        </Link>
      </p>

      <p className="text-xs text-text-muted text-center mt-4">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-text-primary">
          Privacy Policy
        </Link>
      </p>
    </Card>
  );
}
