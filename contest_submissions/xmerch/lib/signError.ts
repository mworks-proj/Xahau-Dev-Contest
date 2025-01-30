// /lib/signError.ts
import { toast } from 'sonner';

export const handleXummError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('Sign In window closed')) {
      toast.error('Sign In window was closed. Please try again.');
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }
  } else {
    toast.error('An unknown error occurred.');
  }
};
