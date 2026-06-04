import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function PreviewWall() {
  return (
    <div className="absolute z-10 inset-x-0 bottom-0 flex min-h-44 items-end justify-center bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
        <h3 className="text-xl font-bold text-slate-950">Keep reading — it&apos;s free</h3>
        <p className="mt-2 text-sm text-slate-600">Create a free account to access the full chapter.</p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
              Create Account
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full sm:w-auto">Log In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
